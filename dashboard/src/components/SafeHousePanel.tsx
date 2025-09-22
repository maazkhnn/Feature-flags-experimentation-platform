import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CodeBlock from "./CodeBlock";
import PanelCard from "./PanelCard";
import { sh } from "@/lib/safehouse";

const BASE = import.meta.env.VITE_SAFEHOUSE_BASE_URL || "http://localhost:4000";
const TOKEN = (localStorage.getItem("safehouse_jwt") || import.meta.env.VITE_SAFEHOUSE_JWT) as string | undefined;

export default function SafeHousePanel({ flagKeys }: { flagKeys: string[] }) {
  // impersonated user
  const [uid, setUid] = useState("demo-user");
  const [plan, setPlan] = useState("free");
  const [country, setCountry] = useState("US");

  // which flag to evaluate
  const [flag, setFlag] = useState<string>("");

  // results
  const [decision, setDecision] = useState<string>("—");
  const [variant, setVariant] = useState<string>("—");
  const [ttl, setTtl] = useState<string>("—");
  const [raw, setRaw] = useState<string>("");

  // error
  const [error, setError] = useState<string>("");

  // headers + query helper
  const headers = useMemo(() => (TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), []);
  const q = (path: string) =>
    `${BASE}${path}?uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&country=${encodeURIComponent(country)}`;

  // Pick a sensible default flag as soon as flagKeys arrive or change
  useEffect(() => {
    if (!flag && flagKeys.length > 0) {
      setFlag(flagKeys[0]);
    } else if (flag && !flagKeys.includes(flag) && flagKeys.length > 0) {
      setFlag(flagKeys[0]);
    }
  }, [flagKeys, flag]);

  // Calls with robust error reporting
  async function checkDecision() {
    setError("");
    if (!flag) return;
    try {
      const url = `${BASE}/api/debug/decision?flag=${encodeURIComponent(flag)}&uid=${uid}&plan=${plan}&country=${country}`;
      const { data } = await sh.get(url);
      setDecision(typeof data === "string" ? data : JSON.stringify(data));
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      setError(`/debug/decision: ${msg}`);
      setDecision("—");
    }
  }

  async function checkVariant() {
    setError("");
    try {
      const url = q("/api/debug/which-upload-route");
      const { data } = await sh.get(url);
      setVariant(typeof data === "string" ? data : JSON.stringify(data));
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      setError(`/debug/which-upload-route: ${msg}`);
      setVariant("—");
    }
  }

  async function checkTTL() {
    setError("");
    try {
      const url = q("/api/debug/ttl");
      const { data } = await sh.get(url);
      // handle either { download_link_ttl_hours: 24 } or a raw number/string
      const val =
        (data && typeof data === "object" && "download_link_ttl_hours" in data
          ? (data as any).download_link_ttl_hours
          : data);
      setTtl(typeof val === "number" ? String(val) : typeof val === "string" ? val : JSON.stringify(val));
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      setError(`/debug/ttl: ${msg}`);
      setTtl("—");
    }
  }

  async function fetchRaw() {
    setError("");
    try {
      const url = q("/api/debug/flags");
      const { data } = await sh.get(url);
      setRaw(JSON.stringify(data, null, 2));
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message;
      setError(`/debug/flags: ${msg}`);
      setRaw("");
    }
  }

  // Mask token in curl
  const mask = (t?: string) => (t ? `${t.slice(0, 12)}…${t.slice(-6)}` : "");
  const curlDecision =
`curl -s "${BASE}/api/debug/decision?flag=${encodeURIComponent(flag || "")}&uid=${encodeURIComponent(uid)}&plan=${encodeURIComponent(plan)}&country=${encodeURIComponent(country)}"${
  TOKEN ? ` \\\n  -H "Authorization: Bearer ${mask(TOKEN)}"` : ""
}`;
  const curlVariant =
`curl -s "${q("/api/debug/which-upload-route")}"${
  TOKEN ? ` \\\n  -H "Authorization: Bearer ${mask(TOKEN)}"` : ""
}`;
  const curlTtl =
`curl -s "${q("/api/debug/ttl")}"${
  TOKEN ? ` \\\n  -H "Authorization: Bearer ${mask(TOKEN)}"` : ""
}`;
  const curlRaw =
`curl -s "${q("/api/debug/flags")}"${
  TOKEN ? ` \\\n  -H "Authorization: Bearer ${mask(TOKEN)}"` : ""
}`;

  return (
    <PanelCard title="C) Client Behavior (SafeHouse)">
      <div className="space-y-3">
        <div className="text-sm text-gray-600">user: {uid} · {plan}/{country}</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>User ID</Label>
            <Input value={uid} onChange={e => setUid(e.target.value)} />
          </div>
          <div>
            <Label>Plan</Label>
            <Input value={plan} onChange={e => setPlan(e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={country} onChange={e => setCountry(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Decision for flag</Label>
          <div className="flex gap-2">
            <select className="border rounded p-2" value={flag} onChange={e => setFlag(e.target.value)}>
              {flagKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <Button onClick={checkDecision}>Evaluate</Button>
          </div>
          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
          <div className="mt-2 text-sm">Result: <span className="font-mono">{decision}</span></div>
          <CodeBlock text={curlDecision} />
        </div>

        <div>
          <Label>Upload variant</Label>
          <div className="flex gap-2">
            <Button onClick={checkVariant}>Check</Button>
          </div>
          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
          <div className="mt-2 text-sm">Result: <span className="font-mono">{variant}</span></div>
          <CodeBlock text={curlVariant} />
        </div>

        <div>
          <Label>Download TTL (hours)</Label>
          <div className="flex gap-2">
            <Button onClick={checkTTL}>Check</Button>
          </div>
          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
          <div className="mt-2 text-sm">Result: <span className="font-mono">{ttl}</span></div>
          <CodeBlock text={curlTtl} />
        </div>

        <div>
          <Label>Raw decisions (JSON)</Label>
          <div className="flex gap-2">
            <Button onClick={fetchRaw}>Fetch</Button>
          </div>
          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
          <div className="h-48 overflow-auto border rounded mt-2">
            <CodeBlock text={raw || "// click Fetch"} />
          </div>
          <CodeBlock text={curlRaw} />
        </div>
      </div>
    </PanelCard>
  );
}
