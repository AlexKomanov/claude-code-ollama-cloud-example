import { User, Board, Column, Task } from '@/types';

const RAW_USERS: User[] = [
  {
    id: 'u1',
    email: 'alex.admin@company.com',
    name: 'Alex Admin',
    avatar: 'AA',
    role: 'admin',
    color: '#ef4444',
  },
  {
    id: 'u2',
    email: 'dev.john@company.com',
    name: 'John Developer',
    avatar: 'JD',
    role: 'member',
    color: '#3b82f6',
  },
  {
    id: 'u3',
    email: 'design.jane@company.com',
    name: 'Jane Designer',
    avatar: 'JJ',
    role: 'member',
    color: '#a855f7',
  },
  {
    id: 'u4',
    email: 'pm.sarah@company.com',
    name: 'Sarah PM',
    avatar: 'SP',
    role: 'member',
    color: '#10b981',
  },
];

const RAW_BOARDS: Board[] = [
  {
    id: 'b1',
    name: 'Engineering',
    description: 'Main development board for core features',
    color: '#3b82f6',
    ownerId: 'u1',
    memberIds: ['u1', 'u2', 'u4'],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-09-01'),
    columns: [
      { id: 'c1', boardId: 'b1', name: 'Backlog', order: 0, color: '#f3f4f6', taskIds: ['t1', 't2'] },
      { id: 'c2', boardId: 'b1', name: 'To Do', order: 1, color: '#f3f4f6', taskIds: ['t3'] },
      { id: 'c3', boardId: 'b1', name: 'In Progress', order: 2, color: '#f3f4f6', taskIds: ['t4'] },
      { id: 'c4', boardId: 'b1', name: 'In Review', order: 3, color: '#f3f4f6', taskIds: [] },
      { id: 'c5', boardId: 'b1', name: 'Done', order: 4, color: '#f3f4f6', taskIds: ['t5'] },
    ],
  },
  {
    id: 'b2',
    name: 'Design',
    description: 'UI/UX assets and prototypes',
    color: '#a855f7',
    ownerId: 'u3',
    memberIds: ['u1', 'u3', 'u4'],
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-09-01'),
    columns: [
      { id: 'd1', boardId: 'b2', name: 'Ideas', order: 0, color: '#f3f4f6', taskIds: [] },
      { id: 'd2', boardId: 'b2', name: 'In Progress', order: 1, color: '#f3f4f6', taskIds: [] },
      { id: 'd3', boardId: 'b2', name: 'Approved', order: 2, color: '#f3f4f6', taskIds: [] },
    ],
  },
];

const RAW_TASKS: Record<string, Task> = {
  t1: {
    id: 't1',
    boardId: 'b1',
    columnId: 'c1',
    title: 'Implement Auth Flow',
    description: 'Create the login and signup pages with mock validation',
    order: 0,
    priority: 'critical',
    assigneeId: 'u2',
    reporterId: 'u1',
    labelIds: ['l1'],
    createdAt: new Date('2026-09-20'),
    updatedAt: new Date('2026-09-20'),
    checklist: [],
    attachments: [],
  },
  t2: {
    id: 't2',
    boardId: 'b1',
    columnId: 'c1',
    title: 'Setup Socket.io',
    description: 'Configure realtime event synchronization',
    order: 1,
    priority: 'high',
    assigneeId: 'u2',
    reporterId: 'u4',
    labelIds: ['l2'],
    createdAt: new Date('2026-09-21'),
    updatedAt: new Date('2026-09-21'),
    checklist: [],
    attachments: [],
  },
  t3: {
    id: 't3',
    boardId: 'b1',
    columnId: 'c2',
    title: 'Design Task Cards',
    description: 'Refine the UI for the Kanban cards using shadcn',
    order: 0,
    priority: 'medium',
    assigneeId: 'u3',
    reporterId: 'u1',
    labelIds: ['l3'],
    createdAt: new Date('2026-09-22'),
    updatedAt: new Date('2026-09-22'),
    checklist: [],
    attachments: [],
  },
  t4: {
    id: 't4',
    boardId: 'b1',
    columnId: 'c3',
    title: 'Configure MSW',
    description: 'Setup Mock Service Worker for API simulation',
    order: 0,
    priority: 'low',
    assigneeId: 'u2',
    reporterId: 'u1',
    labelIds: [],
    createdAt: new Date('2026-09-23'),
    updatedAt: new Date('2026-09-23'),
    checklist: [],
    attachments: [],
  },
  t5: {
    id: 't5',
    boardId: 'b1',
    columnId: 'c5',
    title: 'Initial Project Setup',
    description: 'Run create-next-app and install dependencies',
    order: 0,
    priority: 'low',
    assigneeId: 'u1',
    reporterId: 'u1',
    labelIds: [],
    createdAt: new Date('2026-09-01'),
    updatedAt: new Date('2026-09-01'),
    completedAt: new Date('2026-09-02'),
    checklist: [],
    attachments: [],
  },
};

// Pristine copies captured at module load so tests can reset the shared
// server-side store between tests (see /api/mock-reset).
//
// The store lives on `globalThis`: Next dev (Turbopack) can evaluate this
// module more than once across route bundles, and plain module-level objects
// would then be distinct per evaluation. The live store object ids are shared
// via globalThis, and seeds are never handed out by reference — routes may
// mutate board/column/task objects in place, so reset must deep-clone them.
type MockSeeds = { users: User[]; boards: Board[]; tasks: Record<string, Task> };

const g = globalThis as typeof globalThis & {
  __MOCK_STORE__?: { users: User[]; boards: Board[]; tasks: Record<string, Task> };
  __MOCK_SEEDS__?: MockSeeds;
};

if (!g.__MOCK_SEEDS__) {
  g.__MOCK_SEEDS__ = {
    users: structuredClone(RAW_USERS),
    boards: structuredClone(RAW_BOARDS),
    tasks: structuredClone(RAW_TASKS),
  };
}
if (!g.__MOCK_STORE__) {
  g.__MOCK_STORE__ = {
    users: structuredClone(RAW_USERS),
    boards: structuredClone(RAW_BOARDS),
    tasks: structuredClone(RAW_TASKS),
  };
}

/** Live store aliases — every route mutates the same globalThis arrays. */
export const MOCK_USERS: User[] = g.__MOCK_STORE__.users;
export const MOCK_BOARDS: Board[] = g.__MOCK_STORE__.boards;
export const MOCK_TASKS: Record<string, Task> = g.__MOCK_STORE__.tasks;

/**
 * Mutates the exported mock stores in place (not reassignment — existing
 * imports keep working) back to the pristine seed values. Seed objects are
 * deep-cloned on each restore so past mutations never leak into the seed.
 */
export function resetMockData(): void {
  const store = g.__MOCK_STORE__;
  const seeds = g.__MOCK_SEEDS__;
  store.users.splice(0, store.users.length, ...structuredClone(seeds.users));
  store.boards.splice(0, store.boards.length, ...structuredClone(seeds.boards));
  for (const key of Object.keys(store.tasks)) delete store.tasks[key];
  Object.assign(store.tasks, structuredClone(seeds.tasks));
}
