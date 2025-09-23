# API – Feature-Flags Control Plane

This folder contains the **backend service** for the Feature-Flags & Experimentation Platform.  
It exposes REST endpoints for managing flags/segments, writing snapshots to S3, and broadcasting **real-time version updates via Server-Sent Events (SSE)**.

---

## ⚡ Features

- **Multi-tenant data model**: tenants → projects → environments → flags → segments → rollout rules → audit logs.
- **Realtime propagation**: after any flag change the API:
  1. Builds a fresh `snapshot.json` for that environment,
  2. Uploads it to **AWS S3**,
  3. Emits an **SSE `{version}` event** so SDKs re-fetch only when needed.
- **Admin & guest access**:
  - Admins use **JWT** to create and update flags.
  - Public consumers use an **x-api-key** to read snapshots or listen to the SSE stream.

---

## 🧩 Tech Stack

* **Node.js / Express / TypeScript**
* **Prisma + PostgreSQL**
* **AWS S3** for signed, versioned snapshot delivery
* **Docker** for containerized deployment
* **Cloud-native**: designed for AWS App Runner (or ECS/Fargate)

---

## 🔧 Local Setup

### 1️⃣ Prerequisites
* Node.js 18+
* pnpm or npm
* Postgres database
* AWS credentials with permission to write to the snapshot bucket

### 2️⃣ Install & Configure
```bash
# Install dependencies
pnpm install

# Copy and edit environment variables
cp .env.example .env

# Run database migrations
pnpm prisma migrate deploy

# Start the API
pnpm dev
# -> http://localhost:3000/api/health
