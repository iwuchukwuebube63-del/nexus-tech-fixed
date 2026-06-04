import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import { toast } from "sonner";

type Tab = "users" | "transactions" | "miners" | "giftcodes" | "notifications";

export default function AdminPanel() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("users");

  // User search
  const [searchPhone, setSearchPhone] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftCount, setGiftCount] = useState("1");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [giftMaxUses, setGiftMaxUses] = useState("1");
  const [giftExpiry, setGiftExpiry] = useState("");
  const [giftCustomCode, setGiftCustomCode] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const searchQuery = trpc.admin.searchUser.useQuery(
    { query: searchPhone },
    { enabled: searchPhone.length >= 3 }
  );
  const allUsersQuery = trpc.admin.getAllUsers.useQuery(undefined, { enabled: tab === "users" && !!user && user.role === "admin" });
  const pendingTxQuery = trpc.admin.getPendingTransactions.useQuery(undefined, { enabled: tab === "transactions" && !!user && user.role === "admin" });
  const minersQuery = trpc.cloudMiners.getAll.useQuery(undefined, { enabled: tab === "miners" && !!user });
  const plansQuery = trpc.investments.getPlans.useQuery(undefined, { enabled: tab === "miners" && !!user });

  const adjustBalanceMutation = trpc.admin.adjustBalance.useMutation();
  const setRoleMutation = trpc.admin.setUserRole.useMutation();
  const approveTxMutation = trpc.admin.approveTransaction.useMutation();
  const toggleMinerMutation = trpc.admin.toggleCloudMiner.useMutation();
  const togglePlanMutation = trpc.admin.togglePlan.useMutation();
  const generateGiftMutation = trpc.admin.generateGiftCode.useMutation();
  const resetPasswordMutation = trpc.admin.resetUserPassword.useMutation();
  const banUserMutation = trpc.admin.banUser.useMutation();
  const settingsQuery = trpc.admin.getSettings.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const togglePaystackMutation = trpc.admin.togglePaystack.useMutation();
  const broadcastMutation = trpc.admin.broadcastNotification.useMutation();
  const deleteNotifMutation = trpc.admin.deleteNotification.useMutation();
  const notifsQuery = trpc.admin.getNotifications.useQuery(undefined, { enabled: tab === "notifications" && !!user && user.role === "admin" });
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifImageUrl, setNotifImageUrl] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const allGiftCodesQuery = trpc.admin.getAllGiftCodes.useQuery(undefined, { enabled: tab === "giftcodes" && !!user && user.role === "admin" });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { navigate("/"); return; }
    if (user?.role !== "admin") { toast.error("Admin access only"); navigate("/dashboard"); }
  }, [isAuthenticated, loading, user, navigate]);

  useEffect(() => {
    if (searchQuery.data) setSelectedUser(searchQuery.data);
  }, [searchQuery.data]);

  if (loading || !user) return <PageLoader />;
  if (user.role !== "admin") return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) { toast.error("Enter a phone number"); return; }
    setSearchPhone(searchInput.trim());
    setSelectedUser(null);
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !balanceAmount) return;
    setIsAdjusting(true);
    try {
      const result = await adjustBalanceMutation.mutateAsync({
        userId: selectedUser.id,
        amount: parseFloat(balanceAmount),
      });
      toast.success(`Balance updated. New balance: ₦${result.newBalance.toLocaleString()}`);
      setBalanceAmount("");
      setSearchPhone(""); setSearchPhone(searchInput.trim()); // re-fetch
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust balance");
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleSetRole = async (userId: number, role: "user" | "admin") => {
    try {
      await setRoleMutation.mutateAsync({ userId, role });
      await utils.admin.getAllUsers.invalidate();
      toast.success(`User role set to ${role}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to set role");
    }
  };

  const handleApproveTx = async (txId: number, approve: boolean) => {
    try {
      await approveTxMutation.mutateAsync({ transactionId: txId, approve });
      await utils.admin.getPendingTransactions.invalidate();
      toast.success(approve ? "Transaction approved" : "Transaction declined");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const handleToggleMiner = async (minerId: number, current: boolean) => {
    try {
      await toggleMinerMutation.mutateAsync({ minerId, isUnlocked: !current });
      await utils.cloudMiners.getAll.invalidate();
      toast.success(!current ? "Miner unlocked!" : "Miner locked");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "users",         label: "Users",        icon: "👥" },
    { key: "transactions",  label: "Deposits",     icon: "💳" },
    { key: "miners",        label: "Miners",       icon: "⛏️" },
    { key: "giftcodes",     label: "Gift Codes",   icon: "🎁" },
    { key: "notifications", label: "Broadcast",    icon: "📢" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <p className="font-bold text-gray-900">Admin Panel</p>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-blue-600 font-medium">
            ← Dashboard
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="bg-white rounded-xl flex p-1 shadow-sm mb-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${tab === t.key ? "bg-blue-600 text-white shadow" : "text-gray-500"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 pb-10 space-y-4">

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <>
            {/* Search by phone */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3">Search User by Phone</p>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Phone, User ID, or Username"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
                  Search
                </button>
              </form>

              {searchQuery.isLoading && <p className="text-sm text-gray-400 mt-3">Searching...</p>}
              {searchPhone && !searchQuery.isLoading && !selectedUser && (
                <p className="text-sm text-red-500 mt-3">No user found</p>
              )}

              {selectedUser && (
                <div className="mt-4 bg-blue-50 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Phone", selectedUser.phoneNumber],
                      ["User ID", selectedUser.userId],
                      ["Balance", `₦${parseFloat(selectedUser.balance || "0").toLocaleString()}`],
                      ["Total Earned", `₦${parseFloat(selectedUser.totalEarnings || "0").toLocaleString()}`],
                      ["Role", selectedUser.role],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-semibold text-gray-800">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Adjust balance */}
                  <form onSubmit={handleAdjustBalance} className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount (+/-)"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                    <button type="submit" disabled={isAdjusting}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60">
                      {isAdjusting ? "..." : "Adjust Balance"}
                    </button>
                  </form>

                  {/* Toggle admin */}
                  <button
                    onClick={() => handleSetRole(selectedUser.id, selectedUser.role === "admin" ? "user" : "admin")}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                      selectedUser.role === "admin"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    {selectedUser.role === "admin" ? "Remove Admin" : "Make Admin"}
                  </button>

                  {/* Reset password */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reset User Password</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="New password" value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                      <button
                        onClick={async () => {
                          if (!newUserPassword || newUserPassword.length < 6) { toast.error("Min 6 characters"); return; }
                          try {
                            await resetPasswordMutation.mutateAsync({ userId: selectedUser.id, newPassword: newUserPassword });
                            toast.success("Password reset successfully");
                            setNewUserPassword("");
                          } catch (err: any) { toast.error(err.message || "Failed"); }
                        }}
                        disabled={resetPasswordMutation.isPending}
                        className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Ban / Unban */}
                  <button
                    onClick={async () => {
                      const isBanned = selectedUser.isBanned;
                      try {
                        await banUserMutation.mutateAsync({ userId: selectedUser.id, banned: !isBanned });
                        setSelectedUser({ ...selectedUser, isBanned: !isBanned });
                        await utils.admin.getAllUsers.invalidate();
                        toast.success(isBanned ? "User unbanned" : "User banned");
                      } catch (err: any) { toast.error(err.message || "Failed"); }
                    }}
                    disabled={banUserMutation.isPending}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                      selectedUser.isBanned
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {banUserMutation.isPending ? "..." : selectedUser.isBanned ? "Unban User" : "Ban User"}
                  </button>
                </div>
              )}
            </div>

            {/* All users list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-semibold text-gray-800">All Users ({allUsersQuery.data?.length || 0})</p>
              </div>
              {allUsersQuery.isLoading ? (
                <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
              ) : (allUsersQuery.data || []).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{u.phoneNumber}</p>
                    <p className="text-xs text-gray-400">₦{parseFloat(u.balance || "0").toLocaleString()} • {u.role}</p>
                  </div>
                  <button
                    onClick={() => handleSetRole(u.id, u.role === "admin" ? "user" : "admin")}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                      u.role === "admin" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500 hover:bg-purple-100 hover:text-purple-600"
                    }`}
                  >
                    {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TRANSACTIONS TAB ── */}
        {tab === "transactions" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Pending Transactions</p>
              <p className="text-xs text-gray-400">Approve deposits to credit users, decline to reject</p>
            </div>
            {pendingTxQuery.isLoading ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
            ) : !pendingTxQuery.data || pendingTxQuery.data.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No pending transactions</p>
            ) : (pendingTxQuery.data || []).map((tx: any) => (
              <div key={tx.id} className="px-5 py-4 border-b border-gray-50 last:border-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 capitalize">{tx.type} — ₦{parseFloat(tx.grossAmount || tx.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{tx.phoneNumber} • {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}</p>
                    <p className="text-xs text-gray-400">{tx.description}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-semibold">Pending</span>
                </div>
                {/* Bank details for withdrawals */}
                {tx.type === "withdrawal" && tx.bankName && (
                  <div className="bg-orange-50 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-semibold text-orange-800">Pay to:</p>
                    <p className="text-orange-700">Bank: <span className="font-semibold">{tx.bankName}</span></p>
                    <p className="text-orange-700">Account: <span className="font-semibold">{tx.accountNumber}</span></p>
                    <p className="text-orange-700">Name: <span className="font-semibold">{tx.accountName}</span></p>
                    <p className="text-orange-700">Net Amount: <span className="font-bold text-orange-900">₦{parseFloat(tx.amount).toLocaleString()}</span></p>
                  </div>
                )}
                {/* Receipt for deposits */}
                {tx.type === "deposit" && tx.receiptUrl && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500">Payment Receipt:</p>
                    <img src={tx.receiptUrl} alt="Receipt" className="max-h-40 rounded-xl object-contain border border-gray-200 w-full" />
                  </div>
                )}
                {tx.type === "deposit" && !tx.receiptUrl && (
                  <p className="text-xs text-gray-400 italic">No receipt uploaded</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveTx(tx.id, true)}
                    disabled={approveTxMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleApproveTx(tx.id, false)}
                    disabled={approveTxMutation.isPending}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GIFT CODES TAB ── */}
        {tab === "giftcodes" && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3">Generate Gift Codes</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Amount per code (₦)</label>
                    <input type="number" placeholder="e.g. 5000" value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max uses per code</label>
                    <input type="number" min="1" placeholder="1" value={giftMaxUses}
                      onChange={(e) => setGiftMaxUses(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Number of codes (max 50)</label>
                    <input type="number" min="1" max="50" placeholder="1" value={giftCount} onChange={(e) => setGiftCount(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Expiry (days, optional)</label>
                    <input type="number" min="1" placeholder="No expiry"
                      value={giftExpiry}
                      onChange={(e) => setGiftExpiry(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Custom code (only for single code)</label>
                  <input type="text" placeholder="e.g. CHRISTMAS2026"
                    value={giftCustomCode}
                    onChange={(e) => setGiftCustomCode(e.target.value.toUpperCase())}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-400" />
                </div>
                <button
                  onClick={async () => {
                    if (!giftAmount) { toast.error("Enter amount"); return; }
                    try {
                      const result = await generateGiftMutation.mutateAsync({
                        amount: parseFloat(giftAmount),
                        count: parseInt(giftCount) || 1,
                        maxUses: parseInt(giftMaxUses) || 1,
                        expiryDays: giftExpiry ? parseInt(giftExpiry) : undefined,
                        customCode: giftCustomCode || undefined,
                      });
                      setGeneratedCodes(result.codes);
                      await utils.admin.getAllGiftCodes.invalidate();
                      toast.success(`${result.codes.length} codes generated!`);
                    } catch (err: any) { toast.error(err.message); }
                  }}
                  disabled={generateGiftMutation.isPending}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
                >
                  {generateGiftMutation.isPending ? "Generating..." : "Generate Codes"}
                </button>
                {generatedCodes.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Generated Codes:</p>
                    <div className="space-y-1">
                      {generatedCodes.map((c) => (
                        <div key={c} className="flex justify-between items-center">
                          <code className="font-mono text-sm font-bold text-blue-700">{c}</code>
                          <button onClick={() => { navigator.clipboard.writeText(c); toast.success("Copied!"); }}
                            className="text-xs text-gray-400 hover:text-gray-600">Copy</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800">All Gift Codes</p>
              </div>
              {(allGiftCodesQuery.data || []).map((gc: any) => (
                <div key={gc.id} className="flex justify-between items-center px-5 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <code className="font-mono font-bold text-sm text-gray-800">{gc.code}</code>
                    <p className="text-xs text-gray-400">₦{parseFloat(gc.amount).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${gc.isUsed ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-700"}`}>
                    {gc.isUsed ? "Used" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MINERS TAB ── */}
        {tab === "miners" && (
          <>
          {/* Investment Plans lock/unlock */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Investment Plans</p>
              <p className="text-xs text-gray-400">Lock or unlock device rental plans for users</p>
            </div>
            {plansQuery.isLoading ? (
              <p className="text-center text-gray-400 text-sm py-6">Loading...</p>
            ) : (plansQuery.data || []).map((plan: any) => (
              <div key={plan.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-gray-800">{plan.deviceName}</p>
                  <p className="text-xs text-gray-400">
                    Tier {plan.planLevel} · ₦{parseFloat(plan.investmentAmount).toLocaleString()} · ₦{parseFloat(plan.dailyCommission).toLocaleString()}/day
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await togglePlanMutation.mutateAsync({ planId: plan.id, isUnlocked: !plan.isUnlocked });
                      await utils.investments.getPlans.invalidate();
                      toast.success(plan.isUnlocked ? "Plan locked" : "Plan unlocked!");
                    } catch (err: any) { toast.error(err.message || "Failed"); }
                  }}
                  disabled={togglePlanMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    plan.isUnlocked !== false
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  {plan.isUnlocked !== false ? "🔓 Unlocked" : "🔒 Locked"}
                </button>
              </div>
            ))}
          </div>

          {/* Cloud Miners lock/unlock */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800">Cloud Miners</p>
              <p className="text-xs text-gray-400">Toggle to unlock/lock miners for users</p>
            </div>
            {minersQuery.isLoading ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
            ) : (minersQuery.data || []).map((miner: any) => (
              <div key={miner.id} className="px-5 py-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{miner.name}</p>
                  <p className="text-xs text-gray-400">
                    ₦{parseFloat(miner.price).toLocaleString()} • ₦{parseFloat(miner.dailyIncome).toLocaleString()}/day • {miner.duration} days • Quota: {miner.quota}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleMiner(miner.id, miner.isUnlocked)}
                  disabled={toggleMinerMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    miner.isUnlocked
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  {miner.isUnlocked ? "🔓 Unlocked" : "🔒 Locked"}
                </button>
              </div>
            ))}
          </div>
          </>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === "notifications" && (
          <>
            {/* Paystack toggle */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Paystack Payments</p>
                  <p className="text-xs text-gray-400 mt-0.5">Online payment for deposits ≤ ₦20,000</p>
                </div>
                <button
                  onClick={async () => {
                    const current = settingsQuery.data?.paystackEnabled !== false;
                    try {
                      await togglePaystackMutation.mutateAsync({ enabled: !current });
                      await utils.admin.getSettings.invalidate();
                      toast.success(`Paystack ${!current ? "enabled" : "disabled"}`);
                    } catch (err: any) { toast.error(err.message || "Failed"); }
                  }}
                  disabled={togglePaystackMutation.isPending || settingsQuery.isLoading}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
                    settingsQuery.data?.paystackEnabled !== false ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                    settingsQuery.data?.paystackEnabled !== false ? "translate-x-7" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3">Broadcast to All Users</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-semibold uppercase tracking-wide">Title</label>
                  <input type="text" placeholder="Notification title" value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-semibold uppercase tracking-wide">Message</label>
                  <textarea placeholder="Write your message..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-semibold uppercase tracking-wide">Image URL (optional)</label>
                  <input type="url" placeholder="https://..." value={notifImageUrl} onChange={e => setNotifImageUrl(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                </div>
                <button
                  onClick={async () => {
                    if (!notifTitle.trim() || !notifMessage.trim()) { toast.error("Title and message required"); return; }
                    try {
                      await broadcastMutation.mutateAsync({ title: notifTitle, message: notifMessage, imageUrl: notifImageUrl || undefined });
                      await utils.admin.getNotifications.invalidate();
                      toast.success("Notification broadcast to all users!");
                      setNotifTitle(""); setNotifMessage(""); setNotifImageUrl("");
                    } catch (err: any) { toast.error(err.message || "Failed"); }
                  }}
                  disabled={broadcastMutation.isPending}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
                >
                  {broadcastMutation.isPending ? "Sending..." : "Broadcast Notification"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800">Sent Notifications</p>
              </div>
              {(notifsQuery.data || []).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No notifications sent yet</p>
              ) : (notifsQuery.data || []).map((n: any) => (
                <div key={n.id} className="px-5 py-4 border-b border-gray-50 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-300 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</p>
                    </div>
                    <button onClick={async () => {
                      await deleteNotifMutation.mutateAsync({ id: n.id });
                      await utils.admin.getNotifications.invalidate();
                      toast.success("Deleted");
                    }} className="text-red-400 hover:text-red-600 ml-3 text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
