import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDTMDashboard } from "@/hooks/useDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, CheckCircle, XCircle, TrendingUp, Settings, Shield, ShieldAlert,
  RefreshCw, AlertCircle, Loader2, Trophy, MapPin, Clock, Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
} from "recharts";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportSuperAdminPDF } from "@/lib/exportPDF";
import { ExcelExportButton } from "@/components/ui/excel-export-button";
import { exportSuperAdminExcel } from "@/lib/exportExcel";

import { normalizeGender, normalizeLanguage, hasDTMResult, getUserTotalPoint, getScoreDistribution, getSubjectMastery, getRegionalRanking, getTrendAnalysis } from "@/lib/stats-utils";
import { StatsKPI, DashboardSection } from "@/components/dashboard/StatsKPI";
import { DetailedScoreChart } from "@/components/dashboard/DetailedScoreChart";
import { SubjectMasterySection } from "@/components/dashboard/SubjectMasterySection";
import { RegionalRankingSection } from "@/components/dashboard/RegionalRankingSection";
import { GenderLanguageSection } from "@/components/dashboard/GenderLanguageSection";
import { SchoolRankingsSection } from "@/components/dashboard/SchoolRankingsSection";
import { AlertSchoolsSection } from "@/components/dashboard/AlertSchoolsSection";
import { TimeAnalyticsSection } from "@/components/dashboard/TimeAnalyticsSection";
import { SyncStatusIndicator } from "@/components/dashboard/SyncStatusIndicator";

import { DataHealthSection } from "@/components/dashboard/DataHealthSection";
import logsData from "@/data/security_logs.json";

const PASS_LINE = 70;

