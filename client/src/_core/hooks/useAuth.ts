import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // re-check every 60s to detect ban
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { utils.auth.me.setData(undefined, null); },
  });

  // Auto-logout if user is banned
  useEffect(() => {
    if (meQuery.data && (meQuery.data as any).isBanned) {
      logoutMutation.mutateAsync().catch(() => {}).finally(() => {
        utils.auth.me.setData(undefined, null);
        utils.auth.me.invalidate();
        window.location.href = "/";
      });
    }
  }, [meQuery.data]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") return;
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data) && !(meQuery.data as any)?.isBanned,
  }), [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
