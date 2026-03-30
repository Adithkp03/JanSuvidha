# This README is the judge-facing entrypoint to run the JanSuvidha Phase 0 scaffold locally.

## Setup and Run Services
```bash
cd suvidha
# Copy environment template (On Windows: copy infra\.env.example infra\.env)
cp infra/.env.example infra/.env
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build
```

## What you get (Phase 0 & Beyond)
- A runnable mono-repo scaffold with infra + service skeletons
- Reverse proxy entrypoint at **`http://localhost`** (nginx)
- Public Portal at **`http://localhost:5173`** (requires separate setup)
- Swagger UI at **`http://localhost/docs`**
- Kiosk UI at **`http://localhost/kiosk/`**
- Admin UI at **`http://localhost/admin/`**

## First-time setup
You must copy `infra/.env.example` to `infra/.env` before starting the services (as shown in the run step above).

## Run migrations / seed
```bash
cd suvidha
docker compose --env-file infra/.env -f infra/docker-compose.yml exec -T postgres psql -U admin -d suvidha_db -f /docker-entrypoint-initdb.d/init.sql
```

## Useful local endpoints
- **Gateway health (via nginx)**: `http://localhost/health`
- **Swagger UI**: `http://localhost/docs`
- **MinIO console**: `http://localhost:9000` (S3 API on `http://localhost:9002`)
- **RabbitMQ management**: `http://localhost:15672` (user/pass from `infra/.env`)
- **Postgres**: `localhost:5432`

## Phase 0 demo checklist
1) Start stack: `cd suvidha && docker compose --env-file infra/.env -f infra/docker-compose.yml up --build`
2) Health check: `curl http://localhost/health` → `200`
3) Start Portal: `cd suvidha/portal && npm install && npm run dev`
4) Swagger UI: open `http://localhost/docs` → shows JanSuvidha API stub
5) Kiosk + Admin: open `http://localhost/kiosk/` and `http://localhost/admin/`
6) Public Portal: open `http://localhost:5173`
7) DB tables: connect to Postgres and confirm `users` + `requests` exist

## Current Features Implemented

* **Public Portal**: A standalone React application for citizens with chatbot, request tracking, and a submission pipeline.
* **Admin Dashboard**: Enhanced multi-role support (Super Admin, Regional Admin) with offline data sync for dashboards.
* **Kiosk UI enhancements**: Senior Citizen Mode (with text-to-speech) and multi-language translations.
* **QR Document Upload**: Cross-device document attachments using ngrok-powered QR code mobile links.
* **Broadcast Alerts**: Real-time alerts synchronized from Admin panel to Citizen Portal.
* **Microservices**: Fully functional `request-service`, `payment-service`, and `intent-service`.

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


