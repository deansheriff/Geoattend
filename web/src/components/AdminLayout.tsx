import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";
import { apiFetch, ROOT_URL } from "../api/client";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: "dashboard" },
  { label: "Employees", to: "/admin/employees", icon: "group" },
  { label: "Locations", to: "/admin/locations", icon: "explore" },
  { label: "Assignments", to: "/admin/assignments", icon: "assignment" },
  { label: "Shifts", to: "/admin/shifts", icon: "schedule" },
  { label: "Shift Overview", to: "/admin/shifts/overview", icon: "calendar_month" },
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
    <div className="bg-surface text-on-surface overflow-hidden min-h-screen">
      {/* SideNavBar Shell */}
      <aside className="fixed left-0 top-0 h-full z-40 bg-primary w-72 flex flex-col py-8 font-['Epilogue'] tracking-tight shadow-[40px_8px_40px_rgba(74,53,37,0.06)]">
        <div className="text-2xl font-bold text-[#f9f9f8] mb-8 px-8 flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Company logo" className="size-8 rounded-lg object-cover" />
          ) : (
            <span className="material-symbols-outlined text-[28px]">apartment</span>
          )}
          <div>
            {tenant?.name || "The Estate"}
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-medium mt-1">Management Portal</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`transition-colors px-8 py-4 flex items-center gap-4 mx-2 rounded-full ${
                  active 
                    ? "text-[#f9f9f8] bg-[#322011] font-semibold" 
                    : "text-[#f9f9f8]/70 hover:text-[#f9f9f8] hover:bg-[#322011]/50"
                }`}
              >
                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span className={active ? "font-medium" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 mt-auto flex flex-col gap-2">
          <button
            onClick={() => logout()}
            className="w-full text-[#f9f9f8]/70 hover:text-white transition-colors px-4 py-3 flex items-center justify-center gap-3 hover:bg-[#322011]/50 rounded-full"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
          
          <div className="bg-[#322011] rounded-2xl p-4 flex items-center gap-3 mb-2 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-surface-tint border border-primary flex items-center justify-center text-white">
               <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#f9f9f8]">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-[#f9f9f8]/60 uppercase tracking-wider">System Logged In</p>
            </div>
          </div>
        </div>
      </aside>

      {/* TopAppBar Shell */}
      <header className="fixed top-0 right-0 h-20 ml-72 w-[calc(100%-18rem)] z-30 bg-[#f9f9f8]/80 backdrop-blur-xl flex justify-between items-center px-10 font-['Manrope'] font-medium">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-3 font-display">
            <span className="w-8 h-1 bg-on-tertiary-container rounded-full hidden sm:block"></span>
            {title}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <button className="p-3 rounded-full hover:bg-surface-variant transition-all text-primary/60 relative">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-3 rounded-full hover:bg-surface-variant transition-all text-primary/60">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-72 pt-20 h-screen overflow-y-auto bg-surface">
        <div className="p-10 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
