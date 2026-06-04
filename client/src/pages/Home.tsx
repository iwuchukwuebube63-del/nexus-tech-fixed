import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageLoader } from "@/components/LoadingSpinner";
import { CONFIG } from "@/config";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp";

type Mode = "login" | "signup";

function InputField({
  label, type = "text", placeholder, value, onChange, disabled, maxLength,
}: {
  label: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; disabled?: boolean; maxLength?: number;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <label className="block text-white/70 text-xs font-semibold uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full bg-white/8 border border-white/15 rounded-2xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/40 focus:bg-white/12 transition-all backdrop-blur-sm"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition">
            {show ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const refFromUrl = new URLSearchParams(search).get("ref") || "";

  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState(refFromUrl);
  const [submitting, setSubmitting] = useState(false);

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.loginWithPhoneAndPassword.useMutation();
  const signupMutation = trpc.auth.signupWithPhoneAndPassword.useMutation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <PageLoader />;
  if (isAuthenticated) return <PageLoader />;

  const switchMode = (m: Mode) => {
    setMode(m);
    setPhone(""); setPassword(""); setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error("Enter your phone number"); return; }
    if (!password) { toast.error("Enter your password"); return; }
    if (mode === "signup") {
      if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
      if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ phoneNumber: phone.trim(), password });
      } else {
        await signupMutation.mutateAsync({ phoneNumber: phone.trim(), password, referralCode: referralCode.trim() || undefined, username: username.trim() || undefined });
      }
      await utils.auth.me.invalidate();
      setTimeout(() => navigate("/dashboard"), 150);
    } catch (err: any) {
      toast.error(err.message || (mode === "login" ? "Login failed. Check your credentials." : "Sign up failed."));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050d1a]">
      {/* Background — tech grid + glow */}
      <div className="fixed inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,189,248,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.12) 0%, transparent 60%),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
        }}
      />

      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500/8 blur-3xl animate-pulse" style={{ top: "-10%", left: "-10%", animationDuration: "6s" }} />
        <div className="absolute w-96 h-96 rounded-full bg-cyan-400/6 blur-3xl animate-pulse" style={{ bottom: "-10%", right: "-5%", animationDuration: "8s", animationDelay: "2s" }} />
        <div className="absolute w-64 h-64 rounded-full bg-indigo-500/6 blur-2xl animate-pulse" style={{ top: "40%", right: "10%", animationDuration: "5s", animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between px-5 py-10">

        {/* Branding */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl scale-150" />
            <img src={LOGO_URL} alt="Nexus Tech" className="relative w-20 h-20 drop-shadow-2xl" />
          </div>
          <h1 className="text-white text-3xl font-black tracking-[0.15em] uppercase">Nexus Tech</h1>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mt-1">Device Rental · Simplified</p>
        </div>

        {/* Auth card */}
        <div className="w-full max-w-sm">
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-6 border border-white/8">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all ${
                  mode === m
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-white/40 hover:text-white/70"
                }`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Phone Number" type="tel" placeholder="e.g. 2348012345678" value={phone} onChange={setPhone} disabled={submitting} />
            <InputField label="Password" type="password" placeholder={mode === "login" ? "Enter your password" : "Minimum 6 characters"} value={password} onChange={setPassword} disabled={submitting} />

            {mode === "signup" && (
              <>
                <InputField label="Confirm Password" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={setConfirmPassword} disabled={submitting} />
                <InputField label="Username (Optional)" placeholder="Your display name" value={username} onChange={(v) => setUsername(v.replace(/[^a-zA-Z0-9_]/g, ""))} disabled={submitting} maxLength={20} />
                <InputField label="Referral Code (Optional)" placeholder="6-character code" value={referralCode} onChange={(v) => setReferralCode(v.toUpperCase())} disabled={submitting} maxLength={6} />
              </>
            )}

            {mode === "login" && (
              <div className="text-right">
                <a href={CONFIG.telegramSupport} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400/70 hover:text-blue-400 transition">
                  Forgot password? Contact Support
                </a>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100 mt-2">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
                  </svg>
                  Please wait...
                </span>
              ) : mode === "login" ? "Sign In" : "Create Account"}
            </button>

            {mode === "signup" && (
              <p className="text-white/25 text-xs text-center pt-1">
                New accounts receive a ₦500 welcome bonus
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-white/20 text-xs text-center tracking-wider">
          © 2026 Nexus Tech · All rights reserved
        </p>
      </div>
    </div>
  );
}
