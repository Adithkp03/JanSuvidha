// Purpose: Auth service with production-grade OTP via Redis and JWT (RS256) for JanSuvidha.
import Fastify from "fastify";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import client from "prom-client";
import nodemailer from "nodemailer";

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL || "info" },
});

const registerDefaultMetrics = client.collectDefaultMetrics;
registerDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "auth_http_requests_total",
  help: "Total number of HTTP requests to auth-service",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new client.Histogram({
  name: "auth_http_request_duration_seconds",
  help: "HTTP request duration in seconds for auth-service",
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

const PORT = Number(process.env.PORT || 3001);
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_PER_WINDOW = 5;
const OTP_WINDOW_SECONDS = 15 * 60;

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;

// Use RS256 only for PEM keys; fall back to HS256 for dev/simple string keys
const isPemKey = (k) => k && typeof k === "string" && k.includes("-----BEGIN");
const JWT_ALGORITHM = isPemKey(JWT_PRIVATE_KEY) ? "RS256" : "HS256";
const JWT_SECRET = JWT_PRIVATE_KEY || JWT_PUBLIC_KEY;

if (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY) {
  app.log.warn("JWT_PRIVATE_KEY / JWT_PUBLIC_KEY not set; tokens will not be verifiable externally");
}

const transporter = nodemailer.createTransport({
  host: process.env.HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.SECURE === "true",
  service: process.env.SERVICE || "gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

const redis = createClient({ url: REDIS_URL });
redis.on("error", (err) => app.log.error({ err }, "Redis error in auth-service"));
await redis.connect();

function error(code, message, details = null) {
  return { error: message, code, details };
}

app.setErrorHandler((err, _req, reply) => {
  app.log.error(err);
  reply.code(500).send(error("internal_error", "Unexpected auth-service error"));
});

app.get("/health", async () => ({ ok: true, service: "auth-service" }));

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
});

app.post(
  "/otp",
  {
    schema: {
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
    },
  },
  async (req, reply) => {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      reply.code(400).send(error("email_required", "email required"));
      return;
    }

    const rateKey = `otp:rate:${email}`;
    const count = Number((await redis.incr(rateKey)) || 0);
    if (count === 1) {
      await redis.expire(rateKey, OTP_WINDOW_SECONDS);
    }
    if (count > OTP_MAX_PER_WINDOW) {
      reply
        .code(429)
        .send(
          error("rate_limited", "Too many OTP requests. Please try again later.", {
            window_seconds: OTP_WINDOW_SECONDS,
          }),
        );
      return;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpKey = `otp:${email}`;
    const payload = JSON.stringify({ otp });
    await redis.set(otpKey, payload, { EX: OTP_TTL_SECONDS });

    app.log.info({ email }, "OTP generated");

    // Send email asynchronously
    transporter.sendMail({
      from: `"JanSuvidha Portal" <${process.env.USER}>`,
      to: email,
      subject: "Your OTP for JanSuvidha Portal",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
      html: `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    }).catch(err => app.log.error({ err }, "Failed to send OTP email"));

    reply.send({
      sent: true,
      expires_in_seconds: OTP_TTL_SECONDS,
      otp_hint: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  },
);

app.post(
  "/verify",
  {
    schema: {
      body: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string" },
          otp: { type: "string" },
        },
      },
    },
  },
  async (req, reply) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      reply.code(400).send(error("email_and_otp_required", "email and otp required"));
      return;
    }

    const otpKey = `otp:${email}`;
    const raw = await redis.get(otpKey);
    if (!raw) {
      reply.code(401).send(error("otp_expired", "OTP expired or not found"));
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (!parsed || parsed.otp !== otp) {
      reply.code(401).send(error("otp_invalid", "Invalid OTP"));
      return;
    }

    await redis.del(otpKey);

    const user = {
      id: `user-${crypto.createHash("sha256").update(email).digest("hex").slice(0, 24)}`,
      email,
      role: "citizen",
    };

    let token = null;
    if (JWT_SECRET) {
      token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_ALGORITHM === "RS256" ? JWT_PRIVATE_KEY : JWT_SECRET,
        {
          algorithm: JWT_ALGORITHM,
          expiresIn: "1h",
        },
      );
    }

    reply.send({
      token,
      user,
    });
  },
);

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

