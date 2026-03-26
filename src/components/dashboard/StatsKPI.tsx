import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPIProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: string;
  index: number;
}

const anim = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] as any },
  }),
};

export function StatsKPI({ label, value, sub, icon: Icon, color, index }: KPIProps) {
  return (
    <motion.div custom={index} variants={anim} initial="hidden" animate="visible">
      <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate mb-1">{label}</p>
            <p className="text-2xl font-bold font-mono leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 px-1">
        {title}
      </h2>
      {children}
    </div>
  );
}
