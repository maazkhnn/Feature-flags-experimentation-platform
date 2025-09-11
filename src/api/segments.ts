import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from './middleware';
import { refreshSnapshot } from './middleware';
import { broadcast } from './stream';

export const segments = Router({ mergeParams: true });

// GET (guest/admin)
segments.get('/', requireAuth(['guest','admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const items = await prisma.segment.findMany({ where: { envId } });
    res.json({ items });
});

// CREATE (admin)
segments.post('/', requireAuth(['admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const { name, conditions } = req.body ?? {};

    const result = await prisma.$transaction(async (tx) => {
        const created = await tx.segment.create({ data: { envId, name, conditions } });

        await tx.auditLog.create({
        data: {
            envId,
            actor: (req as any).user.email || 'admin',
            entityType: 'segment',
            entityId: created.id,
            action: 'create',
            diff: { after: created } as any
        }
        });

        const env = await tx.environment.update({
        where: { id: envId },
        data: { version: { increment: 1 } }
        });

        return { created , envVersion: env.version };
    });

    await refreshSnapshot(envId);
    broadcast(envId, {
        type: 'segmentCreated',
        env: envId,
        version: result.envVersion,
        ts: Date.now()
    });
    
    res.status(201).json(result);
});