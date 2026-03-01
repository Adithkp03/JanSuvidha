// Purpose: Payment service sandbox - records payments in Postgres and updates request status via webhook.
import Fastify from "fastify";
import crypto from "node:crypto";
import { Pool } from "pg";
import client from "prom-client";

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });
const PORT = Number(process.env.PORT || 3003);

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://suvidha:suvidha_password_change_me@postgres:5432/suvidha_db";
const pool = new Pool({ connectionString: DATABASE_URL });

const registerDefaultMetrics = client.collectDefaultMetrics;
registerDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "payment_http_requests_total",
  help: "Total HTTP requests to payment-service",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "payment_http_request_duration_seconds",
  help: "HTTP request duration in seconds for payment-service",
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

function uuid() {
  return crypto.randomUUID();
}

function error(code, message, details = null) {
  return { error: message, code, details };
}

app.setErrorHandler((err, _req, reply) => {
  app.log.error(err);
  reply.code(500).send(error("internal_error", "Unexpected payment-service error"));
});

app.get("/health", async () => ({ ok: true, service: "payment-service" }));

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
});

app.post(
  "/payments",
  {
    schema: {
      body: {
        type: "object",
        required: ["request_id", "amount"],
        properties: {
          request_id: { type: "string", format: "uuid" },
          amount: { type: "number" },
          currency: { type: "string", nullable: true },
          gateway: { type: "string", nullable: true },
        },
      },
    },
  },
  async (req, reply) => {
    const body = req.body;
    const id = uuid();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pRes = await client.query(
        `INSERT INTO payments
           (id, request_id, amount_paise, currency, provider, status)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [
          id,
          body.request_id,
          body.amount,
          body.currency || "INR",
          body.gateway || "sandbox",
          "initiated",
        ],
      );

      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
         VALUES ($1,$2,$3,$4,$5)`,
        [null, "payment_created", "payment", id, body],
      );

      await client.query("COMMIT");

      reply.code(201).send(normalizePaymentRow(pRes.rows[0]));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
);

app.post(
  "/payments/webhook",
  {
    schema: {
      body: {
        type: "object",
        required: ["payment_id", "status"],
        properties: {
          payment_id: { type: "string", format: "uuid" },
          status: { type: "string" },
          gateway_ref: { type: "string", nullable: true },
        },
      },
    },
  },
  async (req, reply) => {
    const body = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pRes = await client.query(
        `UPDATE payments
         SET status = $2, provider_ref = COALESCE($3,provider_ref)
         WHERE id = $1
         RETURNING *`,
        [body.payment_id, body.status, body.gateway_ref || null],
      );
      if (!pRes.rowCount) {
        await client.query("ROLLBACK");
        reply.code(404).send(error("not_found", "Payment not found"));
        return;
      }

      const payment = pRes.rows[0];
      if (body.status === "succeeded") {
        await client.query(
          `UPDATE requests SET status = 'paid', updated_at = NOW() WHERE id = $1`,
          [payment.request_id],
        );
      }

      await client.query(
        `INSERT INTO audit_logs (actor_id, action, entity, entity_id, details)
         VALUES ($1,$2,$3,$4,$5)`,
        [null, "payment_webhook", "payment", body.payment_id, body],
      );

      await client.query("COMMIT");

      reply.send(normalizePaymentRow(payment));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
);

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

