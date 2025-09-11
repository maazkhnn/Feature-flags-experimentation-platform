//egment evaluate + choose variant)

import { Attributes, Condition, Rule, Snapshot } from "./types";
import { bucket100 } from "./hash";

// evaluate one condition against attrs
function pass(c: Condition, attrs: Attributes): boolean {
    const v = attrs[c.attr];
    if (v === undefined || v === null) return false;
    const s = String(v);

    switch (c.op) {
        case "eq": return c.values.includes(s);
        case "neq": return !c.values.includes(s);
        case "in": return c.values.includes(s);
        case "not_in": return !c.values.includes(s);
        default: return false;
    }
}

function segmentMatches(segmentConds: Condition[], attrs: Attributes): boolean {
    // AND all conditions for MVP
    for (const c of segmentConds) {
        if (!pass(c, attrs)) return false;
    }
    return true;
}

function pickVariant(variantPercent: Record<string, number>, hashBasis: string): string {
    const b = bucket100(hashBasis); // 0..99
    let acc = 0;
    for (const [variant, pct] of Object.entries(variantPercent)) {
        acc += pct;
        if (b < acc) return variant;
    }
    // default to "off" if percentages don't sum to 100
    return "off";
}

export function evaluateFlag(
    snap: Snapshot,
    flagKey: string,
    attrs: Attributes,
    fallback: "on" | "off" = "off"
    ): "on" | "off" {
    const flag = snap.flags.find(f => f.key === flagKey);
    if (!flag) return fallback;

    // disabled flag → "off"
    if (!flag.enabled) return "off";

    const userId = String(attrs.userId ?? "");
    const hashBasis = userId + ":" + flagKey;

    // 1) rule pass: first matching rule wins
    for (const r of flag.rules.sort((a,b)=>a.priority-b.priority)) {
        if (!r.segment) continue;
        const seg = snap.segments[r.segment];
        if (!seg) continue;
        if (segmentMatches(seg, attrs)) {
        const variant = pickVariant(r.variant_percent, hashBasis);
        return variant === "on" ? "on" : "off";
        }
    }

    // 2) default rollout
    const onPercent = Math.max(0, Math.min(100, flag.rollout));
    const variant = pickVariant({ on: onPercent, off: 100 - onPercent }, hashBasis);
    return variant === "on" ? "on" : "off";
}
