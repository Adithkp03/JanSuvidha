# This README explains how to run the JanSuvidha API gateway locally.

## What it does (Phase 0)
- Serves **Swagger UI** at `/docs` using `openapi.yml`
- Proxies `/auth`, `/requests`, `/payments` to downstream services
- Maps `/intent` → `intent-service` `/predict`
- Provides `/health`

## Run locally (without compose)
```bash
cp .env.example .env
npm install
npm run start
```

## Env vars
See `.env.example`.

