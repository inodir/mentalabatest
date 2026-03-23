import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

interface BallDistributionChartProps {
  ballDistribution?: { labels: string[]; data: number[] };
}

const DIST_COLORS = [
  "hsl(0 72% 51%)",
  "hsl(38 92% 50%)",
  "hsl(48 96% 53%)",
  "hsl(142 71% 45%)",
  "hsl(217 91% 45%)",
];

export function BallDistributionChart({ ballDistribution }: BallDistributionChartProps) {
  if (!ballDistribution || ballDistribution.labels.length === 0) return null;

  const data = ballDistribution.labels.map((label, i) => ({
    range: label,
    count: ballDistribution.data[i] || 0,
  }));

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Ball taqsimoti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => {
                  const pct = total > 0 ? ((value / total) * 100).toFixed(2) : "0";
                  return [`${value} ta (${pct}%)`, "O'quvchilar"];
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {data.map((_, i) => (
                  <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
