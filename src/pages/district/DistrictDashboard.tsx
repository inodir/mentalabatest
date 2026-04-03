import { useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDistrictDTMDashboard } from "@/hooks/useDistrictDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Trophy,
  School,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportDistrictPDF } from "@/lib/exportPDF";
import { ExcelExportButton } from "@/components/ui/excel-export-button";
import { exportToExcel } from "@/lib/exportExcel";
import {
  getScoreDistribution,
  getSubjectMastery,
  getTrendAnalysis,
  getUserTotalPoint,
  hasDTMResult,
  normalizeGender,
  normalizeLanguage,
} from "@/lib/stats-utils";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";
import { StatsKPI, DashboardSection } from "@/components/dashboard/StatsKPI";
import { DetailedScoreChart } from "@/components/dashboard/DetailedScoreChart";
import { GenderLanguageSection } from "@/components/dashboard/GenderLanguageSection";
import { SubjectMasterySection } from "@/components/dashboard/SubjectMasterySection";
import { TimeAnalyticsSection } from "@/components/dashboard/TimeAnalyticsSection";
import { SchoolRankingsSection } from "@/components/dashboard/SchoolRankingsSection";
import { AlertSchoolsSection } from "@/components/dashboard/AlertSchoolsSection";
import { SchoolTopStudents } from "@/components/dashboard/SchoolTopStudents";
import { SchoolRiskSection } from "@/components/dashboard/SchoolRiskSection";
import { DataHealthSection } from "@/components/dashboard/DataHealthSection";

const PASS_LINE = 70;

