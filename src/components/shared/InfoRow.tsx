import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  iconClass?: string;
}

export function InfoRow({ icon: Icon, label, value, iconClass }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("w-3.5 h-3.5 shrink-0", iconClass ?? "text-emerald-500")} />
      <div className="min-w-0">
        <p className="label-xs">{label}</p>
        <p className="stat-value truncate">{value}</p>
      </div>
    </div>
  );
}
