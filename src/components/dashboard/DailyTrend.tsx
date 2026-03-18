import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
import type { DTMUser } from "@/lib/dtm-api";

interface DailyTrendProps {
  users: DTMUser[];
}

const UZ_MONTHS = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];

export function DailyTrend({ users }: DailyTrendProps) {
  if (users.length === 0) return null;

  // Oxirgi 14 kun
  const now = new Date();
  const dayMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, 0);
  }

  for (const u of users) {
    const key = u.created_at?.slice(0, 10);
    if (key && dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
  }

  const data = Array.from(dayMap.entries()).map(([date, count]) => {
    const d = new Date(date);
    return {
      date,
      label: `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`,
      count,
    };
  });

  const totalInPeriod = data.reduce((s, d) => s + d.count, 0);
  const avgPerDay = totalInPeriod > 0 ? (totalInPeriod / 14).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Kunlik ro'yxatdan o'tish trendi (oxirgi 14 kun)
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            O'rtacha: {avgPerDay}/kun
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217 91% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={1}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(v: number) => [`${v} ta`, "Yangi ro'yxat"]}
                labelFormatter={(label: string) => `Sana: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(217 91% 55%)"
                strokeWidth={2.5}
                fill="url(#trendGrad)"
                dot={{ fill: "hsl(217 91% 55%)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
