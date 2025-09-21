import { Router } from "express";

let samples: number[] = [];

export const metricsRouter = Router();

export function recordPropagation(ms: number) {
  samples.push(ms);
  if (samples.length > 500) samples.shift(); // rolling buffer
}

metricsRouter.post("/propagation", (req, res) => {
    const ms = Number(req.body.ms);
    if (!isNaN(ms)) {
        samples.push(ms);
        if (samples.length > 100) samples.shift();
    }
    res.json({ ok: true });
});

metricsRouter.get("/propagation", (_req, res) => {
    if (samples.length === 0) return res.json({ avg: null, p95: null });
    const sorted = [...samples].sort((a,b) => a - b);
    const avg = sorted.reduce((a,b) => a + b, 0) / sorted.length;
    const p95 = sorted[Math.floor(0.95 * sorted.length)];
    res.json({ avg, p95 });
});
