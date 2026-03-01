# This README explains how to run the JanSuvidha document service stub locally.

## Endpoints (Phase 0)
- `GET /health`
- `POST /documents/upload` (multipart form-data, field name: `file`)

## Run locally (without compose)
```bash
cp .env.example .env
npm install
npm run start
```

## Quick upload example
```bash
curl -F "file=@./some.pdf" http://localhost:3004/documents/upload
```

