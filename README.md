# 🌟 Feature-Flags & Experimentation Platform

_A LaunchDarkly-style control plane and SDK — designed, built, and deployed **from scratch**._

This project demonstrates **end-to-end backend engineering**:  
designing a multi-tenant control plane, building a **Node.js SDK**, wiring **real-time flag delivery** with **SSE + S3 snapshots**, and integrating with my other project **[Secure File Vault](https://github.com/maazkhnn/Secure-File-Vault)** to prove instant, live feature rollouts.

> Flip a flag → snapshot in S3 updates → SSE notifies SDKs → File Vault behavior changes in **< 1 second**.

---

## 📌 Highlights

- **Multi-tenant control plane** (Node/Express + Postgres + Prisma)  
  Tenants → projects → environments → flags/segments/rules → audit logs.
- **Real-time delivery path**  
  Environment changes trigger:  
  1️⃣ Snapshot build → versioned `snapshot.json` in S3  
  2️⃣ SSE `{version}` event to clients  
  3️⃣ SDKs re-fetch only when version bumps.
- **Custom Node SDK**  
  - In-memory snapshot cache  
  - Deterministic bucketing (`murmur(userId + flagKey) % 100`)  
  - Segment evaluation (`plan`, `country`)  
  - <1 s propagation from flip to client.
- **Recruiter-facing Live Tour** (React + Vite + Tailwind + shadcn/ui)  
  - Flip Console (PATCH flags with admin JWT)  
  - SSE Event Stream viewer  
  - SLO badge (avg/p95 propagation)  
  - SafeHouse client panel: watch API behavior change instantly.
- **Secure File Vault Integration**  
  The SafeHouse API (secure file-vault project I built earlier) consumes the SDK to gate:
  - `enable_encrypted_upload_v2`
  - `strict_rate_limit`
  - `enable_logs_page`
  - `max_upload_mb`
  - `download_link_ttl_hours`

---

## 🏗️ Architecture

```mermaid
flowchart LR
  A[Admin Dashboard / Live Tour] -->|PATCH flags| B(Control Plane API)
  B -->|write snapshot.json| S3[(S3 Bucket)]
  B -->|SSE /stream| SDK
  SDK -->|GET snapshot.json| S3
  SDK -->|evaluate flags| SH[SafeHouse API]

