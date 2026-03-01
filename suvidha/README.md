# This README is the judge-facing entrypoint to run the JanSuvidha Phase 0 scaffold locally.

## One-line run
```bash
make dev
```

## What you get (Phase 0)
- A runnable mono-repo scaffold with infra + service skeletons
- Reverse proxy entrypoint at **`http://localhost`** (nginx)
- Swagger UI at **`http://localhost/docs`**
- Kiosk UI at **`http://localhost/kiosk/`**
- Admin UI at **`http://localhost/admin/`**

## First-time setup (automatic)
`make dev` will create `infra/.env` from `infra/.env.example` if missing.

## Run migrations / seed
```bash
make migrate
```

## Useful local endpoints
- **Gateway health (via nginx)**: `http://localhost/health`
- **Swagger UI**: `http://localhost/docs`
- **MinIO console**: `http://localhost:9000` (S3 API on `http://localhost:9002`)
- **RabbitMQ management**: `http://localhost:15672` (user/pass from `infra/.env`)
- **Postgres**: `localhost:5432`

## Phase 0 demo checklist
1) Start stack: `make dev`
2) Health check: `curl http://localhost/health` → `200`
3) Swagger UI: open `http://localhost/docs` → shows JanSuvidha API stub
4) Kiosk + Admin: open `http://localhost/kiosk/` and `http://localhost/admin/`
5) DB tables: connect to Postgres and confirm `users` + `requests` exist

## Phase 1 – core platform (data + API + services)

- Core schema is defined in `infra/migrations/001_core.sql` and applied via `infra/init.sql`.
- Requests, documents, payments, offline events, and audit logs are all stored in Postgres.
- The `request-service` now backs:
  - `POST /requests` (create request)
  - `GET /requests/{id}` (with documents + payments)
  - `GET /requests` (filters)
  - `POST /requests/{id}/documents` (metadata only)
  - `POST /sync/offline`
  - `GET /admin/requests`
  - `PATCH /admin/requests/{id}`

### Phase 1 quick test (from host)

```bash
# Create request
curl -X POST http://localhost/requests ^
  -H "Content-Type: application/json" ^
  -d "{\"department\":\"water\",\"service_type\":\"leak\",\"priority\":\"normal\",\"payload\":{\"name\":\"Rahul\"}}"

# List admin requests
curl http://localhost/admin/requests

# Create via offline sync
curl -X POST http://localhost/sync/offline ^
  -H "Content-Type: application/json" ^
  -d "{\"client_event_id\":\"evt-1\",\"kiosk_id\":\"00000000-0000-0000-0000-000000000001\",\"payload\":{\"department\":\"water\",\"service_type\":\"leak\",\"payload\":{\"name\":\"Kiosk User\"}}}"
```


