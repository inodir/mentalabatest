import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingDown, School } from "lucide-react";
import { motion } from "framer-motion";
import type { DistrictSchoolDTMStats } from "@/hooks/useDistrictDTMDashboard";

interface SchoolReadinessProgressProps {
  schoolStats: DistrictSchoolDTMStats[];
}

function getScoreColor(score: number): string {
  if (score >= 150) return "hsl(142 71% 45%)";
  if (score >= 120) return "hsl(217 91% 55%)";
  if (score >= 90) return "hsl(38 92% 50%)";
  return "hsl(0 72% 51%)";
}

function getProgressColor(percent: number): string {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 60) return "bg-blue-500";
  if (percent >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function SchoolReadinessProgress({ schoolStats }: SchoolReadinessProgressProps) {
  if (!schoolStats || schoolStats.length === 0) return null;

  const withStudents = schoolStats.filter((s) => s.totalStudents > 0);
  if (withStudents.length === 0) return null;

  const sorted = [...withStudents].sort((a, b) => b.averageScore - a.averageScore);
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.length > 3 ? sorted.slice(-3).reverse() : [];

  const testedSorted = [...withStudents].sort((a, b) => {
    const pctA = a.totalStudents > 0 ? (a.studentsWithResults / a.totalStudents) * 100 : 0;
    const pctB = b.totalStudents > 0 ? (b.studentsWithResults / b.totalStudents) * 100 : 0;
    return pctB - pctA;
  });

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Topshirish foizi progress */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <School className="h-4 w-4 text-primary" />
            Test topshirish faolligi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testedSorted.slice(0, 8).map((school, idx) => {
            const pct =
              school.totalStudents > 0
                ? Math.round((school.studentsWithResults / school.totalStudents) * 100)
                : 0;
            return (
              <motion.div
                key={school.schoolCode}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[180px] font-medium">
                    {school.schoolName}
                  </span>
                  <span className="text-muted-foreground shrink-0 ml-2">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                    className={`h-full rounded-full ${getProgressColor(pct)}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top 3 maktab */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top maktablar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {top3.map((school, idx) => (
            <motion.div
              key={school.schoolCode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{
                  background:
                    idx === 0
                      ? "linear-gradient(135deg, #f59e0b, #d97706)"
                      : idx === 1
                      ? "linear-gradient(135deg, #94a3b8, #64748b)"
                      : "linear-gradient(135deg, #b45309, #92400e)",
                }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{school.schoolName}</p>
                <p className="text-xs text-muted-foreground">
                  {school.studentsWithResults}/{school.totalStudents} talaba
                </p>
              </div>
              <Badge
                className="shrink-0 font-bold text-white border-0"
                style={{ backgroundColor: getScoreColor(school.averageScore) }}
              >
                {school.averageScore}
              </Badge>
            </motion.div>
          ))}
          {top3.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ma'lumot yo'q
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bottom 3 maktab */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Diqqat talab maktablar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bottom3.length > 0 ? (
            bottom3.map((school, idx) => (
              <motion.div
                key={school.schoolCode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                  {sorted.length - idx}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{school.schoolName}</p>
                  <p className="text-xs text-muted-foreground">
                    {school.studentsWithResults}/{school.totalStudents} natija
                  </p>
                </div>
                <Badge variant="destructive" className="shrink-0 font-bold">
                  {school.averageScore > 0 ? school.averageScore : "—"}
                </Badge>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Taqqoslash uchun kamida 4 ta maktab kerak
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
