import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { DTMDistrictInfo } from "@/lib/dtm-auth";

interface DistrictsChartProps {
  districts?: DTMDistrictInfo[];
}

function pctColor(pct: number) {
  if (pct >= 80) return "hsl(142 71% 45%)";
  if (pct >= 60) return "hsl(217 91% 55%)";
  if (pct >= 40) return "hsl(38 92% 50%)";
  return "hsl(0 72% 51%)";
}

export function DistrictsChart({ districts }: DistrictsChartProps) {
  if (!districts || districts.length === 0) return null;

  const sorted = [...districts]
    .sort((a, b) => b.tested_percent - a.tested_percent);

  const chartData = sorted.slice(0, 15).map((d) => ({
    name: d.district.length > 14 ? d.district.slice(0, 14) + "…" : d.district,
    fullName: d.district,
    region: d.region,
    pct: Math.round(d.tested_percent * 10) / 10,
    answered: d.answered_count,
    registered: d.registered_count,
    schools: d.school_count,
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Tumanlar bo'yicha test topshirish foizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, _: string, props: { payload?: typeof chartData[0] }) => [
                    `${value}%`,
                    `${props.payload?.answered ?? 0} / ${props.payload?.registered ?? 0} ta`,
                  ]}
                  labelFormatter={(label: string) => {
                    const item = chartData.find((d) => d.name === label);
                    return item ? `${item.fullName} (${item.region})` : label;
                  }}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={pctColor(entry.pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tuman reytingi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sorted.slice(0, 10).map((d, idx) => (
            <div
              key={`${d.region}-${d.district}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 text-right">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.district}</p>
                <p className="text-[10px] text-muted-foreground">{d.region} · {d.school_count} maktab</p>
              </div>
              <Badge
                className="shrink-0 text-white border-0 font-bold text-xs"
                style={{ backgroundColor: pctColor(d.tested_percent) }}
              >
                {d.tested_percent.toFixed(0)}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
