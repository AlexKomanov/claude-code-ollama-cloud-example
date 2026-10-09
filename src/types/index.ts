export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string; // URL or initials
  role: 'admin' | 'member';
  color: string; // For presence indicator
}

export interface Board {
  id: string;
  name: string;
  description: string;
  color: string; // Hex for board header
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
  columns: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color: string;
  wipLimit?: number;
  taskIds: string[];
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string; // Markdown
  order: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  reporterId: string;
  labelIds: string[];
  dueDate?: Date;
  estimatedHours?: number;
  storyPoints?: number;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  content: string;
  completed: boolean;
  order: number;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPresence {
  userId: string;
  boardId: string;
  columnId?: string;
  taskId?: string;
  lastSeen: Date;
}
