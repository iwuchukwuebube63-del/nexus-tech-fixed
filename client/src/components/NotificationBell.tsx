import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifsQuery = trpc.notifications.getAll.useQuery();
  const unreadQuery = trpc.notifications.getUnreadCount.useQuery();
  const markReadMutation = trpc.notifications.markAllRead.useMutation();
  const utils = trpc.useUtils();

  const handleOpen = async () => {
    setOpen(true);
    if ((unreadQuery.data?.count || 0) > 0) {
      await markReadMutation.mutateAsync();
      await utils.notifications.getUnreadCount.invalidate();
    }
  };

  const count = unreadQuery.data?.count || 0;

  return (
    <div className="relative">
      <button onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-600">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-800 text-sm">Notifications</p>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifsQuery.isLoading ? (
                <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
              ) : !notifsQuery.data || notifsQuery.data.length === 0 ? (
                <div className="text-center py-10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="w-10 h-10 mx-auto mb-2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p className="text-gray-400 text-sm">No notifications yet</p>
                </div>
              ) : notifsQuery.data.map((n: any) => (
                <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  {n.imageUrl && (
                    <img src={n.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />
                  )}
                  <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
