import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { hashToken } from "../utils/crypto.js";

const COOKIE_NAME = "ga_session";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!session) {
    return res.status(401).json({ error: "Invalid session" });
  }

  req.user = session.user;
  return next();
}

export const authCookieName = COOKIE_NAME;