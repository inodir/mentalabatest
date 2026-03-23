import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, Search, Filter } from "lucide-react";
import type { DTMSchoolInfo } from "@/lib/dtm-auth";

interface SchoolRiskTableProps {
  schools?: DTMSchoolInfo[];
  passLine?: number;
}

type RiskLevel = "all" | "high" | "medium" | "low" | "none";

function getRisk(avgBall: number, passLine: number, testedPct: number): {
  level: RiskLevel;
  label: string;
  badgeClass: string;
  color: string;
} {
  if (testedPct === 0 || avgBall === 0) {
    return { level: "none", label: "Natijasiz", badgeClass: "bg-gray-500/15 text-gray-600 dark:text-gray-400", color: "hsl(0 0% 50%)" };
  }
  if (avgBall < passLine * 0.6) {
    return { level: "high", label: "Yuqori xavf", badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400", color: "hsl(0 72% 51%)" };
  }
  if (avgBall < passLine) {
    return { level: "medium", label: "O'rta xavf", badgeClass: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", color: "hsl(38 92% 50%)" };
  }
  return { level: "low", label: "Xavfsiz", badgeClass: "bg-green-500/15 text-green-600 dark:text-green-400", color: "hsl(142 71% 45%)" };
}

export function SchoolRiskTable({ schools, passLine = 70 }: SchoolRiskTableProps) {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskLevel>("all");

  if (!schools || schools.length === 0) return null;

  const regions = useMemo(() => {
    const set = new Set(schools.map((s) => s.region).filter(Boolean));
    return Array.from(set).sort();
  }, [schools]);

  const districts = useMemo(() => {
    const filtered = selectedRegion === "all"
      ? schools
      : schools.filter((s) => s.region === selectedRegion);
    const set = new Set(filtered.map((s) => s.district).filter(Boolean));
    return Array.from(set).sort();
  }, [schools, selectedRegion]);

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      const tested = s.tested_percent ?? 0;
      const avg = s.avg_total_ball ?? 0;
      const risk = getRisk(avg, passLine, tested);

      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        (s.district || "").toLowerCase().includes(search.toLowerCase());

      const matchRegion = selectedRegion === "all" || s.region === selectedRegion;
      const matchDistrict = selectedDistrict === "all" || s.district === selectedDistrict;
      const matchRisk = riskFilter === "all" || risk.level === riskFilter;

      return matchSearch && matchRegion && matchDistrict && matchRisk;
    });
  }, [schools, search, selectedRegion, selectedDistrict, riskFilter, passLine]);

  const sorted = [...filtered].sort((a, b) => {
    // Sort: high risk first, then medium, then low, then none
    const order = { high: 0, medium: 1, none: 2, low: 3 };
    const ra = getRisk(a.avg_total_ball ?? 0, passLine, a.tested_percent ?? 0);
    const rb = getRisk(b.avg_total_ball ?? 0, passLine, b.tested_percent ?? 0);
    return (order[ra.level] ?? 4) - (order[rb.level] ?? 4);
  });

  // Summary counts
  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0, none: 0 };
    for (const s of schools) {
      const r = getRisk(s.avg_total_ball ?? 0, passLine, s.tested_percent ?? 0);
      c[r.level as keyof typeof c] = (c[r.level as keyof typeof c] ?? 0) + 1;
    }
    return c;
  }, [schools, passLine]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          Maktab bo'yicha xavflilik darajasi va tayyorgarlik
          <Badge variant="outline" className="ml-auto text-xs">
            O'tish balli: {passLine}
          </Badge>
        </CardTitle>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { key: "high",   label: `Yuqori xavf: ${counts.high}`,   cls: "bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400" },
            { key: "medium", label: `O'rta xavf: ${counts.medium}`,  cls: "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 dark:text-yellow-400" },
            { key: "low",    label: `Xavfsiz: ${counts.low}`,        cls: "bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:text-green-400" },
            { key: "none",   label: `Natijasiz: ${counts.none}`,     cls: "bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 dark:text-gray-400" },
          ].map((b) => (
            <button
              key={b.key}
              onClick={() => setRiskFilter(riskFilter === b.key ? "all" : b.key as RiskLevel)}
              className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold border border-transparent transition-colors ${b.cls} ${riskFilter === b.key ? "ring-2 ring-current" : ""}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Maktab nomi yoki kod..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select
            value={selectedRegion}
            onValueChange={(v) => { setSelectedRegion(v); setSelectedDistrict("all"); }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Viloyat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha viloyatlar</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedDistrict}
            onValueChange={setSelectedDistrict}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Tuman" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha tumanlar</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Maktab</th>
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground hidden md:table-cell">Tuman</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Topshirish</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">O'rt. ball</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Tayyorgarlik</th>
                  <th className="text-center py-2.5 px-2 font-medium text-muted-foreground">Xavf</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Maktablar topilmadi
                    </td>
                  </tr>
                ) : (
                  sorted.map((school) => {
                    const tested = school.tested_percent ?? 0;
                    const avg = school.avg_total_ball ?? 0;
                    const risk = getRisk(avg, passLine, tested);
                    // Readiness = avg_ball / 189 (max ball)
                    const readinessPct = Math.min(100, Math.round((avg / 189) * 100));

                    return (
                      <tr
                        key={school.code}
                        className="border-t hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <p className="font-medium truncate max-w-[180px]">{school.name}</p>
                          <p className="text-[10px] text-muted-foreground">{school.code}</p>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground hidden md:table-cell">
                          {school.district || "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium">{tested.toFixed(0)}%</span>
                            <Progress
                              value={tested}
                              className="h-1.5 w-16"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {avg > 0 ? (
                            <span
                              className="font-bold text-sm"
                              style={{ color: risk.color }}
                            >
                              {avg.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {avg > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-medium">{readinessPct}%</span>
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${readinessPct}%`, backgroundColor: risk.color }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk.badgeClass}`}>
                            {risk.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30">
            {sorted.length} / {schools.length} ta maktab · O'tish balli: {passLine}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
