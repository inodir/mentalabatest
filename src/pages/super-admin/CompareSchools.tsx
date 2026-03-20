import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useDTMDashboard } from "@/hooks/useDTMDashboard";
import { BarChart as BarChartIcon, Users, CheckCircle, TrendingUp, School, ArrowUpRight, ArrowDownRight, Globe, Award, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const PASS_LINE = 70;

export default function CompareSchools() {
  const { dtmUser } = useAuth();
  const { loadedEntities, mode, loading } = useDTMDashboard();
  const schools = dtmUser?.schools ?? [];

  const [schoolA, setSchoolA] = useState<string>("none");
  const [schoolB, setSchoolB] = useState<string>("none");

  const dataA = useMemo(() => {
    if (schoolA === "none") return null;
    const currSchool = schools.find(s => s.code === schoolA);
    const list = loadedEntities.filter(u => u.school_code === schoolA);
    const registered = list.length || currSchool?.registered_count || 0;
    const answered = list.filter(u => u.has_result).length || currSchool?.answered_count || 0;
    const passed = list.filter(u => u.has_result && (u.total_point ?? 0) >= PASS_LINE).length;
    const totalScore = list.filter(u => u.has_result).reduce((sum, u) => sum + (u.total_point ?? 0), 0);
    const avg = answered > 0 ? totalScore / answered : (currSchool?.avg_total_ball ?? 0);

    return {
      name: currSchool?.name || "Maktab A", code: schoolA, district: currSchool?.district || "—", region: currSchool?.region || "—",
      registered, answered, passed, pct: registered > 0 ? (answered / registered) * 100 : 0, avg,
      boys: list.filter(u => u.gender === "male").length, girls: list.filter(u => u.gender === "female").length,
      uz: list.filter(u => u.language === "uz").length, ru: list.filter(u => u.language === "ru").length,
    };
  }, [schoolA, loadedEntities, schools]);

  const dataB = useMemo(() => {
    if (schoolB === "none") return null;
    const currSchool = schools.find(s => s.code === schoolB);
    const list = loadedEntities.filter(u => u.school_code === schoolB);
    const registered = list.length || currSchool?.registered_count || 0;
    const answered = list.filter(u => u.has_result).length || currSchool?.answered_count || 0;
    const passed = list.filter(u => u.has_result && (u.total_point ?? 0) >= PASS_LINE).length;
    const totalScore = list.filter(u => u.has_result).reduce((sum, u) => sum + (u.total_point ?? 0), 0);
    const avg = answered > 0 ? totalScore / answered : (currSchool?.avg_total_ball ?? 0);

    return {
      name: currSchool?.name || "Maktab B", code: schoolB, district: currSchool?.district || "—", region: currSchool?.region || "—",
      registered, answered, passed, pct: registered > 0 ? (answered / registered) * 100 : 0, avg,
      boys: list.filter(u => u.gender === "male").length, girls: list.filter(u => u.gender === "female").length,
      uz: list.filter(u => u.language === "uz").length, ru: list.filter(u => u.language === "ru").length,
    };
  }, [schoolB, loadedEntities, schools]);

  const comparisonChartData = useMemo(() => {
    if (!dataA && !dataB) return [];
    return [
      { name: "Topshirish (%)", A: Math.round(dataA?.pct ?? 0), B: Math.round(dataB?.pct ?? 0) },
      { name: "O'rtacha Ball", A: Math.round(dataA?.avg ?? 0), B: Math.round(dataB?.avg ?? 0) },
      { name: "O'tish (%)", A: dataA?.answered ? Math.round((dataA.passed / dataA.answered) * 100) : 0, B: dataB?.answered ? Math.round((dataB.passed / dataB.answered) * 100) : 0 },
    ];
  }, [dataA, dataB]);

  const subjectComparisonData = useMemo(() => {
    if (!dataA && !dataB) return [];
    const stats: Record<string, { A_sum: number, A_cnt: number, B_sum: number, B_cnt: number }> = {};

    const processUser = (u: any, key: "A" | "B") => {
      const res = u.test_results;
      if (!res) return;
      res.mandatory?.forEach((m: any) => {
        const name = m.name?.trim();
        if (!name || name.toLowerCase() === "noma'lum") return;
        if (!stats[name]) stats[name] = { A_sum: 0, A_cnt: 0, B_sum: 0, B_cnt: 0 };
        stats[name][`${key}_sum`] += (m.point ?? 0);
        stats[name][`${key}_cnt`]++;
      });
      if (res.primary) {
        const name = res.primary.name?.trim();
        if (name && name.toLowerCase() !== "noma'lum") {
          if (!stats[name]) stats[name] = { A_sum: 0, A_cnt: 0, B_sum: 0, B_cnt: 0 };
          stats[name][`${key}_sum`] += (res.primary.point ?? 0);
          stats[name][`${key}_cnt`]++;
        }
      }
      if (res.secondary) {
        const name = res.secondary.name?.trim();
        if (name && name.toLowerCase() !== "noma'lum") {
          if (!stats[name]) stats[name] = { A_sum: 0, A_cnt: 0, B_sum: 0, B_cnt: 0 };
          stats[name][`${key}_sum`] += (res.secondary.point ?? 0);
          stats[name][`${key}_cnt`]++;
        }
      }
    };

    if (schoolA !== "none") loadedEntities.filter(u => u.school_code === schoolA).forEach(u => processUser(u, "A"));
    if (schoolB !== "none") loadedEntities.filter(u => u.school_code === schoolB).forEach(u => processUser(u, "B"));

    return Object.entries(stats).map(([name, s]) => ({
      name: name.length > 24 ? name.slice(0, 22) + "…" : name,
      A: s.A_cnt > 0 ? Math.round((s.A_sum / s.A_cnt) * 10) / 10 : 0,
      B: s.B_cnt > 0 ? Math.round((s.B_sum / s.B_cnt) * 10) / 10 : 0,
    })).filter(item => item.A > 0 || item.B > 0).sort((a, b) => b.A + b.B - (a.A + a.B)); // Sort by high combined averages
  }, [schoolA, schoolB, loadedEntities, dataA, dataB]);

  return (
    <AdminLayout variant="super">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-7 w-7 text-primary" /> Maktablarni solishtirish
          </h1>
          <p className="text-muted-foreground mt-1">Ikki maktab statistikasini yonma-yon tahlil qilish</p>
        </div>

        {/* Selection Row */}
        <div className="grid gap-4 sm:grid-cols-2 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">1-Maktab</Label>
            <Select value={schoolA} onValueChange={setSchoolA}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Maktabni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {schools.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">2-Maktab</Label>
            <Select value={schoolB} onValueChange={setSchoolB}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Maktabni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {schools.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Unified Comparison Chart */}
        {(dataA || dataB) && (
          <Card className="rounded-2xl border-primary/10 bg-background/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChartIcon className="h-5 w-5 text-primary" /> Vizual taqqoslash
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mode === "fast" && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-xl mb-3 text-xs border border-amber-500/20">
                  <AlertCircle className="h-4 w-4" />
                  <span>Aniqroq vizualizatsiya va gender/til tahlili uchun Bosh sahifada <strong>"Aniq rejim"</strong>ni yoqing.</span>
                </div>
              )}
              <div className="h-[250px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="A" name={dataA?.name || "1-Maktab"} fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} barSize={35} />
                    <Bar dataKey="B" name={dataB?.name || "2-Maktab"} fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Subject comparison Chart */}
        {subjectComparisonData.length > 0 && (
          <Card className="rounded-2xl border-primary/10 bg-background/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Fanlar kesimida tahlil (O'rtacha ball)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[380px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectComparisonData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="A" name={dataA?.name || "1-Maktab"} fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="B" name={dataB?.name || "2-Maktab"} fill="hsl(262 83% 58%)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Dashboard */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* School A */}
          <SchoolCompareCard title="1-Maktab" school={dataA} />
          {/* School B */}
          <SchoolCompareCard title="2-Maktab" school={dataB} />
        </div>
      </div>
    </AdminLayout>
  );
}

function SchoolCompareCard({ title, school }: { title: string, school: any }) {
  if (!school) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="rounded-full bg-muted p-3 mb-3">
            <School className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">{title} tanlanmagan</p>
        </CardContent>
      </Card>
    );
  }

  const registered = school.registered ?? school.registered_count ?? 0;
  const answered = school.answered ?? school.answered_count ?? 0;
  const pct = Math.round(school.pct ?? school.tested_percent ?? 0);
  const avg = Math.round((school.avg ?? school.avg_total_ball ?? 0) * 10) / 10;

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-transparent to-primary/5">
      <CardHeader className="border-b border-border/40 pb-4">
        <Badge variant="secondary" className="w-fit mb-1">{title}</Badge>
        <CardTitle className="text-xl font-bold">{school.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{school.district}, {school.region} | Kod: {school.code}</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/80 rounded-xl p-3 border border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" /> Jami
            </div>
            <p className="text-lg font-bold">{registered.toLocaleString()}</p>
          </div>

          <div className="bg-background/80 rounded-xl p-3 border border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Topshirdi
            </div>
            <p className="text-lg font-bold">{answered.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Topshirish ko'rsatkichi</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">O'rtacha ball (Max 189)</span>
              <span className="font-bold">{avg} ball</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (avg / 189) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Detailed Splits (Conditional on mode) */}
        {(school.boys > 0 || school.girls > 0 || school.uz > 0 || school.ru > 0) && (
          <div className="pt-3 border-t border-border/30 grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1 bg-background/50 p-2 rounded-xl border border-border/30">
              <span className="text-muted-foreground block">Jinsi (O'g'il / Qiz)</span>
              <div className="flex items-center justify-between font-bold">
                <span className="text-blue-600">{school.boys}</span>
                <span className="text-pink-600">{school.girls}</span>
              </div>
            </div>
            <div className="space-y-1 bg-background/50 p-2 rounded-xl border border-border/30">
              <span className="text-muted-foreground block">Tili (Uz / Ru)</span>
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">{school.uz}</span>
                <span className="text-indigo-600">{school.ru}</span>
              </div>
            </div>
          </div>
        )}

        {school.passed > 0 && (
          <div className="pt-2 flex items-center justify-between text-xs bg-green-500/5 p-2 rounded-xl border border-green-500/10">
            <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
              <Award className="h-3.5 w-3.5" /> O'tish balli yig'ganlar
            </span>
            <span className="font-bold text-green-600">{school.passed} o'quvchi</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
