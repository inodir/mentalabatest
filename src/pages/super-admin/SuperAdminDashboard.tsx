import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDTMDashboard } from "@/hooks/useDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import { GenderLanguageCharts } from "@/components/dashboard/GenderLanguageCharts";
import { SubjectMasteryChart } from "@/components/dashboard/SubjectMasteryChart";
import { BallDistributionChart } from "@/components/dashboard/BallDistributionChart";
import { DTMReadinessCards } from "@/components/dashboard/DTMReadinessCards";
import { MandatoryChart } from "@/components/dashboard/MandatoryChart";
import { TimeBasedStats } from "@/components/dashboard/TimeBasedStats";
import { Users, FileText, TrendingUp, School, Settings, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stats, loading, error, mode, setMode, progress, retry, loadedEntities } = useDTMDashboard();
  const { dtmUser } = useAuth();

  if (error) {
    return (
      <AdminLayout variant="super">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">DTM platformasi umumiy statistikasi</p>
          </div>

          <div className="glass-card rounded-2xl border-destructive/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl scale-150" />
                <div className="relative rounded-full bg-destructive/10 p-4">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {error === "NO_CONFIG" && "API sozlamalari topilmadi"}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri"}
                {error === "NETWORK_ERROR" && "Tarmoq xatosi"}
                {error === "INVALID_URL" && "URL noto'g'ri formatda"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                {error === "NO_CONFIG" && "Dashboard'ni ko'rish uchun avval API sozlamalarini kiriting."}
                {error === "API_KEY_INVALID" && "API kalitingiz noto'g'ri yoki muddati o'tgan. Sozlamalarni tekshiring."}
                {error === "NETWORK_ERROR" && "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring."}
                {error === "INVALID_URL" && "MAIN_URL http:// yoki https:// bilan boshlanishi kerak."}
              </p>
              <div className="flex gap-3">
                {error !== "NO_CONFIG" && (
                  <Button variant="outline" onClick={retry} className="rounded-xl">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Qayta urinish
                  </Button>
                )}
                <Button onClick={() => navigate("/super-admin/settings")} className="rounded-xl">
                  <Settings className="mr-2 h-4 w-4" />
                  Sozlamalarni ochish
                </Button>
              </div>
            </CardContent>
          </div>
        </motion.div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout variant="super">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
              Bosh sahifa
            </h1>
            <p className="text-muted-foreground mt-1">
              DTM platformasi umumiy statistikasi
            </p>
          </div>

          <div className="flex items-center gap-3">
            {progress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground glass-card rounded-full px-4 py-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{progress.loaded}/{progress.total}</span>
              </motion.div>
            )}

            {stats?.isApproximate && !loading && (
              <Badge variant="secondary" className="text-xs rounded-full px-3 py-1">
                Taxminiy
              </Badge>
            )}

            {!stats?.isApproximate && stats && !loading && (
              <Badge variant="default" className="text-xs rounded-full px-3 py-1">
                Aniq (100%)
              </Badge>
            )}

            <div className="flex items-center gap-2 glass-card rounded-full px-4 py-2">
              <Label htmlFor="mode-toggle" className="text-xs font-medium">Aniq</Label>
              <Switch
                id="mode-toggle"
                checked={mode === "accurate"}
                onCheckedChange={(checked) => setMode(checked ? "accurate" : "fast")}
                disabled={loading}
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={retry}
              disabled={loading}
              className="rounded-full h-10 w-10 glass-card border-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-6">
                  <Skeleton className="h-20 animate-shimmer rounded-xl" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Ro'yxatdan o'tganlar"
                value={dtmUser?.stats?.registered_count?.toLocaleString() || 0}
                icon={Users}
                description="/me dan"
                index={0}
              />
              <StatCard
                title="Javob berganlar"
                value={dtmUser?.stats?.answered_count?.toLocaleString() || 0}
                icon={FileText}
                index={1}
              />
              <StatCard
                title="Test topshirganlar %"
                value={`${dtmUser?.stats?.tested_percent?.toFixed(1) || 0}%`}
                icon={TrendingUp}
                index={2}
              />
              <StatCard
                title="Jami maktablar"
                value={dtmUser?.stats?.school_count?.toLocaleString() || 0}
                icon={School}
                index={3}
              />
            </>
          )}
        </motion.div>

        {/* Time-based Stats */}
        <motion.div variants={itemVariants}>
          <TimeBasedStats users={loadedEntities} loading={loading} />
        </motion.div>


        {!loading && dtmUser?.stats?.dtm_readiness && (
          <motion.div variants={itemVariants} className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="O'rtacha ball"
              value={dtmUser.stats.dtm_readiness.avg_total_ball?.toFixed(1) || 0}
              icon={TrendingUp}
              index={0}
            />
          </motion.div>
        )}

        {/* Charts & Analysis */}
        {!loading && dtmUser?.stats && (
          <>
            <motion.div variants={itemVariants}>
              <GenderLanguageCharts
                genderStats={dtmUser.stats.gender_stats}
                languageStats={dtmUser.stats.language_stats}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <DTMReadinessCards
                riskStats={dtmUser.stats.risk_stats}
                dtmReadiness={dtmUser.stats.dtm_readiness}
                genderResultStats={dtmUser.stats.gender_result_stats}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
              <SubjectMasteryChart subjectMastery={dtmUser.stats.subject_mastery} />
              <MandatoryChart mandatoryChart={dtmUser.stats.mandatory_chart} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <BallDistributionChart ballDistribution={dtmUser.stats.ball_distribution} />
            </motion.div>
          </>
        )}

        {/* Recent Users & Chart */}
        <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">So'nggi foydalanuvchilar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl animate-shimmer" />
                  ))}
                </div>
              ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentUsers.slice(0, 8).map((user, index) => (
                    <motion.div
                      key={user.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-border/50 p-3.5 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.school_code || "Maktab ko'rsatilmagan"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.has_result ? (
                          <Badge className="text-xs rounded-full bg-primary/10 text-primary border-0 font-semibold">
                            {user.total_point} ball
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs rounded-full">
                            Natija yo'q
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Foydalanuvchilar topilmadi
                </div>
              )}
            </CardContent>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Ball taqsimoti</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] rounded-xl animate-shimmer" />
              ) : stats?.recentUsers && stats.recentUsers.some(u => u.has_result) ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.recentUsers
                        .filter(u => u.has_result && u.total_point)
                        .slice(0, 10)
                        .map(u => ({
                          name: u.full_name?.substring(0, 12) || "N/A",
                          ball: u.total_point || 0,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 8px 32px -8px hsl(var(--glass-shadow))",
                        }}
                      />
                      <Bar
                        dataKey="ball"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Ball ma'lumotlari mavjud emas
                </div>
              )}
            </CardContent>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
