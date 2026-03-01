# This README explains how to run the JanSuvidha intent-service stub locally.

## Endpoints (Phase 0)
- `GET /health`
- `POST /predict`

## Run locally (without compose)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Predict example
```bash
curl -X POST http://localhost:8000/predict -H "Content-Type: application/json" -d '{"text":"I need a birth certificate"}'
```

