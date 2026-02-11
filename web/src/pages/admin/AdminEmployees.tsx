import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "EMPLOYEE",
    timezone: "UTC",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    const [emps, locs] = await Promise.all([apiFetch("/admin/employees"), apiFetch("/admin/locations")]);
    setEmployees(emps);
    setLocations(locs);
  };

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load employees"));
  }, []);

  const resetForm = () =>
    setForm({ id: "", name: "", email: "", role: "EMPLOYEE", timezone: "UTC", password: "" });

  const onSubmit = async () => {
    setError(null);
    if (!form.name || !form.email) {
      setError("Name and email are required");
      return;
    }
    if (form.id) {
      await apiFetch(`/admin/employees/${form.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          timezone: form.timezone,
          role: form.role
        })
      });
    } else {
      await apiFetch("/admin/employees", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          timezone: form.timezone,
          password: form.password || undefined
        })
      });
    }
    resetForm();
    loadAll().catch(() => setError("Failed to refresh employees"));
  };

  const onDeactivate = async (id: string) => {
    setError(null);
    await apiFetch(`/admin/employees/${id}/deactivate`, { method: "PATCH" });
    loadAll().catch(() => setError("Failed to refresh employees"));
  };

  return (
    <AdminLayout title="Employees">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Employee Directory</h3>
              <p className="text-sm text-slate-500">Manage accounts and assignments</p>
            </div>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              New Employee
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-sm">{emp.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{emp.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          emp.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {emp.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() =>
                          setForm({
                            id: emp.id,
                            name: emp.name,
                            email: emp.email,
                            role: emp.role,
                            timezone: emp.timezone || "UTC",
                            password: ""
                          })
                        }
                        className="text-xs font-bold text-primary hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeactivate(emp.id)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-bold mb-3">{form.id ? "Edit Employee" : "Add Employee"}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Email</label>
              <input
                value={form.email}
                disabled={!!form.id}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Timezone</label>
              <input
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {!form.id && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Temporary Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={onSubmit} className="w-full rounded-lg bg-primary text-white py-2 text-sm font-bold">
              {form.id ? "Save Changes" : "Create Employee"}
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">Locations</h3>
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="font-semibold text-sm">{loc.name}</div>
                  <div className="text-xs text-slate-500">{loc.address}</div>
                  <div className="text-xs text-slate-500">Radius: {loc.radiusMeters}m</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
