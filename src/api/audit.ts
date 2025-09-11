import { Router } from 'express';
import { prisma } from '../db';
import { requireAuth } from './middleware';

export const audit = Router({ mergeParams: true });

audit.get('/', requireAuth(['admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const items = await prisma.auditLog.findMany({
        where: { envId },
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    res.json({ items });
});