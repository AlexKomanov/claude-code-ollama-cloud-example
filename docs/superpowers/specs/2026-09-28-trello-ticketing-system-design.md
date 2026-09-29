# Trello-Style Ticketing System PRD

## Project Overview

A **frontend-only** Trello-style ticketing system built with **Next.js 16.3.6** (App Router), **React 19**, **TypeScript 5.x**, **shadcn/ui**, featuring drag-and-drop, multiple boards, filtering, role-based permissions, and **full realtime updates via Socket.io**. Backend is mocked using **MSW 2.x** with an in-memory store.

---

## Tech Stack (Verified Latest Versions)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.3.6 | React framework (App Router, Server Components) |
| **React** | 19.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **shadcn/ui** | Latest | Component library (Radix + Tailwind) |
| **Tailwind CSS** | 3.4+ | Styling |
| **Zustand** | 4.x | Global state management |
| **MSW** | 2.x | API mocking (Mock Service Worker) |
| **Socket.io** | 4.x | Realtime WebSocket communication |
| **@dnd-kit** | Latest | Accessible drag & drop |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Schema validation |
| **date-fns** | 3.x | Date formatting |

---

## Architecture

### Project Structure
```
/src
  /app                    # Next.js App Router pages
    /(auth)/login         # Login page (mock)
    /(dashboard)/         # Dashboard layout
      /boards             # Boards list
      /board/[id]         # Kanban board view
      /settings           # User settings (admin only)
  /components
    /ui                   # shadcn/ui components
    /board                # Board-specific components
    /task                 # Task cards, modals, forms
    /shared               # Shared components (Header, Sidebar, etc.)
  /lib
    /stores               # Zustand stores
    /mocks                # MSW handlers + mock data
    /socket               # Socket.io client setup
    /hooks                # Custom React hooks
    /utils                # Utilities (cn, date formatting, etc.)
  /types                  # TypeScript types (shared with mock API)
```

---

## Core Features

### 1. Boards Management
- Multiple boards (Engineering, Marketing, Design, Personal)
- Board CRUD: Create, Read, Update (name, description, color), Delete
- Board switching via sidebar/header dropdown
- **Admin only**: Delete boards, archive boards, manage board members

### 2. Kanban Columns (Statuses)
- Default columns: `Backlog` → `To Do` → `In Progress` → `In Review` → `Done`
- Customizable: Add, remove, reorder, rename columns per board
- Column settings: WIP limits, column color
- **Admin only**: Modify column structure

### 3. Task Cards (Tickets)

**Task Fields:**
- Title (required, max 200 chars)
- Description (Markdown support)
- Status (column)
- Priority: `Low` | `Medium` | `High` | `Critical` (color-coded)
- Assignee (from 4 mocked users)
- Labels/Tags (customizable per board)
- Due date
- Estimated hours / Story points
- Attachments (mock - just metadata)
- Checklist items
- Comments (threaded)
- Activity log (who did what when)

**Task Actions:**
- Drag & drop between columns (realtime sync)
- Drag & drop reorder within column
- Click to open detail modal
- Inline edit title (double-click)
- Quick actions: assign, label, priority, due date
- Duplicate, archive, delete
- **Admin only**: Delete any task, force assign, change any field

### 4. Filtering & Search
- **Quick Filters**: My tasks, Assigned to me, High priority, Overdue, No assignee
- **Advanced Filters**: By assignee, label, priority, date range, text search
- **Saved Filters**: Save filter combinations with names
- **Search**: Full-text search across title, description, comments
- **URL State**: Filters reflected in URL for shareable links

### 5. User Roles & Permissions

| Action | Admin | Team Member |
|--------|-------|-------------|
| Create board | ✅ | ✅ |
| Edit board (name/desc) | ✅ | Own boards only |
| Delete board | ✅ | ❌ |
| Archive board | ✅ | ❌ |
| Manage board members | ✅ | ❌ |
| Create column | ✅ | ✅ |
| Edit column | ✅ | ✅ |
| Delete column | ✅ | ❌ |
| Reorder columns | ✅ | ✅ |
| Create task | ✅ | ✅ |
| Edit any task | ✅ | Own tasks only |
| Delete any task | ✅ | Own tasks only |
| Force assign task | ✅ | ❌ |
| Manage labels | ✅ | ✅ |
| View all tasks | ✅ | ✅ |
| Access settings | ✅ | ❌ |

