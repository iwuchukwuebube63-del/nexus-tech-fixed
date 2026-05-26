import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import BottomNav, { TopBar } from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { AnnouncementPopup } from "@/components/AnnouncementPopup";
import { toast } from "sonner";
import { trpc as trpcClient } from "@/lib/trpc";
import { CONFIG, getVipLevel } from "@/config";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp";
const BG_CARD = "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80";

const QuickBtn = ({ label, path, navigate, icon }: { label: string; path: string; navigate: Function; icon: React.ReactNode }) => (
  <button onClick={() => navigate(path)}
    className="bg-white rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md active:scale-95 transition-all">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
      {icon}
    </div>
    <span className="text-xs text-gray-600 font-semibold">{label}</span>
  </button>
);

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const redeemMutation = trpc.wallet.redeemGiftCode.useMutation();
  const utils = trpc.useUtils();

  const walletQuery = trpc.wallet.getBalance.useQuery(undefined, { enabled: !!user });
  const investmentsQuery = trpc.investments.getUserInvestments.useQuery(undefined, { enabled: !!user });
  const plansQuery = trpc.investments.getPlans.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading || (isAuthenticated && !user)) return <PageLoader />;
  if (!user) return <PageLoader />;

  const balance = parseFloat((walletQuery.data?.balance || "0").toString());
  const totalEarnings = parseFloat((walletQuery.data?.totalEarnings || "0").toString());
  const activeInvestments = (investmentsQuery.data || []).filter((i: any) => i.status === "active");
  const totalInvested = (investmentsQuery.data || []).reduce((s: number, i: any) => s + parseFloat(i.investmentAmount || "0"), 0);
  const vip = getVipLevel(totalInvested);
  const dailyIncome = activeInvestments.reduce((s: number, i: any) => s + parseFloat(i.dailyCommission || "0"), 0);

  const QUICK = [
    {
      label: "Recharge", path: "/deposit",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-6 h-6">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>,
    },
    {
      label: "Withdraw", path: "/withdraw",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-6 h-6">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>,
    },
    {
      label: "Invest", path: "/invest",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>,
    },
    {
      label: "Team", path: "/invite",
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AnnouncementPopup />
      {/* Custom header with greeting and bell */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Welcome back</p>
            <p className="text-sm font-bold text-gray-800">
              Hi, {user.username || user.phoneNumber?.slice(-4) || "there"} 👋
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp" alt="" className="h-8 w-8" />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Balance Hero Card */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <img src={BG_CARD} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/92 to-cyan-800/85" />
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/25"
                  style={{ color: vip.color === "#6b7280" ? "white" : vip.color }}>
                  {vip.name}
                </span>
                <span className="text-white/50 text-xs">{user.phoneNumber}</span>
              </div>
              <img src={LOGO_URL} alt="" className="h-8 w-8 opacity-80" />
            </div>
            <p className="text-blue-200 text-sm mb-1">Available Balance</p>
            <p className="text-4xl font-bold tracking-tight mb-5">₦{balance.toLocaleString()}</p>
            <div className="flex gap-3">
              <button onClick={() => navigate("/deposit")}
                className="flex-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl py-2.5 text-sm font-semibold transition backdrop-blur-sm">
                + Recharge
              </button>
              <button onClick={() => navigate("/withdraw")}
                className="flex-1 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl py-2.5 text-sm font-semibold transition backdrop-blur-sm">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Daily Income",   value: `₦${dailyIncome.toLocaleString()}`,   color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
            { label: "Total Earned",   value: `₦${totalEarnings.toLocaleString()}`, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100" },
            { label: "Active Rentals", value: activeInvestments.length.toString(),  color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions — SVG icons, no emojis */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK.map((a) => (
            <QuickBtn key={a.path} label={a.label} path={a.path} navigate={navigate} icon={a.icon} />
          ))}
        </div>

        {/* Gift code + quick action */}
        <button onClick={() => setShowGiftModal(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-sm">Redeem Gift Code</p>
            <p className="text-white/60 text-xs">Get codes from our Telegram channel</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4 opacity-50">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Telegram banner */}
        <a href={CONFIG.telegramChannel} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 bg-gradient-to-r from-[#229ED9] to-[#1a8fc4] rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.06 14.888l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.447c.537-.194 1.006.131.789.684z"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Join Our Telegram Channel</p>
            <p className="text-white/70 text-xs">Get gift codes, updates and support</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4 opacity-50 flex-shrink-0">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </a>

        {/* Active investments */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
            <p className="font-bold text-gray-800">Active Rentals</p>
            <button onClick={() => navigate("/invest")}
              className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg">
              + New
            </button>
          </div>
          {investmentsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-300 text-sm">Loading...</div>
          ) : activeInvestments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-7 h-7">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-3">No active rentals yet</p>
              <button onClick={() => navigate("/invest")}
                className="bg-blue-600 text-white text-xs px-5 py-2 rounded-lg font-semibold">
                Start Investing
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeInvestments.slice(0, 5).map((inv: any) => {
                const plan = (plansQuery.data || []).find((p: any) => p.id === inv.planId);
                return (
                  <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                    {plan?.deviceImageUrl ? (
                      <img src={plan.deviceImageUrl} alt={plan.deviceName}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-5 h-5">
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {plan?.deviceName || `Plan #${inv.planId}`}
                      </p>
                      <p className="text-xs text-gray-400">₦{parseFloat(inv.dailyCommission).toLocaleString()}/day</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-green-600 font-semibold">Active</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />

      {/* Gift Code Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowGiftModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-lg text-gray-900">Redeem Gift Code</p>
              <button onClick={() => setShowGiftModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Get gift codes from our{" "}
              <a href="https://t.me/nexustechinvestment" target="_blank" rel="noopener noreferrer"
                className="text-blue-600 font-semibold underline">Telegram channel</a>
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!giftCode.trim()) { toast.error("Enter a gift code"); return; }
              try {
                const result = await redeemMutation.mutateAsync({ code: giftCode.trim() });
                await utils.wallet.getBalance.invalidate();
                toast.success(`₦${result.amount.toLocaleString()} added to your balance!`);
                setGiftCode(""); setShowGiftModal(false);
              } catch (err: any) { toast.error(err.message || "Invalid gift code"); }
            }} className="space-y-3">
              <input type="text" placeholder="Enter code (e.g. NTABC123)"
                value={giftCode} onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm font-mono tracking-widest focus:outline-none focus:border-blue-400 transition text-center text-lg" />
              <button type="submit" disabled={redeemMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold transition hover:opacity-90 disabled:opacity-60">
                {redeemMutation.isPending ? "Redeeming..." : "Redeem"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
