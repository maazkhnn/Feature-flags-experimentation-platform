import { Router } from 'express';
import { auth } from './auth';
import { flags } from './flags';
import { segments } from './segments';
import { audit } from './audit';
import { snapshotApi } from './snapshot';
import { stream } from './stream';
import { metricsRouter } from "./metrics";

export const api = Router();

api.get('/works', (_req, res) => {
    res.json({ ok: true, service: 'api' })
});
api.post('/testing', (req, res) => {
    res.json({ input: req.body})
});

api.use("/metrics", metricsRouter);
api.use('/auth', auth);
api.use('/envs/:envId/flags', flags);
api.use('/envs/:envId/segments', segments);
api.use('/envs/:envId/audit', audit);
api.use('/envs/:envId/snapshot', snapshotApi);
api.use('/envs/:envId/stream', stream);

