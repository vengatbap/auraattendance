import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-sm max-w-md mx-auto my-6 animate-fade-in">
      {Icon && (
        <div className="flex items-center justify-center size-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 mb-4 shadow-inner">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 mt-2 mb-6 max-w-[280px] leading-relaxed">
        {description}
      </p>
      {action && <div className="w-full flex justify-center">{action}</div>}
    </div>
  );
}
