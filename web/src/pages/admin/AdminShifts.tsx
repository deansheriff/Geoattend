import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

type User = { id: string; name: string; email: string };
type Shift = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  user?: User;
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminShifts() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState({
    userId: "",
    days: [1, 2, 3, 4, 5] as number[],
    startTime: "09:00",
    endTime: "17:00",
    timezone: "UTC",
    overwrite: true
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const loadAll = async () => {
    const [emps, list] = await Promise.all([apiFetch("/admin/employees"), apiFetch("/admin/shifts")]);
    setEmployees(emps);
    setShifts(list);
    if (!form.userId && emps.length) {
      setForm((prev) => ({ ...prev, userId: emps[0].id }));
      setSelectedUserId(emps[0].id);
    }
  };

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load shifts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    setError(null);
    if (form.days.length === 0) {
      setError("Select at least one day");
      return;
    }
    await apiFetch("/admin/shifts/bulk", {
      method: "POST",
      body: JSON.stringify({
        userId: form.userId,
        days: form.days,
        startTime: form.startTime,
        endTime: form.endTime,
        timezone: form.timezone,
        overwrite: form.overwrite
      })
    });
    persistLastWeek(form.userId, form);
    loadAll().catch(() => setError("Failed to refresh shifts"));
  };

  const onDelete = async (id: string) => {
    setError(null);
    await apiFetch(`/admin/shifts/${id}`, { method: "DELETE" });
    loadAll().catch(() => setError("Failed to refresh shifts"));
  };

  const selectedUser = employees.find((e) => e.id === selectedUserId);
  const userShifts = useMemo(
    () => shifts.filter((s) => s.userId === selectedUserId),
    [shifts, selectedUserId]
  );
  const shiftByDay = useMemo(() => {
    const map: Record<number, Shift | undefined> = {};
    for (const shift of userShifts) map[shift.dayOfWeek] = shift;
    return map;
  }, [userShifts]);

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      return { ...prev, days: exists ? prev.days.filter((d) => d !== day) : [...prev.days, day].sort() };
    });
  };

  const onRepeatLastWeek = () => {
    const stored = loadLastWeek(form.userId);
    if (!stored) {
      setError("No saved schedule for this employee yet");
      return;
    }
    setForm((prev) => ({
      ...prev,
      days: stored.days,
      startTime: stored.startTime,
      endTime: stored.endTime,
      timezone: stored.timezone,
      overwrite: true
    }));
  };

  return (
    <AdminLayout title="Shifts">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-600 mb-3">Employees</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => {
                  setSelectedUserId(emp.id);
                  setForm((prev) => ({ ...prev, userId: emp.id }));
                }}
                className={`w-full text-left rounded-lg px-3 py-2 ${
                  selectedUserId === emp.id ? "bg-primary text-white" : "bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-sm font-semibold">{emp.name}</div>
                <div className={`text-xs ${selectedUserId === emp.id ? "text-white/80" : "text-slate-500"}`}>
                  {emp.email}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Weekly Schedule</h3>
                <p className="text-sm text-slate-500">
                  {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Select an employee"}
                </p>
              </div>
              <button onClick={onRepeatLastWeek} className="text-xs font-bold text-primary">
                Repeat last week
              </button>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {dayLabels.map((label, idx) => (
                <div key={label} className="rounded-lg border border-slate-200 p-3 text-center">
                  <div className="text-xs font-bold text-slate-500">{label}</div>
                  {shiftByDay[idx] ? (
                    <div className="mt-2 text-xs font-semibold">
                      {shiftByDay[idx]?.startTime} - {shiftByDay[idx]?.endTime}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-400">Off</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold">Add Weekly Shift</h3>
            <div>
              <label className="text-xs font-semibold text-slate-500">Employee</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Days</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {dayLabels.map((label, idx) => {
                  const active = form.days.includes(idx);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleDay(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        active ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Start</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">End</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Timezone</label>
              <input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="UTC"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.overwrite}
                onChange={(e) => setForm({ ...form, overwrite: e.target.checked })}
              />
              Overwrite existing shifts for selected days
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={onCreate} className="w-full rounded-lg bg-primary text-white py-2 text-sm font-bold">
              Add Weekly Shift
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold">Existing Shifts</h3>
              <p className="text-sm text-slate-500">Manage individual entries for the selected employee</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Day</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hours</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm">{dayLabels[shift.dayOfWeek]}</td>
                      <td className="px-6 py-4 text-sm">
                        {shift.startTime} - {shift.endTime} ({shift.timezone})
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => onDelete(shift.id)}
                          className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {userShifts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-sm text-slate-500">
                        No shifts for this employee yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function persistLastWeek(userId: string, form: { days: number[]; startTime: string; endTime: string; timezone: string }) {
  const key = `geoattend:lastweek:${userId}`;
  localStorage.setItem(key, JSON.stringify(form));
}

function loadLastWeek(userId: string) {
  const key = `geoattend:lastweek:${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { days: number[]; startTime: string; endTime: string; timezone: string };
  } catch {
    return null;
  }
}
