import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Users, Languages } from "lucide-react";

interface GenderLanguageChartsProps {
  genderStats?: Record<string, number>;
  languageStats?: Record<string, number>;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Erkak",
  female: "Ayol",
};

const LANGUAGE_LABELS: Record<string, string> = {
  uz: "O'zbek",
  ru: "Rus",
  en: "Ingliz",
  kk: "Qozoq",
  tg: "Tojik",
};

const GENDER_COLORS = [
  "hsl(217 91% 45%)",
  "hsl(340 65% 55%)",
];

const LANGUAGE_COLORS = [
  "hsl(217 91% 45%)",
  "hsl(340 65% 55%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
];

function formatData(
  stats: Record<string, number> | undefined,
  labels: Record<string, string>
) {
  if (!stats) return [];
  return Object.entries(stats).map(([key, value]) => ({
    name: labels[key] || key,
    value,
    key,
  }));
}

function CustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function LegendItem({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{value.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">({pct}%)</span>
      </div>
    </div>
  );
}

export function GenderLanguageCharts({
  genderStats,
  languageStats,
}: GenderLanguageChartsProps) {
  const genderData = formatData(genderStats, GENDER_LABELS);
  const languageData = formatData(languageStats, LANGUAGE_LABELS);
  const genderTotal = genderData.reduce((s, d) => s + d.value, 0);
  const languageTotal = languageData.reduce((s, d) => s + d.value, 0);

  if (genderData.length === 0 && languageData.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {genderData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Jins bo'yicha taqsimot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={CustomLabel}
                    >
                      {genderData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={GENDER_COLORS[i % GENDER_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        "Soni",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {genderData.map((d, i) => (
                  <LegendItem
                    key={d.key}
                    color={GENDER_COLORS[i % GENDER_COLORS.length]}
                    label={d.name}
                    value={d.value}
                    total={genderTotal}
                  />
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Jami</span>
                    <span className="text-sm font-bold">{genderTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {languageData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4 text-primary" />
              Til bo'yicha taqsimot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-[160px] w-[160px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={CustomLabel}
                    >
                      {languageData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={LANGUAGE_COLORS[i % LANGUAGE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        value.toLocaleString(),
                        "Soni",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {languageData.map((d, i) => (
                  <LegendItem
                    key={d.key}
                    color={LANGUAGE_COLORS[i % LANGUAGE_COLORS.length]}
                    label={d.name}
                    value={d.value}
                    total={languageTotal}
                  />
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium">Jami</span>
                    <span className="text-sm font-bold">{languageTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
