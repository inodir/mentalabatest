import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BookOpen } from "lucide-react";

interface SubjectMasteryChartProps {
  subjectMastery?: {
    subject_id: number;
    subject: string;
    questions_count: number;
    earned_sum: number;
    avg_point: number;
    mastery_percent: number;
  }[];
}

const BAR_COLORS = [
  "hsl(217 91% 45%)",
  "hsl(340 65% 55%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
  "hsl(190 90% 40%)",
];

export function SubjectMasteryChart({ subjectMastery }: SubjectMasteryChartProps) {
  if (!subjectMastery || subjectMastery.length === 0) return null;

  const data = subjectMastery.map((s) => ({
    name: s.subject.length > 18 ? s.subject.substring(0, 18) + "…" : s.subject,
    fullName: s.subject,
    avgPoint: s.avg_point,
    questionsCount: s.questions_count,
    earnedSum: s.earned_sum,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          Fan bo'yicha o'rtacha ball
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" className="text-muted-foreground" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value: number, _: string, props: any) => [
                  `${value.toFixed(1)} ball (${props.payload.questionsCount} ta savol)`,
                  props.payload.fullName,
                ]}
              />
              <Bar dataKey="avgPoint" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
