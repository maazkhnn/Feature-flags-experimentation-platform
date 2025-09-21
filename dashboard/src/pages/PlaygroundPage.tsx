import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Flag } from "../types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function PlaygroundPage() {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [uid, setUid] = useState("demo-user");
    const [plan, setPlan] = useState("free");
    const [country, setCountry] = useState("US");
    const [variants, setVariants] = useState<Record<string,string>>({});
    const ENV_ID = import.meta.env.VITE_FLAGS_ENV_ID || "";

    useEffect(() => {
        async function loadFlags() {
        const res = await api.get(`/envs/${ENV_ID}/flags`);
        setFlags(res.data);
        }
        loadFlags();
    }, [ENV_ID]);

    async function evaluate() {
        const res = await api.get(
        `/envs/${ENV_ID}/evaluate`,
        { params: { userId: uid, attrs: JSON.stringify({ plan, country }) } }
        );
        // assume API returns { [flagKey]: "on" | "off" }
        setVariants(res.data);
    }

    return (
        <div className="p-6 space-y-6">
        <Card>
            <CardHeader>
            <CardTitle>Impersonate a user</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <Input
                value={uid}
                onChange={e => setUid(e.target.value)}
                placeholder="User ID"
            />
            <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
            </Select>
            <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="US">US</SelectItem>
                <SelectItem value="DE">DE</SelectItem>
                <SelectItem value="IN">IN</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={evaluate}>Evaluate Flags</Button>
            </CardContent>
        </Card>

        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Variant</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {flags.map(f => (
                <TableRow key={f.id}>
                <TableCell>{f.key}</TableCell>
                <TableCell>{variants[f.key] ?? "—"}</TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
    );
}
