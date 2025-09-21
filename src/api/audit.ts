import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "./middleware";

export const audit = Router({ mergeParams: true });

audit.get("/", requireAuth(["admin"]), async (req, res) => {
    const envId = String(req.params.envId);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const items = await prisma.auditLog.findMany({
        where: { envId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
    res.json({ items });
});