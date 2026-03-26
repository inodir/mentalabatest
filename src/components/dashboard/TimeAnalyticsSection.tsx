import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock } from "lucide-react";
import { DashboardSection } from "./StatsKPI";

interface TimeAnalyticsSectionProps {
  timelineData: any[];
  hourlyData: any[];
}

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
};

export function TimeAnalyticsSection({ timelineData, hourlyData }: TimeAnalyticsSectionProps) {
  return (
    <DashboardSection title="Vaqtinchalik Tahlil (Dinamika)">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline Analysis */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden text-card-foreground">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Oxirgi 12 kundagi topshirish dinamikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 500 }} className="text-muted-foreground/60" />
                  <YAxis tick={{ fontSize: 10, fontWeight: 500 }} className="text-muted-foreground/60" />
                  <Tooltip contentStyle={ChartTooltipStyle} />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Topshirishlar" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Analysis */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden text-card-foreground">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Sutka davomidagi faollik (Soatlar bo'yicha)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 500 }} className="text-muted-foreground/60" />
                  <YAxis tick={{ fontSize: 10, fontWeight: 500 }} className="text-muted-foreground/60" />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v} ta`, "Topshirishlar"]} />
                  <Bar dataKey="count" fill="hsl(var(--primary) / 0.8)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
}
