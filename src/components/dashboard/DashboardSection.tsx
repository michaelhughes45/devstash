import type { LucideIcon } from "lucide-react";

interface DashboardSectionProps {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardSection({
  title,
  icon: Icon,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
