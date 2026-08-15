import { ReactNode } from "react";
import Link from "next/link";
import { Calendar, Inbox, Scale, Settings } from "lucide-react";

export default function LeaveLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Leave Management</h1>
          <p className="text-sm text-zinc-400">Review requests, manage balances, and configure policies.</p>
        </div>
      </div>

      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          <Link href="/dashboard/leave" className="border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Overview
          </Link>
          <Link href="/dashboard/leave/requests" className="border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Requests
          </Link>
          <Link href="/dashboard/leave/balances" className="border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Balances
          </Link>
          <Link href="/dashboard/leave/types" className="border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Leave Types
          </Link>
        </nav>
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
