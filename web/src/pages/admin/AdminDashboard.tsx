import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [live, setLive] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/admin/attendance/summary").then(setSummary).catch(() => setSummary(null));
    apiFetch("/admin/live").then(setLive).catch(() => setLive([]));
  }, []);

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Records" value={summary?.records ?? "-"} icon="badge" />
          <MetricCard title="Currently Clocked In" value={live.length} icon="timer" accent="text-green-600" />
          <MetricCard title="Late Arrivals" value={summary?.lateCount ?? "-"} icon="warning" accent="text-amber-600" />
          <MetricCard title="Total Hours" value={summary?.totalHours ?? "-"} icon="schedule" accent="text-purple-600" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Live Attendance Feed</h3>
              <p className="text-sm text-slate-500">Real-time status of employees</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Clock-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {live.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{row.user?.name}</div>
                      <div className="text-xs text-slate-500">{row.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">Clocked In</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.location?.name ?? "Unknown"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(row.clockInAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  title,
  value,
  icon,
  accent = "text-primary"
}: {
  title: string;
  value: any;
  icon: string;
  accent?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-lg bg-slate-50 flex items-center justify-center ${accent}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
    </div>
  );
}