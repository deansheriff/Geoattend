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
    <AdminLayout title="Executive Overview">
      {/* Metric Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <MetricCard title="Total Records" value={summary?.records ?? "-"} icon="badge" bgClass="bg-primary" />
        <div className="bg-surface-container-low p-8 rounded-lg transition-all hover:bg-surface-container-highest group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-9xl">bolt</span>
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-tertiary text-white rounded-2xl shadow-lg relative z-10">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </div>
          </div>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] mb-2 font-display">Active Now</p>
          <h3 className="text-5xl font-black text-primary font-display tracking-tight">{live.length}</h3>
          <p className="mt-6 text-on-tertiary-fixed-variant text-sm font-medium flex items-center gap-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Live on premise
          </p>
        </div>
        <MetricCard title="Total Hours" value={summary?.totalHours ?? "-"} icon="schedule" bgClass="bg-secondary" />
      </section>

      {/* Activity & Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Activity Table */}
        <section className="lg:col-span-2 bg-surface-container-low rounded-lg p-10">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="text-3xl font-black text-primary font-display tracking-tight mb-2">Recent Activity</h3>
              <p className="text-on-surface-variant text-sm">Real-time personnel movement tracking</p>
            </div>
            <button
               onClick={() => window.open(`${API_BASE}/admin/export`, "_blank")}
               className="text-tertiary font-bold text-sm border-b-2 border-tertiary-fixed-dim pb-1 hover:border-tertiary transition-all"
            >
              Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant/20">
                <tr className="text-on-surface-variant font-display text-[10px] uppercase tracking-widest">
                  <th className="pb-4 font-bold">Employee Name</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold">Location</th>
                  <th className="pb-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-transparent">
                {live.length === 0 && (
                   <tr>
                     <td colSpan={4} className="py-8 text-center text-primary/50 text-sm font-medium">No active personnel.</td>
                   </tr>
                )}
                {live.map((row) => (
                  <tr key={row.id} className="group hover:bg-surface-container-highest transition-colors rounded-xl">
                    <td className="py-6 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center text-primary/30">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <span className="font-bold text-primary block">{row.user?.name}</span>
                        <span className="text-xs text-primary/60">{row.user?.email}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">
                        Clock In
                      </span>
                    </td>
                    <td className="py-6 text-on-surface-variant text-sm font-medium">{row.location?.name ?? "Unknown"}</td>
                    <td className="py-6 text-on-surface-variant text-sm tabular-nums flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px] text-primary/30">schedule</span>
                       {new Date(row.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Status Sidebar (Bento Style) */}
        <div className="flex flex-col gap-8">
          
          <div className="bg-primary-container p-8 rounded-lg text-white relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white to-transparent pointer-events-none"></div>
            <p className="text-on-primary-container font-bold uppercase tracking-widest text-[10px] mb-8 font-display">System Alerts</p>
            
            <div className="space-y-4 relative z-10">
              {alerts.slice(0, 3).map((alert) => (
                <div key={`${alert.type}-${alert.record?.id}`} className="bg-surface-container/10 p-4 rounded-xl backdrop-blur-sm">
                  <p className="font-bold text-sm mb-1">{alert.message}</p>
                  <p className="text-xs text-on-primary-container">{alert.record?.user?.name}</p>
                </div>
              ))}
              {alerts.length === 0 && <p className="text-sm font-medium text-on-primary-container/70">No pending alerts.</p>}
            </div>
            
            <Link to="/admin/alerts" className="w-full mt-6 block text-center py-4 bg-[#FAFAF9] text-primary rounded-xl font-bold font-display text-sm hover:scale-[1.02] transition-all relative z-10">
                View All Alerts
            </Link>
          </div>

          <div className="bg-surface-container-low p-8 rounded-lg transition-all hover:bg-surface-container-highest group">
            <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] mb-2 font-display">Late Arrivals</p>
            <h3 className="text-5xl font-black text-primary font-display tracking-tight">{summary?.lateCount ?? "-"}</h3>
            <div className="mt-6 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
               <div className="h-full bg-error" style={{ width: summary?.lateCount ? '25%' : '0%' }}></div>
            </div>
          </div>
          
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, icon, bgClass }: { title: string; value: any; icon: string; bgClass: string }) {
  return (
    <div className="bg-surface-container-low p-8 rounded-lg transition-all hover:bg-surface-container-highest group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 ${bgClass} text-white rounded-2xl shadow-lg`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] mb-2 font-display">{title}</p>
      <h3 className="text-5xl font-black text-primary font-display tracking-tight">{value}</h3>
      <div className="mt-6 flex gap-1">
        <div className={`h-2 flex-1 ${bgClass} rounded-full opacity-20`}></div>
        <div className={`h-2 flex-1 ${bgClass} rounded-full opacity-40`}></div>
        <div className={`h-2 flex-1 ${bgClass} rounded-full opacity-60`}></div>
        <div className={`h-2 flex-1 ${bgClass} rounded-full`}></div>
        <div className="h-2 flex-1 bg-surface-container-highest rounded-full"></div>
      </div>
    </div>
  );
}
