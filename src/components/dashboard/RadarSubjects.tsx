import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Crosshair } from "lucide-react";

interface RadarSubjectsProps {
  subjectMastery?: {
    subject_id: number;
    subject: string;
    questions_count: number;
    earned_sum: number;
    avg_point: number;
    mastery_percent: number;
  }[];
}

export function RadarSubjects({ subjectMastery }: RadarSubjectsProps) {
  if (!subjectMastery || subjectMastery.length === 0) return null;

  const data = subjectMastery.map((s) => ({
    subject: s.subject.length > 12 ? s.subject.slice(0, 12) + "…" : s.subject,
    fullSubject: s.subject,
    mastery: Math.round(s.mastery_percent * 10) / 10,
    avgPoint: Math.round(s.avg_point * 10) / 10,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crosshair className="h-4 w-4 text-primary" />
          Fan bo'yicha ko'nikma (Radar)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid className="stroke-border/50" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                dataKey="mastery"
                stroke="hsl(217 91% 55%)"
                fill="hsl(217 91% 55%)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(v: number, _: string, props: { payload?: typeof data[0] }) => [
                  `${v}%`,
                  props.payload?.fullSubject ?? "Ko'nikma",
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
