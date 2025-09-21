import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

type Flag = {
    id: string;
    key: string;
    description?: string | null;
    enabled: boolean;
    rollout: number;
};

const ENV_ID = import.meta.env.VITE_FLAGS_ENV_ID || "";

export default function AdminPage() {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        const { data } = await api.get(`/envs/${ENV_ID}/flags`);
        // backend returns { items: [...] }
        setFlags(data.items ?? data);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function updateFlag(key: string, patch: Partial<Flag>) {
        setSavingKey(key);
        try {
        const { data } = await api.patch(`/envs/${ENV_ID}/flags/${encodeURIComponent(key)}`, patch);
        setFlags(prev => prev.map(f => (f.key === key ? { ...f, ...data } : f)));
        } finally {
        setSavingKey(null);
        }
    }

    if (loading) return <p className="p-6">Loading flags…</p>;

    return (
        <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button onClick={load} variant="outline">Refresh</Button>
        </div>

        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Rollout %</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {flags.map(f => (
                <TableRow key={f.id}>
                <TableCell className="font-mono">{f.key}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.description ?? ""}</TableCell>
                <TableCell>
                    <Switch
                    checked={!!f.enabled}
                    disabled={savingKey === f.key}
                    onCheckedChange={(checked) => updateFlag(f.key, { enabled: checked })}
                    />
                </TableCell>
                <TableCell className="w-[260px]">
                    <div className="flex items-center gap-3">
                    <Slider
                        defaultValue={[f.rollout]}
                        min={0}
                        max={100}
                        step={5}
                        disabled={savingKey === f.key}
                        onValueCommit={(val) => updateFlag(f.key, { rollout: val[0] })}
                    />
                    <span className="w-10 text-right tabular-nums">{f.rollout}%</span>
                    </div>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}
