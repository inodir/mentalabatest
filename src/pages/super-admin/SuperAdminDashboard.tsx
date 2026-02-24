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
import { Users, FileText, TrendingUp, School, Settings, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stats, loading, error, mode, setMode, progress, retry } = useDTMDashboard();
  const { dtmUser } = useAuth();

  // Render error state
  if (error) {
    return (
      <AdminLayout variant="super">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              DTM platformasi umumiy statistikasi
            </p>
          </div>

          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {error === "NO_CONFIG" && "API sozlamalari topilmadi"}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri"}
                {error === "NETWORK_ERROR" && "Tarmoq xatosi"}
                {error === "INVALID_URL" && "URL noto'g'ri formatda"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {error === "NO_CONFIG" && "Dashboard'ni ko'rish uchun avval API sozlamalarini kiriting."}
                {error === "API_KEY_INVALID" && "API kalitingiz noto'g'ri yoki muddati o'tgan. Sozlamalarni tekshiring."}
                {error === "NETWORK_ERROR" && "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring."}
                {error === "INVALID_URL" && "MAIN_URL http:// yoki https:// bilan boshlanishi kerak."}
              </p>
              <div className="flex gap-3">
                {error !== "NO_CONFIG" && (
                  <Button variant="outline" onClick={retry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Qayta urinish
                  </Button>
                )}
                <Button onClick={() => navigate("/super-admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Sozlamalarni ochish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              DTM platformasi umumiy statistikasi
            </p>
          </div>
          
          {/* Mode Toggle & Status */}
          <div className="flex items-center gap-4">
            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Yuklanmoqda: {progress.loaded}/{progress.total}</span>
              </div>
            )}
            
            {stats?.isApproximate && !loading && (
              <Badge variant="secondary" className="text-xs">
                Taxminiy (Fast)
              </Badge>
            )}
            
            {!stats?.isApproximate && stats && !loading && (
              <Badge variant="default" className="text-xs">
                Aniq (100%)
              </Badge>
            )}
            
            <div className="flex items-center gap-2">
              <Label htmlFor="mode-toggle" className="text-sm">Aniq rejim</Label>
              <Switch
                id="mode-toggle"
                checked={mode === "accurate"}
                onCheckedChange={(checked) => setMode(checked ? "accurate" : "fast")}
                disabled={loading}
              />
            </div>
            
            <Button variant="outline" size="icon" onClick={retry} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <Card><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
              <Card><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
            </>
          ) : (
            <>
              <StatCard
                title="Jami foydalanuvchilar"
                value={stats?.totalUsers.toLocaleString() || 0}
                icon={Users}
                description={stats?.isApproximate ? "API dan" : undefined}
              />
              <StatCard
                title="Natijali foydalanuvchilar"
                value={stats?.resultUsersCount.toLocaleString() || 0}
                icon={FileText}
                description={stats?.isApproximate ? `~${stats?.loadedCount} dan` : undefined}
              />
              <StatCard
                title="Natijasiz foydalanuvchilar"
                value={stats?.noResultUsersCount.toLocaleString() || 0}
                icon={Users}
                description={stats?.isApproximate ? `~${stats?.loadedCount} dan` : undefined}
              />
              <StatCard
                title="Jami maktablar"
                value={stats?.totalSchools.toLocaleString() || 0}
                icon={School}
                description={stats?.isApproximate ? `~${stats?.loadedCount} dan` : undefined}
              />
            </>
          )}
        </div>

        {/* Second row stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ) : (
            <StatCard
              title="O'rtacha ball"
              value={stats?.averageTotalPoint || 0}
              icon={TrendingUp}
              description={stats?.isApproximate ? `~${stats?.loadedCount} foydalanuvchi asosida` : undefined}
            />
          )}
        </div>

        {/* Gender & Language Stats */}
        {!loading && dtmUser?.stats && (
          <GenderLanguageCharts
            genderStats={dtmUser.stats.gender_stats}
            languageStats={dtmUser.stats.language_stats}
          />
        )}

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>So'nggi foydalanuvchilar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentUsers.slice(0, 8).map((user, index) => (
                    <div
                      key={user.id || index}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.school_code || "Maktab ko'rsatilmagan"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.has_result ? (
                          <Badge variant="default" className="text-xs">
                            {user.total_point} ball
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Natija yo'q
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  Foydalanuvchilar topilmadi
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ball taqsimoti</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px]" />
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        className="text-muted-foreground"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar
                        dataKey="ball"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
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
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
