import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import BottomNav, { TopBar } from "@/components/BottomNav";

export default function Income() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const investmentsQuery = trpc.investments.getUserInvestments.useQuery(undefined, { enabled: !!user });
  const minersQuery = trpc.cloudMiners.getUserMiners.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const activeInvestments = (investmentsQuery.data || []).filter((i: any) => i.status === "active");
  const activeMiners = (minersQuery.data || []).filter((m: any) => m.status === "active");

  const totalDailyFromPlans = activeInvestments.reduce((s: number, i: any) => s + parseFloat(i.dailyCommission || "0"), 0);
  const totalDailyFromMiners = activeMiners.reduce((s: number, m: any) => s + parseFloat(m.dailyIncome || "0"), 0);
  const totalDaily = totalDailyFromPlans + totalDailyFromMiners;

  const getDaysLeft = (endDate: any) => {
    if (!endDate) return "—";
    const left = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return left > 0 ? `${left} days left` : "Completed";
  };

  const getProgress = (startDate: any, endDate: any) => {
    if (!startDate || !endDate) return 0;
    const total = new Date(endDate).getTime() - new Date(startDate).getTime();
    const done = Date.now() - new Date(startDate).getTime();
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="Income" />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-green-100 text-sm mb-1">Total Daily Income</p>
          <p className="text-4xl font-bold mb-3">₦{totalDaily.toLocaleString()}</p>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-green-200">From Rentals</p>
              <p className="font-semibold">₦{totalDailyFromPlans.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-green-200">From Miners</p>
              <p className="font-semibold">₦{totalDailyFromMiners.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Device rentals */}
        {activeInvestments.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700 mb-2">Active Rentals</p>
            <div className="space-y-3">
              {activeInvestments.map((inv: any) => {
                const progress = getProgress(inv.startDate, inv.endDate);
                return (
                  <div key={inv.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">Plan #{inv.planId}</p>
                        <p className="text-xs text-gray-400">{getDaysLeft(inv.endDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">₦{parseFloat(inv.dailyCommission).toLocaleString()}/day</p>
                        <p className="text-xs text-gray-400">₦{parseFloat(inv.investmentAmount).toLocaleString()} invested</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{progress}% complete</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cloud miners */}
        {activeMiners.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700 mb-2">Active Cloud Miners</p>
            <div className="space-y-3">
              {activeMiners.map((m: any) => {
                const progress = getProgress(m.startDate, m.endDate);
                return (
                  <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">Miner #{m.minerId}</p>
                        <p className="text-xs text-gray-400">{getDaysLeft(m.endDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₦{parseFloat(m.dailyIncome).toLocaleString()}/day</p>
                        <p className="text-xs text-gray-400">₦{parseFloat(m.price).toLocaleString()} invested</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{progress}% complete</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeInvestments.length === 0 && activeMiners.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-3">No active income sources yet</p>
            <button onClick={() => navigate("/invest")} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              Start Investing
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
