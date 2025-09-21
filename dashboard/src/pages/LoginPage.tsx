import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const [email, setEmail] = useState("admin@demo.com");
    const [password, setPassword] = useState("admin123");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
        await login(email, password);
        nav("/admin");
    } catch (e: any) {
        console.error(e?.response || e);
        setErr(e?.response?.data?.error || e?.message || "Login failed");
    } finally {
        setLoading(false);
    }
    }

    return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
        <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="space-y-2">
            <label className="text-sm">Email</label>
            <Input value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
            <label className="text-sm">Password</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </form>
    </div>
    );
}
