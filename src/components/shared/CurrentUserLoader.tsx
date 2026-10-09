"use client";

import React, { useEffect } from "react";
import { useUserStore } from "@/lib/stores/useUserStore";

/**
 * Loads the signed-in user (/api/users/me) into the user store on mount.
 * Without this, currentUser stays null and role-based checks
 * (delete board, task permissions) silently hide admin actions.
 */
export function CurrentUserLoader() {
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (!response.ok) return;
        const user = await response.json();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };
    loadCurrentUser();
  }, [setCurrentUser]);

  return null;
}