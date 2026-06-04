import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import { TopBar } from "@/components/BottomNav";
import { toast } from "sonner";
import { CONFIG } from "@/config";

export default function Withdraw() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const balanceQuery = trpc.wallet.getBalance.useQuery(undefined, { enabled: !!user });
  const cardQuery = trpc.wallet.getBoundCard.useQuery(undefined, { enabled: !!user });
  const withdrawMutation = trpc.wallet.withdraw.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const balance = parseFloat((balanceQuery.data?.balance || "0").toString());
  const parsed = parseFloat(amount) || 0;
  const fee = parsed * (CONFIG.withdrawalFeePercent / 100);
  const net = parsed - fee;
  const hasBoundCard = !!cardQuery.data?.accountNumber;
  const minW = CONFIG.minWithdrawal;

  const handleSubmit = async () => {
    if (!hasBoundCard) { navigate("/bind-card"); return; }
    if (parsed < minW) { toast.error(`Minimum withdrawal is ₦${minW.toLocaleString()}`); return; }
    if (parsed > balance) { toast.error("Insufficient balance"); return; }

    // Client-side hours check (server also validates)
    const now = new Date();
    const nigeriaHour = (now.getUTCHours() + 1) % 24;
    if (nigeriaHour < 8 || nigeriaHour >= 20) {
      toast.error("Withdrawals are only available between 8:00 AM and 8:00 PM.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await withdrawMutation.mutateAsync({ amount: parsed });
      await utils.wallet.getBalance.invalidate();
      toast.success(`Withdrawal of ₦${parsed.toLocaleString()} submitted!`);
      setTimeout(() => navigate("/wallet"), 1200);
    } catch (err: any) {
      if (err.message === "NO_CARD_BOUND") {
        navigate("/bind-card");
      } else if (err.message?.includes("must invest")) {
        toast.error("You must invest in at least one plan before withdrawing.", { duration: 5000 });
        setTimeout(() => navigate("/invest"), 2500);
      } else {
        toast.error(err.message || "Withdrawal failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Withdraw" showBack onBack={() => navigate("/dashboard")} />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Balance */}
        <div className="bg-gradient-to-br from-blue-700 to-cyan-500 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-blue-100 text-sm mb-1">Available Balance</p>
          <p className="text-3xl font-bold">₦{balance.toLocaleString()}</p>
        </div>

        {/* Amount input */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-gray-800 mb-3">Withdrawal Amount</p>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
            <input type="number" placeholder={`Min ₦${minW.toLocaleString()}`} value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl pl-8 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-400 transition" />
          </div>

          {parsed >= minW && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Amount</span>
                <span className="font-semibold">₦{parsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-orange-500">
                <span>Fee ({CONFIG.withdrawalFeePercent}%)</span>
                <span className="font-semibold">−₦{fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600 border-t border-gray-200 pt-2 font-bold">
                <span>You receive</span>
                <span>₦{net.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bound card display */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {cardQuery.isLoading ? (
            <div className="p-5 text-center text-gray-400 text-sm">Loading card...</div>
          ) : hasBoundCard ? (
            <div className="p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-gray-800">Withdrawal Account</p>
                <button onClick={() => navigate("/bind-card")}
                  className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg">
                  Change
                </button>
              </div>
              <div className="space-y-2">
                {[
                  ["Real Name",       cardQuery.data?.accountName || ""],
                  ["Bank",            cardQuery.data?.bankName || ""],
                  ["Account Number",  cardQuery.data?.accountNumber || ""],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={() => navigate("/bind-card")}
              className="w-full flex items-center justify-center gap-3 p-5 hover:bg-gray-50 transition">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-5 h-5">
                  <rect x="1" y="4" width="22" height="16" rx="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-blue-600 text-sm">Bind Bank Card</p>
                <p className="text-xs text-gray-400">You must bind a card before withdrawing</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="w-4 h-4 ml-auto">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          {[
            `Minimum withdrawal: ₦${minW.toLocaleString()}`,
            `Withdrawal hours: 8:00 AM – 8:00 PM`,
            "After withdrawal, share your confirmation on social media to earn a high referral commission once someone joins.",
          ].map((note, i) => (
            <div key={i} className="bg-white border-l-4 border-blue-500 rounded-r-xl px-4 py-3">
              <p className="text-sm text-gray-700">{note}</p>
            </div>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={submitting || parsed < minW || !hasBoundCard}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold transition hover:opacity-90 disabled:opacity-50">
          {!hasBoundCard ? "Bind Card to Withdraw" : submitting ? "Submitting..." : `Withdraw ₦${parsed > 0 ? parsed.toLocaleString() : "0"}`}
        </button>
      </main>
    </div>
  );
}
