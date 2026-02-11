import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { forgotPassword, resetPassword } from "../api/auth";
import logo from "../assets/kameleon.png";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@geoattend.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetToken, setResetToken] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    try {
      const res: any = await forgotPassword(email);
      setResetToken(res.devToken || "");
      setResetMessage("Reset token generated. Use it below to reset your password.");
      setMode("reset");
    } catch (err: any) {
      setError(err.message || "Request failed");
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    try {
      await resetPassword(resetToken, password);
      setResetMessage("Password reset. You can sign in now.");
      setMode("login");
    } catch (err: any) {
      setError(err.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Kameleon" className="h-10 w-auto" />
          <div>
            <h1 className="text-2xl font-bold">GeoAttend</h1>
            <p className="text-xs text-slate-500">Location-Based Attendance</p>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">
          {mode === "login" ? "Sign in" : mode === "forgot" ? "Reset request" : "Set new password"}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {mode === "login"
            ? "Use your work account to continue."
            : "We will generate a reset token for your account."}
        </p>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {resetMessage && <div className="mb-4 text-sm text-green-700">{resetMessage}</div>}
        {mode === "login" && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition"
            >
              Sign in
            </button>
          </form>
        )}
        {mode === "forgot" && (
          <form onSubmit={onForgot} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition"
            >
              Send reset token
            </button>
          </form>
        )}
        {mode === "reset" && (
          <form onSubmit={onReset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Reset Token</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary/30"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">New Password</label>
              <input
                className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50 focus:ring-primary/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-white font-bold shadow-md hover:bg-primary/90 transition"
            >
              Reset password
            </button>
          </form>
        )}
        <div className="mt-4 text-xs text-slate-500">
          {mode !== "login" ? (
            <button onClick={() => setMode("login")} className="text-primary font-semibold">
              Back to sign in
            </button>
          ) : (
            <button onClick={() => setMode("forgot")} className="text-primary font-semibold">
              Forgot password?
            </button>
          )}
        </div>
        <div className="mt-6 text-xs text-slate-500">
          Demo accounts are pre-seeded for local use.
        </div>
      </div>
    </div>
  );
}
