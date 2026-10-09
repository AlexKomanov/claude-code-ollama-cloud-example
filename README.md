# Trello-Style Ticketing System

A high-performance, frontend-only Kanban board implementation built with Next.js, React 19, and TypeScript.

## 🚀 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **API Mocking**: MSW (Mock Service Worker)
- **Realtime**: Socket.io-client
- **Validation**: Zod & React Hook Form

## ✨ Key Features
- **Multiple Boards**: Create and manage separate project boards.
- **Full Kanban Flow**: Drag-and-drop tasks across customizable columns.
- **Realtime Sync**: Socket.io integration for presence and task updates.
- **Detailed Task Management**: Modals for editing descriptions, checklists, and comments.
- **Advanced Filtering**: Search and filter tasks by priority, assignee, and text.
- **Role-Based Access**: Admin vs. Member permissions for board and task management.
- **Responsive Design**: Optimized for desktop, tablet, and mobile.

## 🛠️ Getting Started

### Installation
\`\`\`bash
npm install
\`\`\`

### Running the App
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture
- \`src/app\`: Next.js App Router pages and layouts.
- \`src/components\`: UI components divided into \`ui\`, \`board\`, \`task\`, and \`shared\`.
- \`src/lib/stores\`: Zustand stores for Users, Boards, and Sockets.
- \`src/lib/mocks\`: MSW handlers and mock data for API simulation.
- \`src/types\`: Centralized TypeScript interfaces for the entire system.

## 🧪 Testing
The system is designed for E2E testing with Playwright.
\`\`\`bash
npx playwright test
\`\`\`
