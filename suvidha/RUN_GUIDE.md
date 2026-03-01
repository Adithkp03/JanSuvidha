# JanSuvidha Setup & Run Guide

This guide explains how to spin up the entire JanSuvidha local environment, including the backend services, databases, admin/kiosk frontends, and the public portal.

## Prerequisites
- **Docker** and **Docker Compose** installed and running.
- **Node.js** (v18+ recommended) and **npm** installed (for running the standalone portal).
- *(Optional but recommended)* **Make** utility, if available on your Windows environment (via Git Bash, WSL, or Chocolatey).

---

## 1. Start the Core Infrastructure & Microservices

The core system is orchestrated via Docker Compose and includes:
- **Databases & Messaging:** Postgres, Redis, RabbitMQ, MinIO (Object Storage)
- **Backend Services:** API Gateway, Auth, Request, Routing, Payment, Doc, Intent
- **Internal UIs:** Admin Dashboard, Kiosk Frontend
- **Routing:** NGINX (Reverse proxy on port 80)

### Option A: Using `Make` (If installed)
Open your terminal at the root of the project (`d:\JanSuvidha\suvidha`) and run:
```bash
# This automatically copies the .env files and starts the docker containers
make dev
```

### Option B: Using standard Docker Compose (Native Windows)
If you don't have `make` installed, you can run the equivalent commands manually from the project root:

1. **Setup Environment Variables:**
   ```powershell
   copy infra\.env.example infra\.env
   ```

2. **Start the Stack:**
   ```powershell
   docker compose --env-file infra/.env -f infra/docker-compose.yml up --build
   ```

---

## 2. Initialize the Database (Run Migrations)

Once the containers are up and healthy (especially Postgres), you need to create the database schemas and tables.

### Option A: Using `Make`
Open a new terminal window at the project root:
```bash
make migrate
```

### Option B: Using raw Docker
```powershell
docker compose --env-file infra/.env -f infra/docker-compose.yml exec -T postgres psql -U admin -d suvidha_db -f /docker-entrypoint-initdb.d/init.sql
```
*(Note: If using default credentials from `.env.example`, `POSTGRES_USER` is usually `admin` and `POSTGRES_DB` is `suvidha_db`)*

---

## 3. Start the Main Portal (React Frontend)

The `portal` app is a standalone React/Vite application that is not included in the main docker-compose file. You need to run it locally via Node.

Open a **new** terminal window and run:
```powershell
cd d:\JanSuvidha\suvidha\portal
npm install
npm run dev
```

---

## 4. Accessing the Application

Once everything is running, you can access the different parts of the system in your browser:

### Services Available Externally:
- **Public Portal:** `http://localhost:5173` (or whatever port Vite assigns, check your terminal output)
- **Nginx Gateway (Main entry):** `http://localhost`
- **Swagger API Docs:** `http://localhost/docs`
- **Admin Dashboard:** `http://localhost/admin/`
- **Kiosk UI:** `http://localhost/kiosk/`

### Internal Infra Tools (For debugging):
- **Gateway Health Check:** `http://localhost/health`
- **MinIO Console (S3 Storage):** `http://localhost:9000` (API is on 9002)
- **RabbitMQ Management:** `http://localhost:15672` (Check `infra/.env` for credentials)
- **Postgres Database:** `localhost:5432`

---

## How to Stop the Environment

To shut down the Docker services, run:
```bash
# If using make
make stop

# If using raw docker compose
docker compose -f infra/docker-compose.yml down
```
For the portal, simply press `Ctrl + C` in the terminal where it's running.
