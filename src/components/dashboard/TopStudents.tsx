import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { motion } from "framer-motion";
import type { DTMUser } from "@/lib/dtm-api";

interface TopStudentsProps {
  users: DTMUser[];
  limit?: number;
}

export function TopStudents({ users, limit = 20 }: TopStudentsProps) {
  const withScore = users
    .filter((u) => u.has_result && u.total_point !== null && u.total_point !== undefined)
    .sort((a, b) => (b.total_point ?? 0) - (a.total_point ?? 0))
    .slice(0, limit);

  if (withScore.length === 0) return null;

  const MEDAL: Record<number, { bg: string; emoji: string }> = {
    0: { bg: "linear-gradient(135deg,#f59e0b,#d97706)", emoji: "🥇" },
    1: { bg: "linear-gradient(135deg,#94a3b8,#64748b)", emoji: "🥈" },
    2: { bg: "linear-gradient(135deg,#b45309,#92400e)", emoji: "🥉" },
  };

  function scoreBadgeColor(score: number) {
    if (score >= 150) return "hsl(142 71% 45%)";
    if (score >= 120) return "hsl(217 91% 55%)";
    if (score >= 90) return "hsl(38 92% 50%)";
    return "hsl(0 72% 51%)";
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-yellow-500" />
          Top {limit} o'quvchi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {withScore.map((user, idx) => {
            const medal = MEDAL[idx];
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                {medal ? (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                    title={`#${idx + 1}`}
                  >
                    {medal.emoji}
                  </div>
                ) : (
                  <span className="w-7 shrink-0 text-center text-xs font-bold text-muted-foreground">
                    {idx + 1}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user.school_name || user.school_code || "—"} · {user.district || "—"}
                    {user.group_name && ` · ${user.group_name}`}
                  </p>
                </div>
                <Badge
                  className="shrink-0 font-bold text-white border-0 text-xs"
                  style={{ backgroundColor: scoreBadgeColor(user.total_point ?? 0) }}
                >
                  {user.total_point}
                </Badge>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
