//shared types mirroring the snapshot

export type Condition = { attr: string; op: "eq"|"in"|"neq"|"not_in"; values: string[] };
export type Rule = { priority: number; segment?: string; variant_percent: Record<string, number> };
export type Flag = {
    key: string;
    description?: string | null;
    enabled: boolean;
    rollout: number; // default % for "on"
    rules: Rule[];
};
export type Snapshot = {
    env: string;
    version: number;
    flags: Flag[];
    segments: Record<string, Condition[]>;
    settings?: Record<string, any>;
};

export type Attributes = Record<string, string | number | boolean | undefined>;

export type ClientOptions = {
    env: string;
    snapshotUrl: string;
    sseUrl: string;
    apiKey?: string;
    attributesProvider?: (reqOrCtx: any) => Attributes;
    fetchImpl?: typeof fetch; // optional override for tests
};