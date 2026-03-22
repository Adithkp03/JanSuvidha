// Purpose: Document service - upload files to MinIO, persist metadata in Postgres, and provide signed URLs.
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { Client as MinioClient } from "minio";
import { Pool } from "pg";
import crypto from "node:crypto";
import client from "prom-client";

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });
const PORT = Number(process.env.PORT || 3004);

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9002";
const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER || "minio";
const MINIO_ROOT_PASSWORD = process.env.MINIO_ROOT_PASSWORD || "minio123";
const BUCKET = process.env.MINIO_BUCKET || "jan-suvidha";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://suvidha:suvidha_password_change_me@postgres:5432/suvidha_db";
const pool = new Pool({ connectionString: DATABASE_URL });

const registerDefaultMetrics = client.collectDefaultMetrics;
registerDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "doc_http_requests_total",
  help: "Total HTTP requests to doc-service",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "doc_http_request_duration_seconds",
  help: "HTTP request duration in seconds for doc-service",
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

function parseEndpoint(url) {
  const u = new URL(url);
  return {
    endPoint: u.hostname,
    port: Number(u.port || 80),
    useSSL: u.protocol === "https:",
  };
}

const { endPoint, port, useSSL } = parseEndpoint(MINIO_ENDPOINT);
const minio = new MinioClient({
  endPoint,
  port,
  useSSL,
  accessKey: MINIO_ROOT_USER,
  secretKey: MINIO_ROOT_PASSWORD,
});

async function ensureBucket() {
  const exists = await minio.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await minio.makeBucket(BUCKET, "us-east-1");
    app.log.info({ bucket: BUCKET }, "MinIO bucket created");
  }
}

app.get("/health", async () => ({ ok: true, service: "doc-service" }));

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
});

// In-memory cache for cross-device mobile uploads via QR code
const uploadStatuses = new Map();

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Endpoint for the Kiosk to poll for completion
app.get("/documents/upload-status", async (req, reply) => {
  const token = req.query.token;
  if (!token) return { completed: false };

  const status = uploadStatuses.get(token);
  if (status) {
    // Optionally remove it so it's a one-time read
    uploadStatuses.delete(token);
    return status;
  }
  return { completed: false };
});

app.post("/documents/upload", async (req, reply) => {
  const file = await req.file();
  if (!file) {
    reply.code(400);
    return { ok: false, error: "file required (multipart field name: file)" };
  }

  const token = req.query.token; // For QR code flow

  const objectKey = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${file.filename}`;
  await ensureBucket();

  await minio.putObject(BUCKET, objectKey, file.file, {
    "Content-Type": file.mimetype,
  });

  const client = await pool.connect();
  let responsePayload;
  try {
    const id = crypto.randomUUID();
    const res = await client.query(
      `INSERT INTO documents (id, request_id, file_name, object_key, mime_type, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [id, null, file.filename, objectKey, file.mimetype || null, file.file?.bytes || null],
    );

    responsePayload = {
      ok: true,
      bucket: BUCKET,
      object_key: objectKey,
      document: {
        id: res.rows[0].id,
        filename: res.rows[0].file_name,
        storage_path: res.rows[0].object_key,
        mime_type: res.rows[0].mime_type,
        size: res.rows[0].size_bytes,
      },
    };
    reply.code(201).send(responsePayload);

    if (token) {
      uploadStatuses.set(token, {
        completed: true,
        id: res.rows[0].id,
        object_key: objectKey,
        filename: file.filename,
        size: file.file?.bytes || file.file?.byteLength || 0,
        mock: false
      });

      // Auto-cleanup after 10 minutes just in case
      setTimeout(() => uploadStatuses.delete(token), 10 * 60 * 1000);
    }

  } finally {
    client.release();
  }
});

// Same-origin proxy: browsers cannot open presigned URLs that point at internal hostnames (e.g. minio:9002).
app.get("/documents/:key/stream", async (req, reply) => {
  const objectKey = decodeURIComponent(req.params.key);
  await ensureBucket();
  try {
    const stat = await minio.statObject(BUCKET, objectKey);
    const stream = await minio.getObject(BUCKET, objectKey);
    const ext = objectKey.split(".").pop()?.toLowerCase() || "";
    const extMime = {
      png: "image/png",
      jpg: "image/jpg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    const mime =
      stat.metaData?.["content-type"] ||
      stat.metaData?.["Content-Type"] ||
      extMime[ext] ||
      "application/octet-stream";
    const safeName = objectKey.split("/").pop() || "document";
    reply.header("Content-Type", mime);
    reply.header(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`,
    );
    return reply.send(stream);
  } catch (err) {
    app.log.error({ err, objectKey }, "Stream failed");
    reply.code(404).send({ error: "not_found", code: "document_not_found" });
  }
});

app.get("/documents/:key/signed-url", async (req, reply) => {
  const { key } = req.params;
  const objectKey = key;

  await ensureBucket();
  try {
    const url = await minio.presignedGetObject(BUCKET, objectKey, 600);
    reply.send({ url, expires_in_seconds: 600 });
  } catch (err) {
    app.log.error({ err }, "Failed to create signed URL");
    reply.code(404).send({ error: "not_found", code: "document_not_found" });
  }
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

