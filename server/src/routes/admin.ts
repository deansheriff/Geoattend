import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import type { AttendanceRecord, AttendanceStatus as AttendanceStatusType, Role as RoleType } from "@prisma/client";
import { minutesBetween } from "../utils/time.js";
import multer from "multer";

const router = Router();

const Role = {
  ADMIN: "ADMIN" as RoleType,
  EMPLOYEE: "EMPLOYEE" as RoleType
};
const AttendanceStatus = {
  LATE: "LATE" as AttendanceStatusType,
  EARLY_DEPARTURE: "EARLY_DEPARTURE" as AttendanceStatusType
};

router.use(requireAuth, requireRole(Role.ADMIN));

const upload = multer({ dest: process.env.UPLOADS_DIR || "uploads" });

router.get("/employees", async (req, res) => {
  const employees = await prisma.user.findMany({
    where: { tenantId: req.user!.tenantId },
    select: { id: true, name: true, email: true, role: true, active: true, timezone: true }
  });
  res.json(employees);
});

router.post("/employees", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
    timezone: z.string().default("UTC"),
    password: z.string().min(8).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const passwordHash = req.body.password
    ? await (await import("bcrypt")).default.hash(req.body.password, 10)
    : await (await import("bcrypt")).default.hash("Employee123!", 10);

  const user = await prisma.user.create({
    data: {
      tenantId: req.user!.tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role ?? Role.EMPLOYEE,
      timezone: parsed.data.timezone,
      passwordHash
    }
  });
  res.json(user);
});

router.patch("/employees/:id", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    timezone: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    active: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data
  });
  res.json(user);
});

router.patch("/employees/:id/deactivate", async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { active: false }
  });
  res.json(user);
});

router.get("/locations", async (req, res) => {
  const includeInactive = String(req.query.includeInactive || "false") === "true";
  const locations = await prisma.location.findMany({
    where: { tenantId: req.user!.tenantId, ...(includeInactive ? {} : { active: true }) },
    orderBy: { createdAt: "desc" }
  });
  res.json(locations);
});

router.post("/locations", async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    latitude: z.number(),
    longitude: z.number(),
    radiusMeters: z.number().int().positive()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const location = await prisma.location.create({
    data: {
      tenantId: req.user!.tenantId,
      createdById: req.user!.id,
      ...parsed.data
    }
  });
  res.json(location);
});

router.patch("/locations/:id", async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    radiusMeters: z.number().int().positive().optional(),
    active: z.boolean().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const location = await prisma.location.update({
    where: { id: req.params.id },
    data: parsed.data
  });
  res.json(location);
});

router.delete("/locations/:id", async (req, res) => {
  await prisma.location.update({
    where: { id: req.params.id },
    data: { active: false }
  });
  res.json({ ok: true, deactivated: true });
});

router.get("/locations/:id/assignments", async (req, res) => {
  const assignments = await prisma.userLocationAssignment.findMany({
    where: { locationId: req.params.id },
    include: { user: true }
  });
  res.json(assignments);
});

router.post("/locations/:id/assignments", async (req, res) => {
  const schema = z.object({ userId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const assignment = await prisma.userLocationAssignment.create({
    data: {
      tenantId: req.user!.tenantId,
      userId: parsed.data.userId,
      locationId: req.params.id
    }
  });
  res.json(assignment);
});

router.get("/assignments", async (req, res) => {
  const assignments = await prisma.userLocationAssignment.findMany({
    where: { tenantId: req.user!.tenantId },
    include: { user: true, location: true }
  });
  res.json(assignments);
});

router.post("/assignments", async (req, res) => {
  const schema = z.object({ userId: z.string().uuid(), locationId: z.string().uuid() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const assignment = await prisma.userLocationAssignment.create({
    data: {
      tenantId: req.user!.tenantId,
      userId: parsed.data.userId,
      locationId: parsed.data.locationId
    }
  });
  res.json(assignment);
});

router.delete("/assignments/:id", async (req, res) => {
  await prisma.userLocationAssignment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/employees/:id/locations", async (req, res) => {
  const assignments = await prisma.userLocationAssignment.findMany({
    where: { userId: req.params.id },
    include: { location: true }
  });
  res.json(assignments);
});

router.get("/attendance", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const userId = req.query.userId ? String(req.query.userId) : undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: req.user!.tenantId,
      ...(userId ? { userId } : {}),
      date: {
        gte: from,
        lte: to
      }
    },
    include: { user: true, location: true }
  });

  res.json(records);
});

router.get("/attendance/summary", async (req, res) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { tenantId: req.user!.tenantId }
  });

  const totalMinutes = records.reduce((sum: number, r: AttendanceRecord) => sum + (r.totalMinutes || 0), 0);
  const lateCount = records.filter((r: AttendanceRecord) => r.status === AttendanceStatus.LATE).length;

  res.json({
    totalHours: Math.round(totalMinutes / 60),
    lateCount,
    records: records.length
  });
});

