import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-800", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-slate-800 rounded-2xl bg-slate-900/30 overflow-hidden">
      <div className="border-b border-slate-800 p-4 bg-slate-900/50 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex items-end gap-3 h-48 pt-4">
        {Array.from({ length: 7 }).map((_, i) => {
          const heights = ["h-16", "h-28", "h-12", "h-36", "h-24", "h-40", "h-32"];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className={cn("w-full rounded-t-lg", heights[i % heights.length])} />
              <Skeleton className="h-3 w-8" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 3 }: { fields?: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-6 max-w-xl">
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <div className="space-y-4 pt-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
