import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  welcomeBonus?: number;
  minWithdrawal?: number;
  referralBonusLevel1?: number;
  referralBonusLevel2?: number;
  telegramUsername?: string;
}

export function WelcomePopup({
  isOpen,
  onClose,
  userId,
  welcomeBonus = 500,
  minWithdrawal = 2000,
  referralBonusLevel1 = 15,
  referralBonusLevel2 = 5,
  telegramUsername = "nexus_tech_support",
}: WelcomePopupProps) {
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    setLogoUrl("/manus-storage/nexus-tech-logo.png");
  }, []);

  const maskedUserId = userId ? `${userId.substring(0, 4)}****${userId.substring(userId.length - 4)}` : "****";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-red-500 rounded-full p-2 hover:bg-red-600 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Logo and User ID */}
              <div className="flex flex-col items-center gap-3">
                {logoUrl && (
                  <img src={logoUrl} alt="Nexus Tech" className="w-16 h-16 object-contain" />
                )}
                <div className="text-center">
                  <p className="text-sm opacity-90">User ID</p>
                  <p className="text-2xl font-bold font-mono">{maskedUserId}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Welcome Bonus */}
              <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-gray-600">💚 Welcome Bonus</p>
                <p className="text-xl font-bold text-green-700">₦{welcomeBonus.toLocaleString()}</p>
              </div>

              {/* Minimum Withdrawal */}
              <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-gray-600">💰 Minimum Withdrawal</p>
                <p className="text-xl font-bold text-blue-700">₦{minWithdrawal.toLocaleString()}</p>
              </div>

              {/* Referral Bonuses */}
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-gray-600">🎁 Referral Bonuses</p>
                <div className="space-y-1 mt-2">
                  <p className="text-sm font-semibold text-yellow-700">
                    Level 1: {referralBonusLevel1}% of referral deposit
                  </p>
                  <p className="text-sm font-semibold text-yellow-700">
                    Level 2: {referralBonusLevel2}% of referral deposit
                  </p>
                </div>
              </div>

              {/* Customer Service Info */}
              <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded">
                <p className="text-sm text-gray-600">📞 Customer Service</p>
                <p className="text-sm font-semibold text-purple-700 mt-1">
                  Contact us on Telegram: @{telegramUsername}
                </p>
              </div>

              {/* Join Channel Button */}
              <Button
                onClick={() => window.open(`https://t.me/${telegramUsername}`, "_blank")}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg"
              >
                📱 Join Telegram Channel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
