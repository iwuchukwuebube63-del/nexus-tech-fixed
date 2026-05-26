import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import { TopBar } from "@/components/BottomNav";
import { toast } from "sonner";
import { CONFIG } from "@/config";

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000, 200000];
const TIMER_SECONDS = 15 * 60;

function Timer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [rem, setRem] = useState(seconds);
  useEffect(() => {
    if (rem <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRem(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [rem]);
  const m = Math.floor(rem / 60), s = rem % 60;
  const pct = (rem / seconds) * 100;
  const urgent = rem < 120;
  return (
    <div className={`rounded-2xl p-4 border ${urgent ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-100"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-semibold uppercase tracking-wide ${urgent ? "text-red-500" : "text-blue-500"}`}>
          Time to complete transfer
        </p>
        <p className={`text-2xl font-bold font-mono ${urgent ? "text-red-600" : "text-blue-700"}`}>
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${urgent ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Callback page: handles return from Paystack
function PaystackCallback() {
  const search = useSearch();
  const ref = new URLSearchParams(search).get("ref");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const depositMutation = trpc.wallet.deposit.useMutation();
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (!ref || !user || ran.current) return;
    ran.current = true;

    depositMutation.mutateAsync({ amount: 0, paystackRef: ref })
      .then(async () => {
        await utils.wallet.getBalance.invalidate();
        setStatus("success");
        toast.success("Payment verified! Balance updated.");
        setTimeout(() => navigate("/dashboard"), 2000);
      })
      .catch((err) => {
        setStatus("failed");
        toast.error(err.message || "Payment verification failed");
        setTimeout(() => navigate("/deposit"), 2500);
      });
  }, [ref, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-sm w-full">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-gray-800 text-lg">Verifying Payment</p>
            <p className="text-gray-500 text-sm mt-1">Please wait...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="w-8 h-8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className="font-bold text-green-700 text-lg">Payment Successful!</p>
            <p className="text-gray-500 text-sm mt-1">Your balance has been updated.</p>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="w-8 h-8">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p className="font-bold text-red-700 text-lg">Verification Failed</p>
            <p className="text-gray-500 text-sm mt-1">Redirecting back to deposit...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Deposit() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();

  // Handle Paystack callback route
  if (location === "/deposit/callback") {
    return <PaystackCallback />;
  }

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "manual">("amount");
  const [receiptBase64, setReceiptBase64] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initPaystackMutation = trpc.wallet.initializePaystack.useMutation();
  const depositMutation = trpc.wallet.deposit.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const parsed = parseFloat(amount) || 0;
  const isPaystack = parsed > 0 && parsed <= 20000;

  const handleContinue = async () => {
    if (parsed < CONFIG.minDeposit) {
      toast.error(`Minimum deposit is ₦${CONFIG.minDeposit.toLocaleString()}`);
      return;
    }

    if (isPaystack) {
      setSubmitting(true);
      try {
        // Initialize on server — get real Paystack authorization URL
        const result = await initPaystackMutation.mutateAsync({ amount: parsed });
        // Open Paystack checkout in same tab
        window.location.href = result.authorizationUrl;
      } catch (err: any) {
        toast.error(err.message || "Failed to initialize payment. Try again.");
        setSubmitting(false);
      }
    } else {
      setStep("manual");
    }
  };

  const handleManualSubmit = async () => {
    setSubmitting(true);
    try {
      await depositMutation.mutateAsync({
        amount: parsed,
        receiptBase64: receiptBase64 || undefined,
      });
      toast.success("Deposit submitted! Admin will confirm shortly.");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setReceiptName(file.name);
    const r = new FileReader();
    r.onload = () => setReceiptBase64(r.result as string);
    r.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Recharge" showBack
        onBack={() => step === "manual" ? setStep("amount") : navigate("/dashboard")} />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {step === "amount" && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold text-gray-800 mb-3">Select Amount</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a.toString())}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                      amount === a.toString()
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-100 text-gray-600 hover:border-blue-200"
                    }`}>
                    ₦{a >= 1000 ? `${a / 1000}k` : a}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                <input type="number"
                  placeholder={`Min ₦${CONFIG.minDeposit.toLocaleString()}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition" />
              </div>
            </div>

            <button onClick={handleContinue}
              disabled={parsed < CONFIG.minDeposit || submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold transition hover:opacity-90 disabled:opacity-40">
              {submitting ? "Initializing..." : parsed >= CONFIG.minDeposit ? `Continue — ₦${parsed.toLocaleString()}` : "Continue"}
            </button>
          </>
        )}

        {step === "manual" && (
          <>
            {!timerExpired ? (
              <Timer seconds={TIMER_SECONDS} onExpire={() => setTimerExpired(true)} />
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-600 font-semibold text-sm mb-2">Timer expired. Please start a new deposit.</p>
                <button onClick={() => { setStep("amount"); setTimerExpired(false); setReceiptBase64(""); }}
                  className="text-xs text-red-500 underline">Start over</button>
              </div>
            )}

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-bold text-gray-800 mb-1">Transfer ₦{parsed.toLocaleString()} to:</p>
              <p className="text-xs text-gray-400 mb-4">Complete within 15 minutes then upload your receipt</p>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                {[
                  ["Account Name",   CONFIG.bankAccount.name],
                  ["Account Number", CONFIG.bankAccount.number],
                  ["Bank",           CONFIG.bankAccount.bank],
                  ["Amount",         `₦${parsed.toLocaleString()}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center px-4 py-3.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-400">{label}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm">{val}</p>
                      {label === "Account Number" && (
                        <button onClick={() => { navigator.clipboard.writeText(val); toast.success("Copied!"); }}
                          className="text-blue-500 p-1">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-1">Upload Receipt</p>
              <p className="text-xs text-gray-400 mb-3">Screenshot of your transfer confirmation</p>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl py-8 text-center transition ${
                  receiptBase64 ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-300 bg-gray-50"
                }`}>
                {receiptBase64 ? (
                  <div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="w-8 h-8 mx-auto mb-1">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p className="text-green-600 font-semibold text-sm">Receipt uploaded</p>
                    <p className="text-xs text-gray-400">{receiptName}</p>
                  </div>
                ) : (
                  <div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className="text-sm text-gray-400 font-medium">Tap to upload receipt</p>
                    <p className="text-xs text-gray-300 mt-0.5">PNG or JPG · max 5MB</p>
                  </div>
                )}
              </button>
            </div>

            <button onClick={handleManualSubmit} disabled={submitting || timerExpired}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold transition hover:opacity-90 disabled:opacity-60">
              {submitting ? "Submitting..." : "I Have Transferred — Submit"}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
