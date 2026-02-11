import { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import pkg from "@prisma/client";

const { Prisma } = pkg as any;
const { Role: RuntimeRole } = Prisma;

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}
