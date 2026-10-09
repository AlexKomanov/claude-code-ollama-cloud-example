import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderKanban } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
      <div className="bg-blue-600 p-4 rounded-2xl mb-6">
        <FolderKanban className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
        Welcome to Ticketing
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
        The ultimate Trello-style Kanban system for tracking your tasks, 
        managing boards, and collaborating in real-time.
      </p>
      <Link href="/boards" data-testid="enter-dashboard">
        <Button size="lg" className="px-8 py-6 text-lg rounded-full">
          Enter Dashboard
        </Button>
      </Link>
    </div>
  );
}
