import { User, Board, Task } from '@/types';

export type Role = 'admin' | 'member';

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function canEditBoard(user: User | null, board: Board): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return board.ownerId === user.id;
}

export function canDeleteBoard(user: User | null): boolean {
  return isAdmin(user);
}

export function canEditTask(user: User | null, task: Task): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return task.assigneeId === user.id || task.reporterId === user.id;
}

export function canDeleteTask(user: User | null, task: Task): boolean {
  return canEditTask(user, task);
}

export function canManageMembers(user: User | null): boolean {
  return isAdmin(user);
}
