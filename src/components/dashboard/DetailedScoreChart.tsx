import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { TrendingUp, MousePointerClick, Trophy, Info } from "lucide-react";
import { ScoreStudentsDialog } from "./ScoreStudentsDialog";
import { DashboardSection } from "./StatsKPI";

interface DetailedScoreChartProps {
  scoreBands: any[];
  baseEntities: any[];
  pieData: any[];
  title: string;
}

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
};

export function DetailedScoreChart({ scoreBands, baseEntities, pieData, title }: DetailedScoreChartProps) {
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [selectedScoreRange, setSelectedScoreRange] = useState<{ min: number; max: number } | null>(null);

  const studentsInSelectedRange = useMemo(() => {
    if (!selectedScoreRange) return [];
    return baseEntities.filter(u => {
      const p = u.total_point ?? 0;
      return u.has_result && p >= selectedScoreRange.min && p < selectedScoreRange.max;
    });
  }, [baseEntities, selectedScoreRange]);

  const handleBarClick = (data: any, index: number, event: any) => {
    if (event && (event.ctrlKey || event.metaKey) && data) {
      setSelectedScoreRange({ min: data.min, max: data.max });
      setIsScoreDialogOpen(true);
    }
  };

  return (
    <DashboardSection title={title}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Bar Chart */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Ballar taqsimoti (2 ballik intervalda)
              </CardTitle>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-2 py-1 rounded-md border border-border/40">
                <MousePointerClick className="h-3 w-3" />
                Ctrl + Click: Ro'yxat
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={scoreBands} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(data: any, index: number, event: any) => handleBarClick(data?.activePayload?.[0]?.payload, index, event)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 9, fontWeight: 500 }} 
                    interval={4}
                    className="text-muted-foreground/60"
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 600 }} 
                    className="text-muted-foreground/60"
                  />
                  <Tooltip 
                    contentStyle={ChartTooltipStyle}
                    cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                    formatter={(v: number, name: string, props: any) => [
                      `${v} o'quvchi`, 
                      `${props.payload.min}-${props.payload.max} ball`
                    ]}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1500}
                    cursor="pointer"
                  >
                    {scoreBands.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.min < 40 ? "hsl(0 72% 55%)" : entry.min < 70 ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"} 
                        className="transition-colors duration-500 hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Umumiy holat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    cx="50%" 
                    cy="50%"
                    outerRadius={80} 
                    innerRadius={50}
                    paddingAngle={5} 
                    label={false}
                  >
                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip contentStyle={ChartTooltipStyle} />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", fontWeight: 600, paddingTop: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-xl border border-border/50 w-full flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Grafikda o'tish ballini (70+) to'plagan va to'play olmagan o'quvchilar nisbati aks etgan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScoreStudentsDialog
        isOpen={isScoreDialogOpen}
        onClose={() => setIsScoreDialogOpen(false)}
        students={studentsInSelectedRange}
        scoreRange={selectedScoreRange}
      />
    </DashboardSection>
  );
}
