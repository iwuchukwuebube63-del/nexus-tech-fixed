import { useLocation } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp";

const NAV_TABS = [
  { path: "/dashboard", label: "Home",   svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { path: "/invest",    label: "Invest", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { path: "/income",   label: "Income", svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { path: "/invite",   label: "Team",   svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { path: "/mine",     label: "Mine",   svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export function TopBar({ title, showBack, onBack }: { title?: string; showBack?: boolean; onBack?: () => void }) {
  const [, navigate] = useLocation();
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {showBack ? (
          <button onClick={onBack || (() => navigate("/dashboard"))} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-gray-700">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        ) : (
          <img src={LOGO_URL} alt="Nexus Tech" className="h-8 w-8" />
        )}
        <span className="text-base font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
          {title || "Nexus Tech"}
        </span>
      </div>
    </header>
  );
}

export default function BottomNav() {
  const [location, navigate] = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-2xl mx-auto flex">
        {NAV_TABS.map((tab) => {
          const active = location === tab.path;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-all relative ${
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-b-full" />}
              <span className={`transition-transform ${active ? "scale-110" : ""}`}>{tab.svg}</span>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
