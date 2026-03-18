import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import type { DTMSchoolInfo } from "@/lib/dtm-auth";

interface TopSchoolsTableProps {
  schools?: DTMSchoolInfo[];
}

function scoreBg(score: number) {
  if (score >= 150) return "hsl(142 71% 45%)";
  if (score >= 120) return "hsl(217 91% 55%)";
  if (score >= 90)  return "hsl(38 92% 50%)";
  return "hsl(0 72% 51%)";
}

export function TopSchoolsTable({ schools }: TopSchoolsTableProps) {
  if (!schools || schools.length === 0) return null;

  const withScore = schools.filter((s) => (s.avg_total_ball ?? 0) > 0);
  if (withScore.length === 0) return null;

  const sorted = [...withScore].sort((a, b) => (b.avg_total_ball ?? 0) - (a.avg_total_ball ?? 0));
  const top = sorted.slice(0, 10);
  const bottom = sorted.slice(-5).reverse();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Top 10 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top 10 — eng yuqori o'rtacha ball
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {top.map((school, idx) => (
            <motion.div
              key={school.code}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 hover:bg-muted/40 transition-colors"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{
                  background:
                    idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : idx === 1 ? "linear-gradient(135deg,#94a3b8,#64748b)"
                    : idx === 2 ? "linear-gradient(135deg,#b45309,#92400e)"
                    : "hsl(var(--muted))",
                  color: idx > 2 ? "hsl(var(--muted-foreground))" : undefined,
                }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{school.name}</p>
                <p className="text-[10px] text-muted-foreground">{school.district} · {school.code}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {school.tested_percent != null && (
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {school.tested_percent.toFixed(0)}%
                  </span>
                )}
                <Badge
                  className="font-bold text-white border-0 text-xs"
                  style={{ backgroundColor: scoreBg(school.avg_total_ball ?? 0) }}
                >
                  {(school.avg_total_ball ?? 0).toFixed(1)}
                </Badge>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom 5 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Eng past natijalar — diqqat talab
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bottom.map((school, idx) => (
            <motion.div
              key={school.code}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                {sorted.length - idx}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{school.name}</p>
                <p className="text-[10px] text-muted-foreground">{school.district} · {school.answered_count ?? 0}/{school.registered_count ?? 0} natija</p>
              </div>
              <Badge variant="destructive" className="font-bold text-xs shrink-0">
                {(school.avg_total_ball ?? 0).toFixed(1)}
              </Badge>
            </motion.div>
          ))}

          {/* Summary mini-stats */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
            {[
              {
                label: "Jami maktablar",
                value: schools.length,
              },
              {
                label: "Ball bilan",
                value: withScore.length,
              },
              {
                label: "O'rt. ball",
                value: withScore.length > 0
                  ? (withScore.reduce((s, x) => s + (x.avg_total_ball ?? 0), 0) / withScore.length).toFixed(1)
                  : "—",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
