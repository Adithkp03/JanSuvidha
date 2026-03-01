// Purpose: Routing/event consumer that reads request domain events from RabbitMQ and exposes Prometheus metrics.
import amqp from "amqplib";
import Fastify from "fastify";
import client from "prom-client";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  "amqp://suvidha_rabbit:suvidha_rabbit_password_change_me@rabbitmq:5672";

const EXCHANGE = "requests.events";
const QUEUE = process.env.ROUTING_QUEUE || "requests.events";

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });

const registerDefaultMetrics = client.collectDefaultMetrics;
registerDefaultMetrics();

const eventsCounter = new client.Counter({
  name: "routing_events_total",
  help: "Total number of domain events consumed by routing-service",
  labelNames: ["routing_key"],
});

app.get("/health", async () => ({ ok: true, service: "routing-service" }));

app.get("/metrics", async (_req, reply) => {
  reply.header("Content-Type", client.register.contentType);
  return client.register.metrics();
});

async function startConsumer() {
  while (true) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, "topic", { durable: true });
      const q = await ch.assertQueue(QUEUE, { durable: true });
      await ch.bindQueue(q.queue, EXCHANGE, "#");

      console.log(
        `[routing-service] connected; consuming queue=${q.queue} from exchange=${EXCHANGE}`,
      );

      ch.consume(
        q.queue,
        (msg) => {
          if (!msg) return;
          const body = msg.content.toString("utf-8");
          const rk = msg.fields.routingKey;
          const correlationId = msg.properties.correlationId;
          eventsCounter.inc({ routing_key: rk });
          console.log(
            `[routing-service] event rk=${rk} correlationId=${correlationId} body=${body}`,
          );
          ch.ack(msg);
        },
        { noAck: false },
      );

      return;
    } catch (err) {
      console.error("[routing-service] connect failed; retrying in 2s", err?.message || err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  await startConsumer();
  await app.listen({ port: 3005, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("[routing-service] fatal", err);
  process.exit(1);
});

