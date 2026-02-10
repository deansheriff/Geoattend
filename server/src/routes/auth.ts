import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authCookieName, requireAuth } from "../middleware/auth.js";
import { hashToken, randomToken } from "../utils/crypto.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const forgotSchema = z.object({
  email: z.string().email()
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: { email, active: true }
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ttlDays = Number(process.env.SESSION_TTL_DAYS || 7);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  const token = randomToken();
  const tokenHash = hashToken(token);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    }
  });

  res.cookie(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt
  });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timezone: user.timezone
  });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.[authCookieName];
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  res.clearCookie(authCookieName);
  return res.json({ ok: true });
});

router.post("/forgot-password", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    return res.json({ ok: true });
  }

  const token = randomToken();
  const tokenHash = hashToken(token);
  const ttlMin = Number(process.env.RESET_TOKEN_TTL_MIN || 30);
  const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt }
  });

  return res.json({ ok: true, devToken: token });
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);
  const reset = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }
  });

  if (!reset) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash }
  });

  await prisma.passwordResetToken.update({
    where: { id: reset.id },
    data: { usedAt: new Date() }
  });

  return res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = req.user!;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timezone: user.timezone
  });
});

export default router;
