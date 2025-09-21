import { Router } from 'express';
import { buildSnapshot, writeSnapshotLocal, writeSnapshotS3 } from '../services/snapshot';
import { requireAuth, requireSdkKey } from './middleware';
import { recordPropagation } from './metrics';

export const snapshotApi = Router({ mergeParams: true });

snapshotApi.post('/build-local', requireAuth(['admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const snap = await buildSnapshot(envId);
    const file = await writeSnapshotLocal(envId, snap);
    res.json({ ok: true, file, version: snap.version });
});

//sdk read
snapshotApi.get('/preview', requireSdkKey, async (req, res) => {
    const envId = String(req.params.envId);
    const start = Date.now();
    const snap = await buildSnapshot(envId);
    recordPropagation(Date.now() - start);
    res.json(snap);
});

snapshotApi.post('/push-s3', requireAuth(['admin']), async (req, res) => {
    const envId = String(req.params.envId);
    const snap = await buildSnapshot(envId);
    const out = await writeSnapshotS3(envId, snap);
    res.json({ ok: true, ...out, version: snap.version });
});

