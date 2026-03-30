"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SelectTypeaheadProvider } from "@/providers/select-typeahead-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        {children}
        <SelectTypeaheadProvider />
        <Toaster richColors position="top-right" closeButton />
      </ThemeProvider>
    </SessionProvider>
  );
}
