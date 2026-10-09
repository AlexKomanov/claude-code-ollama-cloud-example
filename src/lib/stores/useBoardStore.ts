import { create } from 'zustand';
import { Board, Column, Task } from '@/types';

interface FilterState {
  searchQuery: string;
  assigneeId: string | 'all';
  priority: string | 'all';
  labelIds: string[];
}

interface BoardState {
  boards: Board[];
  currentBoardId: string | null;
  columns: Column[];
  tasks: Record<string, Task>;
  filters: FilterState;

  setBoards: (boards: Board[] | ((prev: Board[]) => Board[])) => void;
  setCurrentBoard: (id: string) => void;
  setColumns: (columns: Column[] | ((prev: Column[]) => Column[])) => void;
  setTasks: (tasks: Record<string, Task> | ((prev: Record<string, Task>) => Record<string, Task>)) => void;
  updateFilter: (filters: Partial<FilterState>) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  currentBoardId: null,
  columns: [],
  tasks: {},
  filters: {
    searchQuery: '',
    assigneeId: 'all',
    priority: 'all',
    labelIds: [],
  },
  setBoards: (boards) => set((state) => ({
    boards: typeof boards === 'function' ? boards(state.boards) : boards,
  })),
  setCurrentBoard: (currentBoardId) => set({ currentBoardId }),
  setColumns: (columns) => set((state) => ({
    columns: typeof columns === 'function' ? columns(state.columns) : columns,
  })),
  setTasks: (tasks) => set((state) => ({
    tasks: typeof tasks === 'function' ? tasks(state.tasks) : tasks,
  })),
  updateFilter: (updates) => set((state) => ({
    filters: { ...state.filters, ...updates }
  })),
}));