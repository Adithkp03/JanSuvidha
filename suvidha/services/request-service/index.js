// Purpose: Request service - DB-backed endpoints for creating and querying civic service requests (Phase 1).
import Fastify from "fastify";
import { Pool } from "pg";
import crypto from "node:crypto";
import amqp from "amqplib";
import client from "prom-client";

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });
const PORT = Number(process.env.PORT || 3002);

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://suvidha:suvidha_password_change_me@postgres:5432/suvidha_db";

const pool = new Pool({ connectionString: DATABASE_URL });

const registerDefaultMetrics = client.collectDefaultMetrics;
registerDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "request_http_requests_total",
  help: "Total HTTP requests to request-service",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "request_http_request_duration_seconds",
  help: "HTTP request duration in seconds for request-service",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

app.addHook("onRequest", (req, reply, done) => {
  const existing = req.headers["x-request-id"];
  const id = existing || crypto.randomUUID();
  req.headers["x-request-id"] = id;
  reply.header("x-request-id", id);
  reply.metricsStart = process.hrtime.bigint();
  done();
});

app.addHook("onResponse", (req, reply, done) => {
  const started = reply.metricsStart;
  const diffNs = started ? Number(process.hrtime.bigint() - started) : 0;
  const diffSeconds = diffNs / 1e9;
  const route = req.routeOptions?.url || req.raw.url || "unknown";
  const labels = {
    method: req.method,
    route,
    status_code: String(reply.statusCode),
  };
  httpRequestsTotal.inc(labels);
  if (diffSeconds >= 0) {
    httpRequestDuration.observe(labels, diffSeconds);
  }
  done();
});

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  "amqp://suvidha_rabbit:suvidha_rabbit_password_change_me@rabbitmq:5672";
const EVENTS_EXCHANGE = "requests.events";

let amqpChannelPromise = null;
async function getAmqpChannel() {
  if (!amqpChannelPromise) {
    amqpChannelPromise = (async () => {
      const conn = await amqp.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();
      await ch.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
      return ch;
    })().catch((err) => {
      app.log.error({ err }, "Failed to connect to RabbitMQ");
      amqpChannelPromise = null;
      throw err;
    });
  }
  return amqpChannelPromise;
}

async function publishEvent(type, payload, correlationId) {
  try {
    const ch = await getAmqpChannel();
    const body = Buffer.from(JSON.stringify({ type, payload }), "utf8");
    ch.publish(EVENTS_EXCHANGE, type, body, {
      contentType: "application/json",
      timestamp: Date.now(),
      correlationId: correlationId || null,
    });
  } catch (err) {
    app.log.error({ err, type }, "Failed to publish domain event");
  }
}

function uuid() {
  return crypto.randomUUID();
}

function error(code, message, details = null) {
  return { error: message, code, details };
}

app.setErrorHandler((err, _req, reply) => {
  if (err.validation) {
    reply.code(400).send(error("validation_error", "Invalid request payload", err.validation));
    return;
  }
  app.log.error(err);
  reply
    .code(500)
    .send(error("internal_error", "Unexpected server error", process.env.NODE_ENV === "development" ? err : null));
});

app.get("/health", async () => ({ ok: true, service: "request-service" }));

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
});

