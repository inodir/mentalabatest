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
  Users, CheckCircle, XCircle, TrendingUp, School, Settings,
  RefreshCw, AlertCircle, Loader2, AlertTriangle, Trophy, MapPin,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportSuperAdminPDF } from "@/lib/exportPDF";

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
  const total        = stats?.totalUsers ?? 0;
  const submitted    = stats?.resultUsersCount ?? 0;
  const notSubmitted = stats?.noResultUsersCount ?? 0;
  const submitPct    = total > 0 ? ((submitted / total) * 100).toFixed(1) : "0";
  const avgBall      = stats?.averageTotalPoint ?? 0;

  const passed     = loadedEntities.filter(u => u.has_result && (u.total_point ?? 0) >= PASS_LINE).length;
  const failed     = loadedEntities.filter(u => u.has_result && (u.total_point ?? 0) > 0 && (u.total_point ?? 0) < PASS_LINE).length;
  const passPct    = submitted > 0 ? ((passed / submitted) * 100).toFixed(1) : "0";

  // Score range bands  
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
    soni: loadedEntities.filter(u => {
      const p = u.total_point ?? 0;
      return u.has_result && p >= b.min && p < b.max;
    }).length,
  }));

  // Top schools by submission %
  const topSchoolsBySubmit = (dtmUser?.schools ?? [])
    .filter(s => (s.registered_count ?? 0) > 0)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      pct: Math.round(((s.answered_count ?? 0) / (s.registered_count ?? 1)) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  // Top schools by avg score
  const topSchoolsByScore = (dtmUser?.schools ?? [])
    .filter(s => (s.avg_total_ball ?? 0) > 0)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name,
      ball: Math.round((s.avg_total_ball ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.ball - a.ball)
    .slice(0, 10);

  // Districts ranking
  const districtsRanked = (dtmUser?.districts ?? [])
    .map(d => ({
      name: d.district.length > 18 ? d.district.slice(0, 18) + "…" : d.district,
      pct: d.tested_percent,
      registered: d.registered_count,
      answered: d.answered_count,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 12);

  // Alert schools — low submission or low avg
  const alertSchools = (dtmUser?.schools ?? [])
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
    { name: "Topshirmagan",           value: notSubmitted, fill: "hsl(215 16% 65%)" },
  ].filter(d => d.value > 0);

  const isLive = !loading && loadedEntities.length > 0;

  return (
    <AdminLayout variant="super">
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

            {!loading && stats && (
              <PDFExportButton
                label="PDF hisobot"
                onExport={() => exportSuperAdminPDF({
                  totalUsers: stats.totalUsers,
                  answeredUsers: stats.resultUsersCount,
                  testedPercent: parseFloat(submitPct),
                  schoolCount: stats.totalSchools,
                  avgBall: avgBall,
                  passLine: PASS_LINE,
                  schools: dtmUser?.schools,
                  districts: dtmUser?.districts,
                  topStudents: loadedEntities,
                  adminName: dtmUser?.full_name,
                })}
              />
            )}

            <Button variant="outline" size="icon" onClick={retry} disabled={loading} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button onClick={() => navigate("/super-admin/settings")} className="rounded-xl">
              <Settings className="mr-2 h-4 w-4" /> Sozlamalar
            </Button>
          </div>
        </div>

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <KPI i={0} label="Jami ro'yxatdagi o'quvchilar" value={total.toLocaleString()} icon={Users}
                color="bg-blue-500/15 text-blue-600" />
              <KPI i={1} label="Test topshirganlar" value={submitted.toLocaleString()}
                sub={`${submitPct}%`} icon={CheckCircle} color="bg-green-500/15 text-green-600" />
              <KPI i={2} label="Hali topshirmaganlar" value={notSubmitted.toLocaleString()}
                sub={`${(100 - parseFloat(submitPct)).toFixed(1)}%`} icon={XCircle} color="bg-red-500/15 text-red-600" />
              <KPI i={3} label={`O'tish balli (${PASS_LINE}+) olganlar`}
                value={isLive ? passed.toLocaleString() : "—"} sub={isLive ? `${passPct}% topshirganlardan` : ""}
                icon={Trophy} color="bg-yellow-500/15 text-yellow-600" />
              <KPI i={4} label="Barcha maktablar o'rtacha balli"
                value={avgBall > 0 ? `${avgBall.toFixed(1)} / 189` : "—"}
                icon={TrendingUp} color="bg-purple-500/15 text-purple-600" />
            </div>
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
                              fill={i < 2 ? "hsl(0 72% 55%)" : i === 2 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"}
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
            </div>
          </Section>
        )}

        {/* ── 3. Maktablar reytingi ──────────────────────────────── */}
        {(dtmUser?.schools?.length ?? 0) > 0 && (
          <Section title="Maktablar reytingi">
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
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }}
                          tickFormatter={v => `${v}%`} />
                        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9 }} />
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: number) => [`${v}%`, "Topshirish"]}
                        />
                        <Bar dataKey="pct" radius={[0, 6, 6, 0]} name="pct">
                          {topSchoolsBySubmit.map((s, i) => (
                            <Cell key={i} fill={s.pct >= 80 ? "hsl(142 71% 45%)" : s.pct >= 50 ? "hsl(38 92% 50%)" : "hsl(0 72% 55%)"} />
                          ))}
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
                        <Tooltip
                          contentStyle={ChartTooltipStyle}
                          formatter={(v: number) => [`${v} ball`, "O'rtacha ball"]}
                        />
                        <Bar dataKey="ball" fill="hsl(217 91% 55%)" radius={[0, 6, 6, 0]}>
                          {topSchoolsByScore.map((s, i) => (
                            <Cell key={i} fill={
                              i === 0 ? "hsl(38 92% 50%)" : i === 1 ? "hsl(215 70% 60%)" : "hsl(217 91% 55%)"
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
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
