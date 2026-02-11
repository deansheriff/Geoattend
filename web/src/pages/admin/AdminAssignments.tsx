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
    await apiFetch("/admin/assignments", {
      method: "POST",
      body: JSON.stringify({ userId, locationId })
    });
    loadAll().catch(() => setError("Failed to refresh assignments"));
  };

  const onRemove = async (id: string) => {
    setError(null);
    await apiFetch(`/admin/assignments/${id}`, { method: "DELETE" });
    loadAll().catch(() => setError("Failed to refresh assignments"));
  };

  return (
    <AdminLayout title="Assignments">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold">Create Assignment</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500">Employee</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.address})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={onAssign}
            className="w-full rounded-lg bg-primary text-white py-2 text-sm font-bold"
          >
            Assign
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold">Current Assignments</h3>
            <p className="text-sm text-slate-500">Employee to geofence mappings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold">
                      {a.user.name}
                      <div className="text-xs text-slate-500">{a.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {a.location.name}
                      <div className="text-xs text-slate-500">{a.location.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onRemove(a.id)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-sm text-slate-500">
                      No assignments yet.
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
