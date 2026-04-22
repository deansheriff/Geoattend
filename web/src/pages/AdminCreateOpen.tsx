import { FormEvent, useState } from "react";
import { apiFetch } from "../api/client";

export default function AdminCreateOpen() {
  const [email, setEmail] = useState("admin@geoattend.local");
  const [name, setName] = useState("admin");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch("/auth/create-admin-open", {
        method: "POST",
        body: JSON.stringify({ email, name, password })
      });
      setMessage(`Created admin: ${res.admin.email}`);
    } catch (err: any) {
      setError(err.message || "Request failed");
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-6 font-display">
      <div className="bg-surface rounded-2xl border border-black/5 shadow-elevated p-8 w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1bg-accent" />
        <h1 className="text-2xl font-bold text-primary tracking-tight">System Initialization</h1>
        <p className="text-[11px] font-bold text-error uppercase tracking-widest mt-2 bg-error/10 border border-error/20 inline-block px-2 py-1 rounded">
          Danger: Internal Use Only
        </p>
        {message && <div className="mt-6 text-[13px] font-bold text-secondary bg-secondary/10 border border-secondary/20 p-3 rounded-xl">{message}</div>}
        {error && <div className="mt-6 text-[13px] font-bold text-error bg-error/10 border border-error/20 p-3 rounded-xl">{error}</div>}
        
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-[11px] font-bold text-primary/50 uppercase tracking-widest block mb-1.5">Email Required</label>
            <input
              className="w-full bg-background-light border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-primary/50 uppercase tracking-widest block mb-1.5">Full Name</label>
            <input
              className="w-full bg-background-light border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-primary/50 uppercase tracking-widest block mb-1.5">Master Password</label>
            <input
              className="w-full bg-background-light border border-black/10 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-4 text-sm font-bold shadow-subtle hover:bg-primary/90 hover:shadow-elevated transition-all">
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            Provision Admin Account
          </button>
        </form>
      </div>
    </div>
  );
}