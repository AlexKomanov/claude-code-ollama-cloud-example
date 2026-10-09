import { io, Socket } from "socket.io-client";

// Using a mock URL for now; in production this would be the server address
// For development, use the current host and port
const SOCKET_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000");

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
});
