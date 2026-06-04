import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import { TopBar } from "@/components/BottomNav";
import { getVipLevel, CONFIG } from "@/config";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp";

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0 px-5">
      <p className="text-sm text-gray-400 font-medium">{label}</p>
      <p className={`text-sm font-bold text-gray-800 ${mono ? "font-mono tracking-wide" : ""}`}>{value}</p>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const walletQuery = trpc.wallet.getBalance.useQuery(undefined, { enabled: !!user });
  const investmentsQuery = trpc.investments.getUserInvestments.useQuery(undefined, { enabled: !!user });
  const txQuery = trpc.wallet.getTransactionHistory.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading || !user) return <PageLoader />;

  const balance = parseFloat((walletQuery.data?.balance || "0").toString());
  const totalEarnings = parseFloat((walletQuery.data?.totalEarnings || "0").toString());
  const totalInvested = (investmentsQuery.data || []).reduce((s: number, i: any) => s + parseFloat(i.investmentAmount || "0"), 0);
  const activeCount = (investmentsQuery.data || []).filter((i: any) => i.status === "active").length;
  const vip = getVipLevel(totalInvested);

  // Calculate total withdrawn
  const totalWithdrawn = (txQuery.data || [])
    .filter((t: any) => t.type === "withdrawal" && t.status === "completed")
    .reduce((s: number, t: any) => s + parseFloat(t.grossAmount || t.amount || "0"), 0);

  // Calculate total deposited
  const totalDeposited = (txQuery.data || [])
    .filter((t: any) => t.type === "deposit" && t.status === "completed")
    .reduce((s: number, t: any) => s + parseFloat(t.grossAmount || t.amount || "0"), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="My Profile" showBack onBack={() => navigate("/mine")} />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Profile header */}
        <div className="bg-gradient-to-br from-blue-700 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
              <img src={LOGO_URL} alt="" className="w-10 h-10" />
            </div>
            <div>
              <p className="font-bold text-lg">{user.phoneNumber}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30"
                  style={{ color: "white" }}>
                  {vip.name}
                </span>
                <span className="text-white/60 text-xs">Member</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/20 text-center">
            <div className="pr-4">
              <p className="text-xl font-bold">₦{balance.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-0.5">Balance</p>
            </div>
            <div className="px-4">
              <p className="text-xl font-bold">₦{totalEarnings.toLocaleString()}</p>
              <p className="text-white/60 text-xs mt-0.5">Total Earned</p>
            </div>
            <div className="pl-4">
              <p className="text-xl font-bold">{activeCount}</p>
              <p className="text-white/60 text-xs mt-0.5">Active Plans</p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-800">Account Information</p>
          </div>
          <InfoRow label="Phone Number" value={user.phoneNumber || "—"} />
          <InfoRow label="User ID" value={user.userId || "—"} mono />
          <InfoRow label="Referral Code" value={user.referralCode || "—"} mono />
          <InfoRow label="Account Role" value={user.role === "admin" ? "Administrator" : "Member"} />
          <InfoRow label="VIP Level" value={vip.name} />
        </div>

        {/* Investment stats */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-800">Investment Summary</p>
          </div>
          <InfoRow label="Total Invested" value={`₦${totalInvested.toLocaleString()}`} />
          <InfoRow label="Total Earned" value={`₦${totalEarnings.toLocaleString()}`} />
          <InfoRow label="Total Recharged" value={`₦${totalDeposited.toLocaleString()}`} />
          <InfoRow label="Total Withdrawn" value={`₦${totalWithdrawn.toLocaleString()}`} />
          <InfoRow label="Active Rentals" value={activeCount.toString()} />
        </div>

        {/* VIP progress */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="font-bold text-gray-800 mb-3">VIP Progress</p>
          {CONFIG.vipLevels.map((level, i) => {
            const isActive = vip.level === level.level;
            const isPast = vip.level > level.level;
            return (
              <div key={level.level} className={`flex items-center gap-3 py-2 ${i < CONFIG.vipLevels.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: isPast || isActive ? level.color : "#f3f4f6", color: isPast || isActive ? "white" : "#9ca3af" }}>
                  {isPast ? "✓" : level.level}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isActive ? "text-gray-900" : isPast ? "text-gray-500" : "text-gray-300"}`}>
                    {level.name}
                  </p>
                  <p className="text-xs text-gray-400">Min. ₦{level.minInvested.toLocaleString()} invested</p>
                </div>
                {isActive && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ background: level.color }}>Current</span>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

