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

export default function AdminShiftOverview() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    Promise.all([apiFetch("/admin/employees"), apiFetch("/admin/shifts")]).then(([emps, list]) => {
      setEmployees(emps);
      setShifts(list);
    });
  }, []);

  const byUser = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const shift of shifts) {
      if (!map[shift.userId]) map[shift.userId] = [];
      map[shift.userId].push(shift);
    }
    return map;
  }, [shifts]);

  const filteredEmployees = useMemo(() => {
    if (!filter.trim()) return employees;
    const q = filter.toLowerCase();
    return employees.filter((e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
  }, [employees, filter]);

  return (
    <AdminLayout title="Shift Overview">
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Team Schedule</h1>
          <p className="text-primary/60 text-lg">A unified view of all employee shifts across the organisation.</p>
        </div>
      </div>

      <div className="space-y-6 font-display min-h-[600px]">
        <div className="bg-surface-container-low rounded-full border border-black/5 p-3 px-6 shadow-sm flex items-center gap-4 max-w-2xl">
          <span className="material-symbols-outlined text-primary/50 text-[20px]">search</span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search employees by name or email..."
            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-bold text-primary placeholder-primary/30"
          />
        </div>

        <div className="space-y-6">
          {filteredEmployees.map((emp) => {
            const userShifts = byUser[emp.id] || [];
            return (
              <div key={emp.id} className="bg-surface-container-low rounded-[2rem] border border-black/5 p-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center font-bold text-xl uppercase text-primary/60">
                          {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-display text-primary tracking-tight">{emp.name}</h3>
                        <p className="text-xs font-semibold text-primary/50 mt-1">{emp.email}</p>
                      </div>
                  </div>
                  <span className="text-[10px] font-black text-[#3a6846] bg-[#3a6846]/10 px-4 py-2 rounded-full uppercase tracking-[0.15em] border border-[#3a6846]/20">
                      {userShifts.length} shifted days
                  </span>
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {dayLabels.map((label, idx) => {
                    const dayShift = userShifts.find((s) => s.dayOfWeek === idx);
                    return (
                      <div key={`${emp.id}-${label}`} className={`rounded-2xl border p-4 text-center flex flex-col justify-center min-h-[100px] transition-colors ${dayShift ? "bg-tertiary-container text-on-tertiary-container border-tertiary/20" : "bg-surface-container-highest border-transparent"}`}>
                        <div className={`text-[10px] font-black tracking-widest uppercase ${dayShift ? "text-primary transition-all" : "text-primary/30"}`}>{label}</div>
                        {dayShift ? (
                          <div className="mt-2 text-xs font-bold tracking-tight whitespace-nowrap">
                            {dayShift.startTime}<br/><span className="text-[9px] opacity-70 inline-block py-0.5">to</span><br/>{dayShift.endTime}
                          </div>
                        ) : (
                          <div className="mt-3 text-xs font-semibold text-primary/20 uppercase tracking-widest">Off</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredEmployees.length === 0 && (
            <div className="bg-surface-container-low rounded-[2rem] border border-black/5 p-20 text-center shadow-sm">
                <span className="material-symbols-outlined text-[48px] text-primary/20 mb-4 block">search_off</span>
                <div className="text-sm font-bold text-primary/50 uppercase tracking-widest">No employees found matching your search.</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
