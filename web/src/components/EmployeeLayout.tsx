import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useRef, useState } from "react";
import { apiFetchForm, ROOT_URL } from "../api/client";

const navItems = [
  { label: "Clock In", icon: "timer", to: "/employee/clock" },
  { label: "Timesheet", icon: "history", to: "/employee/history" }
];

export default function EmployeeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout, refresh } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = user?.profilePhoto
    ? `${ROOT_URL}/uploads/${user.profilePhoto}`
    : null;

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      await apiFetchForm("/employee/profile-photo", form);
      await refresh();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-surface font-display relative pb-28 md:pb-0 selection:bg-secondary/30">
      {/* Top App Bar */}
      <header className="flex items-center justify-between bg-surface-container-low px-4 md:px-6 py-3 sticky top-0 z-20 border-b border-black/5">
        <div className="flex items-center gap-3">
          {/* Avatar / Profile Photo */}
          <button
            onClick={handleAvatarClick}
            className="relative size-10 rounded-full overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-colors flex-shrink-0 group"
            title="Tap to change profile photo"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name ?? "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary-container flex items-center justify-center">
                <span className="text-sm font-black text-on-secondary-container">{initials}</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-base animate-spin">progress_activity</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="material-symbols-outlined text-white text-sm drop-shadow">photo_camera</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Name + Title */}
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold font-display text-primary tracking-tight leading-tight truncate">
              {user?.name ?? "GeoAttend"}
            </h2>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest leading-none mt-0.5">
              {title}
            </p>
          </div>
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