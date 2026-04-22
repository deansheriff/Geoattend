import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const navItems = [
  { label: "Clock In", icon: "timer", to: "/employee/clock" },
  { label: "Timesheet", icon: "history", to: "/employee/history" }
];

export default function EmployeeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface font-display relative pb-28 md:pb-0 selection:bg-secondary/30">
      {/* Top App Bar */}
      <header className="flex items-center justify-between bg-surface-container-low px-6 py-4 sticky top-0 z-20 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
            <span className="material-symbols-outlined text-primary text-[22px]">location_on</span>
          </div>
          <h2 className="text-xl font-bold font-display text-primary tracking-tight">GeoAttend</h2>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all ${
                  active ? "bg-secondary-container text-on-secondary-container shadow-sm" : "text-primary/60 hover:bg-black/5 hover:text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <button
          onClick={() => logout()}
          className="size-10 rounded-full flex items-center justify-center text-primary/50 hover:text-error hover:bg-error-container transition-colors"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
        </button>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* MD3 Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-surface-container-highest rounded-full shadow-elevated z-30 flex justify-between items-center px-4 py-3 border border-white/10 backdrop-blur-md">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full transition-all duration-300 ${
                active ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105" : "text-primary/50 hover:bg-black/5"
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${active ? "font-variation-settings-'FILL'1" : ""}`}>
                {item.icon}
              </span>
              {active && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}