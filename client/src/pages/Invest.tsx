import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import BottomNav, { TopBar } from "@/components/BottomNav";
import { toast } from "sonner";

const PLAN_LIMITS: Record<number, number> = { 1: 2, 2: 3 };
const DEFAULT_LIMIT = 10;

function getPlanLimit(level: number) {
  return PLAN_LIMITS[level] ?? DEFAULT_LIMIT;
}

export default function Invest() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"devices" | "miners">("devices");

  const plansQuery = trpc.investments.getPlans.useQuery(undefined, { enabled: !!user });
  const minersQuery = trpc.cloudMiners.getAll.useQuery(undefined, { enabled: !!user });
  const userInvestmentsQuery = trpc.investments.getUserInvestments.useQuery(undefined, { enabled: !!user });
  const userMinersQuery = trpc.cloudMiners.getUserMiners.useQuery(undefined, { enabled: !!user });
  const rentMutation = trpc.investments.rentPlan.useMutation();
  const buyMinerMutation = trpc.cloudMiners.buy.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const handleRent = async (planId: number) => {
    try {
      await rentMutation.mutateAsync({ planId });
      await utils.investments.getUserInvestments.invalidate();
      await utils.wallet.getBalance.invalidate();
      toast.success("Investment activated! Daily commissions start now.");
    } catch (error: any) {
      toast.error(error.message || "Failed to activate investment");
    }
  };

  const handleBuyMiner = async (minerId: number) => {
    try {
      await buyMinerMutation.mutateAsync({ minerId });
      await utils.cloudMiners.getUserMiners.invalidate();
      await utils.wallet.getBalance.invalidate();
      toast.success("Cloud miner activated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase miner");
    }
  };

  // Count how many times user has rented each plan
  const rentCounts: Record<number, number> = {};
  (userInvestmentsQuery.data || []).forEach((inv: any) => {
    rentCounts[inv.planId] = (rentCounts[inv.planId] || 0) + 1;
  });

  // Count user cloud miner purchases
  const minerCounts: Record<number, number> = {};
  (userMinersQuery.data || []).forEach((m: any) => {
    minerCounts[m.minerId] = (minerCounts[m.minerId] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="Invest" />

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-xl flex p-1 shadow-sm mb-4">
          <button
            onClick={() => setTab("devices")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${tab === "devices" ? "bg-blue-600 text-white shadow" : "text-gray-500"}`}
          >
            📱 Device Rental
          </button>
          <button
            onClick={() => setTab("miners")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${tab === "miners" ? "bg-blue-600 text-white shadow" : "text-gray-500"}`}
          >
            ⛏️ Cloud Miners
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 space-y-4">
        {/* DEVICE RENTAL TAB */}
        {tab === "devices" && (
          <>
            {plansQuery.isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading plans...</div>
            ) : (plansQuery.data || []).map((plan: any) => {
              const limit = getPlanLimit(plan.planLevel);
              const used = rentCounts[plan.id] || 0;
              const canRent = used < limit;
              return (
                <div key={plan.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {plan.deviceImageUrl && (
                    <img src={plan.deviceImageUrl} alt={plan.deviceName} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{plan.deviceName}</p>
                        <p className="text-xs text-gray-400">Tier {plan.planLevel} • {plan.durationDays} days</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${canRent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        Quota {used}/{limit}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="font-bold text-gray-800 text-sm">₦{parseFloat(plan.investmentAmount).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Daily</p>
                        <p className="font-bold text-blue-600 text-sm">₦{parseFloat(plan.dailyCommission).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="font-bold text-green-600 text-sm">₦{(parseFloat(plan.dailyCommission) * plan.durationDays).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => canRent && handleRent(plan.id)}
                      disabled={!canRent || rentMutation.isPending}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                        canRent
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {canRent ? (rentMutation.isPending ? "Processing..." : "Rent Now") : "Quota Reached"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* CLOUD MINERS TAB */}
        {tab === "miners" && (
          <>
            <p className="text-xs text-gray-400 text-center">New cloud miners unlock periodically. Check back soon!</p>
            {minersQuery.isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading miners...</div>
            ) : (minersQuery.data || []).map((miner: any) => {
              const used = minerCounts[miner.id] || 0;
              const canBuy = miner.isUnlocked && used < miner.quota;
              return (
                <div key={miner.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {miner.imageUrl && (
                    <div className="relative">
                      <img src={miner.imageUrl} alt={miner.name} className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex justify-between items-end">
                        <p className="font-bold text-white text-lg">{miner.name}</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${miner.isUnlocked ? "bg-green-500 text-white" : "bg-gray-600 text-gray-300"}`}>
                          Quota {used}/{miner.quota}
                        </span>
                      </div>
                    </div>
                  )}
                  {!miner.imageUrl && (
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex justify-between items-center">
                    <p className="font-bold text-white">{miner.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${miner.isUnlocked ? "bg-green-500 text-white" : "bg-gray-600 text-gray-300"}`}>
                      Quota {used}/{miner.quota}
                    </span>
                  </div>
                  )}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Price</p>
                        <p className="font-bold text-gray-800">₦{parseFloat(miner.price).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Daily Income</p>
                        <p className="font-bold text-blue-600">₦{parseFloat(miner.dailyIncome).toLocaleString()}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Duration</p>
                        <p className="font-bold text-purple-600">{miner.duration} days</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Total Income</p>
                        <p className="font-bold text-green-600">₦{parseFloat(miner.totalIncome).toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => canBuy && handleBuyMiner(miner.id)}
                      disabled={!miner.isUnlocked || !canBuy || buyMinerMutation.isPending}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
                        !miner.isUnlocked
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : !canBuy
                          ? "bg-orange-100 text-orange-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90"
                      }`}
                    >
                      {!miner.isUnlocked ? "Coming Soon" : !canBuy ? "Quota Reached" : buyMinerMutation.isPending ? "Processing..." : "Buy Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
