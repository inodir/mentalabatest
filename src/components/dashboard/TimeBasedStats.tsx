import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CalendarDays, Timer, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DTMUser } from "@/lib/dtm-api";

interface TimeStats {
  today: number;
  last2Hours: number;
  last7Days: number;
  yesterdayTotal: number;
}

const CACHE_KEY = "dtm_time_stats";
const CACHE_TTL = 2 * 60 * 1000; // 2 min

function calculateTimeStats(users: DTMUser[]): TimeStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  let today = 0, last2Hours = 0, last7Days = 0, yesterdayTotal = 0;

  for (const user of users) {
    const created = new Date(user.created_at);
    if (created >= todayStart) today++;
    if (created >= twoHoursAgo) last2Hours++;
    if (created >= sevenDaysAgo) last7Days++;
    if (created >= yesterdayStart && created < todayStart) yesterdayTotal++;
  }

  return { today, last2Hours, last7Days, yesterdayTotal };
}

function getCachedStats(): TimeStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedStats(data: TimeStats) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

interface TimeBasedStatsProps {
  users: DTMUser[];
  loading?: boolean;
}

export function TimeBasedStats({ users, loading }: TimeBasedStatsProps) {
  const [stats, setStats] = useState<TimeStats | null>(getCachedStats);

  useEffect(() => {
    if (users.length > 0) {
      const calculated = calculateTimeStats(users);
      setStats(calculated);
      setCachedStats(calculated);
    }
  }, [users]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
            <div className="h-16 rounded-xl bg-muted/50" />
          </div>
        ))}
      </div>
    );
  }

  const todayTrend = stats.yesterdayTotal > 0
    ? Math.round(((stats.today - stats.yesterdayTotal) / stats.yesterdayTotal) * 100)
    : stats.today > 0 ? 100 : 0;

  const cards = [
    {
      label: "Oxirgi 2 soat",
      value: stats.last2Hours,
      icon: Timer,
      gradient: "from-orange-500/20 to-amber-500/10",
      iconColor: "text-orange-500",
      ringColor: "ring-orange-500/20",
      glowColor: "bg-orange-500/10",
      pulse: stats.last2Hours > 0,
    },
    {
      label: "Bugun",
      value: stats.today,
      icon: Clock,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconColor: "text-emerald-500",
      ringColor: "ring-emerald-500/20",
      glowColor: "bg-emerald-500/10",
      trend: todayTrend,
    },
    {
      label: "Oxirgi 7 kun",
      value: stats.last7Days,
      icon: CalendarDays,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconColor: "text-blue-500",
      ringColor: "ring-blue-500/20",
      glowColor: "bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="glass-card glass-card-hover rounded-2xl relative overflow-hidden group"
        >
          {/* Background gradient */}
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-80", card.gradient)} />

          {/* Pulse dot for active */}
          {card.pulse && (
            <div className="absolute top-4 right-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
              </span>
            </div>
          )}

          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("rounded-xl p-2.5 ring-1", card.ringColor, card.glowColor)}>
                <card.icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.label}
              </p>
              <div className="flex items-end gap-2">
                <motion.p
                  key={card.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold tracking-tight"
                >
                  {card.value.toLocaleString()}
                </motion.p>
                <span className="text-sm text-muted-foreground mb-1">ta</span>
              </div>

              {card.trend !== undefined && card.trend !== 0 && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  card.trend > 0 ? "text-emerald-500" : "text-destructive"
                )}>
                  {card.trend > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : card.trend < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : (
                    <Minus className="h-3.5 w-3.5" />
                  )}
                  <span>{card.trend > 0 ? "+" : ""}{card.trend}% kechaga nisbatan</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
