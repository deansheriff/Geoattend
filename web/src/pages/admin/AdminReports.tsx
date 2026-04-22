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
    try {
        const data = await apiFetch(`/admin/attendance?${params.toString()}`);
        setRecords(data);
    } catch {
        setError("Failed to load report");
    }
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
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Reports & Analytics</h1>
          <p className="text-primary/60 text-lg">Generate attendance records and export timesheet data.</p>
        </div>
      </div>

      <div className="space-y-8 font-display h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
        {/* Filter Controls */}
        <div className="bg-surface-container-low rounded-[2rem] border border-black/5 p-8 shadow-sm flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Date From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Date To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all cursor-pointer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Employee Filter</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all appearance-none cursor-pointer"
              >
                <option value="">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3 pb-1">
              <button
                onClick={() => load().catch(() => setError("Failed to load report"))}
                className="flex-1 rounded-full bg-primary text-on-primary h-[54px] text-xs uppercase tracking-widest font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                Run
              </button>
              <button
                onClick={onExport}
                className="rounded-full border border-primary/10 bg-surface-container-highest px-6 h-[54px] text-xs uppercase tracking-widest font-bold text-primary hover:bg-black/5 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Export
              </button>
            </div>
          </div>
          {error && <div className="mt-6 text-xs font-bold text-error bg-error-container p-4 rounded-xl flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">error</span> {error}</div>}
        </div>

        {/* Results Table */}
        <div className="bg-surface-container-low rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col flex-1 transform-gpu">
          <div className="p-8 border-b border-primary/5 bg-surface-container-low">
            <h3 className="text-xl font-bold font-display text-primary tracking-tight">Attendance Records</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-primary/50 text-[10px] uppercase tracking-[0.15em] font-black font-display">
                  <th className="px-8 py-5">Employee</th>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Clock In</th>
                  <th className="px-8 py-5">Clock Out</th>
                  <th className="px-8 py-5">Location</th>
                  <th className="px-8 py-5 text-right border-l border-primary/5 w-[120px]">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 bg-surface-container-low">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface-variant transition-colors group cursor-default">
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-primary tracking-tight font-display">{rec.user?.name}</div>
                      <div className="text-[11px] font-semibold text-primary/50 mt-0.5">{rec.user?.email}</div>
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-primary">
                        <div className="bg-black/5 px-2 py-1 rounded-md inline-block">
                            {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-[#3a6846]">{new Date(rec.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-8 py-5 text-sm font-bold text-error">
                      {rec.clockOutAt ? new Date(rec.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="opacity-40">--</span>}
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-primary/60">{rec.location?.name ?? "Unknown"}</td>
                    <td className="px-8 py-5 text-right border-l border-primary/5">
                      {rec.totalMinutes ? (
                          <div className="inline-flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-lg text-sm font-black tracking-tight">
                              {Math.floor(rec.totalMinutes / 60)}h {rec.totalMinutes % 60}m
                          </div>
                      ) : (
                          <span className="text-sm font-bold text-primary/20">--</span>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-xs font-bold text-primary/30 uppercase tracking-widest text-center">
                      No records matched your filters.
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
