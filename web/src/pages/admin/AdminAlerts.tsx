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
    if (severity === "high") return "bg-error-container text-on-error-container border-error/20 shadow-sm shadow-error/10";
    if (severity === "medium") return "bg-secondary-container text-on-secondary-container border-secondary/20 shadow-sm shadow-[#E69D45]/10";
    return "bg-black/5 text-primary/70 border-black/10 shadow-sm";
  };

  return (
    <AdminLayout title="Alerts">
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">System Alerts</h1>
          <p className="text-primary/60 text-lg">Actionable notifications regarding employee attendance.</p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-[2rem] border border-black/5 shadow-sm overflow-hidden font-display flex flex-col min-h-[600px] h-[calc(100vh-200px)]">
        <div className="p-8 border-b border-primary/5">
          <h3 className="text-xl font-bold font-display text-primary tracking-tight">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 text-primary/50 text-[10px] uppercase tracking-[0.15em] font-black font-display">
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Employee</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 bg-surface-container-low">
              {alerts.map((alert) => (
                <tr key={`${alert.type}-${alert.record.id}`} className="hover:bg-surface-variant transition-colors group cursor-default">
                  <td className="px-8 py-5">
                    <span className={`px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black inline-block border ${badge(alert.severity)}`}>
                      {alert.message}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-primary tracking-tight font-display">{alert.record.user?.name}</div>
                    <div className="text-[11px] font-semibold text-primary/50 mt-0.5">{alert.record.user?.email}</div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-primary">
                      <div className="bg-black/5 px-2 py-1 rounded-md inline-block">
                          {new Date(alert.record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-semibold text-primary/60">{alert.record.location?.name ?? "Unknown"}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                     <span className="material-symbols-outlined text-[64px] text-primary/10 block mb-4">notifications_off</span>
                     <div className="text-sm font-bold text-primary/50 uppercase tracking-widest">No alerts right now. All clear!</div>
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
