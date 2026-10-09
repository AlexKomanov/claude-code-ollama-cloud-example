"use client";

import React, { useEffect } from "react";
import { worker } from "@/mocks/browser";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const startMSW = async () => {
      try {
        if (typeof window !== 'undefined') {
          // Playwright test runs set NEXT_PUBLIC_ENABLE_MSW=false so browser
          // fetches hit the real API routes (shared server-side mock store),
          // letting API and UI tests observe the same state.
          if (process.env.NEXT_PUBLIC_ENABLE_MSW === "false") return;
          await worker.start({
            onUnhandledRequest: "bypass",
          });
          console.log("✅ MSW worker started");
        }
      } catch (err: any) {
        if (err.message?.includes("already enabled network")) {
          console.log("ℹ️ MSW worker already running");
        } else {
          console.error("❌ MSW worker failed to start", err);
        }
      }
    };

    startMSW();
  }, []);

  return <>{children}</>;
}
