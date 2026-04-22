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
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 font-display">
      <div className="w-full max-w-[440px] bg-surface-container-low shadow-sm rounded-[3rem] border border-black/5 p-8 sm:p-10 relative overflow-hidden flex flex-col">
        {/* Decorative subtle background elements for the card */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#E69D45]/10 rounded-bl-full pointer-events-none transform translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3a6846]/10 rounded-tr-full pointer-events-none transform -translate-x-12 translate-y-12" />
        
        <div className="relative z-10 flex flex-col items-center gap-4 mb-10 mt-4">
          <div className="size-20 bg-surface-container-highest shadow-sm rounded-[2rem] flex items-center justify-center border border-black/5">
            <img src={logo} alt="GeoAttend" className="h-10 w-auto" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-primary tracking-tighter">GeoAttend</h1>
            <p className="text-[11px] text-primary/50 font-black uppercase tracking-widest mt-1">Workspace Portal</p>
          </div>
        </div>

        <div className="relative z-10 w-full mb-8">
          <h2 className="text-2xl font-black text-primary text-center tracking-tight">
            {mode === "login" ? "Welcome back" : mode === "forgot" ? "Reset Access" : "Set new password"}
          </h2>
          <p className="text-sm font-semibold text-primary/60 text-center mt-2">
            {mode === "login"
              ? "Enter your credentials to access your account."
              : mode === "forgot" ? "We'll send you instructions to reset your password." : "Please enter a strong new password."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-error-container border border-error/10 text-sm text-error font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}
        {resetMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-secondary-container border border-secondary/10 text-sm text-on-secondary-container font-bold flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {resetMessage}
          </div>
        )}

        {mode === "login" && (
          <form onSubmit={onSubmit} className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2 ml-2">Email Address</label>
              <input
                className="w-full h-[56px] rounded-[1.5rem] border-none bg-surface-container-highest focus:ring-2 focus:ring-primary/20 transition-all px-5 text-primary text-base font-bold placeholder-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2 ml-2">Password</label>
              <input
                className="w-full h-[56px] rounded-[1.5rem] border-none bg-surface-container-highest focus:ring-2 focus:ring-primary/20 transition-all px-5 text-primary text-base font-bold placeholder-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-[60px] rounded-[2rem] bg-secondary text-on-secondary font-black text-sm uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
              Sign In
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={onForgot} className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2 ml-2">Email Address</label>
              <input
                className="w-full h-[56px] rounded-[1.5rem] border-none bg-surface-container-highest focus:ring-2 focus:ring-primary/20 transition-all px-5 text-primary text-base font-bold placeholder-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-[60px] rounded-[2rem] bg-secondary text-on-secondary font-black text-sm uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
              Send Reset Token
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={onReset} className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2 ml-2">Reset Token</label>
              <input
                className="w-full h-[56px] rounded-[1.5rem] border-none bg-surface-container-highest focus:ring-2 focus:ring-primary/20 transition-all px-5 text-primary text-base font-bold placeholder-primary/20"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>
            <div>
               <label className="block text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2 ml-2">New Password</label>
              <input
                className="w-full h-[56px] rounded-[1.5rem] border-none bg-surface-container-highest focus:ring-2 focus:ring-primary/20 transition-all px-5 text-primary text-base font-bold placeholder-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full h-[60px] rounded-[2rem] bg-secondary text-on-secondary font-black text-sm uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            >
              Confirm Password
            </button>
          </form>
        )}

        <div className="mt-8 text-center relative z-10">
          {mode !== "login" ? (
            <button onClick={() => setMode("login")} className="text-xs font-bold text-primary hover:text-secondary uppercase tracking-widest transition-colors p-2">
              Return to sign in
            </button>
          ) : (
            <button onClick={() => setMode("forgot")} className="text-xs font-bold text-primary/50 hover:text-primary uppercase tracking-widest transition-colors p-2">
              Forgot your password?
            </button>
          )}
        </div>
        
        <div className="mt-auto pt-8 text-center relative z-10">
          <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">
            Demo accounts pre-seeded
          </p>
        </div>
      </div>
    </div>
  );
}
