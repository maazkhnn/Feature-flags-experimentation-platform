import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type Audit = {
    id: string;
    envId: string;
    actor: string | null;
    entityType: string;
    entityId: string;
    action: string;
    diff: any;
    createdAt?: string;
};

const ENV_ID = import.meta.env.VITE_FLAGS_ENV_ID || "";

export default function AuditPage() {
    const [items, setItems] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const { data } = await api.get(`/envs/${ENV_ID}/audit?limit=100`);
        setItems(data.items ?? data);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    if (loading) return <p className="p-6">Loading audit…</p>;

    return (
        <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <Button onClick={load} variant="outline">Refresh</Button>
        </div>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {items.map(a => (
                <TableRow key={a.id}>
                <TableCell>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</TableCell>
                <TableCell>{a.actor ?? "system"}</TableCell>
                <TableCell>{a.entityType} <span className="text-muted-foreground">({a.entityId})</span></TableCell>
                <TableCell>{a.action}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}
