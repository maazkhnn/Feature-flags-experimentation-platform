import { Router, Request, Response, NextFunction } from 'express';
import { requireSdkKey } from './middleware';

type EnvParams = { envId: string };
export const stream = Router({ mergeParams: true });

type Sub = { res: Response; keepalive: NodeJS.Timeout };
const subscribers: Record<string, Set<Sub>> = {};

function addSub(envId: string, res: Response): Sub {
    if (!subscribers[envId]) subscribers[envId] = new Set();
    const sub: Sub = {
      res,
      keepalive: setInterval(() => {
        try { res.write(':keepalive\n\n'); } catch {}
      }, 15000),
    };
    subscribers[envId].add(sub);
    return sub;
}
function removeSub(envId: string, sub: Sub) {
    clearInterval(sub.keepalive);
    subscribers[envId]?.delete(sub);
}
export function broadcast(envId: string, payload: object) {
    const subs = subscribers[envId];
    if (!subs) return;
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const { res } of subs) {
      try { res.write(data); } catch {}
    }
}

// Middleware: allow guest=1 OR enforce x-api-key via requireSdkKey
function maybeRequireSdkKey(req: Request, res: Response, next: NextFunction) {
    if (req.query.guest === '1') return next();
    return requireSdkKey(req, res, next);
}

stream.get('/', maybeRequireSdkKey, (req: Request<EnvParams>, res: Response) => {
    const { envId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders?.();

    const sub = addSub(envId, res);
    res.write(`data: ${JSON.stringify({ hello: true, env: envId, ts: Date.now() })}\n\n`);

    req.on('close', () => removeSub(envId, sub));
});
