import { http, HttpResponse } from 'msw';
import { MOCK_BOARDS, MOCK_USERS, MOCK_TASKS } from '@/lib/mocks/mockData';
import { Task } from '@/types';

export const handlers = [
  // Boards
  http.get('/api/boards', () => {
    return HttpResponse.json(MOCK_BOARDS);
  }),

  http.get('/api/boards/:id', ({ params }) => {
    const board = MOCK_BOARDS.find(b => b.id === params.id);
    if (!board) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(board);
  }),

  http.post('/api/boards', async ({ request }) => {
    const newBoard = await request.json() as any;
    const board = {
      ...newBoard,
      id: `b${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    MOCK_BOARDS.push(board);
    return HttpResponse.json(board, { status: 201 });
  }),

  http.delete('/api/boards/:id', ({ params }) => {
    const index = MOCK_BOARDS.findIndex(b => b.id === params.id);
    if (index === -1) return new HttpResponse(null, { status: 404 });
    MOCK_BOARDS.splice(index, 1);
    for (const [taskId, task] of Object.entries(MOCK_TASKS)) {
      if (task.boardId === params.id) delete MOCK_TASKS[taskId];
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Users
  http.get('/api/users', () => {
    return HttpResponse.json(MOCK_USERS);
  }),

  http.get('/api/users/me', () => {
    return HttpResponse.json(MOCK_USERS[0]); // Default to Admin
  }),

  // Tasks
  http.get('/api/boards/:id/tasks', ({ params }) => {
    const tasks = Object.values(MOCK_TASKS).filter(t => t.boardId === params.id);
    return HttpResponse.json(tasks);
  }),

  http.get('/api/tasks/:id', ({ params }) => {
    const task = MOCK_TASKS[params.id as keyof typeof MOCK_TASKS];
    if (!task) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(task);
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const existing = MOCK_TASKS[params.id as keyof typeof MOCK_TASKS];
    if (!existing) return new HttpResponse(null, { status: 404 });
    const updates = (await request.json()) as Partial<Task>;
    const updated: Task = { ...existing, ...updates, updatedAt: new Date() };
    MOCK_TASKS[updated.id] = updated;
    return HttpResponse.json(updated);
  }),

  http.patch('/api/tasks/:id/move', async ({ params, request }) => {
    const existing = MOCK_TASKS[params.id as keyof typeof MOCK_TASKS];
    if (!existing) return new HttpResponse(null, { status: 404 });
    const { columnId, order } = (await request.json()) as { columnId: string; order?: number };

    // Take the task out of every column, then insert it at the requested slot.
    for (const board of MOCK_BOARDS) {
      for (const column of board.columns) {
        column.taskIds = column.taskIds.filter(tid => tid !== existing.id);
      }
    }
    const board = MOCK_BOARDS.find(b => b.id === existing.boardId);
    const targetColumn = board?.columns.find(c => c.id === columnId);
    if (targetColumn) {
      const insertAt = typeof order === 'number' ? Math.min(order, targetColumn.taskIds.length) : targetColumn.taskIds.length;
      targetColumn.taskIds.splice(insertAt, 0, existing.id);
    }

    const updated: Task = { ...existing, columnId, updatedAt: new Date() };
    MOCK_TASKS[updated.id] = updated;
    return HttpResponse.json(updated);
  }),

  http.post('/api/boards/:id/tasks', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Task>;
    const task: Task = {
      id: `t${Date.now()}`,
      boardId: params.id as string,
      columnId: body.columnId as string,
      title: body.title || 'Untitled task',
      description: body.description || '',
      order: 0,
      priority: body.priority || 'medium',
      assigneeId: body.assigneeId || undefined,
      reporterId: body.reporterId || 'u1',
      labelIds: [],
      checklist: [],
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    MOCK_TASKS[task.id] = task;
    const board = MOCK_BOARDS.find(b => b.id === task.boardId);
    const column = board?.columns.find(c => c.id === task.columnId);
    if (column) column.taskIds.push(task.id);

    return HttpResponse.json(task, { status: 201 });
  }),

  // Columns (board page persists new columns created in-session)
  http.post('/api/boards/:id/columns', async ({ params, request }) => {
    const body = (await request.json()) as Partial<import('@/types').Column>;
    const board = MOCK_BOARDS.find(b => b.id === params.id);
    if (!board) return new HttpResponse(null, { status: 404 });
    const column: import('@/types').Column = {
      id: `col-${Date.now()}`,
      boardId: board.id,
      name: body.name || 'New Column',
      order: body.order ?? board.columns.length,
      color: body.color || '#f3f4f6',
      taskIds: [],
    };
    board.columns.push(column);
    board.updatedAt = new Date();
    return HttpResponse.json(column, { status: 201 });
  }),
];