import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { useAuth } from "@/hooks/useAuth";

export default function SchoolDashboard() {
  const { dtmUser } = useAuth();
  const { 
    stats, 
    loading, 
    error, 
    schoolCode,
    refetch, 
    lastUpdated 
  } = useSchoolDTMData();

  return (
    <AdminLayout variant="school">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {dtmUser?.full_name || "Bosh sahifa"}
            </h1>
            <p className="text-muted-foreground">
              DTM statistikasi
              {schoolCode && (
                <Badge variant="secondary" className="ml-2">
                  Maktab kodi: {schoolCode}
                </Badge>
              )}
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  (oxirgi yangilanish: {format(lastUpdated, "HH:mm:ss")})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch(true)}
              disabled={loading || !schoolCode}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Yangilash
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {schoolCode && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Jami o'quvchilar"
                value={stats.totalStudents}
                icon={Users}
              />
              <StatCard
                title="Natijasi bor"
                value={stats.studentsWithResults}
                icon={CheckCircle}
              />
              <StatCard
                title="Natijasi yo'q"
                value={stats.studentsWithoutResults}
                icon={XCircle}
              />
              <StatCard
                title="O'rtacha ball"
                value={stats.averageScore}
                icon={TrendingUp}
              />
            </div>

            {/* Recent Students */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  So'nggi ro'yxatdan o'tganlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : stats.recentStudents.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.phone || "Telefon yo'q"}
                          </p>
                        </div>
                        <div className="text-right">
                          {student.has_result ? (
                            <>
                              <p className="text-lg font-bold text-primary">
                                {student.total_point ?? 0}
                              </p>
                              <Badge variant="default" className="text-xs">
                                Natija bor
                              </Badge>
                            </>
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
          </>
        )}
      </div>
    </AdminLayout>
  );
}
