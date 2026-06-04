const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663682556160/c3gibsBWEtzjnCZYrC4SKf/nexus-tech-logo-X39j5c7wfsVDZzr9Afqb6A.webp";

function Dots() {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white gap-5">
      <img src={LOGO_URL} alt="Nexus Tech" className="h-20 w-20 animate-pulse" />
      <Dots />
      <p className="text-sm text-gray-400 font-medium">Loading...</p>
    </div>
  );
}

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <img src={LOGO_URL} alt="Nexus Tech" className="h-14 w-14 animate-pulse" />
      <Dots />
    </div>
  );
}
