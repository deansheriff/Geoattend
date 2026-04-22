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

export default function AdminShifts() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [form, setForm] = useState({
    userId: "",
    days: [1, 2, 3, 4, 5] as number[],
    startTime: "09:00",
    endTime: "17:00",
    timezone: "UTC",
    overwrite: true
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const loadAll = async () => {
    const [emps, list] = await Promise.all([apiFetch("/admin/employees"), apiFetch("/admin/shifts")]);
    setEmployees(emps);
    setShifts(list);
    if (!form.userId && emps.length) {
      setForm((prev) => ({ ...prev, userId: emps[0].id }));
      setSelectedUserId(emps[0].id);
    }
  };

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load shifts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    setError(null);
    setNotice(null);
    if (!form.userId) {
      setError("Select an employee");
      return;
    }
    if (form.days.length === 0) {
      setError("Select at least one day");
      return;
    }
    try {
      await apiFetch("/admin/shifts/bulk", {
        method: "POST",
        body: JSON.stringify({
          userId: form.userId,
          days: form.days,
          startTime: form.startTime,
          endTime: form.endTime,
          timezone: form.timezone,
          overwrite: form.overwrite
        })
      });
      persistLastWeek(form.userId, form);
      loadAll().catch(() => setError("Failed to refresh shifts"));
      setNotice("Weekly shift added.");
    } catch (err: any) {
      setError(err.message || "Failed to add shifts");
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    await apiFetch(`/admin/shifts/${id}`, { method: "DELETE" });
    loadAll().catch(() => setError("Failed to refresh shifts"));
  };

  const selectedUser = employees.find((e) => e.id === selectedUserId);
  const userShifts = useMemo(
    () => shifts.filter((s) => s.userId === selectedUserId),
    [shifts, selectedUserId]
  );
  const shiftByDay = useMemo(() => {
    const map: Record<number, Shift | undefined> = {};
    for (const shift of userShifts) map[shift.dayOfWeek] = shift;
    return map;
  }, [userShifts]);

  const toggleDay = (day: number) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      return { ...prev, days: exists ? prev.days.filter((d) => d !== day) : [...prev.days, day].sort() };
    });
  };

  const onRepeatLastWeek = () => {
    const stored = loadLastWeek(form.userId);
    if (!stored) {
      setError("No saved schedule for this employee yet");
      return;
    }
    setForm((prev) => ({
      ...prev,
      days: stored.days,
      startTime: stored.startTime,
      endTime: stored.endTime,
      timezone: stored.timezone,
      overwrite: true
    }));
  };

  return (
    <AdminLayout title="Shifts">
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Shift Configuration</h1>
          <p className="text-primary/60 text-lg">Define standard weekly hours and individual shift entries for employees.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8 font-display h-[calc(100vh-200px)] min-h-[600px]">
        {/* Left Side: Employee List */}
        <div className="bg-surface-container-low rounded-[2rem] border border-black/5 shadow-sm p-6 flex flex-col overflow-hidden">
          <div className="mb-6 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary/50 text-center">Select Employee</h3>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto px-2">
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => {
                  setSelectedUserId(emp.id);
                  setForm((prev) => ({ ...prev, userId: emp.id }));
                }}
                className={`w-full text-left rounded-2xl px-5 py-4 transition-all group border ${
                  selectedUserId === emp.id 
                  ? "bg-secondary-container text-on-secondary-container border-secondary/10 ring-1 ring-secondary/20 shadow-sm" 
                  : "bg-surface hover:bg-surface-container-highest border-black/5 text-primary"
                }`}
              >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedUserId === emp.id ? "bg-white/20" : "bg-black/5"} uppercase`}>
                        {emp.name.charAt(0)}
                    </div>
                    <div>
                        <div className={`text-sm font-bold tracking-tight ${selectedUserId === emp.id ? "text-secondary font-black" : "font-semibold"}`}>{emp.name}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 truncate max-w-[160px] ${selectedUserId === emp.id ? "opacity-80" : "opacity-50"}`}>
                        {emp.email}
                        </div>
                    </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-8 flex flex-col overflow-y-auto pr-1">
          
          {/* Weekly Overview */}
          <div className="bg-surface-container-low rounded-[2rem] border border-black/5 p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-primary/5 pb-6">
              <div>
                <h3 className="text-xl font-bold font-display text-primary tracking-tight">Active Schedule</h3>
                <p className="text-xs font-semibold text-primary/50 uppercase tracking-widest mt-1">
                  {selectedUser ? `${selectedUser.name}` : "Please select an employee"}
                </p>
              </div>
              <button onClick={onRepeatLastWeek} className="text-xs font-bold text-accent px-4 py-2 rounded-full hover:bg-accent/10 transition-all uppercase tracking-widest flex items-center gap-2 border border-accent/20">
                <span className="material-symbols-outlined text-[16px]">history</span>
                Clone Last Week
              </button>
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {dayLabels.map((label, idx) => (
                <div key={label} className={`rounded-xl border p-4 text-center transition-colors flex flex-col justify-center min-h-[90px] ${shiftByDay[idx] ? "bg-tertiary-container text-on-tertiary-container border-tertiary/20" : "bg-surface-container-highest border-transparent"}`}>
                  <div className={`text-[10px] font-black tracking-widest uppercase ${shiftByDay[idx] ? "" : "text-primary/30"}`}>{label}</div>
                  {shiftByDay[idx] ? (
                    <div className="mt-2 text-xs font-bold tracking-tight whitespace-nowrap">
                      {shiftByDay[idx]?.startTime}<br/><span className="text-[9px] opacity-70 inline-block">to</span><br/>{shiftByDay[idx]?.endTime}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs font-semibold text-primary/20 uppercase tracking-widest">Off</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Shift */}
          <div className="bg-surface-container-low rounded-[2rem] border border-black/5 p-8 shadow-sm flex flex-col gap-6">
            <div className="border-b border-primary/5 pb-4">
              <h3 className="text-xl font-bold font-display text-primary tracking-tight">Apply Shifts</h3>
            </div>
            
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4 mb-2 inline-block">Select Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayLabels.map((label, idx) => {
                    const active = form.days.includes(idx);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleDay(idx)}
                        className={`flex-1 min-w-[60px] py-3 text-xs rounded-xl font-bold uppercase tracking-widest transition-all ${
                          active ? "bg-[#3a6846] text-white shadow-xl shadow-[#3a6846]/20 transform scale-[1.02]" : "bg-surface-container-highest text-primary/40 hover:bg-[#3a6846]/10 hover:text-[#3a6846]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all cursor-pointer"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Timezone</label>
                <input
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all placeholder-primary/20"
                  placeholder="UTC"
                />
              </div>
            </div>

            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 xl:gap-0 mt-4 border-t border-primary/5 pt-6">
               <label className="flex items-center gap-3 text-xs font-bold text-primary cursor-pointer select-none ml-4">
                 <input
                   type="checkbox"
                   checked={form.overwrite}
                   onChange={(e) => setForm({ ...form, overwrite: e.target.checked })}
                   className="rounded border-primary/20 text-[#E69D45] focus:ring-[#E69D45] size-4"
                 />
                 <span className="uppercase tracking-widest text-primary/60">Overwrite existing</span>
               </label>
               <div className="flex items-center gap-4 w-full xl:w-auto">
                  {error && <div className="text-xs font-bold text-error bg-error-container px-4 py-2.5 rounded-xl">{error}</div>}
                  {notice && <div className="text-xs font-bold text-white bg-[#3a6846] px-4 py-2.5 rounded-xl shadow-lg">{notice}</div>}
                  <button onClick={onCreate} className="flex-1 xl:flex-none px-8 py-4 rounded-full bg-[#E69D45] text-white text-xs tracking-widest uppercase font-bold shadow-xl shadow-[#E69D45]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Apply Shifts
                  </button>
               </div>
            </div>
          </div>

          {/* List of individual entries */}
          <div className="bg-surface-container-low rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-primary/5">
              <h3 className="text-xl font-bold font-display text-primary tracking-tight">Shift Entries</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary/5 text-primary/50 text-[10px] uppercase tracking-[0.15em] font-black font-display">
                    <th className="px-8 py-5">Day</th>
                    <th className="px-8 py-5">Hours</th>
                    <th className="px-8 py-5 border-l border-primary/5 text-right w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5 bg-surface-container-low">
                  {userShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-surface-variant transition-colors group">
                      <td className="px-8 py-5 text-sm font-black text-primary tracking-tight font-display">{dayLabels[shift.dayOfWeek]}</td>
                      <td className="px-8 py-5 text-sm font-semibold text-primary">
                        {shift.startTime} <span className="opacity-40 px-2">to</span> {shift.endTime} <span className="text-[10px] bg-black/5 rounded-full px-2 py-1 ml-3 uppercase tracking-widest opacity-80">{shift.timezone}</span>
                      </td>
                      <td className="px-8 py-5 border-l border-primary/5 text-right">
                         <button
                            onClick={() => onDelete(shift.id)}
                            className="p-2.5 rounded-full text-primary/30 hover:bg-error-container hover:text-error transition-all"
                            title="Remove Shift"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                      </td>
                    </tr>
                  ))}
                  {userShifts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-16 text-xs uppercase tracking-widest font-bold text-primary/30 text-center">
                        No configured shifts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function persistLastWeek(userId: string, form: { days: number[]; startTime: string; endTime: string; timezone: string }) {
  const key = `geoattend:lastweek:${userId}`;
  localStorage.setItem(key, JSON.stringify(form));
}

function loadLastWeek(userId: string) {
  const key = `geoattend:lastweek:${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { days: number[]; startTime: string; endTime: string; timezone: string };
  } catch {
    return null;
  }
}