### 6. Mocked Users (4 Total)
1. **Admin**: `alex.admin@company.com` - Full permissions
2. **Developer**: `dev.john@company.com` - Engineering tasks
3. **Designer**: `design.jane@company.com` - Design tasks  
4. **PM**: `pm.sarah@company.com` - Project management tasks

### 7. Realtime Features (Socket.io)
- **Live drag-drop**: See other users moving cards in real-time
- **Presence indicators**: Show who's viewing which board/column
- **Typing indicators**: In comments/composer
- **Notifications**: Task assigned, mentioned, due date approaching
- **Optimistic UI**: Local updates instant, sync in background
- **Conflict resolution**: Last-write-wins with toast notification

---

## API Specification (Mocked via MSW)

### REST Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/boards` | List all boards | User |
| POST | `/api/boards` | Create board | User |
| GET | `/api/boards/:id` | Get board with columns & tasks | User |
| PATCH | `/api/boards/:id` | Update board | Admin/Owner |
| DELETE | `/api/boards/:id` | Delete board | Admin |
| GET | `/api/boards/:id/columns` | Get columns for board | User |
| POST | `/api/boards/:id/columns` | Create column | User |
| PATCH | `/api/columns/:id` | Update column | User |
| DELETE | `/api/columns/:id` | Delete column | Admin |
| PATCH | `/api/columns/reorder` | Reorder columns | User |
| GET | `/api/boards/:id/tasks` | Get tasks (with filters) | User |
| POST | `/api/boards/:id/tasks` | Create task | User |
| GET | `/api/tasks/:id` | Get task detail | User |
| PATCH | `/api/tasks/:id` | Update task | Owner/Admin |
| DELETE | `/api/tasks/:id` | Delete task | Owner/Admin |
| PATCH | `/api/tasks/:id/move` | Move task (column/order) | User |
| POST | `/api/tasks/:id/comments` | Add comment | User |
| GET | `/api/tasks/:id/comments` | Get comments | User |
| POST | `/api/tasks/:id/checklist` | Add checklist item | User |
| PATCH | `/api/checklist/:id` | Toggle checklist | User |
| GET | `/api/users` | List users | User |
| GET | `/api/users/me` | Get current user | User |
| GET | `/api/labels` | Get board labels | User |
| POST | `/api/labels` | Create label | User |
| PATCH | `/api/labels/:id` | Update label | User |
| DELETE | `/api/labels/:id` | Delete label | User |

### WebSocket Events (Socket.io)

**Client → Server:**
```typescript
// Join/leave board room
socket.emit('board:join', { boardId: string })
socket.emit('board:leave', { boardId: string })

// Task movements
socket.emit('task:move', { taskId, columnId, order, boardId })
socket.emit('task:update', { taskId, updates, boardId })
socket.emit('task:create', { task, boardId })
socket.emit('task:delete', { taskId, boardId })

// Presence
socket.emit('presence:update', { boardId, columnId?, taskId? })

// Comments
socket.emit('comment:create', { taskId, content, boardId })
socket.emit('comment:typing', { taskId, boardId, isTyping })
```

**Server → Client:**
```typescript
// Broadcast to board room
socket.on('task:moved', { taskId, columnId, order, userId })
socket.on('task:updated', { taskId, updates, userId })
socket.on('task:created', { task, userId })
socket.on('task:deleted', { taskId, userId })
socket.on('column:updated', { columnId, updates })
socket.on('column:reordered', { columnIds })
socket.on('user:joined', { userId, boardId, columnId? })
socket.on('user:left', { userId, boardId })
socket.on('presence:update', { userId, boardId, columnId?, taskId? })
socket.on('comment:created', { comment, taskId, userId })
socket.on('comment:typing', { userId, taskId, isTyping })
socket.on('notification', { type, message, taskId?, userId })
```

---

## Mock Data Structures

### User Type
```typescript
interface User {
  id: string
  email: string
  name: string
  avatar: string // URL or initials
  role: 'admin' | 'member'
  color: string // For presence indicator
}
```