app.post(
  "/requests",
  {
    schema: {
      body: {
        type: "object",
        required: ["department", "service_type", "payload"],
        properties: {
          kiosk_id: { type: "string", format: "uuid", nullable: true },
          user_id: { type: "string", format: "uuid", nullable: true },
          department: { type: "string" },
          service_type: { type: "string" },
          priority: { type: "string", nullable: true },
          payload: { type: "object" },
        },
      },
    },
  },
  async (req, reply) => {
    const body = req.body;

    const client = await pool.connect();
    try {
      const svcRes = await client.query(
        "SELECT s.*, d.code as dept_code FROM services s JOIN departments d ON s.department_id = d.id WHERE d.code = $1 AND s.code = $2",
        [body.department, body.service_type]
      );

      if (!svcRes.rowCount) {
        reply.code(400).send(
          error("invalid_service", "Unsupported department or service")
        );
        return;
      }

      const serviceDef = svcRes.rows[0];

      const id = uuid();
      const priority = body.priority || "normal";

      // Extract dynamic fee from payload if present (e.g. for bill payments)
      let feeAmount = Number(serviceDef.fee_amount);
      if (body.payload && body.payload.amount) {
        feeAmount = Number(body.payload.amount);
      }

      // Determine initial status based on fee / required docs
      let status = "submitted";
      if (serviceDef.required_documents && serviceDef.required_documents.length > 0) {
        status = "draft";
      } else if (feeAmount > 0) {
        status = "payment_pending";
      }

      await client.query("BEGIN");

      const res = await client.query(
        `INSERT INTO requests
           (id, kiosk_id, user_id, department, service_type, service_code, priority, status, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          id,
          body.kiosk_id || null,
          body.user_id || null,
          body.department,
          body.service_type,
          body.service_type, // Map service_type to service_code
          priority,
          status,
          body.payload,
        ],
      );

      const actorId = body.user_id || null;
      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
         VALUES ($1,$2,$3,$4,$5)`,
        [actorId, "request_created", "request", id, { payload: body.payload, expected_fee: feeAmount }],
      );

      // Even if draft, we record pending payment if there's a fee (e.g., bill payload)
      if (feeAmount > 0) {
        await client.query(
          `INSERT INTO payments (id, request_id, amount_paise, status, provider) VALUES ($1,$2,$3,'pending','sandbox')`,
          [uuid(), id, feeAmount * 100]
        );
      }

      await client.query("COMMIT");

      const correlationId = req.headers["x-request-id"] || uuid();
      await publishEvent("request.created", { id, department: body.department, service_type: body.service_type, status }, correlationId);

      reply.code(201).send(normalizeRequestRow(res.rows[0]));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
);

app.get(
  "/requests/:id",
  {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
    },
  },
  async (req, reply) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      const rRes = await client.query("SELECT * FROM requests WHERE id = $1", [id]);
      if (!rRes.rowCount) {
        reply.code(404).send(error("not_found", "Request not found"));
        return;
      }

      const dRes = await client.query("SELECT * FROM documents WHERE request_id = $1 ORDER BY created_at", [id]);
      const pRes = await client.query("SELECT * FROM payments WHERE request_id = $1 ORDER BY created_at", [id]);

      reply.send({
        request: normalizeRequestRow(rRes.rows[0]),
        documents: dRes.rows.map(normalizeDocumentRow),
        payments: pRes.rows.map(normalizePaymentRow),
      });
    } finally {
      client.release();
    }
  },
);

app.get("/departments", async (req, reply) => {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name, code, icon, description FROM departments ORDER BY name");
    return { departments: res.rows };
  } finally {
    client.release();
  }
});

app.get("/services", async (req, reply) => {
  const { department } = req.query;
  const client = await pool.connect();
  try {
    let sql = `
      SELECT s.id, s.name, s.code as service_type, s.description, s.required_documents, s.form_schema, s.fee_amount, s.processing_days,
             d.id as department_id, d.code as department, d.name as department_name, d.icon as department_icon
      FROM services s
      JOIN departments d ON s.department_id = d.id
    `;
    const values = [];
    if (department) {
      values.push(department);
      sql += ` WHERE d.code = $1`;
    }
    sql += ` ORDER BY d.name, s.name`;
    const res = await client.query(sql, values);
    return { services: res.rows };
  } finally {
    client.release();
  }
});

app.get(
  "/requests",
  {
    schema: {
      querystring: {
        type: "object",
        properties: {
          department: { type: "string" },
          status: { type: "string" },
        },
      },
    },
  },
  async (req) => {
    const { department, status } = req.query;
    const values = [];
    const where = [];
    if (department) {
      values.push(department);
      where.push(`department = $${values.length}`);
    }
    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `SELECT * FROM requests ${whereSql} ORDER BY created_at DESC LIMIT 200`;

    const res = await pool.query(sql, values);
    return { requests: res.rows.map(normalizeRequestRow) };
  },
);

