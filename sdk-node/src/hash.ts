// Simple string hash -> 32-bit unsigned; good enough for stable buckets
export function hash32(str: string): number {
    let h = 2166136261 >>> 0; // FNV-1a seed
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// 0..99 bucket
export function bucket100(str: string): number {
    return hash32(str) % 100;
}