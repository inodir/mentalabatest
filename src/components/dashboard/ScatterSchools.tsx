import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { GitBranch } from "lucide-react";
import type { DTMSchoolInfo } from "@/lib/dtm-auth";

interface ScatterSchoolsProps {
  schools?: DTMSchoolInfo[];
}

export function ScatterSchools({ schools }: ScatterSchoolsProps) {
  if (!schools || schools.length === 0) return null;

  const data = schools
    .filter((s) => (s.avg_total_ball ?? 0) > 0 && (s.tested_percent ?? 0) > 0)
    .map((s) => ({
      x: Math.round(s.tested_percent ?? 0),
      y: Math.round((s.avg_total_ball ?? 0) * 10) / 10,
      z: s.registered_count ?? 10,
      name: s.name,
      district: s.district,
      code: s.code,
    }));

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4 text-primary" />
          Maktablar taqqoslash (topshirish % vs o'rtacha ball)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Nuqta kattaligi = ro'yxatdan o'tganlar soni. X=topshirish%, Y=o'rtacha ball
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="x"
                name="Topshirish %"
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="y"
                name="O'rtacha ball"
                type="number"
                domain={[0, 189]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <ZAxis dataKey="z" range={[30, 300]} name="O'quvchilar" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const p = payload[0]?.payload as typeof data[0];
                  return (
                    <div className="p-3 rounded-xl border bg-card text-xs space-y-1">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-muted-foreground">{p.district} · {p.code}</p>
                      <p>Topshirish: <strong>{p.x}%</strong></p>
                      <p>O'rtacha ball: <strong>{p.y}</strong></p>
                      <p>Ro'yxatda: <strong>{p.z}</strong></p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={data}
                fill="hsl(217 91% 55%)"
                fillOpacity={0.65}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
