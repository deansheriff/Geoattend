import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch, API_BASE } from "../../api/client";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [live, setLive] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/admin/attendance/summary").then(setSummary).catch(() => setSummary(null));
    apiFetch("/admin/live").then(setLive).catch(() => setLive([]));
    apiFetch("/admin/alerts").then(setAlerts).catch(() => setAlerts([]));
  }, []);

  return (
    <AdminLayout title="Dashboard Overview">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardLink title="Employees" description="Manage people" to="/admin/employees" icon="groups" />
          <DashboardLink title="Locations" description="Geofences & zones" to="/admin/locations" icon="explore" />
          <DashboardLink title="Assignments" description="Assign employees" to="/admin/assignments" icon="assignment" />
          <DashboardLink title="Shifts" description="Define schedules" to="/admin/shifts" icon="schedule" />
          <DashboardLink title="Reports" description="Filters & exports" to="/admin/reports" icon="summarize" />
          <DashboardLink title="Alerts" description="Anomalies & issues" to="/admin/alerts" icon="notifications" />
          <DashboardLink title="Settings" description="Company profile" to="/admin/settings" icon="settings" />
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold">Quick Actions</h3>
              <p className="text-xs text-slate-500">Daily admin tasks</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/admin/employees" className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100">
                Add Employee
              </Link>
              <Link to="/admin/locations" className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100">
                Add Location
              </Link>
              <Link to="/admin/reports" className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100">
                Run Report
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Records" value={summary?.records ?? "-"} icon="badge" />
          <MetricCard title="Currently Clocked In" value={live.length} icon="timer" accent="text-green-600" />
          <MetricCard title="Late Arrivals" value={summary?.lateCount ?? "-"} icon="warning" accent="text-amber-600" />
          <MetricCard title="Total Hours" value={summary?.totalHours ?? "-"} icon="schedule" accent="text-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Live Attendance Feed</h3>
              <p className="text-sm text-slate-500">Real-time status of employees</p>
            </div>
            <button
              onClick={() => window.open(`${API_BASE}/admin/export`, "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg"
            >
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Recent Alerts</h3>
              <p className="text-sm text-slate-500">Items needing attention</p>
            </div>
            <Link to="/admin/alerts" className="text-xs font-bold text-primary">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {alerts.slice(0, 5).map((alert) => (
              <div key={`${alert.type}-${alert.record?.id}`} className="p-4">
                <div className="text-sm font-semibold">{alert.message}</div>
                <div className="text-xs text-slate-500">
                  {alert.record?.user?.name} • {new Date(alert.record?.date).toLocaleDateString()}
                </div>
              </div>
            ))}
            {alerts.length === 0 && <div className="p-6 text-sm text-slate-500">No alerts right now.</div>}
          </div>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function DashboardLink({
  title,
  description,
  to,
  icon
}: {
  title: string;
  description: string;
  to: string;
  icon: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="size-12 rounded-lg bg-slate-50 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-slate-500">{description}</p>
    </Link>
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
