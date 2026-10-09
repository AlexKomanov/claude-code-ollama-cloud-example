import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { UserPresence } from '@/types';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  presence: Record<string, UserPresence>;
  
  connect: (socket: Socket) => void;
  disconnect: () => void;
  setConnected: (status: boolean) => void;
  updatePresence: (presence: UserPresence) => void;
  removePresence: (userId: string) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  connected: false,
  presence: {},
  connect: (socket) => set({ socket, connected: true }),
  disconnect: () => set({ socket: null, connected: false }),
  setConnected: (connected) => set({ connected }),
  updatePresence: (presence) => set((state) => ({
    presence: { ...state.presence, [presence.userId]: presence }
  })),
  removePresence: (userId) => set((state) => {
    const newPresence = { ...state.presence };
    delete newPresence[userId];
    return { presence: newPresence };
  }),
}));
