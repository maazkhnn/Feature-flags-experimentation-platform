import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from './middleware';
import { refreshSnapshot } from './middleware';
import { broadcast } from './stream';

export const flags = Router({ mergeParams: true }); //allows this router to access route params like :envId from a parent route

// GET all (guest/admin)
flags.get('/', requireAuth(['guest','admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const items = await prisma.flag.findMany({ 
        where: { envId }, 
        include: { rules: true } 
    });
    res.json({ items });
});

// CREATE (admin)
flags.post('/', requireAuth(['admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const { key, description, enabled = false, rollout = 0 } = req.body;

    const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.flag.findFirst({ where: { envId, key } });
        if (existing) throw new Error('Flag already exists');
        
        const created = await tx.flag.create({
            data: { 
                envId, key, description, enabled, rollout, 
                updatedBy: (req as any).user.email || 'admin' 
            }
        });
        
        await tx.auditLog.create({
            data: {
                envId,
                actor: (req as any).user.email || 'admin',
                entityType: 'flag',
                entityId: created.id,
                action: 'create',
                diff: { after: created } as any
            }
        });

        const env = await tx.environment.update({
            where: { id: envId },
            data: { version: { increment: 1 } }
        });

        return { created, envVersion: env.version };
    });
    
    await refreshSnapshot(envId);
    broadcast(envId, {
        type: 'flagCreated',
        env: envId,
        version: result.envVersion,
        ts: Date.now()
    });

    res.status(201).json(result);
});

// UPDATE (admin)
flags.patch('/:key', requireAuth(['admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const key = String(req.params.key);

    const result = await prisma.$transaction(async (tx) => {
        const before = await tx.flag.findFirst({ where: { envId, key } });
        if (!before) return null;

        const { description = before.description,
                enabled = before.enabled,
                rollout = before.rollout } = req.body ?? {};

        const updated = await tx.flag.update({
            where: { id: before.id },
            data: {
                description, enabled, rollout,
                updatedBy: (req as any).user.email || 'admin',
                version: { increment: 1 }
            }
        });

        await tx.auditLog.create({
            data: {
                envId,
                actor: (req as any).user.email || 'admin',
                entityType: 'flag',
                entityId: updated.id,
                action: 'update',
                diff: { before, after: updated } as any
            }
        });

        const env = await tx.environment.update({
            where: { id: envId },
            data: { version: { increment: 1 } }
        });

        return { updated, envVersion: env.version };
    });


    if (!result) return res.status(404).json({ error: 'flag not found' });

    await refreshSnapshot(envId);
    broadcast(envId, {
        type: 'flagUpdated',
        env: envId,
        version: result.envVersion,
        ts: Date.now()
    });

    res.json(result.updated);
});