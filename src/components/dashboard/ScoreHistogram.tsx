import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DTMUser } from "@/lib/dtm-api";

interface ScoreHistogramProps {
  users: DTMUser[];
}

const RANGES = [
  { label: "0–10",    min: 0,   max: 10   },
  { label: "11–20",   min: 11,  max: 20   },
  { label: "21–30",   min: 21,  max: 30   },
  { label: "31–40",   min: 31,  max: 40   },
  { label: "41–50",   min: 41,  max: 50   },
  { label: "51–60",   min: 51,  max: 60   },
  { label: "61–70",   min: 61,  max: 70   },
  { label: "71–80",   min: 71,  max: 80   },
  { label: "81–90",   min: 81,  max: 90   },
  { label: "91–100",  min: 91,  max: 100  },
  { label: "101–110", min: 101, max: 110  },
  { label: "111–120", min: 111, max: 120  },
  { label: "121–130", min: 121, max: 130  },
  { label: "131–140", min: 131, max: 140  },
  { label: "141–150", min: 141, max: 150  },
  { label: "151–160", min: 151, max: 160  },
  { label: "161–170", min: 161, max: 170  },
  { label: "171–180", min: 171, max: 180  },
  { label: "181–189", min: 181, max: 189  },
];

const COLORS = [
  "hsl(0 72% 51%)",
  "hsl(14 100% 57%)",
  "hsl(38 92% 50%)",
  "hsl(48 96% 53%)",
  "hsl(142 71% 45%)",
  "hsl(158 64% 42%)",
];

export function ScoreHistogram({ users }: ScoreHistogramProps) {
  const withScore = users.filter((u) => u.total_point !== null && u.total_point !== undefined);
  if (withScore.length === 0) return null;

  const data = RANGES.map((r, i) => ({
    label: r.label,
    count: withScore.filter((u) => (u.total_point ?? 0) >= r.min && (u.total_point ?? 0) <= r.max).length,
    color: COLORS[i],
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          Ball oralig'i taqsimoti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(v: number) => [`${v} ta`, "O'quvchilar"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span>{d.label}: <strong>{d.count}</strong></span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
