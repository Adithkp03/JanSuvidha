# JanSuvidha Portal - Admin Dashboard SPA

This is the production-ready Single Page Application (SPA) for JanSuvidha Administrators.
Built with React, Vite, TailwindCSS, Zustand, and React Query.

## Features Added
- **Live Requests Table**: Virtualized, filterable table for handling high-volume citizen requests.
- **Service Level Agreements (SLA) & Priority Engine**: Automatically ranks applications using configured metadata.
- **Fraud Detection Engine**: Flags suspicious applications based on velocity and document fingerprint reuse.
- **Document Preview**: Integrated React-PDF viewer with OCR text extraction stub.
- **Actionable Analytics**: KPI charts powered by Recharts.

## Demo / Running Locally
To test the full feature set without a backend, the application gracefully degrades to use the offline semantic seed data located in `seed/admin-seed.json`.

1. **Install dependencies:**
   ```bash
   cd portal
   npm install
   ```

2. **Run Dev Server:**
   ```bash
   npm run dev
   ```

3. **View Dashboard:**
   Open your browser to `http://localhost:3000/admin`.

## Run Cypress Smoke Test
Ensure the dev server is running, then execute:
```bash
npx cypress run --spec cypress/e2e/admin-smoke.spec.js
```

## Docker Deployment
To build and serve the application via an NGINX container:
```bash
cd portal
docker build -t jansuvidha-portal .
docker run -p 8080:80 jansuvidha-portal
```
