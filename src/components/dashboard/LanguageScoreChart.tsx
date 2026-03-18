import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DTMUser } from "@/lib/dtm-api";

interface LanguageScoreChartProps {
  users: DTMUser[];
}

const LANG_LABELS: Record<string, string> = {
  uz: "O'zbek", ru: "Rus", en: "Ingliz", kk: "Qozoq",
};

export function LanguageScoreChart({ users }: LanguageScoreChartProps) {
  const withScore = users.filter((u) => u.total_point !== null && u.language);
  if (withScore.length === 0) return null;

  const langMap = new Map<string, number[]>();
  for (const u of withScore) {
    const lang = u.language || "uz";
    const arr = langMap.get(lang) ?? [];
    arr.push(u.total_point ?? 0);
    langMap.set(lang, arr);
  }

  const data = Array.from(langMap.entries()).map(([lang, scores]) => ({
    name: LANG_LABELS[lang] || lang,
    avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    count: scores.length,
    max: Math.max(...scores),
    min: Math.min(...scores),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages className="h-4 w-4 text-primary" />
          Til bo'yicha o'rtacha ball
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 189]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(v: number, name: string) => [
                  name === "avg" ? `${v} ball` : v,
                  name === "avg" ? "O'rtacha" : name === "count" ? "O'quvchilar" : name,
                ]}
              />
              <Legend formatter={(v) => v === "avg" ? "O'rtacha ball" : "O'quvchilar soni"} />
              <Bar dataKey="avg" fill="hsl(217 91% 55%)" radius={[6, 6, 0, 0]} name="avg" />
              <Bar dataKey="count" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} name="count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