export default function DistrictDashboard() {
  const { stats, loading, error, retry, lastSynced, progress } = useDistrictDTMDashboard();
  const { dtmUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const districtName = dtmUser?.district || "Tuman";
  const schoolStats = stats?.schoolStats || [];
  const districtStudents = stats?.students || [];

  const totalStudents = stats?.totalStudents ?? 0;
  const submitted = stats?.studentsWithResults ?? 0;
  const notSub = stats?.studentsWithoutResults ?? 0;
  const submitPct = totalStudents > 0 ? ((submitted / totalStudents) * 100).toFixed(1) : "0";
  const avgBall = stats?.averageScore ?? 0;
  const passed = useMemo(
    () => districtStudents.filter((student) => (getUserTotalPoint(student) ?? 0) >= PASS_LINE).length,
    [districtStudents]
  );
  const failed = useMemo(
    () =>
      districtStudents.filter((student) => {
        const point = getUserTotalPoint(student) ?? 0;
        return hasDTMResult(student) && point > 0 && point < PASS_LINE;
      }).length,
    [districtStudents]
  );
  const passPct = submitted > 0 ? ((passed / submitted) * 100).toFixed(1) : "0";
  const bestBall = useMemo(
    () => districtStudents.reduce((best, student) => Math.max(best, getUserTotalPoint(student) ?? 0), 0),
    [districtStudents]
  );
  const activeSchools = useMemo(
    () => schoolStats.filter((school) => school.totalStudents > 0).length,
    [schoolStats]
  );

  const scoreBands = useMemo(() => getScoreDistribution(districtStudents, 10, 189), [districtStudents]);
  const subjectMastery = useMemo(() => getSubjectMastery(districtStudents), [districtStudents]);
  const trendAnalysis = useMemo(() => getTrendAnalysis(districtStudents), [districtStudents]);

  const pieData = [
    { name: `O'tdi (≥${PASS_LINE})`, value: passed, fill: "hsl(142 71% 45%)" },
    { name: "O'tmadi", value: failed, fill: "hsl(0 72% 55%)" },
    { name: "Natija chiqmagan", value: notSub, fill: "hsl(215 16% 65%)" },
  ].filter((item) => item.value > 0);

  const genderCounts = districtStudents.reduce(
    (acc, user) => {
      acc[normalizeGender(user.gender ?? user.dtm?.gender ?? user.Gender)] += 1;
      return acc;
    },
    { male: 0, female: 0, other: 0 }
  );

  const langCounts = districtStudents.reduce(
    (acc, user) => {
      acc[normalizeLanguage(user.language ?? user.dtm?.language ?? user.Language)] += 1;
      return acc;
    },
    { uz: 0, ru: 0, other: 0 }
  );

  const genderData = [
    { name: "O'g'il", value: genderCounts.male, fill: "hsl(210 100% 50%)" },
    { name: "Qiz", value: genderCounts.female, fill: "hsl(330 100% 70%)" },
    { name: "Boshqa", value: genderCounts.other, fill: "hsl(0 0% 76%)" },
  ].filter((item) => item.value > 0);

  const langData = [
    { name: "O'zbek", value: langCounts.uz, fill: "hsl(217 91% 60%)" },
    { name: "Rus", value: langCounts.ru, fill: "hsl(0 84% 60%)" },
    { name: "Boshqa", value: langCounts.other, fill: "hsl(0 0% 60%)" },
  ].filter((item) => item.value > 0);

  const timelineChart = trendAnalysis
    .map((item) => {
      const parts = item.date.split("-");
      return {
        date: `${parts[2]}/${parts[1]}`,
        count: item.total_submissions,
        avg: item.avg_point,
      };
    })
    .slice(-12);

  const hourlyChart = Array.from({ length: 24 }, (_, hour) => {
    const count = districtStudents.filter((student) => {
      const createdAt = student.dtm?.created_at ?? student.created_at;
      return createdAt ? new Date(String(createdAt)).getHours() === hour : false;
    }).length;
    return { hour: `${hour}:00`, count };
  }).filter((item) => item.count > 0 || item.hour === "12:00" || item.hour === "16:00");

  const topSchoolsBySubmit = useMemo(
    () =>
      [...schoolStats]
        .filter((school) => school.totalStudents > 0)
        .map((school) => ({
          name: school.schoolName.length > 20 ? `${school.schoolName.slice(0, 20)}…` : school.schoolName,
          pct: Math.round(school.testedPercent),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 10),
    [schoolStats]
  );

  const topSchoolsByScore = useMemo(
    () =>
      [...schoolStats]
        .filter((school) => school.averageScore > 0)
        .map((school) => ({
          name: school.schoolName.length > 20 ? `${school.schoolName.slice(0, 20)}…` : school.schoolName,
          ball: Math.round(school.averageScore * 10) / 10,
        }))
        .sort((a, b) => b.ball - a.ball)
        .slice(0, 10),
    [schoolStats]
  );

  const bottomSchoolsBySubmit = useMemo(
    () =>
      [...schoolStats]
        .filter((school) => school.totalStudents > 0)
        .map((school) => ({
          name: school.schoolName.length > 20 ? `${school.schoolName.slice(0, 20)}…` : school.schoolName,
          pct: Math.round(school.testedPercent),
        }))
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 5),
    [schoolStats]
  );

  const bottomSchoolsByScore = useMemo(
    () =>
      [...schoolStats]
        .filter((school) => school.averageScore > 0)
        .map((school) => ({
          name: school.schoolName.length > 20 ? `${school.schoolName.slice(0, 20)}…` : school.schoolName,
          ball: Math.round(school.averageScore * 10) / 10,
        }))
        .sort((a, b) => a.ball - b.ball)
        .slice(0, 5),
    [schoolStats]
  );

  const alertSchools = useMemo(
    () =>
      schoolStats
        .filter((school) => school.totalStudents >= 10)
        .map((school) => ({
          name: school.schoolName,
          district: districtName,
          registered: school.totalStudents,
          answered: school.studentsWithResults,
          pct: school.testedPercent,
          avg: school.averageScore,
        }))
        .filter((school) => school.pct < 40 || (school.avg > 0 && school.avg < PASS_LINE))
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 15),
    [districtName, schoolStats]
  );

  const topStudents = useMemo(
    () =>
      [...districtStudents]
        .filter((student) => hasDTMResult(student) && (getUserTotalPoint(student) ?? 0) > 0)
        .sort((a, b) => (getUserTotalPoint(b) ?? 0) - (getUserTotalPoint(a) ?? 0))
        .slice(0, 10),
    [districtStudents]
  );

  const riskList = useMemo(
    () =>
      districtStudents
        .filter((student) => hasDTMResult(student) && (getUserTotalPoint(student) ?? 0) < PASS_LINE)
        .sort((a, b) => (getUserTotalPoint(a) ?? 0) - (getUserTotalPoint(b) ?? 0))
        .slice(0, 10),
    [districtStudents]
  );

  const filteredSchools = schoolStats.filter(
    (school) =>
      school.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.schoolCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <AdminLayout variant="district">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{districtName}</h1>
          <Card className="rounded-2xl border-destructive/30">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-lg font-semibold">
                  {error === "NO_CONFIG" ? "API sozlanmagan" : "Tarmoq yoki API xatosi"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error === "NO_CONFIG"
                    ? "Sozlamalarga API kalitini kiriting."
                    : "Ma'lumotlarni qayta yuklab ko'ring."}
                </p>
              </div>
              <Button variant="outline" onClick={retry} className="rounded-xl">
                <RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout variant="district">
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{districtName}</h1>
            <p className="mt-1 text-muted-foreground">Tuman darajasidagi to'liq tahlil sahifasi</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <SyncStatusIndicator progress={progress} loading={loading} lastSynced={lastSynced} error={error} />
            {!loading && schoolStats.length > 0 && (
              <div className="flex items-center gap-2">
                <ExcelExportButton
                  label="Excel yuklab olish"
                  filename={`${districtName}_Maktablar`}
                  onExport={() => {
                    const data = schoolStats.map((school, index) => ({
                      "#": index + 1,
                      Maktab: school.schoolName,
                      Kodi: school.schoolCode || "—",
                      "Jami o'quvchilar": school.totalStudents,
                      "Natijasi bor": school.studentsWithResults,
                      "Natija chiqmagan": school.studentsWithoutResults,
                      "O'tish balli": school.passCount,
                      "Topshirish foizi": `${school.testedPercent.toFixed(1)}%`,
                      "O'rtacha ball": school.averageScore.toFixed(1),
                    }));
                    return exportToExcel(data, `${districtName}_Maktablar`, "Maktablar");
                  }}
                />
                <PDFExportButton
                  label="PDF hisobot"
                  onExport={() =>
                    exportDistrictPDF({
                      totalUsers: totalStudents,
                      answeredUsers: submitted,
                      testedPercent: parseFloat(submitPct),
                      avgBall,
                      passLine: PASS_LINE,
                      adminName: dtmUser?.full_name,
                      districtName,
                      schools: schoolStats.map((school) => ({
                        id: Number(school.schoolId) || 0,
                        name: school.schoolName,
                        code: school.schoolCode,
                        district: districtName,
                        region: "—",
                        registered_count: school.totalStudents,
                        answered_count: school.studentsWithResults,
                        tested_percent: school.testedPercent,
                        avg_total_ball: school.averageScore,
                      })),
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>

        <DashboardSection title="Asosiy ko'rsatkichlar">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="rounded-2xl shadow-sm">
                  <CardContent className="p-5">
                    <Skeleton className="h-14" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatsKPI index={0} label="Jami o'quvchilar" value={totalStudents.toLocaleString()} icon={Users} color="bg-blue-500/15 text-blue-600" />
              <StatsKPI index={1} label="Natijasi bor" value={submitted.toLocaleString()} sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
              <StatsKPI index={2} label="Natija chiqmagan" value={notSub.toLocaleString()} sub={`${(100 - parseFloat(submitPct)).toFixed(1)}%`} icon={XCircle} color="bg-red-500/15 text-red-600" />
              <StatsKPI index={3} label={`O'tish balli (${PASS_LINE}+)`} value={passed.toLocaleString()} sub={`${passPct}% topshirganlardan`} icon={Trophy} color="bg-yellow-500/15 text-yellow-600" />
              <StatsKPI index={4} label="O'rtacha ball" value={avgBall > 0 ? `${avgBall.toFixed(1)} / 189` : "—"} icon={TrendingUp} color="bg-purple-500/15 text-purple-600" />
              <StatsKPI index={5} label="Faol maktablar" value={activeSchools.toLocaleString()} sub={`Eng yuqori ball: ${bestBall || 0}`} icon={School} color="bg-cyan-500/15 text-cyan-600" />
            </div>
          )}
        </DashboardSection>

        {!loading && districtStudents.length > 0 && (
          <>
            <DetailedScoreChart scoreBands={scoreBands} baseEntities={districtStudents} pieData={pieData} title="Ball taqsimoti" />

            <div className="grid gap-6 lg:grid-cols-2">
              <GenderLanguageSection genderData={genderData} langData={langData} />
              <TimeAnalyticsSection timelineData={timelineChart} hourlyData={hourlyChart} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SubjectMasterySection data={subjectMastery} />
              <SchoolTopStudents students={topStudents} />
            </div>

            <SchoolRankingsSection
              topSchoolsBySubmit={topSchoolsBySubmit}
              topSchoolsByScore={topSchoolsByScore}
              bottomSchoolsBySubmit={bottomSchoolsBySubmit}
              bottomSchoolsByScore={bottomSchoolsByScore}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <SchoolRiskSection riskList={riskList} passLine={PASS_LINE} />
              <DataHealthSection users={districtStudents} />
            </div>

            <AlertSchoolsSection schools={alertSchools} passLine={PASS_LINE} />
          </>
        )}

        {!loading && (
          <DashboardSection title="Maktablar umumiy ro'yxati">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">Barcha maktablar</CardTitle>
                <div className="relative w-full max-w-64">
                  <Search className="absolute left-3 top-3 z-10 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Maktab nomi yoki kodi..."
                    className="pl-9 h-10 rounded-xl"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[420px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-xs text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium">Maktab</th>
                        <th className="text-left py-2 pr-4 font-medium">Kod</th>
                        <th className="text-right py-2 pr-4 font-medium">Ro'yxatda</th>
                        <th className="text-right py-2 pr-4 font-medium">Natijasi bor</th>
                        <th className="text-right py-2 pr-4 font-medium">O'tish</th>
                        <th className="text-right py-2 pr-4 font-medium">Foiz</th>
                        <th className="text-right py-2 font-medium">O'rt. ball</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.map((school, index) => (
                        <tr key={school.schoolCode || index} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 font-medium">{school.schoolName}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs">{school.schoolCode || "—"}</td>
                          <td className="py-2.5 pr-4 text-right">{school.totalStudents}</td>
                          <td className="py-2.5 pr-4 text-right">{school.studentsWithResults}</td>
                          <td className="py-2.5 pr-4 text-right">{school.passCount}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`font-semibold ${school.testedPercent >= 75 ? "text-green-600" : school.testedPercent >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                              {school.testedPercent.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-semibold">
                            {school.averageScore > 0 ? school.averageScore.toFixed(1) : "—"}
                          </td>
                        </tr>
                      ))}
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
