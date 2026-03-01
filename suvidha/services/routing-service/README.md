# This README explains how to run the JanSuvidha routing/event consumer stub locally.

## What it does (Phase 0)
- Connects to RabbitMQ
- Consumes queue `requests.events`
- Logs events and ACKs them

## Run locally (without compose)
```bash
cp .env.example .env
npm install
RABBITMQ_URL=amqp://guest:guest@localhost:5672 npm run start
```

