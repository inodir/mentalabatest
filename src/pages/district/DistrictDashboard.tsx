import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useDistrictDTMDashboard } from "@/hooks/useDistrictDTMDashboard";
import type { DistrictSchoolDTMStats } from "@/hooks/useDistrictDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  School, Users, TrendingUp, Search, Eye,
  Loader2, RefreshCw, FileText, AlertCircle,
  Trophy, TrendingDown, XCircle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportDistrictPDF } from "@/lib/exportPDF";
import { FunnelStats } from "@/components/dashboard/FunnelStats";
import { ScatterSchools } from "@/components/dashboard/ScatterSchools";
import { SchoolRiskTable } from "@/components/dashboard/SchoolRiskTable";
import { TopStudents } from "@/components/dashboard/TopStudents";
import { ReadinessGauge } from "@/components/dashboard/ReadinessGauge";
import { LanguageScoreChart } from "@/components/dashboard/LanguageScoreChart";

// ── helpers ────────────────────────────────────────────────────────────────────
function progressColor(pct: number) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-blue-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
}
function scoreBg(score: number) {
  if (score >= 150) return "hsl(142 71% 45%)";
  if (score >= 120) return "hsl(217 91% 55%)";
  if (score >= 90)  return "hsl(38 92% 50%)";
  return "hsl(0 72% 51%)";
}

