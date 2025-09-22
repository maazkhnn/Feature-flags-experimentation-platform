import { useEffect, useMemo, useRef, useState } from "react";
import PanelCard from "../components/PanelCard";
import CodeBlock from "../components/CodeBlock";
import { api, sdkApi } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import SafeHousePanel from "../components/SafeHousePanel";

type FlagRow = { id: string; key: string; enabled: boolean; rollout: number };

const ENV_ID = import.meta.env.VITE_FLAGS_ENV_ID as string;
const BASE = import.meta.env.VITE_FLAGS_API as string;
const TOKEN = import.meta.env.VITE_ADMIN_TOKEN as string | undefined;

export default function TourPage() {
    const [flags, setFlags] = useState<FlagRow[]>([]);
    const [selectedKey, setSelectedKey] = useState<string>("");
    const [enabled, setEnabled] = useState<boolean>(false);
    const [rollout, setRollout] = useState<number>(0);

    const [metrics, setMetrics] = useState<{ avg: number|null; p95: number|null }>({ avg: null, p95: null });
    const [metricsErr, setMetricsErr] = useState<string>("");

    const [snapshot, setSnapshot] = useState<string>("(loading…)");
    const [snapshotErr, setSnapshotErr] = useState<string>("");

    const [streamLines, setStreamLines] = useState<string[]>([]);
    const [streamState, setStreamState] = useState<"connecting"|"open"|"error">("connecting");
    const esRef = useRef<EventSource | null>(null);

    const sseUrl = useMemo(() =>
    `${BASE}/envs/${ENV_ID}/stream?guest=1`, []
    );

    // Load flags + select first
    async function loadFlags() {
        try {
        const res = await api.get(`/envs/${ENV_ID}/flags`);
        const items: FlagRow[] = res.data.items ?? res.data.flags ?? res.data;
        setFlags(items);
        if (!selectedKey && items.length) {
            setSelectedKey(items[0].key);
            setEnabled(items[0].enabled);
            setRollout(items[0].rollout);
        }
        } catch (e: any) {
        console.error("/flags error", e?.response?.data || e.message);
        }
    }

    // Load metrics
    async function loadMetrics() {
        try {
        const res = await api.get(`/metrics/propagation`);
        setMetrics(res.data);
        setMetricsErr("");
        } catch (e: any) {
        const msg = e?.response?.data?.error || e.message;
        setMetricsErr(String(msg));
        }
    }

    // Load snapshot (preview endpoint)
        async function loadSnapshot() {
        try {
            const res = await sdkApi.get(`/envs/${ENV_ID}/snapshot/preview`);
            setSnapshot(JSON.stringify(res.data, null, 2));
            setSnapshotErr("");
        } catch (e: any) {
            const msg = e?.response?.data?.error || e.message;
            setSnapshotErr(String(msg));
            setSnapshot(`// error: ${msg}`);
        }
        }

    useEffect(() => {
        loadFlags();
        loadMetrics();
        loadSnapshot();
        const int = setInterval(() => loadMetrics(), 5000);
        const int2 = setInterval(() => loadSnapshot(), 10000);
        return () => { clearInterval(int); clearInterval(int2); };
    }, []);

    // SSE stream viewer with visible connection state
    useEffect(() => {
        if (esRef.current) esRef.current.close();
        setStreamState("connecting");
        const es = new EventSource(sseUrl, { withCredentials: false });
        esRef.current = es;

        es.onopen = () => setStreamState("open");
        es.onmessage = (ev) => {
        setStreamLines((lines) => {
            const next = [...lines, ev.data];
            if (next.length > 200) next.shift();
            return next;
        });
        };
        es.onerror = () => {
        setStreamState("error"); // EventSource will auto-reconnect
        setStreamLines((lines) => [...lines, "[SSE] error/reconnecting…"]);
        };
        return () => es.close();
    }, [sseUrl]);

    // Flip console: PATCH selected flag
    async function saveFlag() {
        if (!selectedKey) return;
        try {
        await api.patch(`/envs/${ENV_ID}/flags/${selectedKey}`, { enabled, rollout });
        await loadFlags();
        await loadSnapshot();
        } catch (e: any) {
        alert(`Update failed: ${e?.response?.data?.error || e.message}`);
        }
    }

    // Show curl with masked token
    const mask = (t?: string) => (t ? `${t.slice(0, 12)}…${t.slice(-6)}` : "");
    const body = JSON.stringify({ enabled, rollout });
    const patchCurl =
    `curl -X PATCH ${BASE}/envs/${ENV_ID}/flags/${selectedKey} \\
    -H "Content-Type: application/json" \\
    ${TOKEN ? `  -H "Authorization: Bearer ${mask(TOKEN)}" \\\n` : `  # (no token set)\n`}  -d '${body}'`;

    const streamCurl = `curl -N "${sseUrl}"`;

    return (
        <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-2">Live Tour</h1>
        <p className="text-sm text-gray-600">Flip a flag → watch SSE → see metrics → inspect snapshot.</p>

        {/* Grid: Flip | Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PanelCard title="A) Flip Console (admin PATCH)">
            <div className="space-y-3">
                <div>
                <Label className="text-sm">Flag</Label>
                <select
                    className="w-full border rounded p-2"
                    value={selectedKey}
                    onChange={(e) => {
                    const k = e.target.value;
                    setSelectedKey(k);
                    const f = flags.find(x => x.key === k);
                    if (f) { setEnabled(f.enabled); setRollout(f.rollout); }
                    }}
                >
                    {flags.map(f => <option key={f.id} value={f.key}>{f.key}</option>)}
                </select>
                </div>

                <div className="flex items-center gap-3">
                <input id="enabled" type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                <Label htmlFor="enabled">Enabled</Label>
                </div>

                <div>
                <Label>Rollout: {rollout}%</Label>
                <Slider value={[rollout]} onValueChange={(v) => setRollout(v[0])} max={100} step={5} />
                </div>

                <div className="flex gap-2">
                <Button onClick={saveFlag}>Save</Button>
                <Button variant="secondary" onClick={loadFlags}>Reload Flags</Button>
                </div>

                <div>
                <Label className="text-xs text-gray-500 block mb-1">Copy curl</Label>
                <CodeBlock text={patchCurl} />
                </div>
            </div>
            </PanelCard>

            <PanelCard
            title="B) Event Stream (SSE)"
            right={
                <Badge variant={streamState === "open" ? "secondary" : "destructive"}>
                {streamState === "open" ? "Connected" : streamState === "connecting" ? "Connecting…" : "Reconnecting…"}
                </Badge>
            }
            >
            <div className="text-xs h-64 overflow-auto bg-neutral-900 text-neutral-100 rounded p-2">
                {streamLines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <div>
                <Label className="text-xs text-gray-500 block mb-1">Try via terminal</Label>
                <CodeBlock text={streamCurl} />
            </div>
            </PanelCard>
        </div>

        {/* Grid: SLO | Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PanelCard
            title="D) SLO Badge (Propagation)"
            right={<Badge>avg {metrics.avg?.toFixed(0) ?? "—"} ms · p95 {metrics.p95?.toFixed(0) ?? "—"} ms</Badge>}
            >
            <p className="text-sm text-gray-600">
                SDKs post propagation ms to <code>/metrics/propagation</code>. We refresh every 5s.
            </p>
            {metricsErr && <p className="text-xs text-red-600">/metrics error: {metricsErr}</p>}
            <Button variant="outline" onClick={loadMetrics}>Refresh Now</Button>
            </PanelCard>

            <PanelCard title="Snapshot Viewer (current)">
            <div className="space-y-2">
                <div className="flex gap-2">
                <Button variant="outline" onClick={loadSnapshot}>Reload Snapshot</Button>
                <a className="text-blue-600 underline text-sm" href={`${BASE}/envs/${ENV_ID}/snapshot/preview`} target="_blank" rel="noreferrer">
                    open raw JSON
                </a>
                </div>
                {snapshotErr && <p className="text-xs text-red-600">/snapshot error: {snapshotErr}</p>}
                <div className="h-64 overflow-auto border rounded">
                <CodeBlock text={snapshot} />
                </div>
            </div>
            </PanelCard>
        </div>

        {/* C) SafeHouse */}
        <SafeHousePanel flagKeys={flags.map(f => f.key)} />
        </div>
    );
}
