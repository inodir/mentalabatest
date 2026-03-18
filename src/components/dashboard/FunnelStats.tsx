import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface FunnelStatsProps {
  registered: number;
  answered: number;
  passed?: number;
  passLine?: number;
}

const STEPS = [
  { key: "registered", label: "Ro'yxatdan o'tgan", color: "hsl(217 91% 55%)", bg: "hsl(217 91% 55% / 0.12)" },
  { key: "answered",   label: "Test topshirgan",   color: "hsl(142 71% 45%)", bg: "hsl(142 71% 45% / 0.12)" },
  { key: "passed",     label: "O'tish balidan yuqori", color: "hsl(38 92% 50%)",  bg: "hsl(38 92% 50% / 0.12)" },
];

export function FunnelStats({ registered, answered, passed, passLine }: FunnelStatsProps) {
  const values: Record<string, number> = { registered, answered, passed: passed ?? 0 };
  const steps = passed !== undefined ? STEPS : STEPS.slice(0, 2);
  const max = registered || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>Funnel tahlil</span>
          {passLine && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              O'tish balli: {passLine}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, idx) => {
          const value = values[step.key] ?? 0;
          const widthPct = max > 0 ? (value / max) * 100 : 0;
          const prevValue = idx === 0 ? max : (values[steps[idx - 1].key] ?? 1);
          const dropPct = idx > 0 && prevValue > 0
            ? Math.round((1 - value / prevValue) * 100)
            : null;

          return (
            <div key={step.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{step.label}</span>
                <div className="flex items-center gap-2">
                  {dropPct !== null && (
                    <span className="text-xs text-destructive">▼ {dropPct}%</span>
                  )}
                  <span className="font-bold">{value.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-9 rounded-xl overflow-hidden bg-muted/50 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.15, ease: "easeOut" }}
                  className="h-full rounded-xl flex items-center justify-end pr-3"
                  style={{ backgroundColor: step.color }}
                >
                  <span className="text-white text-xs font-bold">
                    {widthPct.toFixed(1)}%
                  </span>
                </motion.div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center">
                  <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
