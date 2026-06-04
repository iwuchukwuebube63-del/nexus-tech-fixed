import { CONFIG } from "@/config";

export function FloatingCustomerService() {
  return (
    <a
      href={CONFIG.telegramSupport}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all"
      title="Customer Support"
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.016 9.504c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.06 14.888l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.447c.537-.194 1.006.131.789.684z"/>
      </svg>
    </a>
  );
}
