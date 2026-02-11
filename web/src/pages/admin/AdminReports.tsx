import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch, API_BASE } from "../../api/client";

type User = { id: string; name: string; email: string };
type RecordRow = {
  id: string;
  date: string;
  clockInAt: string;
  clockOutAt?: string;
  totalMinutes?: number;
  user?: User;
  location?: { name: string };
};

export default function AdminReports() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/admin/employees").then(setEmployees).catch(() => setEmployees([]));
  }, []);

  const load = async () => {
    setError(null);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (userId) params.set("userId", userId);
    const data = await apiFetch(`/admin/attendance?${params.toString()}`);
    setRecords(data);
  };

  const onExport = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (userId) params.set("userId", userId);
    const url = `${API_BASE}/admin/export?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Employee</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => load().catch(() => setError("Failed to load report"))}
                className="flex-1 rounded-lg bg-primary text-white py-2 text-sm font-bold"
              >
                Run Report
              </button>
              <button
                onClick={onExport}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
              >
                Export CSV
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold">Attendance Records</h3>
            <p className="text-sm text-slate-500">Filtered report results</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Clock In</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Clock Out</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold">
                      {rec.user?.name}
                      <div className="text-xs text-slate-500">{rec.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{new Date(rec.clockInAt).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-sm">
                      {rec.clockOutAt ? new Date(rec.clockOutAt).toLocaleTimeString() : "--"}
                    </td>
                    <td className="px-6 py-4 text-sm">{rec.location?.name ?? "Unknown"}</td>
                    <td className="px-6 py-4 text-sm">
                      {rec.totalMinutes ? `${Math.round(rec.totalMinutes / 60)}h ${rec.totalMinutes % 60}m` : "--"}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-slate-500">
                      No results yet. Run a report above.
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