// Extra components and styles were moved to separate files.

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { dtmUser } = useAuth();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const { stats, loading, error, mode, setMode, progress, retry, loadedEntities, lastSynced } = useDTMDashboard({
    initialMode: "accurate",
    autoRefresh,
  });
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
  const submitted    = mode === "accurate" ? baseEntities.filter(u => hasDTMResult(u)).length : (stats?.resultUsersCount ?? 0);
  const notSubmitted = total - submitted;
  const submitPct    = total > 0 ? ((submitted / total) * 100).toFixed(1) : "0";
  
  const avgBall = mode === "accurate" && submitted > 0 
    ? baseEntities.reduce((sum, u) => sum + (getUserTotalPoint(u) ?? 0), 0) / submitted 
    : (stats?.averageTotalPoint ?? 0);

  const passed     = baseEntities.filter(u => hasDTMResult(u) && (getUserTotalPoint(u) ?? 0) >= PASS_LINE).length;
  const failed     = baseEntities.filter(u => hasDTMResult(u) && (getUserTotalPoint(u) ?? 0) > 0 && (getUserTotalPoint(u) ?? 0) < PASS_LINE).length;
  const passPct    = submitted > 0 ? ((passed / submitted) * 100).toFixed(1) : "0";

  const regionalRanking = useMemo(() => getRegionalRanking(baseEntities), [baseEntities]);
  const subjectMastery = useMemo(() => getSubjectMastery(baseEntities), [baseEntities]);
  const trendAnalysis = useMemo(() => getTrendAnalysis(baseEntities), [baseEntities]);

  // Score range bands  
  const scoreBands = useMemo(() => 
    getScoreDistribution(baseEntities, 10, 189),
    [baseEntities]
  );

  // Language stats
  const l_uz = baseEntities.filter(u => normalizeLanguage(u.language ?? u.dtm?.language ?? u.Language) === "uz").length;
  const l_ru = baseEntities.filter(u => normalizeLanguage(u.language ?? u.dtm?.language ?? u.Language) === "ru").length;
  const l_other = baseEntities.length - l_uz - l_ru;
  
  // Gender stats
  const maleUsers = baseEntities.filter(u => normalizeGender(u.gender ?? (u.dtm as any)?.gender ?? u.Gender) === 'male');
  const femaleUsers = baseEntities.filter(u => normalizeGender(u.gender ?? (u.dtm as any)?.gender ?? u.Gender) === 'female');
  
  const g_male = maleUsers.length;
  const g_female = femaleUsers.length;
  const g_other = baseEntities.length - g_male - g_female;

  const langData = [
    { name: "O'zbek", value: l_uz, fill: "hsl(217 91% 60%)" },
    { name: "Rus",    value: l_ru, fill: "hsl(0 84% 60%)"    },
    { name: "Boshqa", value: l_other, fill: "hsl(0 0% 60%)"   },
  ].filter(d => d.value > 0);

  const genderData = [
    { name: "O'g'il", value: g_male,   fill: "hsl(210 100% 50%)" },
    { name: "Qiz",   value: g_female, fill: "hsl(330 100% 70%)" },
    { name: "Boshqa", value: g_other,  fill: "hsl(0 0% 76%)"    },
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

  // Timeline analytics Grouping (Updated to use trendAnalysis)
  const timelineChart = trendAnalysis.map(d => {
    const parts = d.date.split("-");
    return { date: `${parts[2]}/${parts[1]}`, count: d.total_submissions, avg: d.avg_point };
  }).slice(-12);

  const hourlyChart = Array(24).fill(0).map((_, hour) => {
    const count = baseEntities.filter(u => {
      if (!u.created_at) return false;
      return new Date(u.created_at).getHours() === hour;
    }).length;
    return { hour: `${hour}:00`, count };
  }).filter(h => h.count > 0 || h.hour === "12:00" || h.hour === "15:00");

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

  const isLive = !loading && baseEntities.length > 0;

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
            <SyncStatusIndicator 
              progress={progress} 
              loading={loading} 
              lastSynced={lastSynced}
              error={error}
            />

            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <Label htmlFor="super-accurate-mode" className="text-xs font-medium">
                Aniq rejim
              </Label>
              <Switch
                id="super-accurate-mode"
                checked={mode === "accurate"}
                onCheckedChange={(checked) => setMode(checked ? "accurate" : "fast")}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-2">
              <Label htmlFor="super-auto-refresh" className="text-xs font-medium">
                Avtomatik yangilash
              </Label>
              <Switch
                id="super-auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>

            {stats?.isApproximate && !loading && (
              <Badge variant="secondary" className="rounded-full">Taxminiy</Badge>
            )}

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
        <DashboardSection title="Asosiy ko'rsatkichlar">
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
              <StatsKPI index={0} label="Jami ro'yxatdagi o'quvchilar" value={total.toLocaleString()} icon={Users}
                color="bg-blue-500/15 text-blue-600" />
              <StatsKPI index={1} label="Natijasi bor" value={submitted.toLocaleString()}
                sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
              <StatsKPI index={2} label="Natija chiqmagan" value={notSubmitted.toLocaleString()}
                sub={`${(100 - parseFloat(submitPct)).toFixed(1)}%`} icon={XCircle} color="bg-red-500/15 text-red-600" />
              <StatsKPI index={3} label={`O'tish balli (${PASS_LINE}+) olganlar`}
                value={isLive ? passed.toLocaleString() : "—"} sub={isLive ? `${passPct}% topshirganlardan` : ""}
                icon={Trophy} color="bg-yellow-500/15 text-yellow-600" />
              <StatsKPI index={4} label="O'rtacha ball"
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
        </DashboardSection>

        {/* ── 2. Ball taqsimoti + Demografiya ─────────────────── */}
        {isLive && (
          <>
            <DetailedScoreChart 
              scoreBands={scoreBands} 
              pieData={pieData} 
              baseEntities={baseEntities}
              title="Ball taqsimoti"
            />
            
            <GenderLanguageSection 
              genderData={genderData}
              langData={langData}
            />
          </>
        )}

        {/* ── 3. Hududlar va Fanlar Tahlili ────────────────────────── */}
        {isLive && mode === "accurate" && (
          <>
            <RegionalRankingSection 
              data={regionalRanking}
            />
            
            <SubjectMasterySection 
              data={subjectMastery}
            />
          </>
        )}

        {/* ── 4. Vaqt va Maktablar Reytingi ────────────────────────── */}
        <TimeAnalyticsSection 
          timelineData={timelineChart}
          hourlyData={hourlyChart}
        />

        {(dtmUser?.schools?.length ?? 0) > 0 && (
          <SchoolRankingsSection 
            topSchoolsBySubmit={topSchoolsBySubmit}
            topSchoolsByScore={topSchoolsByScore}
            bottomSchoolsBySubmit={bottomSchoolsBySubmit}
            bottomSchoolsByScore={bottomSchoolsByScore}
          />
        )}

        {/* ── 5. Diqqat talab maktablar ─────────────────────────── */}
        <AlertSchoolsSection 
          schools={alertSchools}
          passLine={PASS_LINE}
        />

        {/* ── 6. Ma'lumotlar salomatligi ─────────────────────── */}
        {isLive && mode === "accurate" && (
          <DataHealthSection users={baseEntities} />
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