router.get("/analytics", async (req, res) => {
  const employees = await prisma.user.findMany({
    where: { tenantId: req.user!.tenantId, role: "EMPLOYEE" }
  });

  const attendance = await prisma.attendanceRecord.findMany({
    where: { tenantId: req.user!.tenantId }
  });

  const byUser: Record<string, { minutes: number; late: number; early: number }> = {};
  for (const user of employees) {
    byUser[user.id] = { minutes: 0, late: 0, early: 0 };
  }

  for (const record of attendance as AttendanceRecord[]) {
    if (!byUser[record.userId]) continue;
    byUser[record.userId].minutes += record.totalMinutes || 0;
    if (record.status === AttendanceStatus.LATE) byUser[record.userId].late += 1;
    if (record.status === AttendanceStatus.EARLY_DEPARTURE) byUser[record.userId].early += 1;
  }

  res.json({ byUser });
});

router.get("/live", async (req, res) => {
  const active = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: req.user!.tenantId,
      clockOutAt: null
    },
    include: { user: true, location: true }
  });

  res.json(active);
});

router.get("/alerts", async (req, res) => {
  const cutoffHours = Number(process.env.MISSING_CLOCK_OUT_HOURS || 12);
  const cutoff = new Date(Date.now() - cutoffHours * 60 * 60 * 1000);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const missingClockOut = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: req.user!.tenantId,
      clockOutAt: null,
      clockInAt: { lt: cutoff }
    },
    include: { user: true, location: true }
  });

  const lateOrEarly = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: req.user!.tenantId,
      date: { gte: since },
      status: { in: [AttendanceStatus.LATE, AttendanceStatus.EARLY_DEPARTURE] }
    },
    include: { user: true, location: true }
  });

  const alerts = [
    ...missingClockOut.map((record: any) => ({
      type: "MISSING_CLOCK_OUT",
      severity: "high",
      message: "Missing clock-out",
      record
    })),
    ...lateOrEarly.map((record: any) => ({
      type: record.status,
      severity: record.status === AttendanceStatus.LATE ? "medium" : "low",
      message: record.status === AttendanceStatus.LATE ? "Late arrival" : "Early departure",
      record
    }))
  ];

  res.json(alerts);
});

router.get("/export", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const userId = req.query.userId ? String(req.query.userId) : undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: { tenantId: req.user!.tenantId, ...(userId ? { userId } : {}), date: { gte: from, lte: to } },
    include: { user: true, location: true }
  });

  const header = "employee,date,clock_in,clock_out,total_minutes,location\n";
  const rows = records.map((r: any) => {
    return [
      r.user.name,
      r.date.toISOString(),
      r.clockInAt.toISOString(),
      r.clockOutAt ? r.clockOutAt.toISOString() : "",
      r.totalMinutes ?? "",
      r.location?.name ?? ""
    ].join(",");
  });

  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=attendance.csv");
  res.send(csv);
});

router.post("/recalculate/:id", async (req, res) => {
  const record = await prisma.attendanceRecord.findFirst({
    where: { id: req.params.id }
  });
  if (!record) return res.status(404).json({ error: "Not found" });

  if (record.clockOutAt) {
    const totalMinutes = minutesBetween(record.clockInAt, record.clockOutAt) - record.breakMinutes;
    await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { totalMinutes }
    });
  }

  res.json({ ok: true });
});

router.get("/settings", async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.user!.tenantId }
  });
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });

  res.json({
    id: tenant.id,
    name: tenant.name,
    address: tenant.address,
    logoPath: tenant.logoPath
  });
});

router.patch("/settings", async (req, res) => {
  const emptyToUndefined = (val: unknown) => {
    if (typeof val === "string" && val.trim() === "") return undefined;
    return val;
  };
  const schema = z.object({
    name: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    address: z.preprocess(emptyToUndefined, z.string().min(1).optional())
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const tenant = await prisma.tenant.update({
    where: { id: req.user!.tenantId },
    data: parsed.data
  });
  res.json({
    id: tenant.id,
    name: tenant.name,
    address: tenant.address,
    logoPath: tenant.logoPath
  });
});

router.post("/settings/logo", upload.single("logo"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Missing logo file" });

  const tenant = await prisma.tenant.update({
    where: { id: req.user!.tenantId },
    data: { logoPath: req.file.filename }
  });

  res.json({
    id: tenant.id,
    name: tenant.name,
    address: tenant.address,
    logoPath: tenant.logoPath
  });
});

router.get("/shifts", async (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : undefined;
  const shifts = await prisma.shift.findMany({
    where: { tenantId: req.user!.tenantId, ...(userId ? { userId } : {}) },
    include: { user: true }
  });
  res.json(shifts);
});

router.post("/shifts", async (req, res) => {
  const schema = z.object({
    userId: z.string().uuid(),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().min(3),
    endTime: z.string().min(3),
    timezone: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const shift = await prisma.shift.create({
    data: {
      tenantId: req.user!.tenantId,
      userId: parsed.data.userId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      timezone: parsed.data.timezone || "UTC"
    },
    include: { user: true }
  });
  res.json(shift);
});

router.patch("/shifts/:id", async (req, res) => {
  const schema = z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().min(3).optional(),
    endTime: z.string().min(3).optional(),
    timezone: z.string().optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const shift = await prisma.shift.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { user: true }
  });
  res.json(shift);
});

router.delete("/shifts/:id", async (req, res) => {
  await prisma.shift.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
