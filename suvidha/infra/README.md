# This README explains how to run the JanSuvidha infrastructure stack locally using Docker Compose.

## What runs here
- **Postgres 14**: primary relational DB (schema from `init.sql`)
- **Redis 7**: cache/session placeholder
- **MinIO**: S3-compatible object store (for `doc-service`)
- **RabbitMQ**: event bus (for `routing-service`)
- **nginx**: single entrypoint on `localhost:80`

## Local credentials / secrets
- Copy `.env.example` to `.env` and keep secrets out of git.
- JWT keys are placeholders in `.env.example` (generate real keys for Phase 1).

## Ports (host)
- **nginx**: `80`
- **postgres**: `5432`
- **rabbitmq**: `5672` (mgmt UI: `15672`)
- **minio**: `9000` (console) and `9002` (S3 API)

## Notes
- `init.sql` is mounted into Postgres for first boot initialization.
- If you want to re-init from scratch, delete the `postgres_data` volume (`docker compose down -v`).

