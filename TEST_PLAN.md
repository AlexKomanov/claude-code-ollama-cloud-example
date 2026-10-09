# Playwright Test Plan - Trello-Style Ticketing System

## Test Suite Setup (@playwright/test)

The test library path is the primary one (the playwright-cli interactive agent commands at the bottom are kept for manual/ad-hoc exploration):

- Library: `@playwright/test` (devDependency) + Chromium browsers (`npx playwright install chromium`)
- Config: `playwright.config.ts`
  - Runs against a dedicated server on **http://localhost:3100** (`npm run dev -- -p 3100`, started automatically via `webServer`)
  - Test server runs with **MSW disabled** (`NEXT_PUBLIC_ENABLE_MSW=false`) so browser fetches hit the real Next.js API routes — this is what lets API tests and UI tests observe the same mock store
  - `screenshot: "on"`, `video: "retain-on-failure"`, `trace: "retain-on-failure"` (artifacts land in `test-results/`)
  - Reporters: terminal `list` + HTML report in `playwright-report/` (view with `npx playwright show-report`)
  - Projects: `chromium` (Desktop Chrome) and `mobile` (iPhone 17 Pro Max descriptor on the Chromium engine)
  - `fullyParallel: false`, `workers: 1` — the in-memory mock store is process-global, so tests run serially for determinism
- Run: `npm run test:e2e` (or `npm run test:e2e:ui`)
- State reset: mockData seed copies + `POST /api/mock-reset` route (named without an underscore prefix — Next.js App Router excludes `_`-prefixed folders from routing); mutating specs reset before/after each test
- Selectors: every interactive element has a stable `data-testid`; board/column/task ids are **dynamically discovered** at runtime (via `/api/...` or `[data-testid^=...]` wildcards), never hardcoded to seed ids

### Spec file layout (mirrors the scenario groups)

| File | Covers |
|---|---|
| `e2e/landing.spec.ts` | LP-01..02 |
| `e2e/boards-page.spec.ts` | BP-01..06 |
| `e2e/board.spec.ts` | BRD-01..12 (Engineering) + BRD2-01..02 (Design) |
| `e2e/task-modal.spec.ts` | TM-01..08 |
| `e2e/responsive.spec.ts` | RES-01..03 |
| `e2e/api.spec.ts` | API-01..05 (pure API, no browser) |
| `e2e/mixed.spec.ts` | MIX-01..04 (API + UI in the same tests) |
| `e2e/helpers.ts` | Shared discovery, drag simulation, reset helpers |

---

## Application Overview
This is a Trello-style Kanban board application with:
- Landing page with "Enter Dashboard" button
- Boards listing page (multiple boards)
- Individual board page with columns, tasks, drag-and-drop, filtering, and task modals
- MSW for API mocking
- Socket.io for realtime features

---

## Test Scenarios

### 1. Landing Page Tests
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| LP-01 | Load landing page | Page loads with "Welcome to Ticketing" heading and "Enter Dashboard" button |
| LP-02 | Click "Enter Dashboard" | Navigates to `/boards` page |

### 2. Boards Page Tests
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| BP-01 | Load boards page | Shows "My Boards" heading, displays 2 boards (Engineering, Design) |
| BP-02 | Board cards display correctly | Each board shows name, description, member avatars, column count, color bar |
| BP-03 | Click "Engineering" board | Navigates to `/board/b1` |
| BP-04 | Click "Design" board | Navigates to `/board/b2` |
| BP-05 | Click "Create Board" button | Opens board creation (if implemented) |
| BP-06 | Delete board (admin) | Click dropdown → Delete Board → confirms → board removed |

### 3. Board Page Tests (Engineering - b1)
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| BRD-01 | Load board page | Shows "Engineering" title with blue color bar, 5 columns (Backlog, To Do, In Progress, In Review, Done) |
| BRD-02 | Column task counts | Backlog: 2, To Do: 1, In Progress: 1, In Review: 0, Done: 1 |
| BRD-03 | Task cards display | Each task shows title, priority badge, assignee avatar |
| BRD-04 | Drag task between columns | Drag "Implement Auth Flow" from Backlog to To Do → task moves visually and API called |
| BRD-05 | Drag task within same column | Reorder tasks in Backlog → order updates |
| BRD-06 | Click "Add Task" button | Opens task modal for selected column |
| BRD-07 | Click existing task | Opens task modal with task details |
| BRD-08 | Filter by search | Type "Auth" → only "Implement Auth Flow" visible |
| BRD-09 | Filter by assignee | Select "John Developer" → shows tasks assigned to u2 |
| BRD-10 | Filter by priority | Select "Critical" → shows only critical priority tasks |
| BRD-11 | Clear filters | Click clear → all tasks visible again |
| BRD-12 | Click "Add Column" | Adds new column to board |

