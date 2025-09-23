# Feature Flags Platform – Dashboard (Live Tour)

This folder contains the **React + Vite** frontend that showcases the Feature-Flags platform in action.  
The dashboard is a **recruiter-facing Live Tour** where you can:

* Flip feature flags in real time.
* Watch the **Server-Sent Events (SSE)** stream update instantly.
* View SLO badges (avg & p95 propagation).
* Inspect the **snapshot JSON** stored in **Amazon S3**.
* Call into the **SafeHouse API** to see client behavior change live.

---

## ⚡ Tech Stack

- **React 18** + **Vite** (fast dev build)
- **Tailwind CSS** + **shadcn/ui** for styling and components
- **Axios** for API calls
- **TypeScript**

---

## 🔧 Setup & Run Locally

```bash
# 1️⃣ Install dependencies
pnpm install

# 2️⃣ Copy environment variables
cp .env.example .env
# Fill in:
#   VITE_FLAGS_API      -> base URL of the Feature-Flag API (e.g. http://localhost:3000/api)
#   VITE_FLAGS_ENV_ID   -> ID of the environment to demo
#   VITE_ADMIN_TOKEN    -> admin JWT for flipping flags in the console
#   VITE_SAFEHOUSE_BASE_URL -> base URL of the SafeHouse API (e.g. http://localhost:4000)
#   VITE_SAFEHOUSE_JWT  -> demo JWT for SafeHouse debug endpoints

# 3️⃣ Start dev server
pnpm dev
# -> http://localhost:5173/tour
