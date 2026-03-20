import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { useAuth } from "@/hooks/useAuth";
import { Users, CheckCircle, XCircle, TrendingUp, Trophy, AlertTriangle, FileText, Clock, Monitor, Shield } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportSchoolPDF } from "@/lib/exportPDF";
import { ExcelExportButton } from "@/components/ui/excel-export-button";
import { exportStudentsExcel } from "@/lib/exportExcel";
import { exportCertificate } from "@/lib/exportCertificate";

const PASS_LINE = 70;

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
};

function KPI({ label, value, sub, icon: Icon, color, i }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.06 }}
    >
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

export default function SchoolDashboard() {
  const { dtmUser, refresh } = useAuth();
  const { stats, loading, schoolCode, students } = useSchoolDTMData();

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [targetPct, setTargetPct] = useState<number>(() => {
    const saved = localStorage.getItem(`targetPct_${schoolCode || "default"}`);
    return saved ? parseInt(saved, 10) : 80;
  });

  const saveTarget = (val: number) => {
    setTargetPct(val);
    localStorage.setItem(`targetPct_${schoolCode || "default"}`, val.toString());
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      refresh();
    }, 60000); // 60 sec Refresh
    return () => clearInterval(timer);
  }, [autoRefresh, refresh]);

  const schoolName = dtmUser?.school?.name || dtmUser?.full_name || "Maktab";

  const total      = stats?.totalStudents ?? 0;
  const submitted  = stats?.studentsWithResults ?? 0;
  const notSub     = stats?.studentsWithoutResults ?? 0;
  const submitPct  = total > 0 ? ((submitted / total) * 100).toFixed(1) : "0";
  const avgBall    = stats?.averageScore ?? 0;

  // Score bands
  const bands = [
    { label: "0–40",    min: 0,   max: 40  },
    { label: "40–70",   min: 40,  max: 70  },
    { label: "70–100",  min: 70,  max: 100 },
    { label: "100–130", min: 100, max: 130 },
    { label: "130–160", min: 130, max: 160 },
    { label: "160–189", min: 160, max: 190 },
  ];

  const scoreBands = bands.map(b => ({
    label: b.label,
    soni: students.filter(u => {
      const p = u.dtm?.total_ball as number ?? 0;
      return u.dtm?.tested && p >= b.min && p < b.max;
    }).length,
  }));

  const passed    = students.filter(u => u.dtm?.tested && ((u.dtm?.total_ball as number) ?? 0) >= PASS_LINE).length;
  const failed    = students.filter(u => u.dtm?.tested && ((u.dtm?.total_ball as number) ?? 0) > 0 && ((u.dtm?.total_ball as number) ?? 0) < PASS_LINE).length;
  const passPct   = submitted > 0 ? ((passed / submitted) * 100).toFixed(1) : "0";

  // Language stats
  const l_uz = students.filter(u => u.language?.toLowerCase() === "uz" || u.language === "o'zbek").length;
  const l_ru = students.filter(u => u.language?.toLowerCase() === "ru" || u.language === "rus").length;
  const l_other = students.length - l_uz - l_ru;

  // Gender stats
  const g_male = students.filter(u => u.gender?.toLowerCase() === "erkak" || u.gender?.toLowerCase() === "male" || u.gender === "M").length;
  const g_female = students.filter(u => u.gender?.toLowerCase() === "ayol" || u.gender?.toLowerCase() === "female" || u.gender === "F").length;
  const g_other = students.length - g_male - g_female;

  const langData = [
    { name: "O'zbek", value: l_uz, fill: "hsl(217 91% 60%)" },
    { name: "Rus",    value: l_ru, fill: "hsl(0 84% 60%)"    },
    { name: "Boshqa", value: l_other, fill: "hsl(0 0% 60%)"   },
  ].filter(d => d.value > 0);

  const genderData = [
    { name: "O'g'il", value: g_male,   fill: "hsl(210 100% 50%)" },
    { name: "Qiz",   value: g_female, fill: "hsl(330 100% 70%)" },
  ].filter(d => d.value > 0);

  // Subject mastery bars from dtmUser.stats
  const subjectMastery = (dtmUser?.stats?.subject_mastery ?? []).slice(0, 8).map(s => ({
    name: s.subject.length > 20 ? s.subject.slice(0, 20) + "…" : s.subject,
    mastery: Math.round(s.mastery_percent),
    avg: Math.round(s.avg_point * 10) / 10,
  }));

  // Top 10 students by score
  const topStudents = [...students]
    .filter(u => u.dtm?.tested && (u.dtm?.total_ball as number) > 0)
    .sort((a, b) => ((b.dtm?.total_ball as number) ?? 0) - ((a.dtm?.total_ball as number) ?? 0))
    .slice(0, 10);

  // Students under 70 who haven't submitted
  const riskStudents = students.filter(u =>
    !u.dtm?.tested || ((u.dtm?.total_ball as number) ?? 0) < PASS_LINE
  ).slice(0, 10);

  // Timeline analytics for School Dashboard
  const timelineData: Record<string, number> = {};
  const hourlyData: number[] = Array(24).fill(0);

  students.forEach(u => {
    const res = u.dtm as any;
    if (res?.created_at) {
      const date = new Date(res.created_at);
      const dateStr = date.toISOString().split("T")[0];
      timelineData[dateStr] = (timelineData[dateStr] || 0) + 1;
      hourlyData[date.getHours()]++;
    }
  });

  const timelineChart = Object.entries(timelineData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => {
      const parts = date.split("-");
      return { date: `${parts[2]}/${parts[1]}`, count };
    })
    .slice(-12);

  const hourlyChart = hourlyData.map((count, hour) => ({
    hour: `${hour}:00`,
    count
  })).filter(h => h.count > 0 || h.hour === "12:00" || h.hour === "16:00");

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
              {schoolCode && <Badge variant="secondary" className="ml-2">Kod: {schoolCode}</Badge>}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 glass-card rounded-full px-4 py-2 border border-border/40">
              <Label htmlFor="refresh-toggle" className="text-xs font-semibold">Avto-yangilash</Label>
              <Switch id="refresh-toggle" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>

            {!loading && stats && (
              <div className="flex items-center gap-2">
              <ExcelExportButton
                label="Excel yuklab olish"
                filename={`${schoolName}_O'quvchilar`}
                onExport={() => exportStudentsExcel(students)}
              />
              <PDFExportButton
                label="PDF hisobot"
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

        {/* 🚀 Target Progress Bar Banner */}
        <Card className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden mb-6">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600 animate-pulse" />
                  <h3 className="font-bold text-lg">Ko'rsatkich Maqsadi (Target)</h3>
                </div>
                <p className="text-sm text-muted-foreground">Maqsad: {targetPct}%. Joriysi: {submitPct}%</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">O'zgartirish:</span>
                  <input 
                    type="range" min="10" max="100" step="5" 
                    value={targetPct} onChange={(e) => saveTarget(parseInt(e.target.value))} 
                    className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Progress</span>
                  <span className={parseFloat(submitPct) >= targetPct ? "text-green-600 font-bold" : "text-muted-foreground"}>
                    {parseFloat(submitPct) >= targetPct ? "Maqsad bajarildi! 🎉" : `${Math.round((parseFloat(submitPct) / targetPct) * 100)}%`}
                  </span>
                </div>
                <div className="h-4 bg-muted/40 rounded-full border border-border/20 overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-green-500/80 to-green-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(100, (parseFloat(submitPct) / targetPct) * 100)}%` }} />
                  <div className="absolute top-0 bottom-0 border-r border-red-500/80" style={{ left: `${targetPct}%` }} title={`Target: ${targetPct}%`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 1. Asosiy ko'rsatkichlar */}
        <Section title="Asosiy ko'rsatkichlar">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="rounded-2xl"><CardContent className="p-5"><Skeleton className="h-14" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI i={0} label="Jami o'quvchilar" value={total.toLocaleString()} icon={Users} color="bg-blue-500/15 text-blue-600" />
              <KPI i={1} label="Natijasi bor" value={submitted.toLocaleString()} sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
              <KPI i={2} label="Natija chiqmagan" value={notSub.toLocaleString()} icon={XCircle} color="bg-red-500/15 text-red-600" />
              <KPI i={3} label={`${PASS_LINE}+ ball olganlar`} value={passed} sub={`${passPct}% topshirganlardan`} icon={Trophy} color="bg-yellow-500/15 text-yellow-600" />
            </div>
          )}
          {!loading && avgBall > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI i={4} label="O'rtacha ball" value={`${avgBall.toFixed(1)} / 189`} icon={TrendingUp} color="bg-purple-500/15 text-purple-600" />
            </div>
          )}
        </Section>

        {/* 1.5 Vaqt va faollik tahlili */}
        {!loading && timelineChart.length > 0 && (
          <Section title="Vaqt va faollik tahlili">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Daily LineChart */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" /> Kunlik topshirishlar dinamikasi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineChart} margin={{ left: 5, right: 15, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} o'quvchi`, "Topshirdi"]} />
                        <Line type="monotone" dataKey="count" stroke="hsl(217 91% 60%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--background))", stroke: "hsl(217 91% 60%)" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Hourly BarChart */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" /> Soatbay faollik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyChart} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                        <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} o'quvchi`, "Faollik"]} />
                        <Bar dataKey="count" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>
        )}

        {/* 2. Ball taqsimoti */}
        {schoolCode && (
          <Section title="Ball taqsimoti">
            <div className="grid gap-5 lg:grid-cols-3">
              <Card className="rounded-2xl lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">O'quvchilar ball oralig'i bo'yicha</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    {loading ? <Skeleton className="h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreBands} margin={{ top: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={ChartTooltipStyle}
                            formatter={(v: number) => [`${v} o'quvchi`, "Soni"]} />
                          <Bar dataKey="soni" radius={[6, 6, 0, 0]}>
                            {scoreBands.map((b, i) => (
                              <Cell key={b.label} fill={i < 2 ? "hsl(0 72% 55%)" : i === 2 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Umumiy holat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    {loading ? <Skeleton className="h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="45%"
                            outerRadius={72} innerRadius={40} paddingAngle={3}>
                            {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Pie>
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} o'quvchi`]} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Language Pie */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Til bo'yicha tahlil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {loading ? <Skeleton className="h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={langData} dataKey="value" cx="50%" cy="45%"
                            outerRadius={68} innerRadius={35} paddingAngle={3}>
                            {langData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Pie>
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} o'quvchi`]} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Gender Pie */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Jins bo'yicha tahlil</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {loading ? <Skeleton className="h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={genderData} dataKey="value" cx="50%" cy="45%"
                            outerRadius={68} innerRadius={35} paddingAngle={3}>
                            {genderData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Pie>
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} o'quvchi`]} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>
        )}

        {/* 3. Fan ko'nikmasi */}
        {subjectMastery.length > 0 && (
          <Section title="Fan bo'yicha o'rtacha ball">
            <Card className="rounded-2xl">
              <CardContent className="pt-5">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectMastery} layout="vertical" margin={{ left: 8, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={ChartTooltipStyle}
                        formatter={(v: number, name: string) => [
                          name === "mastery" ? `${v}%` : `${v} ball`,
                          name === "mastery" ? "Ko'nikma" : "O'rt. ball",
                        ]} />
                      <Bar dataKey="mastery" radius={[0, 6, 6, 0]} name="mastery">
                        {subjectMastery.map((s, i) => (
                          <Cell key={i} fill={s.mastery >= 70 ? "hsl(142 71% 45%)" : s.mastery >= 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 55%)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* 4. Top o'quvchilar */}
        {topStudents.length > 0 && (
          <Section title="Eng yuqori natija ko'rsatgan o'quvchilar">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Top 10 o'quvchi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topStudents.map((u, i) => {
                    const ball = (u.dtm?.total_ball as number) ?? 0;
                    return (
                      <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border/40 p-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold
                          ${i === 0 ? "bg-yellow-500/20 text-yellow-600" : i === 1 ? "bg-slate-300/40 text-slate-600" : i === 2 ? "bg-orange-500/20 text-orange-600" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.phone || "—"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-600"
                            onClick={() => exportCertificate(u.full_name)}
                            title="Sertifikat yuklash"
                          >
                            <Trophy className="h-4 w-4" />
                          </Button>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${ball >= 70 ? "text-green-600" : "text-red-500"}`}>{ball}</p>
                            <p className="text-xs text-muted-foreground">/ 189</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* 5. Diqqat talab o'quvchilar */}
        {riskStudents.length > 0 && (
          <Section title="Natija chiqmagan yoki past ball olgan o'quvchilar">
            <Card className="rounded-2xl border-orange-200 dark:border-orange-900/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Diqqat kerak bo'lgan o'quvchilar
                  <Badge variant="destructive" className="ml-auto">{riskStudents.length} ta</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskStudents.map((u, i) => {
                    const ball = (u.dtm?.total_ball as number) ?? 0;
                    const tested = u.dtm?.tested ?? false;
                    return (
                      <div key={u.id || i} className="flex items-center gap-3 rounded-xl border border-orange-200/50 dark:border-orange-900/30 p-3">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.phone || "—"}</p>
                        </div>
                        <div className="text-right">
                          {tested ? (
                            <Badge variant="destructive" className="text-xs">{ball} ball</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Natija chiqmagan</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl"><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
