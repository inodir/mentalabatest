import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDistrictDTMDashboard } from "@/hooks/useDistrictDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, CheckCircle, XCircle, TrendingUp, Trophy, AlertTriangle, School, Search, RefreshCw, Monitor, Clock, Shield
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportDistrictPDF } from "@/lib/exportPDF";
import { ExcelExportButton } from "@/components/ui/excel-export-button";
import { exportToExcel } from "@/lib/exportExcel";
import { Input } from "@/components/ui/input";
import { ChartTooltipStyle } from "@/lib/stats-utils";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";

const PASS_LINE = 70;


import { StatsKPI, DashboardSection } from "@/components/dashboard/StatsKPI";

export default function DistrictDashboard() {
  const { stats, loading, error, retry, lastSynced, progress } = useDistrictDTMDashboard();
  const { dtmUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const districtName = dtmUser?.district || "Tuman";
  const schoolStats = stats?.schoolStats || [];

  // Aggregations
  const totalStudents = schoolStats.reduce((sum, s) => sum + (s.totalStudents || 0), 0);
  const submitted = schoolStats.reduce((sum, s) => sum + (s.studentsWithResults || 0), 0);
  const notSub = totalStudents - submitted;
  const submitPct = totalStudents > 0 ? ((submitted / totalStudents) * 100).toFixed(1) : "0";

  // For averageScore, let's aggregate safely weighted by submitted count or simple average across all submitted users if known
  // DistrictSchoolDTMStats has averageScore on school level. 
  const totalScoreWeighted = schoolStats.reduce((sum, s) => sum + (s.averageScore * s.studentsWithResults), 0);
  const avgBall = submitted > 0 ? totalScoreWeighted / submitted : 0;

  // Pie chart
  const pieData = [
    { name: "Natijasi bor", value: submitted, fill: "hsl(142 71% 45%)" },
    { name: "Natija chiqmagan", value: notSub, fill: "hsl(215 16% 65%)" },
  ].filter(d => d.value > 0);

  // Top/Bottom schools by submission
  const topSchoolsBySubmit = [...schoolStats]
    .map(s => ({
      name: s.schoolName.length > 20 ? s.schoolName.slice(0, 20) + "…" : s.schoolName,
      pct: s.totalStudents > 0 ? Math.round((s.studentsWithResults / s.totalStudents) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  // Top schools by score
  const topSchoolsByScore = [...schoolStats]
    .filter(s => s.averageScore > 0)
    .map(s => ({
      name: s.schoolName.length > 20 ? s.schoolName.slice(0, 20) + "…" : s.schoolName,
      ball: Math.round(s.averageScore * 10) / 10,
    }))
    .sort((a, b) => b.ball - a.ball)
    .slice(0, 10);

  const filteredSchools = schoolStats.filter(s =>
    s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.schoolCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout variant="district">
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{districtName}</h1>
            <p className="text-muted-foreground mt-1">Tuman darajasidagi tahlil sahifasi</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <SyncStatusIndicator 
              progress={progress} 
              loading={loading} 
              lastSynced={lastSynced}
              error={error}
            />
            {!loading && schoolStats.length > 0 && (
              <div className="flex items-center gap-2">
                <ExcelExportButton
                  label="Excel yuklab olish"
                  filename={`${districtName}_Maktablar`}
                  onExport={() => {
                    const data = schoolStats.map((s, idx) => ({
                      "#": idx + 1,
                      "Maktab": s.schoolName,
                      "Kodi": s.schoolCode || "—",
                      "O'quvchilar": s.totalStudents,
                      "Topshirdi": s.studentsWithResults,
                      "Foiz (%)": s.totalStudents > 0 ? `${Math.round((s.studentsWithResults/s.totalStudents)*100)}%` : "0%",
                      "O'rtacha ball": s.averageScore.toFixed(1),
                    }));
                    return exportToExcel(data, `${districtName}_Maktablar`, "Maktablar");
                  }}
                />
                <PDFExportButton
                  label="PDF hisobot"
                  onExport={() => exportDistrictPDF({
                    totalUsers: totalStudents,
                    answeredUsers: submitted,
                    testedPercent: parseFloat(submitPct),
                    avgBall,
                    passLine: PASS_LINE,
                    adminName: dtmUser?.full_name,
                    districtName,
                    schools: schoolStats.map(s => ({
                      id: Number(s.schoolId) || 0,
                      name: s.schoolName,
                      code: s.schoolCode,
                      district: districtName,
                      region: "—",
                      registered_count: s.totalStudents,
                      answered_count: s.studentsWithResults,
                      tested_percent: s.totalStudents > 0 ? (s.studentsWithResults / s.totalStudents) * 100 : 0,
                      avg_total_ball: s.averageScore,
                    })),
                  })}
                />
              </div>
            )}
          </div>
        </div>

        {/* 1. Asosiy ko'rsatkichlar */}
        <DashboardSection title="Asosiy ko'rsatkichlar">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="rounded-2xl shadow-sm"><CardContent className="p-5"><Skeleton className="h-14" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsKPI index={0} label="Jami o'quvchilar" value={totalStudents.toLocaleString()} icon={Users} color="bg-blue-500/15 text-blue-600" />
              <StatsKPI index={1} label="Natijasi bor" value={submitted.toLocaleString()} sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
              <StatsKPI index={2} label="Natija chiqmagan" value={notSub.toLocaleString()} icon={XCircle} color="bg-red-500/15 text-red-600" />
              <StatsKPI index={3} label="Maktablar soni" value={schoolStats.length} icon={School} color="bg-purple-500/15 text-purple-600" />
            </div>
          )}
        </DashboardSection>

        {/* 2. Statistika Grafiklarchi */}
        {!loading && schoolStats.length > 0 && (
          <DashboardSection title="Taqsimotlar">
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="rounded-2xl lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Topshirish foizi bo'yicha maktablar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSchoolsBySubmit} margin={{ top: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={40} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                        <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v}%`, "Topshirish"]} />
                        <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                          {topSchoolsBySubmit.map((s, i) => (
                            <Cell key={i} fill={s.pct >= 80 ? "hsl(142 71% 45%)" : s.pct >= 50 ? "hsl(217 91% 55%)" : "hsl(0 72% 55%)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Umumiy holat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="45%" outerRadius={72} innerRadius={40} paddingAngle={3}>
                          {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v.toLocaleString()} o'quvchi`]} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DashboardSection>
        )}

        {/* 3. Maktablar ro'yxati */}
        {!loading && (
          <DashboardSection title="Maktablar umumiy ro'yxati">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Barcha maktablar</CardTitle>
                <div className="relative w-full max-w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder="Maktab nomi yoki kodi..."
                    className="pl-9 h-10 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground text-xs">
                        <th className="text-left py-2 pr-4 font-medium">Maktab</th>
                        <th className="text-left py-2 pr-4 font-medium">Kod</th>
                        <th className="text-right py-2 pr-4 font-medium">Ro'yxatda</th>
                        <th className="text-right py-2 pr-4 font-medium">Topshirdi</th>
                        <th className="text-right py-2 pr-4 font-medium">Foiz (ish)</th>
                        <th className="text-right py-2 font-medium">O'rt. ball</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.map((s, i) => {
                        const pct = s.totalStudents > 0 ? Math.round((s.studentsWithResults / s.totalStudents) * 100) : 0;
                        return (
                          <tr key={s.schoolCode || i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-4 font-medium">{s.schoolName}</td>
                            <td className="py-2.5 pr-4 font-mono text-xs">{s.schoolCode || "—"}</td>
                            <td className="py-2.5 pr-4 text-right">{s.totalStudents}</td>
                            <td className="py-2.5 pr-4 text-right">{s.studentsWithResults}</td>
                            <td className="py-2.5 pr-4 text-right">
                              <span className={`font-semibold ${pct >= 75 ? "text-green-600" : pct >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                                {pct}%
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-semibold">
                              {s.averageScore > 0 ? s.averageScore.toFixed(1) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </DashboardSection>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
