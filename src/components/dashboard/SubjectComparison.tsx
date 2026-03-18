import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DTMSchoolInfo } from "@/lib/dtm-auth";

interface SubjectComparisonProps {
  schools?: DTMSchoolInfo[];
}

export function SubjectComparison({ schools }: SubjectComparisonProps) {
  if (!schools || schools.length === 0) return null;

  const withData = schools.filter(
    (s) => (s.avg_primary_ball ?? 0) > 0 || (s.avg_secondary_ball ?? 0) > 0 || (s.avg_mandatory_ball ?? 0) > 0
  );
  if (withData.length === 0) return null;

  const topByPrimary = [...withData]
    .sort((a, b) => (b.avg_primary_ball ?? 0) - (a.avg_primary_ball ?? 0))
    .slice(0, 10);

  const chartData = topByPrimary.map((s) => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
    fullName: s.name,
    majburiy: Math.round((s.avg_mandatory_ball ?? 0) * 10) / 10,
    asosiy: Math.round((s.avg_primary_ball ?? 0) * 10) / 10,
    qoshimcha: Math.round((s.avg_secondary_ball ?? 0) * 10) / 10,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          Asosiy / Qo'shimcha / Majburiy fan taqqoslash
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
              <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => {
                  const s = chartData.find((d) => d.name === label);
                  return s?.fullName ?? label;
                }}
              />
              <Legend
                formatter={(v) =>
                  v === "majburiy" ? "Majburiy" : v === "asosiy" ? "Asosiy fan" : "Qo'shimcha"
                }
              />
              <Bar dataKey="majburiy"   fill="hsl(217 91% 55%)"  radius={[0, 4, 4, 0]} />
              <Bar dataKey="asosiy"     fill="hsl(142 71% 45%)"  radius={[0, 4, 4, 0]} />
              <Bar dataKey="qoshimcha"  fill="hsl(38 92% 50%)"   radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
