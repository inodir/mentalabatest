import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";
import { DashboardSection } from "./StatsKPI";

interface SchoolRankingsSectionProps {
  topSchoolsBySubmit: any[];
  topSchoolsByScore: any[];
  bottomSchoolsBySubmit: any[];
  bottomSchoolsByScore: any[];
}

import { ChartTooltipStyle } from "@/lib/stats-utils";

export function SchoolRankingsSection({ 
  topSchoolsBySubmit, 
  topSchoolsByScore, 
  bottomSchoolsBySubmit, 
  bottomSchoolsByScore 
}: SchoolRankingsSectionProps) {
  return (
    <DashboardSection title="Maktablar Reytingi">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top by submission */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Topshirish foizi bo'yicha top 10 maktab
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSchoolsBySubmit} layout="vertical" margin={{ left: 8, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fontWeight: 500 }} />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v}%`, "Topshirish"]} />
                  <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {topSchoolsBySubmit.map((s, i) => (
                      <Cell key={i} fill={i < 3 ? "hsl(142 71% 45%)" : "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top by avg score */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              O'rtacha ball bo'yicha top 10 maktab
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSchoolsByScore} layout="vertical" margin={{ left: 8, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" domain={[0, 189]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fontWeight: 500 }} />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ball`, "O'rtacha ball"]} />
                  <Bar dataKey="ball" fill="hsl(217 91% 55%)" radius={[0, 4, 4, 0]}>
                    {topSchoolsByScore.map((s, i) => (
                      <Cell key={i} fill={i === 0 ? "hsl(38 92% 50%)" : i === 1 ? "hsl(215 70% 60%)" : "hsl(217 91% 55%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Bottom by submission */}
        <Card className="rounded-2xl border-red-500/10 bg-gradient-to-b from-transparent to-red-500/[0.02] shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-red-500/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Eng past topshirish ko'rsatkichi (Quyi 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottomSchoolsBySubmit} layout="vertical" margin={{ left: 8, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fontWeight: 500 }} />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v}%`, "Topshirish"]} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill="hsl(0 72% 55%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bottom by avg score */}
        <Card className="rounded-2xl border-red-500/10 bg-gradient-to-b from-transparent to-red-500/[0.02] shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-red-500/10">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              Eng past o'rtacha ball (Quyi 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottomSchoolsByScore} layout="vertical" margin={{ left: 8, right: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                  <XAxis type="number" domain={[0, 189]} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fontWeight: 500 }} />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ball`, "O'rtacha ball"]} />
                  <Bar dataKey="ball" radius={[0, 4, 4, 0]} fill="hsl(0 72% 55%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
}
