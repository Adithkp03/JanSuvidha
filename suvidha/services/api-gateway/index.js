// Purpose: API Gateway entrypoint (health, Swagger UI, and proxy/stub routes for Phase 0).
import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { createRequire } from "node:module";
import YAML from "yaml";
import crypto from "node:crypto";
import client from "prom-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

const registerDefaultMetrics = client.collectDefaultMetrics;
registerDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

app.addHook("onRequest", (req, reply, done) => {
  const existing = req.headers["x-request-id"];
  const id = existing || crypto.randomUUID();
  req.headers["x-request-id"] = id;
  reply.header("x-request-id", id);
  reply.requestId = id;
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

const PORT = Number(process.env.PORT || 3000);

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";
const REQUEST_SERVICE_URL =
  process.env.REQUEST_SERVICE_URL || "http://request-service:3002";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://payment-service:3003";
const INTENT_SERVICE_URL =
  process.env.INTENT_SERVICE_URL || "http://intent-service:8000";
const DOC_SERVICE_URL =
  process.env.DOC_SERVICE_URL || "http://doc-service:3004";
const OPENAPI_PATH =
  process.env.OPENAPI_PATH || path.join(__dirname, "openapi.yml");

app.get("/health", async () => {
  return { ok: true, service: "api-gateway" };
});

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
});

// Serve the OpenAPI stub (mounted in docker-compose as /usr/src/app/openapi.yml).
app.get("/openapi.yml", async (_req, reply) => {
  const p = OPENAPI_PATH;
  if (!fs.existsSync(p)) {
    reply.code(404);
    return { ok: false, error: "openapi.yml not found" };
  }
  reply.type("text/yaml");
  return fs.createReadStream(p);
});

// Load OpenAPI YAML once and use it for swagger plugin.
let openapiObject = undefined;
try {
  if (fs.existsSync(OPENAPI_PATH)) {
    const raw = fs.readFileSync(OPENAPI_PATH, "utf8");
    openapiObject = YAML.parse(raw);
  }
} catch (err) {
  app.log.warn({ err }, "Failed to load openapi.yml for swagger");
}

if (openapiObject) {
  await app.register(swagger, { openapi: openapiObject });
} else {
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: { title: "JanSuvidha API", version: "0.0.0" },
      paths: {},
    },
  });
}

await app.register(swaggerUI, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Auth proxy: custom handler to ensure request body is correctly forwarded
// (@fastify/http-proxy can lose body when Fastify parses it first)
app.register(async function authRoutes(instance) {
  instance.all("/auth/*", async (req, reply) => {
    const path = req.raw.url.replace(/^\/auth/, "") || "/";
    const targetUrl = `${AUTH_SERVICE_URL}${path}`;
    const bodyStr = req.body != null ? JSON.stringify(req.body) : undefined;
    try {
      const res = await fetch(targetUrl, {
        method: req.method,
        headers: {
          "content-type": "application/json",
          ...(req.headers["x-request-id"] && { "x-request-id": req.headers["x-request-id"] }),
        },
        body: req.method !== "GET" && req.method !== "HEAD" ? bodyStr : undefined,
      });
      const text = await res.text();
      reply.code(res.status);
      reply.header("Content-Type", res.headers.get("content-type") || "application/json");
      return text;
    } catch (err) {
      instance.log.error({ err, targetUrl }, "Auth proxy fetch failed");
      reply.code(502).send(JSON.stringify({
        error: "Auth service unreachable",
        code: "auth_unreachable",
      }));
    }
  });
});

// Proxies: keep paths consistent with the OpenAPI stub.
await app.register(proxy, {
  upstream: `${REQUEST_SERVICE_URL}/requests`,
  prefix: "/requests",
});
await app.register(proxy, {
  upstream: `${PAYMENT_SERVICE_URL}/payments`,
  prefix: "/payments",
});
await app.register(proxy, {
  upstream: `${REQUEST_SERVICE_URL}/admin`,
  prefix: "/admin",
});
await app.register(proxy, {
  upstream: `${REQUEST_SERVICE_URL}/sync`,
  prefix: "/sync",
});
await app.register(proxy, {
  upstream: `${DOC_SERVICE_URL}/documents`,
  prefix: "/documents",
});

// Intent is mapped to Python service but exposed as /intent/* for clients.
await app.register(async function (instance) {
  instance.all("/intent/*", async (req, reply) => {
    const suffix = req.raw.url.replace(/^\/intent/, "") || "/";
    const targetUrl = `${INTENT_SERVICE_URL}${suffix}`;

    const res = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "content-type": req.headers["content-type"] || "application/json",
      },
      body:
        req.body && typeof req.body === "object"
          ? JSON.stringify(req.body)
          : undefined,
    });

    const text = await res.text();
    reply.code(res.status);
    for (const [k, v] of res.headers.entries()) {
      if (k.toLowerCase() === "content-type") {
        reply.type(v);
      }
    }
    return text;
  });

  instance.get("/intent/health", async () => {
    const res = await fetch(`${INTENT_SERVICE_URL}/health`);
    const json = await res.json();
    return json;
  });
});

// Service catalog routing (Phase 2)
app.get("/services", async (req, reply) => {
  const url = new URL(`${REQUEST_SERVICE_URL}/services`);
  if (req.query.department) url.searchParams.append("department", req.query.department);

  const res = await fetch(url.toString());
  const text = await res.text();
  reply.code(res.status);
  reply.header("content-type", res.headers.get("content-type") || "application/json");
  return text;
});

app.get("/departments", async (req, reply) => {
  const res = await fetch(`${REQUEST_SERVICE_URL}/departments`);
  const text = await res.text();
  reply.code(res.status);
  reply.header("content-type", res.headers.get("content-type") || "application/json");
  return text;
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

