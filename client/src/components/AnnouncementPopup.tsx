import { useState, useEffect } from "react";

const ANNOUNCEMENT_KEY = "nexus_announcement_dismissed_v2";

const MESSAGE = `🔊 Product Earnings 🔊

Purchase product ₦3,500 → earn ₦700 daily
Purchase product ₦6,000 → earn ₦1,200 daily
Purchase product ₦15,000 → earn ₦3,000 daily

Other products will be unlocked soon — join our Telegram for updates.

🔥 Your earnings automatically arrive in your balance every night at 12:00 AM.

💵 Withdrawals available: 8:00 AM to 8:00 PM daily.

📋 Key Information:
• Withdrawal hours: 8:00 AM – 8:00 PM
• Withdrawal fee: 14%
• Minimum top-up: ₦3,000
• Minimum withdrawal: ₦1,500

You can withdraw daily with no limit.

⭐ Start your investment today — invite family and friends to join and receive exclusive bonuses!`;

export function AnnouncementPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(ANNOUNCEMENT_KEY);
    if (!dismissed) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(ANNOUNCEMENT_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-white font-bold text-base">Platform Announcement</p>
            <p className="text-white/70 text-xs">Important updates from Nexus Tech</p>
          </div>
          <button onClick={dismiss}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {MESSAGE.split("\n").map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-2" />;
            const isBig = line.startsWith("🔊") || line.startsWith("⭐");
            const isBullet = line.startsWith("•");
            const isInfo = line.startsWith("💵") || line.startsWith("🔥") || line.startsWith("📋");
            return (
              <p key={i} className={`leading-relaxed ${
                isBig ? "font-bold text-blue-700 text-sm" :
                isInfo ? "text-blue-600 text-sm font-medium" :
                isBullet ? "text-gray-600 text-sm pl-2" :
                "text-gray-700 text-sm"
              }`}>
                {line}
              </p>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={dismiss}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-bold text-sm transition hover:opacity-90">
            Got it — Start Investing
          </button>
        </div>
      </div>
    </div>
  );
}
