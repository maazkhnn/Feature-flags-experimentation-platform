import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const [error, setError] = useState<string>("");
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [draftRollout, setDraftRollout] = useState<Record<string, number | undefined>>({});
    const navigate = useNavigate();

    async function load() {
        setLoading(true);
        setError("");
        try {
        const { data } = await api.get(`/envs/${ENV_ID}/flags`);
        setFlags(data.items ?? data);
        } catch (e: any) {
        if (e?.response?.status === 401) {
            navigate("/login");
            return;
        }
        setError(e?.response?.data?.error || e.message || "Failed to load flags");
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function updateFlag(key: string, patch: Partial<Flag>) {
        setSavingKey(key);
        try {
        const { data } = await api.patch(`/envs/${ENV_ID}/flags/${encodeURIComponent(key)}`, patch);
        setFlags(prev => prev.map(f => (f.key === key ? { ...f, ...data } : f)));
        } catch (e: any) {
        alert(e?.response?.data?.error || e.message || "Update failed");
        } finally {
        setSavingKey(null);
        // clear draft if we committed rollout
        if (patch.rollout !== undefined) {
            setDraftRollout(d => ({ ...d, [key]: undefined }));
        }
        }
    }

    if (loading) return <p className="p-6">Loading flags…</p>;
    if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

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
            {flags.map(f => {
                const liveRollout = draftRollout[f.key] ?? f.rollout;
                return (
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
                    <TableCell className="w-[300px]">
                    <div className="flex items-center gap-3">
                        <Slider
                        value={[liveRollout]}
                        min={0}
                        max={100}
                        step={5}
                        disabled={savingKey === f.key}
                        onValueChange={(val) => setDraftRollout(d => ({ ...d, [f.key]: val[0] }))}
                        onValueCommit={(val) => updateFlag(f.key, { rollout: val[0] })}
                        />
                        <span className="w-10 text-right tabular-nums">{liveRollout}%</span>
                    </div>
                    </TableCell>
                </TableRow>
                );
            })}
            </TableBody>
        </Table>
        </div>
    );
}