// ── sub-components ─────────────────────────────────────────────────────────────
function ReadinessSection({ schoolStats }: { schoolStats: DistrictSchoolDTMStats[] }) {
  const withStudents = schoolStats.filter((s) => s.totalStudents > 0);
  if (withStudents.length === 0) return null;

  const sorted = [...withStudents].sort((a, b) => b.averageScore - a.averageScore);
  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.length > 3 ? sorted.slice(-3).reverse() : [];
  const testedSorted = [...withStudents].sort((a, b) => {
    const pa = a.totalStudents > 0 ? a.studentsWithResults / a.totalStudents : 0;
    const pb = b.totalStudents > 0 ? b.studentsWithResults / b.totalStudents : 0;
    return pb - pa;
  });

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Progress bars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <School className="h-4 w-4 text-primary" />
            Topshirish faolligi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testedSorted.slice(0, 8).map((school, idx) => {
            const pct = school.totalStudents > 0
              ? Math.round((school.studentsWithResults / school.totalStudents) * 100)
              : 0;
            return (
              <motion.div
                key={school.schoolCode}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="space-y-1"
              >
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-[170px] font-medium">{school.schoolName}</span>
                  <span className="text-muted-foreground ml-2 shrink-0">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.04, ease: "easeOut" }}
                    className={`h-full rounded-full ${progressColor(pct)}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top 3 */}
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
                  background: idx === 0
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : idx === 1
                    ? "linear-gradient(135deg,#94a3b8,#64748b)"
                    : "linear-gradient(135deg,#b45309,#92400e)",
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
                style={{ backgroundColor: scoreBg(school.averageScore) }}
              >
                {school.averageScore}
              </Badge>
            </motion.div>
          ))}
          {top3.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Ma'lumot yo'q</p>
          )}
        </CardContent>
      </Card>

      {/* Bottom 3 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Diqqat talab maktablar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bottom3.length > 0 ? bottom3.map((school, idx) => (
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
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Taqqoslash uchun kamida 4 ta maktab kerak
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const PIE_COLORS = ["hsl(217 91% 55%)", "hsl(0 72% 51%)"];

// ── main page ──────────────────────────────────────────────────────────────────
export default function DistrictDashboard() {
  const { stats, loading, error, progress, retry } = useDistrictDTMDashboard();
  const { district, dtmUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSchools = (stats?.schoolStats || []).filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pieData = stats
    ? [
        { name: "Natijasi bor", value: stats.studentsWithResults },
        { name: "Natijasi yo'q", value: stats.studentsWithoutResults },
      ]
    : [];

  if (error) {
    return (
      <AdminLayout variant="district">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              {district && <Badge variant="secondary" className="ml-0">{district}</Badge>}{" "}
              tuman maktablari statistikasi
            </p>
          </div>
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {error === "NO_CONFIG" && "API sozlamalari topilmadi"}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri"}
                {error === "NETWORK_ERROR" && "Tarmoq xatosi"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {error === "NO_CONFIG" && "DTM ma'lumotlarini ko'rish uchun super admin API kalitini sozlashi kerak."}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri yoki muddati o'tgan."}
                {error === "NETWORK_ERROR" && "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring."}
              </p>
              {error !== "NO_CONFIG" && (
                <Button variant="outline" onClick={retry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Qayta urinish
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout variant="district">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              {district && <Badge variant="secondary" className="ml-0">{district}</Badge>}{" "}
              tuman maktablari statistikasi
            </p>
          </div>
          <div className="flex items-center gap-3">
            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{progress.loaded}/{progress.total}</span>
              </div>
            )}
            {!loading && stats && (
              <PDFExportButton
                label="PDF hisobot"
                onExport={() =>
                  exportDistrictPDF({
                    totalUsers: stats.totalStudents,
                    answeredUsers: stats.studentsWithResults,
                    schoolCount: stats.totalSchools,
                    avgBall: stats.averageScore,
                  })
                }
              />
            )}
            <Button variant="outline" size="icon" onClick={retry} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ── 5 StatCards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatCard title="Jami maktablar"    value={stats?.totalSchools || 0}                            icon={School}       index={0} />
              <StatCard title="Jami o'quvchilar"  value={(stats?.totalStudents || 0).toLocaleString()}        icon={Users}        description="DTM ro'yxatidan" index={1} />
              <StatCard title="Natijasi borlar"   value={(stats?.studentsWithResults || 0).toLocaleString()}  icon={FileText}     description="test topshirgan" index={2} />
              <StatCard title="Natijasi yo'qlar"  value={(stats?.studentsWithoutResults || 0).toLocaleString()} icon={XCircle}   description="topshirmagan" index={3} />
              <StatCard title="O'rtacha ball"     value={stats?.averageScore ? `${stats.averageScore}/189` : "—"} icon={TrendingUp} index={4} />
            </>
          )}
        </div>

        {/* ── Top / Bottom / Progress ── */}
        {!loading && stats?.schoolStats && stats.schoolStats.length > 0 && (
          <ReadinessSection schoolStats={stats.schoolStats} />
        )}

        {/* ── Charts row ── */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Bar chart — school avg score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Maktablar bo'yicha o'rtacha ball</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] rounded-xl" />
              ) : stats?.schoolStats?.some((s) => s.averageScore > 0) ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...( stats?.schoolStats || [])]
                        .filter((s) => s.averageScore > 0)
                        .sort((a, b) => b.averageScore - a.averageScore)
                        .slice(0, 10)
                        .map((s) => ({
                          name: s.schoolName.length > 12 ? s.schoolName.slice(0, 12) + "…" : s.schoolName,
                          ball: s.averageScore,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
                      <YAxis domain={[0, 189]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                        }}
                        formatter={(v: number) => [`${v} ball`, "O'rtacha"]}
                      />
                      <Bar dataKey="ball" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                  Ball ma'lumotlari mavjud emas
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie chart — tested vs not */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test topshirish nisbati</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[280px] rounded-xl" />
              ) : stats && stats.totalStudents > 0 ? (
                <div className="flex items-center gap-6 h-[280px]">
                  <div className="flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "10px",
                            fontSize: "13px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="shrink-0 space-y-4 pr-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-lg font-bold">{d.value.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.totalStudents > 0
                              ? `${((d.value / stats.totalStudents) * 100).toFixed(1)}%`
                              : "0%"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                  Ma'lumot mavjud emas
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Recent students ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">So'nggi ro'yxatdan o'tganlar</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {stats.recentUsers.slice(0, 8).map((user, index) => (
                  <div
                    key={user.id || index}
                    className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.school_code || "—"}</p>
                    </div>
                    {user.has_result ? (
                      <Badge variant="default" className="text-xs shrink-0">{user.total_point} ball</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs shrink-0">Natija yo'q</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-muted-foreground">
                O'quvchilar topilmadi
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Schools Table ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Maktablar ro'yxati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Maktab nomi yoki kod bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maktab nomi</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-center">O'quvchilar</TableHead>
                    <TableHead className="text-center">Natijasi bor</TableHead>
                    <TableHead className="text-center">Topshirish %</TableHead>
                    <TableHead className="text-center">O'rtacha ball</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Maktablar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...filteredSchools]
                      .sort((a, b) => b.averageScore - a.averageScore)
                      .map((school) => {
                        const pct = school.totalStudents > 0
                          ? Math.round((school.studentsWithResults / school.totalStudents) * 100)
                          : 0;
                        return (
                          <TableRow key={school.schoolId}>
                            <TableCell className="font-medium">{school.schoolName}</TableCell>
                            <TableCell>
                              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                                {school.schoolCode}
                              </code>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{school.totalStudents}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={school.studentsWithResults > 0 ? "default" : "secondary"}>
                                {school.studentsWithResults}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"}>
                                {pct}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {school.averageScore > 0 ? (
                                <Badge variant={
                                  school.averageScore >= 150 ? "default"
                                  : school.averageScore >= 100 ? "secondary"
                                  : "destructive"
                                }>
                                  {school.averageScore}/189
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link to={`/district/schools/${school.schoolCode}`}>
                                <Button variant="ghost" size="icon" title="Ko'rish">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Tayyorlik ko'rsatkichi + Til bo'yicha ball */}
        {!loading && dtmUser?.stats?.dtm_readiness && (
          <div className="grid gap-5 lg:grid-cols-2">
            <ReadinessGauge
              readinessIndex={dtmUser.stats.dtm_readiness.readiness_index}
              avgTotalBall={dtmUser.stats.dtm_readiness.avg_total_ball}
              passedCount={dtmUser.stats.dtm_readiness.passed_count}
              testedCount={dtmUser.stats.dtm_readiness.tested_count}
              passLine={70}
            />
            {stats && stats.recentUsers.length > 0 && (
              <LanguageScoreChart users={stats.recentUsers} />
            )}
          </div>
        )}

        {/* Bosqichli tahlil */}
        {!loading && stats && (
          <FunnelStats
            registered={stats.totalStudents}
            answered={stats.studentsWithResults}
          />
        )}

        {/* ScatterSchools — maktab bubble chart */}
        {!loading && dtmUser?.schools && dtmUser.schools.length > 0 && (
          <ScatterSchools schools={dtmUser.schools} />
        )}

        {/* SchoolRiskTable — xavflilik jadval + filter */}
        {!loading && dtmUser?.schools && dtmUser.schools.length > 0 && (
          <SchoolRiskTable schools={dtmUser.schools} />
        )}

        {/* Top o'quvchilar */}
        {!loading && stats && stats.recentUsers.length > 0 && (
          <TopStudents users={stats.recentUsers} />
        )}

      </div>
    </AdminLayout>
  );
}
