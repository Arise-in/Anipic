"use client";

import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "@/lib/settings-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SettingsProvider>{children}</SettingsProvider>
    </SessionProvider>
  );
}
