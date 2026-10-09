import React from "react";
import { DashboardShell } from "@/components/shared/DashboardShell";
import { CurrentUserLoader } from "@/components/shared/CurrentUserLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CurrentUserLoader />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}