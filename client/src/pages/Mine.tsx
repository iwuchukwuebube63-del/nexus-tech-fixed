import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import BottomNav from "@/components/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { CONFIG, getVipLevel } from "@/config";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp";
const HERO_BG = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80";

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition text-left ${danger ? "text-red-500" : "text-gray-700"}`}
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? "bg-red-50" : "bg-blue-50"}`}>
        {icon}
      </span>
      <span className="flex-1 font-medium text-sm">{label}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-300">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

export default function Mine() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [giftCode, setGiftCode] = useState("");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const walletQuery = trpc.wallet.getBalance.useQuery(undefined, { enabled: !!user });
  const investmentsQuery = trpc.investments.getUserInvestments.useQuery(undefined, { enabled: !!user });
  const redeemMutation = trpc.wallet.redeemGiftCode.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading || (isAuthenticated && !user)) return <PageLoader />;
  if (!user) return <PageLoader />;

  const balance = parseFloat((walletQuery.data?.balance || "0").toString());
  const totalEarnings = parseFloat((walletQuery.data?.totalEarnings || "0").toString());

  // Calculate total invested for VIP level
  const totalInvested = (investmentsQuery.data || []).reduce((sum: number, inv: any) => {
    return sum + parseFloat(inv.investmentAmount?.toString() || "0");
  }, 0);
  const vip = getVipLevel(totalInvested);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) { toast.error("Enter a gift code"); return; }
    setIsRedeeming(true);
    try {
      const result = await redeemMutation.mutateAsync({ code: giftCode.trim() });
      await utils.wallet.getBalance.invalidate();
      toast.success(`Gift code redeemed! ₦${result.amount.toLocaleString()} added to your balance.`);
      setGiftCode("");
      setShowGiftModal(false);
    } catch (err: any) {
      toast.error(err.message || "Invalid gift code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const QUICK_ACTIONS = [
    { label: "Recharge", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, path: "/deposit" },
    { label: "Withdraw", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, path: "/withdraw" },
    { label: "Service",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, href: CONFIG.telegramSupport },
    { label: "Channel",  icon: <svg viewBox="0 0 24 24" fill="#229ED9" className="w-5 h-5"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.06 14.888l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.447c.537-.194 1.006.131.789.684z"/></svg>, href: CONFIG.telegramChannel },
  ];

  const MENU_ITEMS = [
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>,
      label: "Personal Information",
      onClick: () => navigate("/profile"),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-5 h-5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      label: "Income Details",
      onClick: () => navigate("/income"),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
      label: "Recharge Details",
      onClick: () => navigate("/wallet"),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
      label: "Withdrawal Details",
      onClick: () => navigate("/wallet"),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" className="w-5 h-5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
      label: "Gift Code",
      onClick: () => setShowGiftModal(true),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
      label: "About Us",
      onClick: () => toast.info("Nexus Tech — Device Rental, Simplified."),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      label: "Change Password",
      onClick: () => setShowPasswordModal(true),
    },
    {
      icon: <svg viewBox="0 0 24 24" fill="#229ED9" className="w-5 h-5"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.06 14.888l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.447c.537-.194 1.006.131.789.684z"/></svg>,
      label: "Join Telegram Channel",
      onClick: () => window.open(CONFIG.telegramChannel, "_blank"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero profile header */}
      <div className="relative">
        <div
          className="h-52 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-3 border-white shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center overflow-hidden">
                <img src={LOGO_URL} alt="Nexus Tech" className="w-12 h-12" />
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs font-bold px-1.5 py-0.5 rounded-full text-white shadow"
                style={{ background: vip.color, fontSize: "9px" }}>
                {vip.name}
              </span>
            </div>
            {/* User info */}
            <div className="flex-1 text-white pb-1">
              <p className="font-bold text-lg leading-tight">{user.username || user.phoneNumber}</p>
              <p className="text-white/70 text-xs">ID: {user.userId || "—"}</p>
            </div>
            <div className="pb-1">
              <NotificationBell />
            </div>
          </div>
        </div>
      </div>

      {/* VIP progress bar */}
      <div className="mx-4 -mt-2 bg-white rounded-xl shadow-sm p-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-gray-500">{vip.name}</span>
          <span className="text-xs text-gray-400">₦{totalInvested.toLocaleString()} invested</span>
        </div>
        {(() => {
          const nextVip = CONFIG.vipLevels[vip.level + 1];
          const progress = nextVip
            ? Math.min(100, ((totalInvested - vip.minInvested) / (nextVip.minInvested - vip.minInvested)) * 100)
            : 100;
          return (
            <>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, background: vip.color }} />
              </div>
              {nextVip && (
                <p className="text-xs text-gray-400 mt-1 text-right">
                  ₦{(nextVip.minInvested - totalInvested).toLocaleString()} more to {nextVip.name}
                </p>
              )}
            </>
          );
        })()}
      </div>

      {/* Balance card */}
      <div className="mx-4 mt-3 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-2xl p-5 shadow-lg text-white">
        <div className="grid grid-cols-3 divide-x divide-white/20 text-center">
          <div>
            <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
            <p className="text-blue-100 text-xs mt-0.5">Balance</p>
          </div>
          <div>
            <p className="text-2xl font-bold">₦{totalInvested.toLocaleString()}</p>
            <p className="text-blue-100 text-xs mt-0.5">Invested</p>
          </div>
          <div>
            <p className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</p>
            <p className="text-blue-100 text-xs mt-0.5">Total Income</p>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="mx-4 mt-3 grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => action.href ? window.open(action.href, "_blank") : navigate(action.path!)}
            className="bg-white rounded-xl py-3 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition"
          >
            <span className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              {action.icon}
            </span>
            <span className="text-xs text-gray-600 font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Admin button */}
      {user.role === "admin" && (
        <div className="mx-4 mt-3">
          <button onClick={() => navigate("/admin")}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl py-3 text-sm font-bold shadow-sm hover:shadow-md transition">
            Admin Panel
          </button>
        </div>
      )}

      {/* Menu list */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        {MENU_ITEMS.map((item) => (
          <MenuItem key={item.label} icon={item.icon} label={item.label} onClick={item.onClick} />
        ))}
        <MenuItem
          danger
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-5 h-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
          label="Log Out"
          onClick={handleLogout}
        />
      </div>

      <BottomNav />

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <p className="font-bold text-lg text-gray-900">Change Password</p>
              <button onClick={() => { setShowPasswordModal(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!currentPwd || !newPwd || !confirmPwd) { toast.error("Fill in all fields"); return; }
              if (newPwd.length < 6) { toast.error("New password must be at least 6 characters"); return; }
              if (newPwd !== confirmPwd) { toast.error("New passwords do not match"); return; }
              setChangingPwd(true);
              try {
                await changePasswordMutation.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd });
                toast.success("Password changed successfully!");
                setShowPasswordModal(false);
                setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
              } catch (err: any) {
                toast.error(err.message || "Failed to change password");
              } finally { setChangingPwd(false); }
            }} className="space-y-3">
              {[
                { label: "Current Password", value: currentPwd, set: setCurrentPwd, placeholder: "Enter current password" },
                { label: "New Password", value: newPwd, set: setNewPwd, placeholder: "Minimum 6 characters" },
                { label: "Confirm New Password", value: confirmPwd, set: setConfirmPwd, placeholder: "Re-enter new password" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input type="password" placeholder={placeholder} value={value} onChange={(e) => set(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition" />
                </div>
              ))}
              <button type="submit" disabled={changingPwd}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold text-sm transition hover:opacity-90 disabled:opacity-60 mt-2">
                {changingPwd ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gift Code Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-lg text-gray-900">Redeem Gift Code</p>
              <button onClick={() => setShowGiftModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Get gift codes from our{" "}
              <a href={CONFIG.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">
                Telegram channel
              </a>
            </p>
            <form onSubmit={handleRedeem} className="space-y-3">
              <input
                type="text"
                placeholder="Enter gift code (e.g. NT3F8A2C)"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:border-blue-400"
              />
              <button type="submit" disabled={isRedeeming}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60">
                {isRedeeming ? "Redeeming..." : "Redeem Code"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
