import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import type { AttendanceRecord, AttendanceStatus as AttendanceStatusType, Role as RoleType } from "@prisma/client";
import { minutesBetween } from "../utils/time.js";

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
  const locations = await prisma.location.findMany({
    where: { tenantId: req.user!.tenantId },
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
  await prisma.location.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
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

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId: req.user!.tenantId,
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

router.get("/export", async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: { tenantId: req.user!.tenantId, date: { gte: from, lte: to } },
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

export default router;
