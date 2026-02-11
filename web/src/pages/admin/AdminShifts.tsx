import { useEffect, useState } from "react";
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
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    timezone: "UTC"
  });
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    const [emps, list] = await Promise.all([apiFetch("/admin/employees"), apiFetch("/admin/shifts")]);
    setEmployees(emps);
    setShifts(list);
    if (!form.userId && emps.length) {
      setForm((prev) => ({ ...prev, userId: emps[0].id }));
    }
  };

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load shifts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    setError(null);
    await apiFetch("/admin/shifts", {
      method: "POST",
      body: JSON.stringify(form)
    });
    loadAll().catch(() => setError("Failed to refresh shifts"));
  };

  const onDelete = async (id: string) => {
    setError(null);
    await apiFetch(`/admin/shifts/${id}`, { method: "DELETE" });
    loadAll().catch(() => setError("Failed to refresh shifts"));
  };

  return (
    <AdminLayout title="Shifts">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold">Create Shift</h3>
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
            <label className="text-xs font-semibold text-slate-500">Day of Week</label>
            <select
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {dayLabels.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={onCreate} className="w-full rounded-lg bg-primary text-white py-2 text-sm font-bold">
            Add Shift
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold">Shift Schedule</h3>
            <p className="text-sm text-slate-500">Per-employee weekly expectations</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Day</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hours</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold">
                      {shift.user?.name || "Unknown"}
                      <div className="text-xs text-slate-500">{shift.user?.email}</div>
                    </td>
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
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-sm text-slate-500">
                      No shifts defined.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
