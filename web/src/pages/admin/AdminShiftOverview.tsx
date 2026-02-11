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
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search employees by name or email"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-4">
          {filteredEmployees.map((emp) => {
            const userShifts = byUser[emp.id] || [];
            return (
              <div key={emp.id} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{emp.name}</h3>
                    <p className="text-xs text-slate-500">{emp.email}</p>
                  </div>
                  <span className="text-xs text-slate-500">{userShifts.length} shifts</span>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {dayLabels.map((label, idx) => {
                    const dayShift = userShifts.find((s) => s.dayOfWeek === idx);
                    return (
                      <div key={`${emp.id}-${label}`} className="rounded-lg border border-slate-200 p-3 text-center">
                        <div className="text-xs font-bold text-slate-500">{label}</div>
                        {dayShift ? (
                          <div className="mt-2 text-xs font-semibold">
                            {dayShift.startTime} - {dayShift.endTime}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-400">Off</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredEmployees.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
              No employees found.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
