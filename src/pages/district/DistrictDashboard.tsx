import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDistrictDTMDashboard } from "@/hooks/useDistrictDTMDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  School,
  Users,
  TrendingUp,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  FileText,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DistrictDashboard() {
  const { stats, loading, error, progress, retry } = useDistrictDTMDashboard();
  const { district } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSchools = (stats?.schoolStats || []).filter(
    (s) =>
      s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.schoolCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Error state
  if (error) {
    return (
      <AdminLayout variant="district">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              {district && <Badge variant="secondary" className="ml-0">{district}</Badge>} tuman maktablari statistikasi
            </p>
          </div>
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {error === "NO_CONFIG" && "API sozlamalari topilmadi"}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri"}
                {error === "NETWORK_ERROR" && "Tarmoq xatosi"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {error === "NO_CONFIG" && "DTM ma'lumotlarini ko'rish uchun super admin API kalitini sozlashi kerak."}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri yoki muddati o'tgan."}
                {error === "NETWORK_ERROR" && "Serverga ulanib bo'lmadi. Internet aloqangizni tekshiring."}
              </p>
              {error !== "NO_CONFIG" && (
                <Button variant="outline" onClick={retry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Qayta urinish
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout variant="district">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              {district && <Badge variant="secondary" className="ml-0">{district}</Badge>}{" "}
              tuman maktablari statistikasi
            </p>
          </div>
          <div className="flex items-center gap-3">
            {progress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Yuklanmoqda: {progress.loaded}/{progress.total}</span>
              </div>
            )}
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
                title="Jami maktablar"
                value={stats?.totalSchools || 0}
                icon={School}
              />
              <StatCard
                title="Jami o'quvchilar"
                value={stats?.totalStudents.toLocaleString() || 0}
                icon={Users}
                description="DTM ro'yxatidan"
              />
              <StatCard
                title="Natijasi borlar"
                value={stats?.studentsWithResults.toLocaleString() || 0}
                icon={FileText}
              />
              <StatCard
                title="O'rtacha ball"
                value={stats?.averageScore ? `${stats.averageScore}/189` : "—"}
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent students */}
          <Card>
            <CardHeader>
              <CardTitle>So'nggi o'quvchilar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
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
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  O'quvchilar topilmadi
                </div>
              )}
            </CardContent>
          </Card>

          {/* School comparison chart */}
          <Card>
            <CardHeader>
              <CardTitle>Maktablar bo'yicha o'rtacha ball</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px]" />
              ) : stats?.schoolStats && stats.schoolStats.some((s) => s.averageScore > 0) ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.schoolStats
                        .filter((s) => s.averageScore > 0)
                        .sort((a, b) => b.averageScore - a.averageScore)
                        .slice(0, 10)
                        .map((s) => ({
                          name: s.schoolName.length > 15
                            ? s.schoolName.substring(0, 15) + "…"
                            : s.schoolName,
                          ball: s.averageScore,
                        }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        className="text-muted-foreground"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis className="text-muted-foreground" domain={[0, 189]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar dataKey="ball" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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

        {/* Schools Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Maktablar ro'yxati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Maktab nomi yoki kod bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maktab nomi</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-center">O'quvchilar</TableHead>
                    <TableHead className="text-center">Natijasi bor</TableHead>
                    <TableHead className="text-center">O'rtacha ball</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Maktablar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.schoolId}>
                        <TableCell className="font-medium">{school.schoolName}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                            {school.schoolCode}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{school.totalStudents}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={school.studentsWithResults > 0 ? "default" : "secondary"}>
                            {school.studentsWithResults}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {school.averageScore > 0 ? (
                            <Badge variant={
                              school.averageScore >= 150 ? "default" :
                              school.averageScore >= 100 ? "secondary" : "destructive"
                            }>
                              {school.averageScore}/189
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/district/schools/${school.schoolCode}`}>
                            <Button variant="ghost" size="icon" title="Ko'rish">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
