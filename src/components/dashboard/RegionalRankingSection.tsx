import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MapPin } from "lucide-react";
import { DashboardSection } from "./StatsKPI";

interface RegionalRankingSectionProps {
  data: any[];
}

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
};

export function RegionalRankingSection({ data }: RegionalRankingSectionProps) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-sm lg:col-span-2 overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Hududlar bo'yicha o'rtacha ball reytingi
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {data.length === 0 ? (
          <div className="h-[250px] w-full flex items-center justify-center text-sm text-muted-foreground">
            Hududlar bo'yicha yetarli natija topilmadi
          </div>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 500 }} domain={[0, 189]} />
                <YAxis 
                  dataKey="region" 
                  type="category" 
                  tick={{ fontSize: 10, fontWeight: 500 }} 
                  width={100} 
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={ChartTooltipStyle}
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                />
                <Bar dataKey="avg_point" name="O'rtacha ball" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--primary) / ${1 - (i * 0.05)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
