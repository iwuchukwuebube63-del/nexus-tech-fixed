import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoader } from "@/components/LoadingSpinner";
import BottomNav, { TopBar } from "@/components/BottomNav";
import { toast } from "sonner";
import { CONFIG } from "@/config";

type LevelTab = "level1" | "level2" | "level3";

const MILESTONES = [
  { target: 250000,   reward: 10000  },
  { target: 500000,   reward: 10000  },
  { target: 1000000,  reward: 20000  },
  { target: 2000000,  reward: 20000  },
  { target: 5000000,  reward: 100000 },
];

function TeamVolumeSection() {
  const volumeQuery = trpc.referral.getTeamVolume.useQuery(undefined);
  const data = volumeQuery.data;

  if (volumeQuery.isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-100 rounded mb-4" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const totalVolume = data?.totalVolume || 0;
  const level1Volume = data?.level1Volume || 0;
  const level2Volume = data?.level2Volume || 0;
  const level3Volume = data?.level3Volume || 0;

  // Find current milestone progress
  const currentMilestoneIdx = MILESTONES.findIndex(m => totalVolume < m.target);
  const activeMilestone = currentMilestoneIdx === -1 ? MILESTONES[MILESTONES.length - 1] : MILESTONES[currentMilestoneIdx];
  const prevTarget = currentMilestoneIdx <= 0 ? 0 : MILESTONES[currentMilestoneIdx - 1].target;
  const progressPct = currentMilestoneIdx === -1
    ? 100
    : Math.min(100, ((totalVolume - prevTarget) / (activeMilestone.target - prevTarget)) * 100);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">Team Investment Volume</p>
        <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">3 Levels</span>
      </div>

      {/* Total volume + level breakdown */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <p className="text-purple-200 text-xs mb-0.5">Total Team Volume</p>
        <p className="text-2xl font-bold">₦{totalVolume.toLocaleString()}</p>
        <div className="flex gap-4 mt-3 text-xs">
          <div>
            <p className="text-purple-300">Level 1</p>
            <p className="font-semibold">₦{level1Volume.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-purple-300">Level 2</p>
            <p className="font-semibold">₦{level2Volume.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-purple-300">Level 3</p>
            <p className="font-semibold">₦{level3Volume.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Progress bar to next milestone */}
      {currentMilestoneIdx !== -1 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to next reward</span>
            <span className="font-semibold text-purple-600">₦{activeMilestone.target.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ₦{Math.max(0, activeMilestone.target - totalVolume).toLocaleString()} more to unlock ₦{activeMilestone.reward.toLocaleString()} bonus
          </p>
        </div>
      )}

      {/* Milestone list */}
      <div className="space-y-2">
        {MILESTONES.map((m, i) => {
          const reached = totalVolume >= m.target;
          const isNext = !reached && (i === 0 || totalVolume >= MILESTONES[i - 1].target);
          const pct = Math.min(100, (totalVolume / m.target) * 100);

          return (
            <div
              key={m.target}
              className={`relative rounded-xl p-3 border transition-all ${
                reached
                  ? "bg-green-50 border-green-200"
                  : isNext
                  ? "bg-purple-50 border-purple-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${reached ? "opacity-100" : "opacity-40"}`}>
                    {reached ? "✅" : isNext ? "🔓" : "🔒"}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${reached ? "text-green-700" : isNext ? "text-purple-700" : "text-gray-400"}`}>
                      ₦{m.target.toLocaleString()} Team Volume
                    </p>
                    <p className={`text-xs ${reached ? "text-green-500" : isNext ? "text-purple-400" : "text-gray-300"}`}>
                      Reward: ₦{m.reward.toLocaleString()}
                    </p>
                  </div>
                </div>
                {reached && (
                  <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">Reached</span>
                )}
                {isNext && (
                  <span className="text-xs bg-purple-100 text-purple-600 font-bold px-2 py-0.5 rounded-full">In Progress</span>
                )}
              </div>

              {/* Individual milestone bar */}
              <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${
                    reached ? "bg-green-400" : "bg-purple-400"
                  }`}
                  style={{ width: `${reached ? 100 : pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Invite() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<LevelTab>("level1");

  const referralQuery = trpc.referral.getReferralCode.useQuery(undefined, { enabled: !!user });
  const earningsQuery = trpc.referral.getReferralEarnings.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  const code = referralQuery.data?.referralCode || user.referralCode || "";
  const link = `${window.location.origin}?ref=${code}`;
  const totalEarnings = earningsQuery.data?.totalEarnings || 0;
  const level1 = earningsQuery.data?.level1 || [];
  const level2 = earningsQuery.data?.level2 || [];
  const level3 = earningsQuery.data?.level3 || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const currentList = activeTab === "level1" ? level1 : activeTab === "level2" ? level2 : level3;
  const LEVEL_INFO = [
    { key: "level1" as LevelTab, label: "Level 1", rate: "15%", count: level1.length, color: "from-blue-500 to-blue-600", textColor: "text-blue-600" },
    { key: "level2" as LevelTab, label: "Level 2", rate: "3%", count: level2.length, color: "from-purple-500 to-purple-600", textColor: "text-purple-600" },
    { key: "level3" as LevelTab, label: "Level 3", rate: "2%",  count: level3.length, color: "from-pink-500 to-rose-500",   textColor: "text-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TopBar title="Team & Referrals" />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80" alt="" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-pink-800/80" />
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <p className="text-white text-xl font-bold">Invite & Earn</p>
            <p className="text-white/70 text-sm">Earn on 3 levels of referrals</p>
          </div>
        </div>

        {/* Earnings summary */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-green-100 text-sm mb-1">Total Referral Earnings</p>
          <p className="text-3xl font-bold">₦{Number(totalEarnings).toLocaleString()}</p>
          <div className="flex gap-4 mt-3 text-sm">
            {LEVEL_INFO.map(l => (
              <div key={l.key}>
                <p className="text-green-200 text-xs">{l.label}</p>
                <p className="font-bold">{l.count} members · {l.rate}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Commission levels */}
        <div className="grid grid-cols-3 gap-3">
          {LEVEL_INFO.map((l) => (
            <div key={l.key} className={`bg-gradient-to-br ${l.color} rounded-xl p-3 text-white text-center shadow`}>
              <p className="text-2xl font-bold">{l.rate}</p>
              <p className="text-white/80 text-xs font-semibold mt-0.5">{l.label}</p>
              <p className="text-white/50 text-xs">{l.count} members</p>
            </div>
          ))}
        </div>

        {/* Team Volume Milestones */}
        <TeamVolumeSection />

        {/* Referral code */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-semibold">Your Referral Code</p>
          <p className="font-mono text-3xl font-bold text-gray-900 tracking-widest mb-4">{code || "..."}</p>
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-400 font-mono break-all">{link}</div>
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition">
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Join Nexus Tech and earn daily commissions! Sign up here: ${link}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold text-sm transition">
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share
            </a>
          </div>
        </div>

        {/* Level tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {LEVEL_INFO.map((l) => (
              <button key={l.key} onClick={() => setActiveTab(l.key)}
                className={`flex-1 py-3 text-xs font-bold transition ${
                  activeTab === l.key ? `${l.textColor} border-b-2 border-current` : "text-gray-400"
                }`}>
                {l.label} ({l.count})
              </button>
            ))}
          </div>

          {earningsQuery.isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : currentList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">No {activeTab.replace("level", "Level ")} referrals yet</p>
              {activeTab === "level1" && (
                <p className="text-xs text-gray-300 mt-1">Share your link to start earning</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {currentList.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.phoneNumber?.slice(-2) || "??"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">
                      {r.phoneNumber?.replace(/(\d{4})(\d+)(\d{4})/, "$1****$3") || "—"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                    </p>
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
