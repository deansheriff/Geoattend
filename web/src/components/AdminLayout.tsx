import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";
import { apiFetch, ROOT_URL } from "../api/client";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: "dashboard" },
  { label: "Employees", to: "/admin/employees", icon: "groups" },
  { label: "Locations", to: "/admin/locations", icon: "explore" },
  { label: "Assignments", to: "/admin/assignments", icon: "assignment" },
  { label: "Shifts", to: "/admin/shifts", icon: "schedule" },
  { label: "Reports", to: "/admin/reports", icon: "summarize" },
  { label: "Alerts", to: "/admin/alerts", icon: "notifications" },
  { label: "Settings", to: "/admin/settings", icon: "settings" }
];

export default function AdminLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [tenant, setTenant] = useState<{ name?: string; address?: string; logoPath?: string } | null>(null);

  useEffect(() => {
    apiFetch("/admin/settings")
      .then(setTenant)
      .catch(() => setTenant(null));
  }, []);

  const logoUrl = tenant?.logoPath ? `${ROOT_URL}/uploads/${tenant.logoPath}` : null;

  return (
    <div className="min-h-screen flex bg-background-light">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="size-10 rounded-lg object-cover border border-slate-200" />
          ) : (
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined">location_on</span>
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">{tenant?.name || "GeoAttend"}</h1>
            <p className="text-xs text-slate-500">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => logout()}
            className="w-full rounded-lg bg-slate-100 text-slate-700 py-2 text-sm font-semibold hover:bg-slate-200"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold leading-none">{user?.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">System Admin</p>
            </div>
            <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
          </div>
        </header>
        <div className="p-8 max-w-[1400px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
