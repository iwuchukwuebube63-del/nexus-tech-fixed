import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import BottomNav, { TopBar } from "@/components/BottomNav";

const TX_ICONS: Record<string, string> = {
  deposit: "📥", withdrawal: "📤", investment: "📱",
  commission: "💰", referral: "🎁", bonus: "🎉",
};
const TX_COLORS: Record<string, string> = {
  completed: "text-green-600", pending: "text-amber-500",
  failed: "text-red-500", cancelled: "text-gray-400",
};

export default function Wallet() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const walletQuery = trpc.wallet.getBalance.useQuery(undefined, { enabled: !!user });
  const txQuery = trpc.wallet.getTransactionHistory.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const balance = parseFloat((walletQuery.data?.balance || "0").toString());

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="Wallet" />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Balance */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-blue-100 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold mb-4">₦{balance.toLocaleString()}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/deposit")}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2.5 text-sm font-semibold transition">
              + Deposit
            </button>
            <button onClick={() => navigate("/withdraw")}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2.5 text-sm font-semibold transition">
              Withdraw
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-800">Transaction History</p>
          </div>
          {txQuery.isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : !txQuery.data || txQuery.data.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {txQuery.data.map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="text-2xl">{TX_ICONS[tx.type] || "💳"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-300">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">₦{parseFloat(tx.amount).toLocaleString()}</p>
                    <p className={`text-xs font-medium capitalize ${TX_COLORS[tx.status] || "text-gray-400"}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
