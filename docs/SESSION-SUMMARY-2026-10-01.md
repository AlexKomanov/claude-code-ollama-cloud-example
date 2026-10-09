# Session Handoff — Playwright CLI Testing (2026-10-01)

> Context for the next session: we are executing an E2E test plan (`TEST_PLAN.md`,
> 26 scenarios) against the app using the **Playwright agent CLI** (`playwright-cli`,
> docs: https://playwright.dev/agent-cli/quick-start). The user explicitly does NOT
> want `npx playwright` — use `playwright-cli` commands (open / find / click / type /
> press / snapshot / screenshot / close). The spec at
> `docs/superpowers/specs/2026-09-28-trello-ticketing-system-design.md` is the source
> of truth for expected features.

## What is this?

Frontend-only Trello-style Kanban ticketing system: Next.js 16.3.6 (App Router),
React 19, TypeScript, shadcn/ui + @base-ui/react, Tailwind 4, Zustand 5, @dnd-kit,
MSW 2 (API mocking), socket.io-client (realtime, mock). Pages: `/` (landing),
`/boards`, `/board/[id]`, `/settings`.

## Progress so far

Test plan created at `TEST_PLAN.md` (LP-*, BP-*, BRD-*, TM-*, BRD2-*, RES-* scenarios).

**Tests executed before getting blocked:**
- ✅ LP-01 Landing page renders ("Welcome to Ticketing", Enter Dashboard button)
- ✅ LP-02 Click "Enter Dashboard" -> navigates to `/boards`
- ✅ BP-01 Boards page renders "My Boards" + 2 board cards (Engineering=5 columns,
  Design=3 columns, member avatars, color bars all present)
- ✅ BP-03 Click Engineering card -> navigates to `/board/b1`
- BP-02 partially verified; BRD-* blocked (see below)

## Bugs found & fixed so far (uncommitted)

1. **`src/app/(dashboard)/board/[id]/page.tsx`** — file had escaped backticks
   in `fetch()` calls at lines ~35, ~140, ~176 -> "Unterminated template"
   build error. All three fixed.
2. **`src/components/ui/label.tsx`** — missing; `TaskModal.tsx` imports
   `@/components/ui/label`. Created it as a native `<label>` wrapper
   (`@base-ui/react` has no Label primitive — checked `node_modules/@base-ui/react/`).
3. **`src/components/board/FilterBar.tsx`** — crashed with `Cannot read properties
   of undefined (reading 'map')`: it read `users` from `useBoardStore` (doesn't
   exist). Fixed to read from `useUserStore`; board page now also fetches
   `/api/users` and calls `setUsers` in the existing data-loading effect.
4. **`src/lib/socket/socket.ts`** — hardcoded `http://localhost:3001` caused endless
   ERR_CONNECTION_REFUSED spam. Changed to `window.location.origin`.
5. **Created real Next.js API routes** under `src/app/api/` (boards, boards/[id],
   boards/[id]/tasks, tasks/[id], tasks/[id]/move, users, users/me) because MSW's
   service worker was NOT intercepting fetches despite logging "worker started"
   — requests hit the dev server and 404'd. Routes return the same mock data
   (`src/lib/mocks/mockData.ts`) the MSW handlers used. NOTE: MSW intercept failure
   is still un-diagnosed; routes are the workaround, decide later which to keep.

## Where we stopped (the blocker)

Both `/boards` and `/board/b1` render sidebar/header but **the `<main>` area is
empty** — the inner page component renders nothing. Root cause found in console:
a **React hydration error** in `BoardsPage`:

    In HTML, <button> cannot be a descendant of <button>
      <Link href="/board/b1"> -> <Card> -> <DropdownMenuTrigger asChild>
        -> nested <Button variant="ghost"> ... nested <button>
    React does not recognize the `asChild` prop on a DOM element

The board-card `<Link>` contains a nested `DropdownMenu` whose trigger renders a
`<button>` inside the outer `<a>` chain, breaking hydration and dropping
`main` content on **both** dashboard pages (boundary swallows the error).
Fix direction: stop wrapping an interactive Card in `<Link>` containing nested
buttons — e.g. render the card as a div with onClick + `router.push`, or split
the dropdown out of the Link, and drop the double-nested `<Button>` inside
`DropdownMenuTrigger asChild`.

## Still untested (next session's work)

- BP-02/04/05/06 (Design board nav, Create Board, Delete board dropdown+confirm)
- BRD-01..12 (columns render, counts, drag and drop, filters, Add Task/Column)
- TM-01..08 (TaskModal: title/desc/priority/assignee/checklist/close)
- BRD2-01/02, RES-01..03 (Design board, mobile viewport, keyboard nav)
- The socket.io endpoint still 404s on `/socket.io/` (no server) — harmless but
  noisy; consider gating `autoConnect` or removing RealtimeProvider connect.

## How to run

- Dev server already running: `npm run dev` -> http://localhost:3000 (a stale
  process on PID 40376 owns port 3000; `kill 40376` if needed).
- Playwright CLI: `playwright-cli open http://localhost:3000 --headed`, then
  `playwright-cli find "..."`, `click <ref>`, `snapshot`, `screenshot`, `close`.
  Snapshots land in `.playwright-cli/page-*.yml` and console logs in
  `.playwright-cli/console-*.log` — read those files for refs/errors.
