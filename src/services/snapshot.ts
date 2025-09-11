import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { putJson } from './s3';


export type Snapshot = {
    env: string;
    version: number;
    flags: Array<{
        key: string;
        description?: string | null;
        enabled: boolean;
        rollout: number;
        rules: Array<{ priority: number; segment?: string; variant_percent: Record<string, number> }>;
    }>;
    segments: Record<string, Array<{ attr: string; op: string; values: string[] }>>;
    settings?: Record<string, any>;
};

export async function buildSnapshot(envId: string): Promise<Snapshot> {
    const env = await prisma.environment.findUnique({
        where: { id: envId },
        include: {
        flags: { include: { rules: true } },
        segments: true
        }
    });
    if (!env) throw new Error('env not found');

    type SnapshotRule = { priority: number; segment?: string; variant_percent: Record<string, number> };
    type SnapshotFlag = {
        key: string;
        description?: string | null;
        enabled: boolean;
        rollout: number;
        rules: SnapshotRule[];
    };

    const flags: SnapshotFlag[] = env.flags.map((f) => {
        const rules: SnapshotRule[] = f.rules
        .sort((a, b) => a.priority - b.priority)
        .map((r) => {
            const base: SnapshotRule = {
            priority: r.priority,
            variant_percent: r.variantPercent as Record<string, number>,
            };
            return r.segmentName ? { ...base, segment: r.segmentName } : base;
        });

        const flagBase: Omit<SnapshotFlag, 'description'> = {
            key: f.key,
            enabled: f.enabled,
            rollout: Number(f.rollout),
            rules,
        };

        return (f.description ?? null) !== null ? { ...flagBase, description: f.description } : flagBase;
    });

    const segments = Object.fromEntries(
        env.segments.map((s) => [
        s.name,
        (s.conditions as any[]).map((c) => ({
            attr: c.attr,
            op: c.op,
            values: c.values as string[],
        })),
        ])
    ) as Snapshot['segments'];

    const snapshot: Snapshot = {
        env: env.id,
        version: env.version,
        flags,
        segments,
        settings: (env as any).settings || {}
    };

    return snapshot;
}


export async function writeSnapshotLocal(envId: string, snap: Snapshot) {
    const dir = path.join(process.cwd(), 'snapshots');
    if (!fs.existsSync(dir)) 
        fs.mkdirSync(dir);
    
    const file = path.join(dir, `snapshot.${envId}.json`);
    fs.writeFileSync(file, JSON.stringify(snap, null, 2), 'utf-8');
    
    return file;
}

export async function writeSnapshotS3(envId: string, snap: Snapshot) {
    const bucket = process.env.SNAPSHOT_BUCKET!;
    const key = `snapshots/${envId}/snapshot.json`;
    const out = await putJson(bucket, key, snap);
    return { bucket, key, etag: (out as any).ETag };
}
