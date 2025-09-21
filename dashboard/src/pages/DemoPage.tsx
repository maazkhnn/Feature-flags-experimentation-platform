import { useEffect, useState } from "react";
import { sdkApi, rootApi } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SnapFlag = { key: string; enabled: boolean; rollout: number };

const ENV_ID = import.meta.env.VITE_FLAGS_ENV_ID || "";

export default function DemoPage() {
    const [flags, setFlags] = useState<SnapFlag[]>([]);
    const [metrics, setMetrics] = useState<{ avg: number | null; p95: number | null }>({ avg: null, p95: null });
    const [loading, setLoading] = useState(true);

    async function load() {
        // snapshot/preview is public (requires x-api-key). It returns your full snapshot.
        const snap = await sdkApi.get(`/envs/${ENV_ID}/snapshot/preview`);
        setFlags(snap.data.flags || []);
        // metrics mounted at /metrics (root, not /api)
        const met = await rootApi.get(`api/metrics/propagation`);
        setMetrics(met.data);
        setLoading(false);
    }

    useEffect(() => {
        load();
        const id = setInterval(load, 5000);
        return () => clearInterval(id);
    }, []);

    if (loading) return <p className="p-6">Loading demo…</p>;

    return (
        <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Public Demo</h1>
            <Badge variant="secondary">
            Propagation avg: {metrics.avg != null ? Math.round(metrics.avg) : "—"} ms ·
            p95: {metrics.p95 != null ? Math.round(metrics.p95) : "—"} ms
            </Badge>
        </div>

        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Rollout %</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {flags.map(f => (
                <TableRow key={f.key}>
                <TableCell className="font-mono">{f.key}</TableCell>
                <TableCell>{f.enabled ? "ON" : "OFF"}</TableCell>
                <TableCell>{f.rollout}%</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}


