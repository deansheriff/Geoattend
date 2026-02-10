import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

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