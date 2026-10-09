"use client";

import React, { useEffect } from "react";
import { socket } from "@/lib/socket/socket";
import { useSocketStore } from "@/lib/stores/useSocketStore";
import { useBoardStore } from "@/lib/stores/useBoardStore";
import { useUserStore } from "@/lib/stores/useUserStore";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { connect, setConnected, updatePresence, removePresence } = useSocketStore();
  const { currentBoardId } = useBoardStore();
  const { currentUser } = useUserStore();

  useEffect(() => {
    // Socket.io server is not part of this frontend-only app; only connect
    // when a realtime backend is actually available (NEXT_PUBLIC_ENABLE_REALTIME).
    const enableRealtime = process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true";
    if (!enableRealtime) return;

    // Initialize connection
    socket.connect();
    connect(socket);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Listen for presence updates
    socket.on("presence:update", (presence) => {
      updatePresence(presence);
    });

    socket.on("user:left", ({ userId }) => {
      removePresence(userId);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("presence:update");
      socket.off("user:left");
      socket.disconnect();
    };
  }, [connect, setConnected, updatePresence, removePresence]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_REALTIME !== "true") return;
    if (!currentUser || !currentBoardId) return;

    // Join board room and update presence
    socket.emit("board:join", { boardId: currentBoardId });
    
    socket.emit("presence:update", {
      userId: currentUser.id,
      boardId: currentBoardId,
      lastSeen: new Date(),
    });

    return () => {
      socket.emit("board:leave", { boardId: currentBoardId });
    };
  }, [currentUser, currentBoardId]);

  return <>{children}</>;
}
