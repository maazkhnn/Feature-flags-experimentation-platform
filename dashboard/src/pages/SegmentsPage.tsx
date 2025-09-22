import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Segment = {
    id: string;
    name: string;
    envId: string;
    conditions: Array<{ attr: string; op: string; values: string[] }>;
};

const ENV_ID = import.meta.env.VITE_FLAGS_ENV_ID || "";

export default function SegmentsPage() {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const navigate = useNavigate();

    // form state
    const [name, setName] = useState("");
    const [attr, setAttr] = useState<"plan" | "country">("plan");
    const [op, setOp] = useState<"eq" | "in">("eq");
    const [values, setValues] = useState<string>("pro");

    async function load() {
        setLoading(true);
        setError("");
        try {
        const { data } = await api.get(`/envs/${ENV_ID}/segments`);
        setSegments(data.items ?? data);
        } catch (e: any) {
        if (e?.response?.status === 401) {
            navigate("/login");
            return;
        }
        setError(e?.response?.data?.error || e.message || "Failed to load segments");
        } finally {
        setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function createSegment() {
        try {
        const vals = op === "in"
            ? values.split(",").map(v => v.trim()).filter(Boolean)
            : [values.trim()];
        const conds = [{ attr, op, values: vals }];
        await api.post(`/envs/${ENV_ID}/segments`, { name: name.trim(), conditions: conds });
        setName("");
        setValues(attr === "plan" ? "pro" : "US");
        await load();
        } catch (e: any) {
        alert(e?.response?.data?.error || e.message || "Create failed");
        }
    }

    if (loading) return <p className="p-6">Loading segments…</p>;
    return (
        <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Segments</h1>
        {error && <p className="text-red-600">{error}</p>}

        {/* Create form */}
        <div className="bg-white p-4 rounded-lg shadow space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input placeholder="Segment name (e.g., proUS)" value={name} onChange={e => setName(e.target.value)} />

            <Select value={attr} onValueChange={(v: any) => setAttr(v)}>
                <SelectTrigger><SelectValue placeholder="Attribute" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="plan">plan</SelectItem>
                <SelectItem value="country">country</SelectItem>
                </SelectContent>
            </Select>

            <Select value={op} onValueChange={(v: any) => setOp(v)}>
                <SelectTrigger><SelectValue placeholder="Operator" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="eq">eq</SelectItem>
                <SelectItem value="in">in</SelectItem>
                </SelectContent>
            </Select>

            <Input
                placeholder={op === "in" ? "Comma-separated values" : "Value"}
                value={values}
                onChange={e => setValues(e.target.value)}
            />
            </div>
            <Button onClick={createSegment} disabled={!name.trim() || !values.trim()}>
            Create Segment
            </Button>
        </div>

        {/* List */}
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Conditions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {segments.map(s => (
                <TableRow key={s.id}>
                <TableCell className="font-mono">{s.name}</TableCell>
                <TableCell className="text-sm">
                    {s.conditions.map((c, i) => (
                    <span key={i} className="mr-2">
                        <code>{c.attr}</code> {c.op} <code>{c.values.join(",")}</code>
                    </span>
                    ))}
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}
