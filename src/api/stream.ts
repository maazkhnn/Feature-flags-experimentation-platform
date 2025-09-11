import { Router, Request, Response } from 'express';
import { requireSdkKey } from "./middleware"
type EnvParams = { envId: string };

export const stream = Router({ mergeParams: true });

// For MVP we'll keep subscribers in memory
const subscribers: Record<string, Set<any>> = {};

export function broadcast(envId: string, payload: object) {
    const subs = subscribers[envId];
    if (!subs) return;
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of subs) {
        res.write(data);
    }
}

stream.get('/', requireSdkKey, (req: Request<EnvParams>, res: Response) => {
    const { envId } = req.params;

    // Headers required for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add to subscribers
    const subs = (subscribers[envId] ??= new Set<Response>());
    subs.add(res);

    // Initial event
    res.write(`data: ${JSON.stringify({ hello: true, env: envId })}\n\n`);

    // Cleanup
    req.on('close', () => {
        subs.delete(res);
    });
});

