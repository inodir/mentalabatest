import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { useAuth } from "@/hooks/useAuth";

export default function SchoolDashboard() {
  const { dtmUser } = useAuth();
  const { stats, loading, schoolCode, students } = useSchoolDTMData();

  const schoolName = dtmUser?.school?.name || dtmUser?.full_name || "Bosh sahifa";

  // Recent 5 students
  const recentStudents = [...students]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <AdminLayout variant="school">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{schoolName}</h1>
          <p className="text-muted-foreground">
            DTM statistikasi
            {schoolCode && (
              <Badge variant="secondary" className="ml-2">
                Maktab kodi: {schoolCode}
              </Badge>
            )}
          </p>
        </div>

        {schoolCode && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Jami o'quvchilar" value={stats.totalStudents} icon={Users} />
              <StatCard title="Natijasi bor" value={stats.studentsWithResults} icon={CheckCircle} />
              <StatCard title="Natijasi yo'q" value={stats.studentsWithoutResults} icon={XCircle} />
              <StatCard title="Test topshirganlar" value={`${stats.testedPercent}%`} icon={Percent} />
              <StatCard title="O'rtacha ball" value={stats.averageScore} icon={TrendingUp} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  So'nggi ro'yxatdan o'tganlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    Yuklanmoqda...
                  </div>
                ) : recentStudents.length > 0 ? (
                  <div className="space-y-3">
                    {recentStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">{student.phone || "Telefon yo'q"}</p>
                        </div>
                        <div className="text-right">
                          {student.dtm?.tested ? (
                            <>
                              {student.dtm.total_ball != null && (
                                <p className="text-lg font-bold text-primary">{student.dtm.total_ball}</p>
                              )}
                              <Badge variant="default" className="text-xs">Topshirgan</Badge>
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Topshirmagan</Badge>
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
