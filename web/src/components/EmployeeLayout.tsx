import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const navItems = [
  { label: "Clock In", to: "/employee/clock" },
  { label: "Timesheet", to: "/employee/history" }
];

export default function EmployeeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background-light">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
          <h2 className="text-lg font-bold">GeoAttend</h2>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium ${
                location.pathname === item.to ? "text-primary border-b-2 border-primary" : "text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => logout()}
          className="text-sm font-semibold text-slate-600 hover:text-primary"
        >
          Sign Out
        </button>
      </header>
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
}