app.post(
  "/requests/:id/documents",
  {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        required: ["filename"],
        properties: {
          filename: { type: "string" },
          storage_path: { type: "string", nullable: true },
          mime_type: { type: "string", nullable: true },
          size: { type: "integer", nullable: true },
        },
      },
    },
  },
  async (req, reply) => {
    const { id } = req.params;
    const body = req.body;

    const client = await pool.connect();
    try {
      const rRes = await client.query("SELECT id, status FROM requests WHERE id = $1", [id]);
      if (!rRes.rowCount) {
        reply.code(404).send(error("not_found", "Request not found"));
        return;
      }

      await client.query("BEGIN");

      const docId = uuid();
      const storagePath = body.storage_path || `/requests/${id}/${body.filename}`;
      const res = await client.query(
        `INSERT INTO documents
           (id, request_id, file_name, object_key, mime_type, size_bytes)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [docId, id, body.filename, storagePath, body.mime_type || null, body.size || null],
      );

      // Check if there is a pending payment to determine next status
      const pRes = await client.query("SELECT id FROM payments WHERE request_id = $1 AND status = 'pending'", [id]);
      const nextStatus = pRes.rowCount > 0 ? "payment_pending" : "submitted";

      // Auto-advance draft to submitted or payment_pending if docs are adequate
      if (rRes.rows[0].status === "draft" || rRes.rows[0].status === "doc_required") {
        await client.query("UPDATE requests SET status = $2, updated_at = NOW() WHERE id = $1", [id, nextStatus]);
        const correlationId = req.headers["x-request-id"] || uuid();
        await publishEvent("request.status_changed", { id, status: nextStatus }, correlationId);
      }

      await client.query("COMMIT");
      reply.code(201).send(normalizeDocumentRow(res.rows[0]));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
);

app.post(
  "/sync/offline",
  {
    schema: {
      body: {
        type: "object",
        required: ["client_event_id", "kiosk_id", "payload"],
        properties: {
          client_event_id: { type: "string" },
          kiosk_id: { type: "string", format: "uuid" },
          payload: { type: "object" },
          signature: { type: "string", nullable: true },
        },
      },
    },
  },
  async (req, reply) => {
    const body = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingEvt = await client.query(
        "SELECT * FROM offline_events WHERE client_event_id = $1",
        [body.client_event_id],
      );

      if (existingEvt.rowCount && existingEvt.rows[0].processed) {
        const stored = existingEvt.rows[0].payload || {};
        const requestId = stored.server_request_id || null;
        await client.query("COMMIT");
        reply.code(201).send({ request_id: requestId, duplicate: true });
        return;
      }

      if (!existingEvt.rowCount) {
        await client.query(
          `INSERT INTO offline_events
             (client_event_id, kiosk_id, payload, signature, processed)
           VALUES ($1,$2,$3,$4,false)`,
          [body.client_event_id, body.kiosk_id, body.payload, body.signature || null],
        );
      }

      const rPayload = body.payload || {};
      const reqBody = {
        kiosk_id: body.kiosk_id,
        user_id: rPayload.user_id || null,
        department: rPayload.department,
        service_type: rPayload.service_type,
        priority: rPayload.priority || "normal",
        payload: rPayload.payload || rPayload,
      };

      // Validate department exists
      const deptCheck = await client.query(
        "SELECT 1 FROM departments WHERE code = $1",
        [reqBody.department],
      );
      if (!deptCheck.rowCount) {
        throw new Error("Invalid department in offline payload");
      }

      const svcCheck = await client.query(
        "SELECT s.id FROM services s JOIN departments d ON s.department_id = d.id WHERE d.code = $1 AND s.code = $2",
        [reqBody.department, reqBody.service_type],
      );
      if (!svcCheck.rowCount) {
        throw new Error("Invalid service in offline payload");
      }

      const requestId = uuid();

      await client.query(
        `INSERT INTO requests
           (id, kiosk_id, user_id, department, service_type, service_code, priority, status, payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'submitted',$8)`,
        [
          requestId,
          reqBody.kiosk_id,
          reqBody.user_id,
          reqBody.department,
          reqBody.service_type,
          reqBody.service_type, // map service_type to service_code for offline
          reqBody.priority,
          reqBody.payload,
        ],
      );

      await client.query(
        `UPDATE offline_events
         SET processed = true, payload = jsonb_set(payload, '{server_request_id}', to_jsonb($2::text), true)
         WHERE client_event_id = $1`,
        [body.client_event_id, requestId],
      );

      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
         VALUES ($1,$2,$3,$4,$5)`,
        [null, "offline_request_created", "request", requestId, { client_event_id: body.client_event_id }],
      );

      await client.query("COMMIT");

      reply.code(201).send({ request_id: requestId, duplicate: false });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
);

app.get("/admin/requests", async (req) => {
  const { department, status, priority } = req.query;
  const values = [];
  const where = [];
  if (department) {
    values.push(department);
    where.push(`r.department = $${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`r.status = $${values.length}`);
  }
  if (priority) {
    values.push(priority);
    where.push(`r.priority = $${values.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT r.* FROM requests r ${whereSql} ORDER BY r.fraud_flag DESC, r.priority DESC, r.created_at DESC LIMIT 200`;

  const res = await pool.query(sql, values);
  return { requests: res.rows.map(normalizeRequestRow) };
});

app.get("/admin/analytics", async () => {
  const client = await pool.connect();
  try {
    const byDept = await client.query(
      `SELECT department, status, COUNT(*) as count FROM requests GROUP BY department, status ORDER BY department, status`
    );
    const byStatus = await client.query(
      `SELECT status, COUNT(*) as count FROM requests GROUP BY status ORDER BY count DESC`
    );
    const total = await client.query(`SELECT COUNT(*) as total FROM requests`);
    const fraudCount = await client.query(`SELECT COUNT(*) as count FROM requests WHERE fraud_flag = true`);
    return {
      total_requests: Number(total.rows[0]?.total || 0),
      fraud_flagged: Number(fraudCount.rows[0]?.count || 0),
      by_department_status: byDept.rows,
      by_status: byStatus.rows,
    };
  } finally {
    client.release();
  }
});

app.patch(
  "/admin/requests/:id",
  {
    schema: {
      params: {
        type: "object",
        required: ["id"],
        properties: { id: { type: "string", format: "uuid" } },
      },
      body: {
        type: "object",
        properties: {
          status: { type: "string" },
          priority: { type: "string" },
          fraud_flag: { type: "boolean" },
        },
      },
    },
  },
  async (req, reply) => {
    const { id } = req.params;
    const body = req.body;
    const fields = [];
    const values = [];

    if (body.status) {
      values.push(body.status);
      fields.push(`status = $${values.length}`);
    }
    if (body.priority) {
      values.push(body.priority);
      fields.push(`priority = $${values.length}`);
    }
    if (typeof body.fraud_flag === "boolean") {
      values.push(body.fraud_flag);
      fields.push(`fraud_flag = $${values.length}`);
    }

    if (!fields.length) {
      reply.code(400).send(error("no_updates", "No updatable fields provided"));
      return;
    }

    values.push(id);
    const sql = `UPDATE requests SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${values.length
      } RETURNING *`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const res = await client.query(sql, values);
      if (!res.rowCount) {
        reply.code(404).send(error("not_found", "Request not found"));
        return;
      }

      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
         VALUES ($1,$2,$3,$4,$5)`,
        [null, "request_updated_admin", "request", id, body],
      );

      const updated = normalizeRequestRow(res.rows[0]);

      if (body.status === "payment_pending") {
        const svcRes = await client.query("SELECT fee_amount FROM services s JOIN departments d ON s.department_id = d.id WHERE d.code = $1 AND s.code = $2", [updated.department, updated.service_type]);
        let fee = 0;
        if (svcRes.rowCount) fee = svcRes.rows[0].fee_amount;

        await client.query(
          `INSERT INTO payments (request_id, amount, status) VALUES ($1,$2,'pending')`,
          [id, fee]
        );
      }

      await client.query("COMMIT");

      const correlationId = req.headers["x-request-id"] || uuid();
      await publishEvent(
        "request.status_changed",
        { id, status: updated.status, priority: updated.priority },
        correlationId,
      );

      reply.send(updated);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
);

function normalizeRequestRow(row) {
  return {
    id: row.id,
    kiosk_id: row.kiosk_id,
    user_id: row.user_id,
    department: row.department,
    service_type: row.service_type,
    service_code: row.service_type || row.service_code,
    priority: row.priority,
    status: row.status,
    payload: row.payload,
    sla_due_at: row.sla_due_at,
    fraud_flag: row.fraud_flag,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeDocumentRow(row) {
  return {
    id: row.id,
    request_id: row.request_id,
    filename: row.file_name,
    storage_path: row.object_key,
    mime_type: row.mime_type,
    size: row.size_bytes ? Number(row.size_bytes) : null,
    uploaded_at: row.created_at,
  };
}

function normalizePaymentRow(row) {
  return {
    id: row.id,
    request_id: row.request_id,
    amount_paise: row.amount_paise !== null ? Number(row.amount_paise) : null,
    currency: row.currency,
    gateway: row.provider,
    gateway_ref: row.provider_ref,
    status: row.status,
    created_at: row.created_at,
  };
}

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

