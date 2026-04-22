import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

type User = { id: string; name: string; email: string };
type Location = { id: string; name: string; address: string };
type Assignment = {
  id: string;
  user: User;
  location: Location;
};

export default function AdminAssignments() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userId, setUserId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    const [emps, locs, assigns] = await Promise.all([
      apiFetch("/admin/employees"),
      apiFetch("/admin/locations"),
      apiFetch("/admin/assignments")
    ]);
    setEmployees(emps);
    setLocations(locs);
    setAssignments(assigns);
    if (!userId && emps.length) setUserId(emps[0].id);
    if (!locationId && locs.length) setLocationId(locs[0].id);
  };

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load assignments"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const existingPairs = useMemo(
    () => new Set(assignments.map((a) => `${a.user.id}:${a.location.id}`)),
    [assignments]
  );

  const onAssign = async () => {
    setError(null);
    if (!userId || !locationId) return;
    const key = `${userId}:${locationId}`;
    if (existingPairs.has(key)) {
      setError("Assignment already exists");
      return;
    }
    try {
      await apiFetch("/admin/assignments", {
        method: "POST",
        body: JSON.stringify({ userId, locationId })
      });
      loadAll().catch(() => setError("Failed to refresh assignments"));
    } catch {
      setError("Failed to create assignment");
    }
  };

  const onRemove = async (id: string) => {
    setError(null);
    try {
      await apiFetch(`/admin/assignments/${id}`, { method: "DELETE" });
      loadAll().catch(() => setError("Failed to refresh assignments"));
    } catch {
       setError("Failed to remove assignment");
    }
  };

  return (
    <AdminLayout title="Assignments">
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Location Assignments</h1>
          <p className="text-primary/60 text-lg">Define where employees are authorised to clock in and out.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Assignment Form */}
        <div className="lg:col-span-1 bg-surface-container-low p-8 rounded-[2rem] flex flex-col items-start justify-start shadow-sm border border-black/5">
          <h3 className="text-xl font-bold font-display text-primary tracking-tight mb-6">Create Assignment</h3>
          <div className="w-full space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Select Employee</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all appearance-none cursor-pointer"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Assign Location</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all appearance-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.address})
                  </option>
                ))}
              </select>
            </div>
            
            {error && (
              <div className="text-sm font-bold text-error bg-error-container p-4 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span> {error}
              </div>
            )}
            
            <button
              onClick={onAssign}
              className="w-full mt-4 flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[#E69D45] shadow-xl shadow-[#E69D45]/20 hover:scale-[1.02] active:scale-95 transition-all py-4 uppercase text-xs tracking-widest"
            >
              <span className="material-symbols-outlined text-[18px]">link</span>
              Assign Employee
            </button>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-[2rem] shadow-sm transform-gpu overflow-hidden border border-black/5 flex flex-col">
          <div className="p-8 border-b border-primary/5">
            <h3 className="text-xl font-bold font-display text-primary tracking-tight">Active Assignments</h3>
          </div>
          
          <div className="overflow-x-auto flex-1 h-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/5 text-primary/50 text-[10px] uppercase tracking-[0.15em] font-black font-display">
                  <th className="px-8 py-5">Employee</th>
                  <th className="px-8 py-5">Assigned Location</th>
                  <th className="px-8 py-5 border-l border-primary/5 text-right w-[100px]">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5 bg-surface-container-low">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-variant transition-colors group cursor-default">
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-primary tracking-tight font-display">{a.user.name}</div>
                      <div className="text-xs font-semibold text-primary/50 mt-0.5">{a.user.email}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px]">map</span>
                        </div>
                        <div>
                           <div className="text-sm font-bold text-primary tracking-tight font-display">{a.location.name}</div>
                           <div className="text-[11px] font-semibold text-primary/50 mt-0.5 truncate max-w-[200px]">{a.location.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 border-l border-primary/5 text-right">
                       <button
                         onClick={() => onRemove(a.id)}
                         className="p-2.5 rounded-full text-primary/30 hover:bg-error-container hover:text-error transition-all"
                         title="Revoke Assignment"
                       >
                         <span className="material-symbols-outlined text-[18px]">close</span>
                       </button>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-xs uppercase tracking-widest font-bold text-primary/30 text-center">
                      No assignments configured. Link an employee to a location.
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
