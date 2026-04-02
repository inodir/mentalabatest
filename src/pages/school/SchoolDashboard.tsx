import { useState, useMemo } from "react";
import { normalizeGender, getScoreDistribution, getSubjectMastery, getRiskAnalytics, getTrendAnalysis } from "@/lib/stats-utils";
import { PredictiveInsights } from "@/components/dashboard/PredictiveInsights";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { useAuth } from "@/hooks/useAuth";
import { Users, CheckCircle, XCircle, Trophy, TrendingUp } from "lucide-react";

import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportSchoolPDF } from "@/lib/exportPDF";
import { ExcelExportButton } from "@/components/ui/excel-export-button";
import { exportStudentsExcel } from "@/lib/exportExcel";

import { StatsKPI, DashboardSection } from "@/components/dashboard/StatsKPI";
import { DetailedScoreChart } from "@/components/dashboard/DetailedScoreChart";
import { SchoolTargetBanner } from "@/components/dashboard/SchoolTargetBanner";
import { SchoolTopStudents } from "@/components/dashboard/SchoolTopStudents";
import { SchoolRiskSection } from "@/components/dashboard/SchoolRiskSection";
import { GenderLanguageSection } from "@/components/dashboard/GenderLanguageSection";
import { TimeAnalyticsSection } from "@/components/dashboard/TimeAnalyticsSection";
import { SubjectMasterySection } from "@/components/dashboard/SubjectMasterySection";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";

const PASS_LINE = 70;

