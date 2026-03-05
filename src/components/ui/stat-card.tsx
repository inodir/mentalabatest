import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  index?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn("glass-card glass-card-hover rounded-2xl", className)}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-semibold flex items-center gap-1",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                <span className={trend.isPositive ? "rotate-0" : "rotate-180"}>↑</span>
                {Math.abs(trend.value)}% oxirgi oyga nisbatan
              </p>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl scale-150" />
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-3.5 ring-1 ring-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
