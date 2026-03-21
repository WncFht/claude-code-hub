"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Agentation } from "agentation";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export const QUERY_CLIENT_DEFAULTS = {
  queries: {
    gcTime: 2 * 60 * 1000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  },
};

export const APP_THEME_DEFAULTS = {
  defaultTheme: "dark",
  enableSystem: false,
  storageKey: "claude-code-hub-theme",
} as const;

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: QUERY_CLIENT_DEFAULTS,
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        {...APP_THEME_DEFAULTS}
        enableColorScheme
        disableTransitionOnChange
      >
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
