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
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Asia/Dubai", "Asia/Karachi",
  "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
  "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg",
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
    setSelected(null); setName(""); setEmail(""); setRole("EMPLOYEE");
    setTimezone("UTC"); setPassword(""); setFormError(null); setDrawer("add");
  };

  const openEdit = (emp: Employee) => {
    setSelected(emp); setName(emp.name); setEmail(emp.email);
    setRole(emp.role); setTimezone(emp.timezone || "UTC");
    setPassword(""); setFormError(null); setDrawer("edit");
  };

  const openResetPassword = (emp: Employee) => {
    setSelected(emp); setNewPassword(""); setFormError(null); setDrawer("reset-password");
  };

  const closeDrawer = () => {
    setDrawer(null); setSelected(null); setFormError(null);
  };

  const onCreateEmployee = async () => {
    setFormError(null);
    if (!name.trim() || !email.trim()) { setFormError("Name and email are required"); return; }
    if (password && password.length < 8) { setFormError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await apiFetch("/admin/employees", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role, timezone, password: password || undefined }),
      });
      showToast(`${name} created successfully`, "success");
      closeDrawer(); loadEmployees();
    } catch (err: any) { setFormError(err.message || "Failed to create employee"); } finally { setLoading(false); }
  };

  const onUpdateEmployee = async () => {
    if (!selected) return;
    setFormError(null);
    if (!name.trim()) { setFormError("Name is required"); return; }
    setLoading(true);
    try {
      await apiFetch(`/admin/employees/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), role, timezone }),
      });
      showToast("Employee updated successfully", "success");
      closeDrawer(); loadEmployees();
    } catch (err: any) { setFormError(err.message || "Failed to update employee"); } finally { setLoading(false); }
  };

  const onResetPassword = async () => {
    if (!selected) return;
    setFormError(null);
    if (!newPassword || newPassword.length < 8) { setFormError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await apiFetch(`/admin/employees/${selected.id}/reset-password`, { method: "PATCH", body: JSON.stringify({ password: newPassword }) });
      showToast(`Password for ${selected.name} has been reset`, "success");
      closeDrawer();
    } catch (err: any) { setFormError(err.message || "Failed to reset password"); } finally { setLoading(false); }
  };

  const onToggleActive = async (emp: Employee) => {
    const action = emp.active ? "deactivate" : "activate";
    try {
      await apiFetch(`/admin/employees/${emp.id}/${action}`, { method: "PATCH" });
      showToast(emp.active ? `${emp.name} deactivated` : `${emp.name} reactivated`, "success");
      loadEmployees();
    } catch (err: any) { showToast(err.message || "Action failed", "error"); }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await apiFetch(`/admin/employees/${deleteTarget.id}`, { method: "DELETE" });
      showToast(`${deleteTarget.name} has been deleted`, "success");
      setDeleteTarget(null); loadEmployees();
    } catch (err: any) { showToast(err.message || "Failed to delete employee", "error"); } finally { setLoading(false); }
  };

  const filtered = showInactive ? employees : employees.filter((e) => e.active);

  return (
    <AdminLayout title="Employees">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-elevated text-white text-sm font-bold transition-all ${toast.type === "success" ? "bg-secondary" : "bg-error"}`}>
          <span className="material-symbols-outlined text-base">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-[2rem] shadow-xl w-full max-w-sm p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-2xl bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-black font-display text-primary tracking-tight">Delete Employee</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-8 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-primary">{deleteTarget.name}</span>? 
              Their account will be deactivated and all active sessions revoked. Attendance records are preserved.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-full bg-surface-container-low font-bold text-primary/70 hover:bg-surface-container-highest transition-colors">
                Cancel
              </button>
              <button onClick={onConfirmDelete} disabled={loading} className="flex-[2] py-3 rounded-full bg-error text-white font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                {loading ? "Deleting…" : "Delete Employee"}
              </button>
            </div>
          </div>
        </div>
      )}

      {drawer && (
        <>
          <div className="fixed inset-0 z-40 bg-primary/20 backdrop-blur-sm transition-opacity" onClick={closeDrawer}></div>
          <aside className="fixed right-0 top-0 h-full z-50 bg-surface w-[450px] rounded-l-[3rem] shadow-[40px_8px_40px_rgba(74,53,37,0.1)] p-10 flex flex-col font-['Epilogue'] transition-transform">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-3xl font-black text-primary tracking-tighter leading-tight">
                  {drawer === "add" ? "New Employee" : drawer === "reset-password" ? "Reset Password" : "Edit Employee"}
                </h2>
                <p className="text-primary/50 text-sm mt-1">
                  {drawer === "reset-password" ? `Set new credentials for ${selected?.name}` : "Manage individual records and permissions"}
                </p>
              </div>
              <button onClick={closeDrawer} className="w-12 h-12 flex items-center justify-center bg-surface-container-low rounded-full hover:bg-surface-container-highest transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pr-4 font-body">
              {formError && (
                <div className="flex items-start gap-3 bg-error-container text-error rounded-xl px-4 py-3 text-sm font-bold">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {formError}
                </div>
              )}

              {drawer === "reset-password" ? (
                 <section>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-black text-primary/40 mb-6 flex items-center gap-2">
                       <span className="w-6 h-[1px] bg-primary/10"></span>
                       Security
                    </h3>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-primary/50 ml-4">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all" />
                    </div>
                 </section>
              ) : (
                <>
                  <section>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-black text-primary/40 mb-6 flex items-center gap-2">
                      <span className="w-6 h-[1px] bg-primary/10"></span> Personal Info
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-primary/50 ml-4">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-primary/50 ml-4">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={drawer === "edit"} className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all disabled:opacity-50" />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-black text-primary/40 mb-6 flex items-center gap-2">
                      <span className="w-6 h-[1px] bg-primary/10"></span> Work & Role
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-primary/50 ml-4">Access Level</label>
                          <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "EMPLOYEE")} className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all appearance-none cursor-pointer">
                            <option value="ADMIN">Administrator</option>
                            <option value="EMPLOYEE">Employee</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-primary/50 ml-4">Timezone</label>
                          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all appearance-none cursor-pointer">
                            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </section>

                  {drawer === "add" && (
                    <section>
                       <h3 className="text-xs uppercase tracking-[0.2em] font-black text-primary/40 mb-6 flex items-center gap-2">
                         <span className="w-6 h-[1px] bg-primary/10"></span> Security
                       </h3>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-primary/50 ml-4">Temporary Password</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all" />
                       </div>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-primary/5 grid grid-cols-2 gap-4">
              <button onClick={closeDrawer} className="px-8 py-5 rounded-full font-bold text-primary/60 bg-surface-container-low hover:bg-surface-container-highest transition-all">
                Cancel
              </button>
              <button onClick={drawer === "add" ? onCreateEmployee : drawer === "reset-password" ? onResetPassword : onUpdateEmployee} disabled={loading} className="px-8 py-5 rounded-full font-bold text-white bg-[#E69D45] shadow-xl shadow-[#E69D45]/20 hover:scale-[1.02] active:scale-95 transition-all">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Title */}
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Employee Directory</h1>
          <p className="text-primary/60 text-lg">Manage your team of professionals and define system access.</p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full text-xs font-bold text-primary/60 cursor-pointer select-none border border-transparent hover:border-outline-variant transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="hidden" />
            {showInactive ? "Viewing All" : "Viewing Active"}
          </label>
          <button onClick={openAdd} className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all active:scale-95">
             <span className="material-symbols-outlined text-sm">add</span>
             Add New
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/5 text-primary/50 text-[11px] uppercase tracking-[0.15em] font-black font-display">
                <th className="px-10 py-6">Employee</th>
                <th className="px-6 py-6">System Role</th>
                <th className="px-6 py-6">Timezone</th>
                <th className="px-6 py-6 border-l border-primary/5">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filtered.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-10 py-20 text-center text-primary/40 font-bold uppercase tracking-widest text-sm">
                      No employees match criteria.
                   </td>
                 </tr>
              )}
              {filtered.map((emp) => (
                <tr key={emp.id} className={`group transition-colors ${!emp.active ? "bg-surface-variant/50 hover:bg-surface-variant" : "hover:bg-surface"} cursor-default`}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-display font-black text-lg flex items-center justify-center shrink-0 border border-primary/5">
                         {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold font-display text-primary text-base">{emp.name}</p>
                        <p className="text-xs text-primary/40 font-bold">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-sm font-bold text-primary/70">{emp.role}</td>
                  <td className="px-6 py-6 text-sm text-primary/60 font-medium">
                     <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] opacity-50">schedule</span>
                        {emp.timezone || "UTC"}
                     </div>
                  </td>
                  <td className="px-6 py-6 border-l border-primary/5">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${emp.active ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-highest text-primary/40"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.active ? "bg-secondary" : "bg-primary/20"}`}></span>
                        {emp.active ? "Active" : "Inactive"}
                     </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onToggleActive(emp)} title={emp.active ? "Deactivate" : "Activate"} className="p-2 hover:bg-surface-container-highest rounded-full transition-all text-primary/40 hover:text-primary">
                         <span className="material-symbols-outlined">{emp.active ? "block" : "check_circle"}</span>
                      </button>
                      <button onClick={() => openResetPassword(emp)} title="Reset Password" className="p-2 hover:bg-surface-container-highest rounded-full transition-all text-primary/40 hover:text-primary">
                         <span className="material-symbols-outlined">key</span>
                      </button>
                      <button onClick={() => openEdit(emp)} title="Edit Employee" className="p-2 hover:bg-surface-container-highest rounded-full transition-all text-primary/40 hover:text-primary">
                         <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button onClick={() => setDeleteTarget(emp)} title="Delete Employee" className="p-2 hover:bg-error-container rounded-full transition-all text-primary/40 hover:text-error">
                         <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-10 py-6 flex justify-between items-center text-primary/40 font-bold text-xs uppercase tracking-widest bg-primary/5">
            <span>Showing {filtered.length} of {employees.length} total users</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
