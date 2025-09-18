import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { buildSnapshot, writeSnapshotS3, writeSnapshotLocal } from '../services/snapshot';
import { prisma } from '../db';

type EnvParams = { envId: string };

export function requireAuth(roles: ('admin'|'guest')[] = ['admin']){
    return(req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized'});
    
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token) 
            return res.status(401).json({ error: 'missing token' });
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!);
            
            (req as any).user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid Credentials'});
        }
    };
};

export async function requireSdkKey(req: Request, res: Response, next: NextFunction) {
    const key = req.header('x-api-key');
    if (!key) return res.status(401).json({ error: 'Missing x-api-key' });

    const env = await prisma.environment.findFirst({ where: { sdkKey: key } });
    if (!env) return res.status(401).json({ error: 'Invalid x-api-key' });

    if (req.params.envId && req.params.envId !== env.id) {
        return res.status(403).json({ error: 'Env mismatch' });
    }

    (req as any).sdk = { envId: env.id, role: 'guest' };
    next();
};


//rebuilds a fresh snapshot
export async function refreshSnapshot(envId: string) {
    const snap = await buildSnapshot(envId);
    if (process.env.SNAPSHOT_BUCKET) {
        await writeSnapshotS3(envId, snap);
    } else {
        await writeSnapshotLocal(envId, snap);
    }
}