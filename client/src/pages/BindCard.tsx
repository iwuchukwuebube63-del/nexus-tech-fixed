import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import { TopBar } from "@/components/BottomNav";
import { toast } from "sonner";

const NIGERIAN_BANKS = [
  "Access Bank","First Bank","GTBank","UBA","Zenith Bank",
  "OPay","PalmPay","Moniepoint","Kuda","Fidelity Bank",
  "Sterling Bank","Polaris Bank","Wema Bank","Union Bank",
  "Stanbic IBTC","Ecobank","First City Monument Bank","Heritage Bank",
];

export default function BindCard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cardQuery = trpc.wallet.getBoundCard.useQuery(undefined, { enabled: !!user });
  const bindMutation = trpc.wallet.bindCard.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  // Pre-fill if card already bound
  useEffect(() => {
    if (cardQuery.data?.bankName) setBankName(cardQuery.data.bankName);
    if (cardQuery.data?.accountNumber) setAccountNumber(cardQuery.data.accountNumber);
    if (cardQuery.data?.accountName) setAccountName(cardQuery.data.accountName);
  }, [cardQuery.data]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const hasBoundCard = !!cardQuery.data?.accountNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName) { toast.error("Select your bank"); return; }
    if (!accountNumber.trim()) { toast.error("Enter account number"); return; }
    if (!accountName.trim()) { toast.error("Enter account name"); return; }

    setSubmitting(true);
    try {
      await bindMutation.mutateAsync({ bankName, accountNumber, accountName });
      await utils.wallet.getBoundCard.invalidate();
      toast.success(hasBoundCard ? "Bank card updated successfully!" : "Bank card bound successfully!");
      setTimeout(() => navigate("/withdraw"), 800);
    } catch (err: any) {
      toast.error(err.message || "Failed to bind card");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Bind Bank Card" showBack onBack={() => navigate("/withdraw")} />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Card preview */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl h-44">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
          {/* Card chip */}
          <div className="absolute top-5 right-6">
            <svg viewBox="0 0 40 32" className="w-10 h-8" fill="none">
              <rect width="40" height="32" rx="4" fill="#d4a017" opacity="0.9"/>
              <rect x="4" y="4" width="32" height="24" rx="2" stroke="#b8860b" strokeWidth="1" fill="none"/>
              <line x1="0" y1="16" x2="40" y2="16" stroke="#b8860b" strokeWidth="1"/>
              <line x1="20" y1="0" x2="20" y2="32" stroke="#b8860b" strokeWidth="1"/>
            </svg>
          </div>
          <div className="relative p-6 h-full flex flex-col justify-between">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">Bank</p>
              <p className="text-white font-bold text-lg mt-0.5">{bankName || "—"}</p>
            </div>
            <div>
              <p className="text-white font-mono text-xl tracking-widest">
                {accountNumber || "— — — — — — — —"}
              </p>
              <p className="text-white/60 text-sm mt-1">Real Name: {accountName || "—"}</p>
            </div>
          </div>
        </div>

        {hasBoundCard && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 font-medium">
            You already have a bound card. Updating will replace it.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Real Name
            </label>
            <input type="text" placeholder="Name on your bank account" value={accountName}
              onChange={e => setAccountName(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Bank
            </label>
            <select value={bankName} onChange={e => setBankName(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition bg-white">
              <option value="">Select your bank</option>
              {NIGERIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Bank Account Number
            </label>
            <input type="text" placeholder="10-digit account number" value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)} maxLength={20}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:border-blue-400 transition" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-4 rounded-xl font-bold transition hover:opacity-90 disabled:opacity-60">
            {submitting ? "Saving..." : hasBoundCard ? "Update Card" : "Confirm"}
          </button>
        </form>

        {/* Notes */}
        <div className="space-y-2">
          {[
            `Minimum withdrawal: ₦1,500`,
            `Withdrawal hours: 8:00 AM – 8:00 PM`,
            `After withdrawal, share your confirmation on social media to earn a high referral commission once someone joins.`,
          ].map((note, i) => (
            <div key={i} className="bg-white border-l-4 border-blue-500 rounded-r-xl px-4 py-3">
              <p className="text-sm text-gray-700 font-medium">{note}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
