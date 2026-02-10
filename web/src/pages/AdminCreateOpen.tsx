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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 w-full max-w-md">
        <h1 className="text-xl font-bold">Create Admin (Temporary)</h1>
        <p className="text-xs text-red-600 mt-1">
          Requires ENABLE_ADMIN_CREATE=true on the server. Remove after use.
        </p>
        {message && <div className="mt-4 text-sm text-green-600">{message}</div>}
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <input
              className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <button className="w-full py-2.5 rounded-lg bg-primary text-white font-bold">
            Create Admin
          </button>
        </form>
      </div>
    </div>
  );
}