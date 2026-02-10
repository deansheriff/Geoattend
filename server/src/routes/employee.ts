import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { withinRadius } from "../utils/geo.js";
import { minutesBetween, nowUtc, parseLocalTimeToDate, toUserDay } from "../utils/time.js";
import { AttendanceStatus } from "@prisma/client";
import multer from "multer";

const router = Router();
const upload = multer({ dest: process.env.UPLOADS_DIR || "uploads" });

router.use(requireAuth);

const clockSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional()
});

router.get("/attendance", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      date: { gte: from, lte: to }
    },
    include: { location: true }
  });

  res.json(records);
});

router.get("/status", async (req, res) => {
  const record = await prisma.attendanceRecord.findFirst({
    where: { tenantId: req.user!.tenantId, userId: req.user!.id, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
    include: { location: true }
  });

  res.json({ active: !!record, record });
});

router.get("/locations", async (req, res) => {
  const assignments = await prisma.userLocationAssignment.findMany({
    where: { userId: req.user!.id },
    include: { location: true }
  });
  res.json(assignments.map((a) => a.location));
});

router.post("/clock-in", upload.single("photo"), async (req, res) => {
  const parsed = clockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { latitude, longitude } = parsed.data;
  const buffer = Number(process.env.GPS_BUFFER_METERS || 20);

  const assignments = await prisma.userLocationAssignment.findMany({
    where: { userId: req.user!.id },
    include: { location: true }
  });

  if (assignments.length === 0) {
    return res.status(400).json({ error: "No assigned locations" });
  }

  let closest: { locationId: string; distance: number } | null = null;
  let within = false;

  for (const a of assignments) {
    const result = withinRadius(
      latitude,
      longitude,
      a.location.latitude,
      a.location.longitude,
      a.location.radiusMeters,
      buffer
    );
    if (!closest || result.distance < closest.distance) {
      closest = { locationId: a.location.id, distance: result.distance };
    }
    if (result.ok) within = true;
  }

  if (!within) {
    return res.status(400).json({
      error: "Outside allowed geofence",
      nearestDistance: closest?.distance ?? null
    });
  }

  const now = nowUtc();
  const date = toUserDay(now, req.user!.timezone);

  const active = await prisma.attendanceRecord.findFirst({
    where: { userId: req.user!.id, clockOutAt: null }
  });
  if (active) {
    return res.status(400).json({ error: "Already clocked in" });
  }

  let status = AttendanceStatus.UNKNOWN;
  const shift = await prisma.shift.findFirst({
    where: {
      userId: req.user!.id,
      dayOfWeek: now.getUTCDay()
    }
  });
  if (shift) {
    const shiftStart = parseLocalTimeToDate(now, shift.startTime, req.user!.timezone);
    const minutesLate = minutesBetween(shiftStart, now);
    if (minutesLate > 5) status = AttendanceStatus.LATE;
    else status = AttendanceStatus.ON_TIME;
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      date,
      clockInAt: now,
      clockInLat: latitude,
      clockInLng: longitude,
      locationId: closest?.locationId,
      status,
      clockInPhoto: req.file?.filename
    },
    include: { location: true }
  });

  res.json({ ok: true, record });
});

router.post("/clock-out", upload.single("photo"), async (req, res) => {
  const parsed = clockSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { latitude, longitude } = parsed.data;
  const buffer = Number(process.env.GPS_BUFFER_METERS || 20);

  const assignments = await prisma.userLocationAssignment.findMany({
    where: { userId: req.user!.id },
    include: { location: true }
  });

  let closest: { locationId: string; distance: number } | null = null;
  let within = false;

  for (const a of assignments) {
    const result = withinRadius(
      latitude,
      longitude,
      a.location.latitude,
      a.location.longitude,
      a.location.radiusMeters,
      buffer
    );
    if (!closest || result.distance < closest.distance) {
      closest = { locationId: a.location.id, distance: result.distance };
    }
    if (result.ok) within = true;
  }

  if (!within) {
    return res.status(400).json({
      error: "Outside allowed geofence",
      nearestDistance: closest?.distance ?? null
    });
  }

  const active = await prisma.attendanceRecord.findFirst({
    where: { userId: req.user!.id, clockOutAt: null }
  });
  if (!active) {
    return res.status(400).json({ error: "Not clocked in" });
  }

  const now = nowUtc();
  const totalMinutes = minutesBetween(active.clockInAt, now) - active.breakMinutes;

  let status = active.status;
  const shift = await prisma.shift.findFirst({
    where: {
      userId: req.user!.id,
      dayOfWeek: now.getUTCDay()
    }
  });
  if (shift) {
    const shiftEnd = parseLocalTimeToDate(now, shift.endTime, req.user!.timezone);
    if (now < shiftEnd) status = AttendanceStatus.EARLY_DEPARTURE;
  }

  const record = await prisma.attendanceRecord.update({
    where: { id: active.id },
    data: {
      clockOutAt: now,
      clockOutLat: latitude,
      clockOutLng: longitude,
      totalMinutes,
      status,
      clockOutPhoto: req.file?.filename
    },
    include: { location: true }
  });

  res.json({ ok: true, record });
});

router.post("/break-start", async (req, res) => {
  const active = await prisma.attendanceRecord.findFirst({
    where: { userId: req.user!.id, clockOutAt: null }
  });
  if (!active) return res.status(400).json({ error: "Not clocked in" });

  const openBreak = await prisma.breakRecord.findFirst({
    where: { attendanceRecordId: active.id, endedAt: null }
  });
  if (openBreak) return res.status(400).json({ error: "Break already active" });

  const record = await prisma.breakRecord.create({
    data: { attendanceRecordId: active.id, startedAt: new Date() }
  });

  res.json({ ok: true, record });
});

router.post("/break-end", async (req, res) => {
  const active = await prisma.attendanceRecord.findFirst({
    where: { userId: req.user!.id, clockOutAt: null }
  });
  if (!active) return res.status(400).json({ error: "Not clocked in" });

  const openBreak = await prisma.breakRecord.findFirst({
    where: { attendanceRecordId: active.id, endedAt: null }
  });
  if (!openBreak) return res.status(400).json({ error: "No active break" });

  const now = new Date();
  const totalMinutes = minutesBetween(openBreak.startedAt, now);

  await prisma.breakRecord.update({
    where: { id: openBreak.id },
    data: { endedAt: now, totalMinutes }
  });

  await prisma.attendanceRecord.update({
    where: { id: active.id },
    data: { breakMinutes: active.breakMinutes + totalMinutes }
  });

  res.json({ ok: true });
});

export default router;
