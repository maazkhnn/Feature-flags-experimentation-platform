import { EventSource} from "eventsource";
import { evaluateFlag } from "./eval";
import { ClientOptions, Snapshot, Attributes } from "./types";
import { setTimeout as delay } from "node:timers/promises";

// tiny in-mem cache per client
export function createClient(opts: ClientOptions) {
    const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as typeof fetch);
    if (!fetchImpl) throw new Error("fetch not available; provide opts.fetchImpl");

    let snapshot: Snapshot | null = null;
    let es: EventSource | null = null;

    async function loadSnapshot(): Promise<void> {
        const res = await fetchImpl(opts.snapshotUrl, {
        headers: opts.apiKey ? { "x-api-key": opts.apiKey } : undefined,
        cache: "no-store" as any
        });
        if (!res.ok) throw new Error(`snapshot fetch failed: ${res.status}`);
        snapshot = await res.json() as Snapshot;
    }

    function getAttrs(reqOrCtx: any): Attributes {
        return opts.attributesProvider ? (opts.attributesProvider(reqOrCtx) || {}) : {};
    }

    async function connectSSE() {
        if (es) { es.close(); es = null; }
        const esOptions = {
        headers: opts.apiKey ? { "x-api-key": opts.apiKey } : undefined
        };

        es = new EventSource(opts.sseUrl, esOptions as any);

        es.onmessage = async (ev) => {
            try {
            const data = JSON.parse(ev.data || "{}");
            if (typeof data.version === "number") {
                const tServer = typeof data.ts === "number" ? data.ts : null;
                const t0 = Date.now();
                await loadSnapshot();
                const t1 = Date.now();

                // Prefer server-to-client propagation if we got ts; else fall back to fetch time
                const ms = tServer ? (t1 - tServer) : (t1 - t0);

                // Post a sample if metricsUrl configured
                if (opts.metricsUrl) {
                try {
                    await fetchImpl(opts.metricsUrl, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ ms }),
                    });
                } catch {}
                }
            }
            } catch {}
        };

        es.onerror = async () => {
            es?.close();
            await delay(1000);
            connectSSE();
        };
    }

    async function init() {
        await loadSnapshot();
        await connectSSE();
        return api;
    }

    function getVariant(flagKey: string, reqOrCtx?: any, fallback: "on" | "off" = "off"): "on" | "off" {
        if (!snapshot) return fallback;
        const attrs = getAttrs(reqOrCtx);
        if (!attrs.userId) return fallback;
        return evaluateFlag(snapshot, flagKey, attrs, fallback);
    }

    function getSetting<T=any>(key: string, def: T): T {
        if (!snapshot || !snapshot.settings) return def;
        const v = snapshot.settings[key];
        return (v === undefined ? def : v) as T;
    }

    function currentVersion(): number | null {
        return snapshot?.version ?? null;
    }

    function close() {
        es?.close();
        es = null;
    }

    const api = { init, getVariant, getSetting, currentVersion, close };
    return api;
}