### 4. Task Modal Tests
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TM-01 | Open task modal | Modal opens with task title, description, priority, assignee |
| TM-02 | Edit task title | Change title → save → updates on board |
| TM-03 | Edit task description | Change description → save → updates on board |
| TM-04 | Change priority | Change from Critical to High → badge updates |
| TM-05 | Change assignee | Reassign to different user → avatar updates |
| TM-06 | Add checklist item | Add item → appears in checklist |
| TM-07 | Toggle checklist item | Check/uncheck → updates completion status |
| TM-08 | Close modal | Click X or overlay → modal closes, changes persist |

### 5. Board Page Tests (Design - b2)
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| BRD2-01 | Load Design board | Shows 3 columns (Ideas, In Progress, Approved), all empty |
| BRD2-02 | Add task to empty column | Click "Add card" → create task → appears in column |

### 6. Responsive/Edge Cases
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| RES-01 | Mobile viewport | Layout adapts, columns stack horizontally scrollable |
| RES-02 | Empty board state | Shows "No boards yet" with create button |
| RES-03 | Keyboard navigation | Tab through elements, Enter to activate buttons |

### 7. API Tests (new — pure API, no browser; `e2e/api.spec.ts`)
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| API-01 | GET endpoints | `/api/boards`, `/api/boards/:id` (404 on miss), `/api/boards/:id/tasks`, `/api/users`, `/api/users/me` return well-shaped data |
| API-02 | Create task via POST | `POST /api/boards/:id/tasks` → 201, task persists in the board's task list |
| API-03 | PATCH task | `PATCH /api/tasks/:id` updates fields and a re-read returns them |
| API-04 | Move task | `PATCH /api/tasks/:id/move` puts the task id only into the destination column's taskIds |
| API-05 | Board create/delete | `POST /api/boards` persists (and binds column.boardId), DELETE returns 204 and the board 404s afterwards |

### 8. Mixed API + UI Tests (new — both sides in the same test; `e2e/mixed.spec.ts`)
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| MIX-01 | API acts → UI verifies | Task created via API appears on the board page card |
| MIX-02 | UI acts → API verifies | Board created in the UI dialog is retrievable via GET /api/boards/:id (4 default columns) |
| MIX-03 | UI edit → API verifies | Title edited in the task modal is reflected by GET /api/tasks/:id |
| MIX-04 | API move → UI verifies | Task moved via /move endpoint renders in the destination column after reload |

---

## Test Data (from mockData.ts)
- **Users**: u1 (Alex Admin), u2 (John Developer), u3 (Jane Designer), u4 (Sarah PM)
- **Boards**: b1 (Engineering), b2 (Design)
- **Tasks**: t1-t5 with various priorities, assignees, columns

---

## Playwright CLI Agent Commands Reference

Based on https://playwright.dev/agent-cli/quick-start:

```bash
# Open a URL
playwright-cli open http://localhost:3000 --headed

# Find elements (cheaper than full snapshot)
playwright-cli find "Enter Dashboard"

# Click element by ref
playwright-cli click <ref>

# Type text
playwright-cli type "search text"

# Press key
playwright-cli press Enter

# Take screenshot
playwright-cli screenshot

# Get accessibility snapshot
playwright-cli snapshot

# Close
playwright-cli close
```

---

## Execution Order
Spec files run serially (`workers: 1`) in this order (alphabetical — matches the plan's groups):
1. `api.spec.ts` — API layer first
2. `board.spec.ts` + `boards-page.spec.ts` + `landing.spec.ts` (UI scenarios LP/BP/BRD/BRD2)
3. `mixed.spec.ts` — combined API+UI
4. `responsive.spec.ts` — last (RES-02 briefly wipes the store; it is reset afterwards)

Each mock store mutating spec resets state before/after its tests via `POST /api/mock-reset`.

---

## Notes
- The app uses MSW for API mocking - all API calls are intercepted
- Socket.io is mocked - realtime events won't actually propagate
- Drag and drop uses @dnd-kit - test with mouse interactions
- All data is client-side state (Zustand) - no persistent backend