import { useEffect, useState } from "react";
import EmployeeLayout from "../../components/EmployeeLayout";
import { apiFetch, API_BASE } from "../../api/client";

export default function EmployeeHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const data = await apiFetch(`/employee/attendance?${params.toString()}`);
    setRecords(data);
  };

  useEffect(() => {
    load().catch(() => setRecords([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onExport = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = `${API_BASE}/employee/export?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <EmployeeLayout title="Attendance History">
      <div className="md:mb-10 mb-6 mt-2 hidden md:block">
        <h1 className="text-4xl md:text-5xl font-black font-display text-primary tracking-tighter mb-2">Timesheet</h1>
        <p className="text-primary/60 text-lg">Your attendance logs and past shifts.</p>
      </div>

      <div className="bg-surface-container-low rounded-[2.5rem] shadow-sm border border-black/5 overflow-hidden flex flex-col font-display">
        <div className="p-6 md:p-8 border-b border-primary/5 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-surface-container-low relative z-10 w-full">
          <div className="xl:hidden">
            <h3 className="text-2xl font-black font-display text-primary tracking-tight">Timesheet</h3>
            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">Attendance logs</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto overflow-hidden flex-nowrap">
            <div className="flex items-center gap-2 w-full md:w-auto bg-surface-container-highest p-1.5 rounded-full border border-black/5 flex-nowrap flex-shrink min-w-0">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs md:text-sm font-bold text-primary w-full min-w-0 px-2 flex-1 cursor-pointer"
              />
              <span className="text-primary/30 material-symbols-outlined text-sm flex-shrink-0">arrow_forward</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs md:text-sm font-bold text-primary w-full min-w-0 px-2 flex-1 cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                <button
                  onClick={() => load().catch(() => setRecords([]))}
                  className="flex-1 md:flex-none bg-primary text-on-primary px-6 h-[46px] rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
                >
                  Filter
                </button>
                <button
                  onClick={onExport}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface border border-black/10 px-6 h-[46px] rounded-full text-xs font-black uppercase tracking-widest text-primary hover:bg-black/5 transition-all shadow-sm whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export
                </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-primary/5 bg-surface-container-lowest">
          {records.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center">
                 <span className="material-symbols-outlined text-[48px] text-primary/20 mb-4 block">history</span>
                 <span className="text-primary/40 text-sm font-bold uppercase tracking-widest">No records found</span>
             </div>
          ) : (
            records.map((rec) => (
              <div key={rec.id} className="p-6 bg-surface-container-low transition-colors hover:bg-surface-variant">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Date</div>
                    <div className="font-bold text-primary text-base">
                        <div className="bg-black/5 px-2 py-1 rounded-lg inline-block text-sm">
                             {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Duration</div>
                    <div className="font-black text-secondary text-sm bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-lg inline-block">
                      {rec.totalMinutes ? `${Math.floor(rec.totalMinutes / 60)}h ${rec.totalMinutes % 60}m` : "--"}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-surface-container-highest p-4 rounded-[1.5rem] mb-4">
                  <div>
                    <div className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-1 mt-0.5"><span className="text-[#3a6846] mr-1 shadow-sm">●</span>Clock In</div>
                    <div className="font-bold text-primary text-base">{new Date(rec.clockInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div className="pl-4 border-l border-primary/5">
                    <div className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-1 mt-0.5"><span className="text-error mr-1 shadow-sm">●</span>Clock Out</div>
                    <div className="font-bold text-primary text-base">
                      {rec.clockOutAt ? new Date(rec.clockOutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : <span className="opacity-40">--</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-[11px] font-semibold text-primary/60 px-2">
                  <span className="material-symbols-outlined text-[16px] text-primary/40">location_on</span>
                  {rec.location?.name ?? "Unknown location"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto bg-surface-container-low flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 text-primary/50 text-[10px] uppercase tracking-[0.15em] font-black font-display">
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Clock-In</th>
                <th className="px-8 py-5">Clock-Out</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5 text-right w-[120px] border-l border-primary/5">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 bg-surface-container-low">
              {records.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-8 py-32 text-center flex-col items-center">
                        <span className="material-symbols-outlined text-[64px] text-primary/10 block mb-4">history</span>
                        <div className="text-[11px] font-black text-primary/40 uppercase tracking-widest">No records found.</div>
                    </td>
                </tr>
              )}
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-surface-variant transition-colors group cursor-default">
                  <td className="px-8 py-5">
                    <div className="bg-black/5 px-2 py-1 rounded-md inline-block text-sm font-semibold text-primary">
                        {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-[#3a6846]">
                    {new Date(rec.clockInAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-error">
                    {rec.clockOutAt ? new Date(rec.clockOutAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : <span className="opacity-40">--</span>}
                  </td>
                  <td className="px-8 py-5 text-sm font-semibold text-primary/60 flex items-center gap-1.5 min-h-[64px]">
                    <span className="material-symbols-outlined text-[18px] text-primary/30 group-hover:text-primary/50 transition-colors">location_on</span>
                    {rec.location?.name ?? "Unknown"}
                  </td>
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
            </tbody>
          </table>
        </div>
      </div>
    </EmployeeLayout>
  );
}