export default function SchoolDashboard() {
  const { dtmUser, refresh, lastSynced, refreshing } = useAuth();
  const { stats, loading, schoolCode, students } = useSchoolDTMData();

  const [targetPct, setTargetPct] = useState<number>(() => {
    const saved = localStorage.getItem(`targetPct_${schoolCode || "default"}`);
    return saved ? parseInt(saved, 10) : 80;
  });

  const saveTarget = (val: number) => {
    setTargetPct(val);
    localStorage.setItem(`targetPct_${schoolCode || "default"}`, val.toString());
  };

  const schoolName = dtmUser?.school?.name || dtmUser?.full_name || "Maktab";

  const total      = stats?.totalStudents ?? 0;
  const submitted  = stats?.studentsWithResults ?? 0;
  const notSub     = stats?.studentsWithoutResults ?? 0;
  const submitPct  = total > 0 ? ((submitted / total) * 100).toFixed(1) : "0";
  const avgBall    = stats?.averageScore ?? 0;

  // Score range bands  
  const scoreBands = useMemo(() => 
    getScoreDistribution(
      students, 
      10, 
      189, 
      u => (u.dtm?.total_ball as number) ?? null,
      u => u.dtm?.tested ?? false
    ),
    [students]
  );

  const passed    = students.filter(u => u.dtm?.tested && ((u.dtm?.total_ball as number) ?? 0) >= PASS_LINE).length;
  const failed    = students.filter(u => u.dtm?.tested && ((u.dtm?.total_ball as number) ?? 0) > 0 && ((u.dtm?.total_ball as number) ?? 0) < PASS_LINE).length;
  const passPct   = submitted > 0 ? ((passed / submitted) * 100).toFixed(1) : "0";

  const riskStats = useMemo(() => getRiskAnalytics(students, PASS_LINE), [students]);
  const subjectMastery = useMemo(() => getSubjectMastery(students), [students]);
  const trendAnalysis = useMemo(() => getTrendAnalysis(students), [students]);

  // Language stats
  const l_uz = students.filter(u => u.language?.toLowerCase() === "uz" || u.language === "o'zbek").length;
  const l_ru = students.filter(u => u.language?.toLowerCase() === "ru" || u.language === "rus").length;
  const l_other = students.length - l_uz - l_ru;

  const maleStudents = students.filter(u => normalizeGender(u.gender) === 'male');
  const femaleStudents = students.filter(u => normalizeGender(u.gender) === 'female');
  
  const langData = [
    { name: "O'zbek", value: l_uz, fill: "hsl(217 91% 60%)" },
    { name: "Rus",    value: l_ru, fill: "hsl(0 84% 60%)"    },
    { name: "Boshqa", value: l_other, fill: "hsl(0 0% 60%)"   },
  ].filter(d => d.value > 0);

  const genderData = [
    { name: "O'g'il", value: maleStudents.length,   fill: "hsl(210 100% 50%)" },
    { name: "Qiz",   value: femaleStudents.length, fill: "hsl(330 100% 70%)" },
    { name: "Boshqa", value: students.length - maleStudents.length - femaleStudents.length,  fill: "hsl(0 0% 76%)"    },
  ].filter(d => d.value > 0);

  // Top 10 students by score
  const topStudents = useMemo(() => [...students]
    .filter(u => u.dtm?.tested && ((u.dtm?.total_ball as number) ?? 0) > 0)
    .sort((a, b) => ((b.dtm?.total_ball as number) ?? 0) - ((a.dtm?.total_ball as number) ?? 0))
    .slice(0, 10), [students]);

  // Students under 70 
  const riskList = useMemo(() => students.filter(u =>
    u.dtm?.tested && ((u.dtm?.total_ball as number) ?? 0) < PASS_LINE
  ).sort((a, b) => ((a.dtm?.total_ball as number) ?? 0) - ((b.dtm?.total_ball as number) ?? 0)), [students]);

  // Timeline analytics
  const timelineChart = trendAnalysis.map(d => {
    const parts = d.date.split("-");
    return { date: `${parts[2]}/${parts[1]}`, count: d.total_submissions };
  }).slice(-12);

  const hourlyChart = Array(24).fill(0).map((_, hour) => {
    const count = students.filter(u => u.dtm?.created_at && new Date(u.dtm.created_at).getHours() === hour).length;
    return { hour: `${hour}:00`, count };
  }).filter(h => h.count > 0 || h.hour === "12:00" || h.hour === "16:00");

  const pieData = [
    { name: `O'tdi (≥${PASS_LINE})`, value: passed,  fill: "hsl(142 71% 45%)" },
    { name: "O'tmadi",               value: failed,  fill: "hsl(0 72% 55%)"   },
    { name: "Natija chiqmagan",           value: notSub,  fill: "hsl(215 16% 65%)" },
  ].filter(d => d.value > 0);

  return (
    <AdminLayout variant="school">
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{schoolName}</h1>
            <p className="text-muted-foreground mt-1">
              DTM tahlil sahifasi
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <SyncStatusIndicator 
              progress={null} 
              loading={refreshing} 
              lastSynced={lastSynced}
              error={null}
            />

            {!loading && stats && (
              <div className="flex items-center gap-2">
                <ExcelExportButton
                  label="Excel"
                  filename={`${schoolName}_O'quvchilar`}
                  onExport={() => exportStudentsExcel(students)}
                />
                <PDFExportButton
                  label="PDF"
                  onExport={() => exportSchoolPDF({
                    totalUsers: total,
                    answeredUsers: submitted,
                    testedPercent: parseFloat(submitPct),
                    avgBall,
                    passLine: PASS_LINE,
                    adminName: dtmUser?.full_name,
                    schoolName,
                  })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Target Progress Banner */}
        <SchoolTargetBanner 
          targetPct={targetPct} 
          submitPct={submitPct} 
          onTargetChange={saveTarget} 
        />

        {/* 1. KPI & Predictive Insights */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DashboardSection title="Asosiy ko'rsatkichlar">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatsKPI index={0} label="Jami o'quvchilar" value={total.toLocaleString()} icon={Users} color="bg-blue-500/15 text-blue-600" />
                <StatsKPI index={1} label="Natijasi bor" value={submitted.toLocaleString()} sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
                <StatsKPI index={2} label="Natija chiqmagan" value={notSub.toLocaleString()} sub={`${(100 - parseFloat(submitPct)).toFixed(1)}%`} icon={XCircle} color="bg-red-500/15 text-red-600" />
                <StatsKPI index={3} label="O'tish ko'rsatkichi" value={`${passPct}%`} sub={`${passed} o'quvchi`} icon={Trophy} color="bg-yellow-500/15 text-yellow-600" />
              </div>
            </DashboardSection>
            
            <PredictiveInsights 
              score={avgBall} 
              userName={schoolName} 
              subjectMastery={subjectMastery.map(s => ({ subject: s.subject, mastery_percent: s.mastery_percent }))} 
            />
          </div>

          <SchoolRiskSection riskList={riskList.slice(0, 10)} passLine={PASS_LINE} />
        </div>

        {/* 2. Charts & Demographics */}
        {!loading && (
          <>
            <DetailedScoreChart 
              scoreBands={scoreBands} 
              baseEntities={students} 
              pieData={pieData} 
              title="Ball taqsimoti"
            />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <GenderLanguageSection genderData={genderData} langData={langData} />
              <TimeAnalyticsSection timelineData={timelineChart} hourlyData={hourlyChart} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SubjectMasterySection data={subjectMastery} />
              <SchoolTopStudents students={topStudents} />
            </div>
          </>
        )}

        {loading && (
          <div className="grid gap-6 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl h-40"><CardContent className="p-6"><Skeleton className="h-full" /></CardContent></Card>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
