import { create } from 'zustand';
import { User } from '@/types';

interface UserState {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  users: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  setUsers: (users) => set({ users }),
}));
