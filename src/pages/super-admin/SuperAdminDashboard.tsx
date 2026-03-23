import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDTMDashboard } from "@/hooks/useDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, CheckCircle, XCircle, TrendingUp, School, Settings, Shield, ShieldAlert,
  RefreshCw, AlertCircle, Loader2, AlertTriangle, Trophy, MapPin, Clock, Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportSuperAdminPDF } from "@/lib/exportPDF";
import { ExcelExportButton } from "@/components/ui/excel-export-button";
import { exportSuperAdminExcel } from "@/lib/exportExcel";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";

import logsData from "@/data/security_logs.json";

const PASS_LINE = 70;

const anim = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

// ─── Small stat card ────────────────────────────────────────────────
function KPI({
  label, value, sub, icon: Icon, color, i,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; i: number;
}) {
  return (
    <motion.div custom={i} variants={anim} initial="hidden" animate="visible">
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-5 flex items-start gap-4">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Section title ───────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Tooltip ────────────────────────────────────────────────────────
const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stats, loading, error, mode, setMode, progress, retry, loadedEntities } = useDTMDashboard();
  const { dtmUser } = useAuth();

  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  const regions = useMemo(() => {
    const r = new Set<string>();
    loadedEntities.forEach(u => { if (u.region) r.add(u.region); });
    return Array.from(r).sort();
  }, [loadedEntities]);

  const districts = useMemo(() => {
    const d = new Set<string>();
    loadedEntities.forEach(u => {
      if (u.district && (selectedRegion === "all" || u.region === selectedRegion)) {
        d.add(u.district);
      }
    });
    return Array.from(d).sort();
  }, [loadedEntities, selectedRegion]);

  const filteredEntities = useMemo(() => {
    let list = loadedEntities;
    if (selectedRegion !== "all") list = list.filter(u => u.region === selectedRegion);
    if (selectedDistrict !== "all") list = list.filter(u => u.district === selectedDistrict);
    return list;
  }, [loadedEntities, selectedRegion, selectedDistrict]);

  const aggregSchools = useMemo(() => {
    const sourceSchools = dtmUser?.schools ?? [];
    if (mode === "fast" || loadedEntities.length === 0) return sourceSchools;
    
    const map = new Map<string, any>();
    filteredEntities.forEach(u => {
      const code = u.school_code || "unknown";
      const curr = map.get(code) || {
        name: u.school_name || (u.school_code ? `Maktab ${u.school_code}` : "Noma'lum"),
        code: code,
        district: u.district || "—",
        region: u.region || "—",
        registered_count: 0, answered_count: 0, totalBall: 0,
      };
      curr.registered_count++;
      if (u.has_result) {
        curr.answered_count++;
        curr.totalBall += (u.total_point ?? 0);
      }
      map.set(code, curr);
    });

    return Array.from(map.values()).map(s => ({
      ...s,
      tested_percent: s.registered_count > 0 ? (s.answered_count / s.registered_count) * 100 : 0,
      avg_total_ball: s.answered_count > 0 ? s.totalBall / s.answered_count : 0,
    }));
  }, [filteredEntities, mode, dtmUser?.schools, loadedEntities.length]);

  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      retry();
    }, 60000); // 60 sec Refresh
    return () => clearInterval(timer);
  }, [autoRefresh, retry]);

  // ─── Error State ───────────────────────────────────────────────────
  if (error) {
    return (
      <AdminLayout variant="super">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Bosh sahifa</h1>
          <Card className="rounded-2xl border-destructive/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="font-semibold text-lg">
                  {error === "NO_CONFIG" && "API sozlanmagan"}
                  {error === "API_KEY_INVALID" && "API kaliti noto'g'ri"}
                  {error === "NETWORK_ERROR" && "Tarmoq xatosi"}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {error === "NO_CONFIG" && "Sozlamalar sahifasidan API kalitini kiriting"}
                  {error === "API_KEY_INVALID" && "API kaliti noto'g'ri yoki muddati o'tgan"}
                  {error === "NETWORK_ERROR" && "Internet aloqani tekshiring"}
                </p>
              </div>
              <div className="flex gap-2">
                {error !== "NO_CONFIG" && (
                  <Button variant="outline" onClick={retry} className="rounded-xl">
                    <RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish
                  </Button>
                )}
                <Button onClick={() => navigate("/super-admin/settings")} className="rounded-xl">
                  <Settings className="mr-2 h-4 w-4" /> Sozlamalar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // ─── Computed values ───────────────────────────────────────────────
  const baseEntities = mode === "accurate" ? filteredEntities : loadedEntities;
  
  const total        = mode === "accurate" ? baseEntities.length : (stats?.totalUsers ?? 0);
  const submitted    = mode === "accurate" ? baseEntities.filter(u => u.has_result).length : (stats?.resultUsersCount ?? 0);
  const notSubmitted = total - submitted;
  const submitPct    = total > 0 ? ((submitted / total) * 100).toFixed(1) : "0";
  
  const avgBall = mode === "accurate" && submitted > 0 
    ? baseEntities.reduce((sum, u) => sum + (u.total_point ?? 0), 0) / submitted 
    : (stats?.averageTotalPoint ?? 0);

  const passed     = baseEntities.filter(u => u.has_result && (u.total_point ?? 0) >= PASS_LINE).length;
  const failed     = baseEntities.filter(u => u.has_result && (u.total_point ?? 0) > 0 && (u.total_point ?? 0) < PASS_LINE).length;
  const passPct    = submitted > 0 ? ((passed / submitted) * 100).toFixed(1) : "0";

  // Score range bands  
  const bands = [
    { label: "0–10",    min: 0,   max: 10  },
    { label: "10–20",   min: 10,  max: 20  },
    { label: "20–30",   min: 20,  max: 30  },
    { label: "30–40",   min: 30,  max: 40  },
    { label: "40–50",   min: 40,  max: 50  },
    { label: "50–60",   min: 50,  max: 60  },
    { label: "60–70",   min: 60,  max: 70  },
    { label: "70–80",   min: 70,  max: 80  },
    { label: "80–90",   min: 80,  max: 90  },
    { label: "90–100",  min: 90,  max: 100 },
    { label: "100–110", min: 100, max: 110 },
    { label: "110–120", min: 110, max: 120 },
    { label: "120–130", min: 120, max: 130 },
    { label: "130–140", min: 130, max: 140 },
    { label: "140–150", min: 140, max: 150 },
    { label: "150–160", min: 150, max: 160 },
    { label: "160–170", min: 160, max: 170 },
    { label: "170–180", min: 170, max: 180 },
    { label: "180–189", min: 180, max: 190 },
  ];
  const scoreBands = bands.map(b => ({
    label: b.label,
    soni: baseEntities.filter(u => {
      const p = u.total_point ?? 0;
      return u.has_result && p >= b.min && p < b.max;
    }).length,
  }));

  // Language stats
  const l_uz = baseEntities.filter(u => u.language?.toLowerCase() === "uz" || u.language === "o'zbek").length;
  const l_ru = baseEntities.filter(u => u.language?.toLowerCase() === "ru" || u.language === "rus").length;
  const l_other = baseEntities.length - l_uz - l_ru;
  
  // Gender stats
  const g_male = baseEntities.filter(u => {
    const g = (u.gender ?? (u.dtm as any)?.gender ?? u.Gender)?.toString().toLowerCase()?.trim();
    return g === "erkak" || g === "male" || g === "m" || g === "o'g'il" || g === "o'g`il" || g === "1";
  }).length;
  const g_female = baseEntities.filter(u => {
    const g = (u.gender ?? (u.dtm as any)?.gender ?? u.Gender)?.toString().toLowerCase()?.trim();
    return g === "ayol" || g === "female" || g === "f" || g === "qiz" || g === "2";
  }).length;
  const g_other = baseEntities.length - g_male - g_female;

  const langData = [
    { name: "O'zbek", value: l_uz, fill: "hsl(217 91% 60%)" },
    { name: "Rus",    value: l_ru, fill: "hsl(0 84% 60%)"    },
    { name: "Boshqa", value: l_other, fill: "hsl(0 0% 60%)"   },
  ].filter(d => d.value > 0);

  const genderData = [
    { name: "O'g'il", value: g_male,   fill: "hsl(210 100% 50%)" },
    { name: "Qiz",   value: g_female, fill: "hsl(330 100% 70%)" },
  ].filter(d => d.value > 0);

  // Top schools by submission %
  const topSchoolsBySubmit = (aggregSchools)
    .filter(s => (s.registered_count ?? 0) > 0)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      pct: Math.round(((s.answered_count ?? 0) / (s.registered_count ?? 1)) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  // Top schools by avg score
  const topSchoolsByScore = (aggregSchools)
    .filter(s => (s.avg_total_ball ?? 0) > 0)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      ball: Math.round((s.avg_total_ball ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.ball - a.ball)
    .slice(0, 10);

  // Bottom schools by submission % (Lowest 5)
  const bottomSchoolsBySubmit = [...aggregSchools]
    .filter(s => (s.registered_count ?? 0) > 0)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      pct: Math.round(((s.answered_count ?? 0) / (s.registered_count ?? 1)) * 100),
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  // Bottom schools by avg score (Lowest 5)
  const bottomSchoolsByScore = [...aggregSchools]
    .filter(s => (s.avg_total_ball ?? 0) > 0)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      ball: Math.round((s.avg_total_ball ?? 0) * 10) / 10,
    }))
    .sort((a, b) => a.ball - b.ball)
    .slice(0, 5);

  // Subject diagnostics computation
  const subjectsStats = {
    onaTili: { sum: 0, count: 0 },
    matematika: { sum: 0, count: 0 },
    tarix: { sum: 0, count: 0 },
  };

  baseEntities.forEach(u => {
    const res = u.test_results;
    if (!res) return;
    res.mandatory?.forEach(m => {
      const n = m.name.toLowerCase();
      if (n.includes("ona tili")) { subjectsStats.onaTili.sum += m.point ?? 0; subjectsStats.onaTili.count++; }
      if (n.includes("matematika")) { subjectsStats.matematika.sum += m.point ?? 0; subjectsStats.matematika.count++; }
      if (n.includes("tarix")) { subjectsStats.tarix.sum += m.point ?? 0; subjectsStats.tarix.count++; }
    });
  });

  const subjectAverages = [
    { name: "Ona tili", pct: Math.round(subjectsStats.onaTili.count > 0 ? (subjectsStats.onaTili.sum / subjectsStats.onaTili.count) / 11 * 100 : 100) },
    { name: "Matematika", pct: Math.round(subjectsStats.matematika.count > 0 ? (subjectsStats.matematika.sum / subjectsStats.matematika.count) / 11 * 100 : 100) },
    { name: "Tarix", pct: Math.round(subjectsStats.tarix.count > 0 ? (subjectsStats.tarix.sum / subjectsStats.tarix.count) / 11 * 100 : 100) },
  ].sort((a, b) => a.pct - b.pct);

  const worstSubject = subjectAverages.length > 0 && subjectAverages[0].pct < 85 ? subjectAverages[0] : null;

  // ── RICH SUBJECT AVERAGES (All Subjects) ───────────────────────
  const subjectsStatsAll: Record<string, { sum: number, count: number }> = {};
  filteredEntities.forEach(u => {
    const res = u.test_results;
    if (!res) return;
    
    res.mandatory?.forEach((m: any) => {
      const name = m.name?.trim();
      if (!name || name.toLowerCase() === "noma'lum") return;
      if (!subjectsStatsAll[name]) subjectsStatsAll[name] = { sum: 0, count: 0 };
      subjectsStatsAll[name].sum += (m.point ?? 0);
      subjectsStatsAll[name].count++;
    });

    if (res.primary) {
      const name = res.primary.name?.trim();
      if (name && name.toLowerCase() !== "noma'lum") {
        if (!subjectsStatsAll[name]) subjectsStatsAll[name] = { sum: 0, count: 0 };
        subjectsStatsAll[name].sum += (res.primary.point ?? 0);
        subjectsStatsAll[name].count++;
      }
    }

    if (res.secondary) {
      const name = res.secondary.name?.trim();
      if (name && name.toLowerCase() !== "noma'lum") {
        if (!subjectsStatsAll[name]) subjectsStatsAll[name] = { sum: 0, count: 0 };
        subjectsStatsAll[name].sum += (res.secondary.point ?? 0);
        subjectsStatsAll[name].count++;
      }
    }
  });

  const subjectAveragesAll = Object.entries(subjectsStatsAll).map(([name, s]) => ({
    name: name.length > 18 ? name.slice(0, 16) + "…" : name,
    fullName: name,
    avg: Math.round((s.sum / s.count) * 10) / 10,
    count: s.count,
  })).sort((a, b) => b.avg - a.avg).slice(0, 15); // Top 15 subjects

  // Timeline analytics Grouping
  const timelineData: Record<string, number> = {};
  const hourlyData: number[] = Array(24).fill(0);

  baseEntities.forEach(u => {
    const res = u.test_results as any;
    if (res?.created_at) {
      const date = new Date(res.created_at);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      timelineData[dateStr] = (timelineData[dateStr] || 0) + 1;
      const hour = date.getHours();
      hourlyData[hour]++;
    }
  });

  const timelineChart = Object.entries(timelineData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => {
      const parts = date.split("-");
      return { date: `${parts[2]}/${parts[1]}`, count }; // DD/MM
    })
    .slice(-12); // Last 12 points

  const hourlyChart = hourlyData.map((count, hour) => ({
    hour: `${hour}:00`,
    count
  })).filter(h => h.count > 0 || h.hour === "12:00" || h.hour === "15:00");

  // ─── Real-Time Alert Banner State ────────────────────────────────
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [alerts, setAlerts] = useState<any[]>(() => {
    const online = logsData.filter((l: any) => l.status === "Active").map((l: any) => ({ text: `${l.user} online (${l.location})`, type: "online" }));
    const attacks = logsData.filter((l: any) => l.status === "Blocked").map((l: any) => ({ text: `Diqqat! IP ${l.ip} xuruji blokda! (${l.action || "Hack attempt"})`, type: "attack" }));
    const list = [...online, ...attacks];
    return list.length > 0 ? list : [{ text: "Tizim xavfsiz. Hech qanday xatar yo'q.", type: "online" }];
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (alerts.length > 0) {
        setCurrentAlertIndex(prev => (prev + 1) % alerts.length);
      }
    }, 4500);
    return () => clearInterval(id);
  }, [alerts.length]);

  // Districts ranking
  const districtsRanked = (dtmUser?.districts ?? [])
    .filter(d => selectedRegion === "all" || d.region === selectedRegion)
    .map(d => ({
      name: d.district.length > 18 ? d.district.slice(0, 18) + "…" : d.district,
      pct: d.tested_percent,
      registered: d.registered_count,
      answered: d.answered_count,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 12);

  // Alert schools — low submission or low avg
  const alertSchools = (aggregSchools)
    .filter(s => (s.registered_count ?? 0) >= 10)
    .map(s => ({
      name: s.name,
      district: s.district ?? "—",
      registered: s.registered_count ?? 0,
      answered: s.answered_count ?? 0,
      pct: s.tested_percent ?? 0,
      avg: s.avg_total_ball ?? 0,
    }))
    .filter(s => s.pct < 40 || (s.avg > 0 && s.avg < PASS_LINE))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 15);

  const pieData = [
    { name: `O'tdi (≥${PASS_LINE})`, value: passed,     fill: "hsl(142 71% 45%)" },
    { name: "O'tmadi",               value: failed,     fill: "hsl(0 72% 55%)"   },
    { name: "Natija chiqmagan",           value: notSubmitted, fill: "hsl(215 16% 65%)" },
  ].filter(d => d.value > 0);

  const isLive = !loading && loadedEntities.length > 0;

  return (
    <AdminLayout variant="super">
      {/* 🚨 Live Security & Activity Ticker Alert */}
      <div className="mx-2 mt-2">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentAlertIndex}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className={`p-3 rounded-2xl flex items-center justify-between shadow-sm border text-xs font-semibold ${
              alerts[currentAlertIndex]?.type === "attack" 
                ? "bg-red-500/10 border-red-500/30 text-red-600" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
            }`}
          >
            <div className="flex items-center gap-2">
              {alerts[currentAlertIndex]?.type === "attack" ? (
                <ShieldAlert className="h-4 w-4 animate-pulse" />
              ) : (
                <Users className="h-4 w-4 animate-bounce" />
              )}
              <span>Tizim Xabari: {alerts[currentAlertIndex]?.text}</span>
            </div>
            <Badge variant="outline" className={`rounded-full text-[10px] px-2 ${
              alerts[currentAlertIndex]?.type === "attack" ? "bg-red-600/10 text-red-600 border-red-500/30" : "bg-emerald-600/10 text-emerald-600 border-emerald-500/30"
            }`}>Faol</Badge>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-8">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground mt-1">DTM platformasi umumiy tahlili</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground glass-card rounded-full px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{progress.loaded}/{progress.total} yuklandi</span>
              </div>
            )}

            {stats?.isApproximate && !loading && (
              <Badge variant="secondary" className="rounded-full">Taxminiy</Badge>
            )}

            <div className="flex items-center gap-2 glass-card rounded-full px-4 py-2">
              <Label htmlFor="mode-toggle" className="text-xs font-medium">Aniq ma'lumot</Label>
              <Switch
                id="mode-toggle"
                checked={mode === "accurate"}
                onCheckedChange={c => setMode(c ? "accurate" : "fast")}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2 glass-card rounded-full px-4 py-2">
              <Label htmlFor="refresh-toggle" className="text-xs font-medium">Avto-yangilash</Label>
              <Switch
                id="refresh-toggle"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>

            {!loading && stats && (
              <>
                <ExcelExportButton
                  label="Excel"
                  filename="SuperAdmin_Statistikasi"
                  onExport={() => exportSuperAdminExcel(aggregSchools, dtmUser?.districts || [])}
                />
                <PDFExportButton
                  label="PDF"
                  onExport={() => exportSuperAdminPDF({
                    totalUsers: total,
                    answeredUsers: submitted,
                    testedPercent: parseFloat(submitPct),
                    schoolCount: aggregSchools.length,
                    avgBall: avgBall,
                    passLine: PASS_LINE,
                    schools: aggregSchools.map(s => ({
                      id: 0, region: s.region, district: s.district, name: s.name, code: s.code,
                      registered_count: s.registered_count, answered_count: s.answered_count,
                      tested_percent: s.tested_percent, avg_total_ball: s.avg_total_ball
                    })),
                    districts: dtmUser?.districts,
                    topStudents: baseEntities,
                    adminName: dtmUser?.full_name,
                  })}
                />
              </>
            )}
            
            <Button variant="outline" size="icon" onClick={retry} disabled={loading} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button onClick={() => navigate("/super-admin/security")} variant="outline" className="rounded-xl">
              <Shield className="mr-2 h-4 w-4" /> Xavfsizlik
            </Button>

            <Button onClick={() => navigate("/super-admin/settings")} className="rounded-xl">
              <Settings className="mr-2 h-4 w-4" /> Sozlamalar
            </Button>
          </div>
        </div>

        {/* ── 0. Filtrlar ────────────────────────────────────────── */}
        {mode === "accurate" && loadedEntities.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border border-border/50 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground mr-1">Viloyat:</Label>
              <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setSelectedDistrict("all"); }}>
                <SelectTrigger className="w-[170px] rounded-xl h-9 bg-background/50">
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground mr-1">Tuman:</Label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger className="w-[170px] rounded-xl h-9 bg-background/50">
                  <SelectValue placeholder="Barchasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            { (selectedRegion !== "all" || selectedDistrict !== "all") && (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-normal">
                Filtr faol: {baseEntities.length.toLocaleString()} o'quvchi
              </Badge>
            )}
          </motion.div>
        )}

        {/* ── Subject Diagnostics Alert ── */}
        {worstSubject && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-400 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Diagnostika: Maslahat</p>
                <p className="text-xs opacity-90 mt-0.5">
                  Foydalanuvchilar orasida <b>{worstSubject.name}</b> fani o'rtacha o'zlashtirish ko'rsatkichi eng past: <b>{worstSubject.pct}%</b>. Ushbu fanga ko'proq e'tibor qaratish tavsiya qilinadi.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── 1. Asosiy ko'rsatkichlar ────────────────────────────── */}
        <Section title="Asosiy ko'rsatkichlar">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="rounded-2xl">
                  <CardContent className="p-5"><Skeleton className="h-16" /></CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KPI i={0} label="Jami ro'yxatdagi o'quvchilar" value={total.toLocaleString()} icon={Users}
                color="bg-blue-500/15 text-blue-600" />
              <KPI i={1} label="Natijasi bor" value={submitted.toLocaleString()}
                sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
              <KPI i={2} label="Natija chiqmagan" value={notSubmitted.toLocaleString()}
                sub={`${(100 - parseFloat(submitPct)).toFixed(1)}%`} icon={XCircle} color="bg-red-500/15 text-red-600" />
              <KPI i={3} label={`O'tish balli (${PASS_LINE}+) olganlar`}
                value={isLive ? passed.toLocaleString() : "—"} sub={isLive ? `${passPct}% topshirganlardan` : ""}
                icon={Trophy} color="bg-yellow-500/15 text-yellow-600" />
              <KPI i={4} label="Barcha maktablar o'rtacha balli"
                value={avgBall > 0 ? `${avgBall.toFixed(1)} / 189` : "—"}
                icon={TrendingUp} color="bg-purple-500/15 text-purple-600" />
            </div>

            {/* 🛡️ Xavfsizlik Quick Access Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-emerald-500/15 transition-colors"
              onClick={() => navigate("/super-admin/security")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">🛡️ Sessiyalar & Xavfsizlik Monitoringi</p>
                  <p className="text-xs opacity-90 mt-0.5">Tizim kirish jurnali va xavfsizlik tahliliga kiring</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl bg-transparent border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20">Ko'rish</Button>
            </motion.div>
            </>
          )}
        </Section>

        {/* ── 2. Ball taqsimoti + O'tdi/O'tmadi ─────────────────── */}
        {isLive && (
          <Section title="Ball taqsimoti">
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Score range bars */}
              <Card className="rounded-2xl lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    O'quvchilar ball oralig'i bo'yicha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreBands} margin={{ top: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: number) => [`${v.toLocaleString()} o'quvchi`, "Soni"]}
                        />
                        <Bar dataKey="soni" radius={[6, 6, 0, 0]}>
                          {scoreBands.map((b, i) => (
                            <Cell
                               key={b.label}
                               fill={i < 4 ? "hsl(0 72% 55%)" : i < 7 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"}
                             />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pie chart */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Umumiy holat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="45%"
                          outerRadius={72} innerRadius={40}
                          paddingAngle={3} label={false}>
                          {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: number) => [`${v.toLocaleString()} o'quvchi`]}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Language Pie */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Til bo'yicha tahlil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={langData} dataKey="value" cx="50%" cy="45%"
                          outerRadius={68} innerRadius={35}
                          paddingAngle={3} label={false}>
                          {langData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: number) => [`${v.toLocaleString()} o'quvchi`]}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gender Pie */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Jins bo'yicha tahlil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderData} dataKey="value" cx="50%" cy="45%"
                          outerRadius={68} innerRadius={35}
                          paddingAngle={3} label={false}>
                          {genderData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: number) => [`${v.toLocaleString()} o'quvchi`]}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>
        )}

        {/* ── 2.5 Vaqt va Faollik Tahlili ── */}
        {mode === "accurate" && timelineChart.length > 0 && (
          <Section title="Vaqt va faollik tahlili">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Daily LineChart */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Kunlik topshirishlar dinamikasi (Oxirgi 12 nuqta)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
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
                    <Clock className="h-4 w-4 text-purple-500" />
                    Kun vaqti bo'yicha faollik (Soatbay)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
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

        {/* 2.5 Fanlar kesimida tahlil */}
        {subjectAveragesAll.length > 0 && (
          <Section title="Fanlar kesimida tahlil">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Average Score BarChart */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Fanlar bo'yicha o'rtacha ball
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectAveragesAll} layout="vertical" margin={{ left: 8, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ball`, "O'rtacha ball"]} />
                        <Bar dataKey="avg" radius={[0, 6, 6, 0]} fill="hsl(217 91% 60%)" barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Popularity Count BarChart */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    Fanlarni tanlagan o'quvchilar qamrovi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[...subjectAveragesAll].sort((a,b) => b.count - a.count)} layout="vertical" margin={{ left: 8, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ta`, "O'quvchilar soni"]} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="hsl(142 71% 45%)" barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>
        )}

        {/* ── 3. Maktablar reytingi ──────────────────────────────── */}
        {(dtmUser?.schools?.length ?? 0) > 0 && (
          <Section title="Maktablar reytingi">
            <div className="space-y-6">
              <div className="grid gap-5 lg:grid-cols-2">
                {/* By submission rate */}
                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Topshirish foizi bo'yicha top 10 maktab
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSchoolsBySubmit} layout="vertical" margin={{ left: 8, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v}%`, "Topshirish"]} />
                          <Bar dataKey="pct" radius={[0, 6, 6, 0]} name="pct">
                            {topSchoolsBySubmit.map((s, i) => <Cell key={i} fill={s.pct >= 80 ? "hsl(142 71% 45%)" : s.pct >= 50 ? "hsl(38 92% 50%)" : "hsl(0 72% 55%)"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* By avg score */}
                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      O'rtacha ball bo'yicha top 10 maktab
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSchoolsByScore} layout="vertical" margin={{ left: 8, right: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                          <XAxis type="number" domain={[0, 189]} tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ball`, "O'rtacha ball"]} />
                          <Bar dataKey="ball" fill="hsl(217 91% 55%)" radius={[0, 6, 6, 0]}>
                            {topSchoolsByScore.map((s, i) => <Cell key={i} fill={i === 0 ? "hsl(38 92% 50%)" : i === 1 ? "hsl(215 70% 60%)" : "hsl(217 91% 55%)"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Bottom 5 Rankings Grid ── */}
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Lowest submission rate */}
                <Card className="rounded-2xl border-red-500/10 bg-gradient-to-b from-transparent to-red-500/[0.02]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Eng past topshirish ko'rsatkichi (Quyi 5)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bottomSchoolsBySubmit} layout="vertical" margin={{ left: 8, right: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v}%`, "Topshirish"]} />
                          <Bar dataKey="pct" radius={[0, 6, 6, 0]} fill="hsl(0 72% 55%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Lowest avg score */}
                <Card className="rounded-2xl border-red-500/10 bg-gradient-to-b from-transparent to-red-500/[0.02]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Eng past o'rtacha ball (Quyi 5)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bottomSchoolsByScore} layout="vertical" margin={{ left: 8, right: 35 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                          <XAxis type="number" domain={[0, 189]} tick={{ fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ball`, "O'rtacha ball"]} />
                          <Bar dataKey="ball" radius={[0, 6, 6, 0]} fill="hsl(0 72% 55%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>
        )}

        {/* ── 4. Tumanlar reytingi ───────────────────────────────── */}
        {districtsRanked.length > 0 && (
          <Section title="Tumanlar reytingi">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-500" />
                  Topshirish foizi bo'yicha tumanlar (top 12)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtsRanked} margin={{ top: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={48} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        contentStyle={ChartTooltipStyle}
                        formatter={(v: number) => [`${v.toFixed(1)}%`, "Topshirish"]}
                      />
                      <Bar dataKey="pct" radius={[6, 6, 0, 0]} name="pct">
                        {districtsRanked.map((d, i) => (
                          <Cell key={i} fill={d.pct >= 80 ? "hsl(142 71% 45%)" : d.pct >= 50 ? "hsl(217 91% 55%)" : "hsl(0 72% 55%)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* ── 5. Diqqat talab maktablar ─────────────────────────── */}
        {alertSchools.length > 0 && (
          <Section title="Diqqat talab maktablar">
            <Card className="rounded-2xl border-orange-200 dark:border-orange-900/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Topshirish foizi past (&lt;40%) yoki o'rtacha ball {PASS_LINE} dan past
                  <Badge variant="destructive" className="ml-auto">{alertSchools.length} ta maktab</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground text-xs">
                        <th className="text-left py-2 pr-4 font-medium">Maktab</th>
                        <th className="text-left py-2 pr-4 font-medium">Tuman</th>
                        <th className="text-right py-2 pr-4 font-medium">Ro'yxatda</th>
                        <th className="text-right py-2 pr-4 font-medium">Topshirdi</th>
                        <th className="text-right py-2 pr-4 font-medium">Foiz</th>
                        <th className="text-right py-2 font-medium">O'rt. ball</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertSchools.map((s, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 font-medium max-w-[200px] truncate">{s.name}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground text-xs">{s.district}</td>
                          <td className="py-2.5 pr-4 text-right">{s.registered.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 text-right">{s.answered.toLocaleString()}</td>
                          <td className="py-2.5 pr-4 text-right">
                            <span className={`font-semibold ${s.pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                              {s.pct.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`font-semibold ${s.avg >= 70 ? "text-green-600" : s.avg > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                              {s.avg > 0 ? s.avg.toFixed(1) : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Section>
        )}

        {/* Loading skeleton for charts */}
        {loading && (
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-6"><Skeleton className="h-40" /></CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
