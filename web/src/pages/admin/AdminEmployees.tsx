import { useEffect, useRef, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  active: boolean;
  timezone: string;
};

type Toast = { message: string; type: "success" | "error" };

type DrawerMode = "add" | "edit" | "reset-password" | null;

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
];

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");
  const [timezone, setTimezone] = useState("UTC");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const loadEmployees = async () => {
    try {
      const data = await apiFetch("/admin/employees");
      setEmployees(data);
    } catch {
      showToast("Failed to load employees", "error");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openAdd = () => {
    setSelected(null);
    setName("");
    setEmail("");
    setRole("EMPLOYEE");
    setTimezone("UTC");
    setPassword("");
    setFormError(null);
    setDrawer("add");
  };

  const openEdit = (emp: Employee) => {
    setSelected(emp);
    setName(emp.name);
    setEmail(emp.email);
    setRole(emp.role);
    setTimezone(emp.timezone || "UTC");
    setPassword("");
    setFormError(null);
    setDrawer("edit");
  };

  const openResetPassword = (emp: Employee) => {
    setSelected(emp);
    setNewPassword("");
    setFormError(null);
    setDrawer("reset-password");
  };

  const closeDrawer = () => {
    setDrawer(null);
    setSelected(null);
    setFormError(null);
  };

  const onCreateEmployee = async () => {
    setFormError(null);
    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required");
      return;
    }
    if (password && password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/admin/employees", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          timezone,
          password: password || undefined,
        }),
      });
      showToast(`${name} has been created successfully`, "success");
      closeDrawer();
      loadEmployees();
    } catch (err: any) {
      setFormError(err.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const onUpdateEmployee = async () => {
    if (!selected) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/admin/employees/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), role, timezone }),
      });
      showToast("Employee updated successfully", "success");
      closeDrawer();
      loadEmployees();
    } catch (err: any) {
      setFormError(err.message || "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!selected) return;
    setFormError(null);
    if (!newPassword || newPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/admin/employees/${selected.id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword }),
      });
      showToast(`Password for ${selected.name} has been reset`, "success");
      closeDrawer();
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const onToggleActive = async (emp: Employee) => {
    const action = emp.active ? "deactivate" : "activate";
    try {
      await apiFetch(`/admin/employees/${emp.id}/${action}`, { method: "PATCH" });
      showToast(
        emp.active ? `${emp.name} has been deactivated` : `${emp.name} has been reactivated`,
        "success"
      );
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || "Action failed", "error");
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await apiFetch(`/admin/employees/${deleteTarget.id}`, { method: "DELETE" });
      showToast(`${deleteTarget.name} has been deleted`, "success");
      setDeleteTarget(null);
      loadEmployees();
    } catch (err: any) {
      showToast(err.message || "Failed to delete employee", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = showInactive ? employees : employees.filter((e) => e.active);

  return (
    <AdminLayout title="Employees">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
              <h3 className="text-lg font-bold">Delete Employee</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold">{deleteTarget.name}</span>? Their account will be
              deactivated and all active sessions revoked. Attendance records are preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmDelete}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-40 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-bold">
                {drawer === "add"
                  ? "Add Employee"
                  : drawer === "reset-password"
                  ? `Reset Password — ${selected?.name}`
                  : `Edit — ${selected?.name}`}
              </h3>
              <button
                onClick={closeDrawer}
                className="text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex-1 space-y-4">
              {drawer === "reset-password" ? (
                <>
                  <p className="text-sm text-slate-500">
                    Set a new password for <span className="font-semibold">{selected?.name}</span>.
                    Their active sessions will be logged out immediately.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={drawer === "edit"}
                      placeholder="jane@company.com"
                      type="email"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    {drawer === "edit" && (
                      <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "ADMIN" | "EMPLOYEE")}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {drawer === "add" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Temporary Password
                        <span className="ml-1 font-normal text-slate-400">(optional — defaults to Employee123!)</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                </>
              )}

              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                  {formError}
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-slate-200">
              <button
                disabled={loading}
                onClick={
                  drawer === "add"
                    ? onCreateEmployee
                    : drawer === "reset-password"
                    ? onResetPassword
                    : onUpdateEmployee
                }
                className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {loading
                  ? "Saving…"
                  : drawer === "add"
                  ? "Create Employee"
                  : drawer === "reset-password"
                  ? "Reset Password"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Employee Directory</h3>
            <p className="text-sm text-slate-500">
              {filtered.length} {showInactive ? "total" : "active"} user
              {filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              Show inactive
            </label>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timezone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No employees found
                  </td>
                </tr>
              )}
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className={`hover:bg-slate-50 transition ${!emp.active ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        emp.role === "ADMIN"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{emp.timezone || "UTC"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        emp.active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {emp.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => openEdit(emp)}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openResetPassword(emp)}
                        className="text-xs font-bold text-slate-500 hover:underline"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => onToggleActive(emp)}
                        className={`text-xs font-bold hover:underline ${
                          emp.active ? "text-amber-600" : "text-green-600"
                        }`}
                      >
                        {emp.active ? "Deactivate" : "Reactivate"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(emp)}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
