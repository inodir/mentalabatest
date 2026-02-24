import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Crosshair } from "lucide-react";

interface MandatoryChartProps {
  mandatoryChart?: { labels: string[]; data: number[] };
}

export function MandatoryChart({ mandatoryChart }: MandatoryChartProps) {
  if (!mandatoryChart || mandatoryChart.labels.length === 0) return null;

  const data = mandatoryChart.labels.map((label, i) => ({
    subject: label,
    ball: mandatoryChart.data[i] || 0,
  }));

  const maxVal = Math.max(...data.map((d) => d.ball), 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crosshair className="h-4 w-4 text-primary" />
          Majburiy fanlar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <PolarRadiusAxis domain={[0, maxVal]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value.toFixed(1)} ball`, "O'rtacha"]}
              />
              <Radar
                dataKey="ball"
                stroke="hsl(217 91% 45%)"
                fill="hsl(217 91% 45%)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
