import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import { motion } from "framer-motion";

interface ReadinessGaugeProps {
  readinessIndex?: number;
  avgTotalBall?: number;
  passedCount?: number;
  testedCount?: number;
  passLine?: number;
}

export function ReadinessGauge({
  readinessIndex = 0,
  avgTotalBall = 0,
  passedCount = 0,
  testedCount = 0,
  passLine = 0,
}: ReadinessGaugeProps) {
  if (readinessIndex === 0 && avgTotalBall === 0) return null;

  // SVG gauge
  const pct = Math.min(100, Math.max(0, readinessIndex));
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -210;
  const sweepAngle = 240;
  const angle = startAngle + (pct / 100) * sweepAngle;

  function polarToCart(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
    const s = polarToCart(cx, cy, r, startDeg);
    const e = polarToCart(cx, cy, r, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const trackPath = describeArc(cx, cy, radius, startAngle, startAngle + sweepAngle);
  const valuePath = pct > 0
    ? describeArc(cx, cy, radius, startAngle, angle)
    : "";

  const gaugeColor =
    pct >= 80 ? "hsl(142 71% 45%)"
    : pct >= 60 ? "hsl(217 91% 55%)"
    : pct >= 40 ? "hsl(38 92% 50%)"
    : "hsl(0 72% 51%)";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-primary" />
          DTM Tayyorlik Gauge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* SVG Gauge */}
          <div className="shrink-0">
            <svg width="180" height="140" viewBox="0 0 180 140">
              {/* Track */}
              <path
                d={trackPath}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Value arc */}
              {valuePath && (
                <motion.path
                  d={valuePath}
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="14"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              )}
              {/* Needle */}
              {(() => {
                const needleEnd = polarToCart(cx, cy, radius - 20, angle);
                return (
                  <motion.line
                    x1={cx}
                    y1={cy}
                    x2={needleEnd.x}
                    y2={needleEnd.y}
                    stroke={gaugeColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ rotate: startAngle }}
                    animate={{ rotate: angle }}
                  />
                );
              })()}
              <circle cx={cx} cy={cy} r="6" fill={gaugeColor} />
              {/* Center text */}
              <text x={cx} y={cy + 22} textAnchor="middle" fontSize="22" fontWeight="bold" fill="currentColor">
                {pct.toFixed(1)}%
              </text>
              <text x={cx} y={cy + 36} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                Tayyorlik indeksi
              </text>
              {/* Labels */}
              {[0, 25, 50, 75, 100].map((val) => {
                const a = startAngle + (val / 100) * sweepAngle;
                const p = polarToCart(cx, cy, radius + 14, a);
                return (
                  <text key={val} x={p.x} y={p.y} textAnchor="middle"
                    dominantBaseline="central" fontSize="8"
                    fill="hsl(var(--muted-foreground))">
                    {val}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3">
            {[
              { label: "O'rtacha ball", value: avgTotalBall.toFixed(1) },
              { label: "O'tganlar", value: `${passedCount} / ${testedCount}` },
              { label: "O'tish balli", value: `${passLine} ball` },
              {
                label: "O'tish foizi",
                value: testedCount > 0 ? `${((passedCount / testedCount) * 100).toFixed(1)}%` : "—",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className="text-base font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
