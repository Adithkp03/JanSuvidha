# This README explains how to run the JanSuvidha Auth service stub locally.

## Endpoints (Phase 0)
- `GET /health`
- `POST /auth/otp` (returns `otp_hint` for demo)
- `POST /auth/verify` (returns a stub token)

## Run locally (without compose)
```bash
cp .env.example .env
npm install
npm run start
```

