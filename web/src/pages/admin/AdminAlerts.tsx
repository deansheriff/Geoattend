import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

type Alert = {
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  record: {
    id: string;
    date: string;
    clockInAt: string;
    user?: { name: string; email: string };
    location?: { name: string };
  };
};

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    apiFetch("/admin/alerts").then(setAlerts).catch(() => setAlerts([]));
  }, []);

  const badge = (severity: Alert["severity"]) => {
    if (severity === "high") return "bg-red-50 text-red-600";
    if (severity === "medium") return "bg-amber-50 text-amber-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <AdminLayout title="Alerts">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold">System Alerts</h3>
          <p className="text-sm text-slate-500">Late arrivals, early departures, and missing clock-outs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={`${alert.type}-${alert.record.id}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge(alert.severity)}`}>
                      {alert.message}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {alert.record.user?.name}
                    <div className="text-xs text-slate-500">{alert.record.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(alert.record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{alert.record.location?.name ?? "Unknown"}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-sm text-slate-500">
                    No alerts right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