### Board Type
```typescript
interface Board {
  id: string
  name: string
  description: string
  color: string // Hex for board header
  ownerId: string
  memberIds: string[]
  createdAt: Date
  updatedAt: Date
  columns: Column[]
}
```

### Column Type
```typescript
interface Column {
  id: string
  boardId: string
  name: string
  order: number
  color: string
  wipLimit?: number
  taskIds: string[]
}
```

### Task Type
```typescript
interface Task {
  id: string
  boardId: string
  columnId: string
  title: string
  description: string // Markdown
  order: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigneeId?: string
  reporterId: string
  labelIds: string[]
  dueDate?: Date
  estimatedHours?: number
  storyPoints?: number
  checklist: ChecklistItem[]
  attachments: Attachment[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

interface ChecklistItem {
  id: string
  taskId: string
  content: string
  completed: boolean
  order: number
}
```

---

## UI/UX Design (shadcn/ui)

**Key Components to Build:**
- `BoardHeader` - Board name, color, actions (settings, members, archive)
- `Column` - Column header (name, task count, WIP), task list drop zone
- `TaskCard` - Compact view in column (title, priority badge, assignee avatar, labels, due date)
- `TaskModal` - Full detail view (description, comments, checklist, activity, actions)
- `TaskForm` - Create/edit task (React Hook Form + Zod)
- `ColumnSettings` - Edit column name, color, WIP limit, delete
- `FilterBar` - Quick filters, advanced filters, search, saved filters
- `UserAvatar` - With presence indicator (green dot when online)
- `BoardSwitcher` - Dropdown to switch boards
- `Notifications` - Toast + notification center (bell icon)
- `DragOverlay` - Custom drag preview with @dnd-kit

**Responsive:**
- Desktop: Full kanban (horizontal scroll if many columns)
- Tablet: Horizontal scroll, collapsible sidebar
- Mobile: Single column view with column tabs at bottom

---

## State Management (Zustand Stores)

```typescript
// stores/useBoardStore.ts
interface BoardState {
  boards: Board[]
  currentBoardId: string | null
  columns: Column[]
  tasks: Record<string, Task> // by taskId
  filters: FilterState
  // Actions...
}

// stores/useUserStore.ts
interface UserState {
  currentUser: User
  users: User[]
  // Actions...
}

// stores/useSocketStore.ts
interface SocketState {
  socket: Socket | null
  connected: boolean
  presence: Map<string, UserPresence>
  // Actions...
}
```

---

## Error Handling & Edge Cases
- **Optimistic updates rollback** on socket error
- **Offline queue** - Store mutations locally, sync on reconnect
- **Conflict toast** - "This task was updated by another user. Refreshing..."
- **Empty states** - No boards, no tasks in column, no search results
- **Loading skeletons** - For boards, tasks, task modal
- **Permission denied** - Friendly messages, disable UI elements

---

## Testing Strategy
- **Unit**: Store actions, utility functions, validation schemas
- **Integration**: MSW handlers, socket event handlers
- **E2E**: Playwright - drag-drop, filter, create/edit/delete flows, auth
- **Visual**: Storybook for TaskCard, TaskModal, Column, BoardHeader

---

## Implementation Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Project setup, shadcn/ui, TypeScript config, basic layout |
| 2 | Mock data, MSW setup, user store, login page (mock) |
| 3 | Board list, board creation, board switching |
| 4 | Kanban view: columns, task cards, drag-drop (@dnd-kit) |
| 5 | Task modal: detail view, edit form, comments, checklist |
| 6 | Filtering, search, URL state |
| 7 | Socket.io client, realtime events, presence |
| 8 | Admin features: user management, board settings, permissions |
| 9 | Polish: animations, toasts, empty states, responsive |
| 10 | E2E tests, documentation |

---

## Success Criteria
1. All 4 mocked users can log in and see appropriate permissions
2. Drag-and-drop works smoothly with realtime sync across browser tabs
3. Filtering and search are fast and URL-shareable
4. Admin has full control; team members have restricted editing
5. Multiple boards can be created, switched, and managed
6. All API calls are mocked via MSW with realistic latency
7. Socket.io connection handles reconnection gracefully
8. Responsive design works on mobile, tablet, desktop
9. TypeScript strict mode passes with no errors
10. E2E tests cover all critical user flows