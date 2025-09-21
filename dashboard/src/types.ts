export type Flag = {
    id: string;
    key: string;
    description?: string;
    enabled: boolean;
    rollout: number; // 0..100
    updated_at?: string;
};