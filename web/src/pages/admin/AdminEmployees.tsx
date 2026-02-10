import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/admin/employees").then(setEmployees);
    apiFetch("/admin/locations").then(setLocations);
  }, []);

  return (
    <AdminLayout title="Employees">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Employee Directory</h3>
              <p className="text-sm text-slate-500">Manage accounts and assignments</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add Employee
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
    </AdminLayout>
  );
}