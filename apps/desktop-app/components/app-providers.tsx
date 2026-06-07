"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import {
  configureAuthRefresh,
  restoreSession,
} from "@/features/auth/auth-service";
import { useAppState } from "@/lib/app-state";

export function AppProviders({ children }: { children: ReactNode }) {
  const setSession = useAppState((state) => state.setSession);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    configureAuthRefresh();
    void restoreSession()
      .then((session) => {
        if (session) {
          setSession(session);
        }
      })
      .catch(() => {
        // Keep the demo fallback session when the backend or token is unavailable.
      });
  }, [setSession]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
