import axios from "axios";

const BASE = import.meta.env.VITE_SAFEHOUSE_BASE_URL || "http://localhost:4000";

let inFlight: Promise<string> | null = null;

async function fetchDemoToken(): Promise<string> {
    const res = await axios.post(`${BASE}/api/demo/token`, {}); // server issues a demo token
    const token: string = res.data?.token;
    if (!token) throw new Error("No token returned from /api/demo/token");
    sessionStorage.setItem("safehouse_demo_jwt", token);
    return token;
}

async function ensureToken(): Promise<string> {
    const cached = sessionStorage.getItem("safehouse_demo_jwt");
    if (cached) return cached;
    if (!inFlight) inFlight = fetchDemoToken().finally(() => (inFlight = null));
    return inFlight!;
}

export const sh = axios.create({ baseURL: BASE });

sh.interceptors.request.use(async (config) => {
    const token = await ensureToken();
    (config.headers as any).Authorization = `Bearer ${token}`;
    return config;
});

sh.interceptors.response.use(
    (res) => res,
    async (err) => {
        const status = err?.response?.status;
        const cfg = err?.config;
        if (status === 401 && !cfg?._retry) {
        cfg._retry = true;
        sessionStorage.removeItem("safehouse_demo_jwt");
        const token = await ensureToken();
        cfg.headers = cfg.headers || {};
        cfg.headers.Authorization = `Bearer ${token}`;
        return sh(cfg); // retry once
        }
        throw err;
    }
);
