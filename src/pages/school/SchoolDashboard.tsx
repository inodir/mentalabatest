import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FileText, TrendingUp, Percent, CheckCircle2, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { useAuth } from "@/hooks/useAuth";
import { GenderLanguageCharts } from "@/components/dashboard/GenderLanguageCharts";
import { SubjectMasteryChart } from "@/components/dashboard/SubjectMasteryChart";
import { BallDistributionChart } from "@/components/dashboard/BallDistributionChart";
import { DTMReadinessCards } from "@/components/dashboard/DTMReadinessCards";
import { MandatoryChart } from "@/components/dashboard/MandatoryChart";
import { FunnelStats } from "@/components/dashboard/FunnelStats";
import { DailyTrend } from "@/components/dashboard/DailyTrend";
import { RadarSubjects } from "@/components/dashboard/RadarSubjects";
import { ScoreHistogram } from "@/components/dashboard/ScoreHistogram";
import { TopStudents } from "@/components/dashboard/TopStudents";
import { ReadinessGauge } from "@/components/dashboard/ReadinessGauge";
import { LanguageScoreChart } from "@/components/dashboard/LanguageScoreChart";
import { motion } from "framer-motion";
import { PDFExportButton } from "@/components/ui/pdf-export-button";
import { exportSchoolPDF } from "@/lib/exportPDF";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function SchoolDashboard() {
  const { dtmUser } = useAuth();
  const { stats, loading, schoolCode, students } = useSchoolDTMData();

  const schoolName = dtmUser?.school?.name || dtmUser?.full_name || "Bosh sahifa";

  const recentStudents = [...students]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <AdminLayout variant="school">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{schoolName}</h1>
            <p className="text-muted-foreground mt-1">
              DTM statistikasi
              {schoolCode && (
                <Badge variant="secondary" className="ml-2">
                  Maktab kodi: {schoolCode}
                </Badge>
              )}
            </p>
          </div>
          {!loading && stats && (
            <PDFExportButton
              label="PDF hisobot"
              onExport={() =>
                exportSchoolPDF({
                  totalUsers: stats.totalStudents,
                  answeredUsers: stats.studentsWithResults,
                  testedPercent: stats.testedPercent,
                  avgBall: stats.averageScore,
                  adminName: dtmUser?.full_name,
                })
              }
            />
          )}
        </motion.div>

        {schoolCode && (
          <>
            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-6">
                    <Skeleton className="h-20 rounded-xl animate-shimmer" />
                  </div>
                ))
              ) : (
                <>
                  <StatCard
                    title="Jami o'quvchilar"
                    value={stats.totalStudents.toLocaleString()}
                    icon={Users}
                    index={0}
                  />
                  <StatCard
                    title="Natijasi borlar"
                    value={stats.studentsWithResults.toLocaleString()}
                    icon={CheckCircle2}
                    description="test topshirgan"
                    index={1}
                  />
                  <StatCard
                    title="Natijasi yo'qlar"
                    value={stats.studentsWithoutResults.toLocaleString()}
                    icon={XCircle}
                    description="hali topshirmagan"
                    index={2}
                  />
                  <StatCard
                    title="Test topshirish %"
                    value={`${stats.testedPercent.toFixed(1)}%`}
                    icon={Percent}
                    index={3}
                  />
                </>
              )}
            </motion.div>

            {/* O'rtacha ball alohida StatCard */}
            {!loading && stats.averageScore > 0 && (
              <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="O'rtacha ball"
                  value={`${stats.averageScore} / 189`}
                  icon={TrendingUp}
                  index={0}
                />
              </motion.div>
            )}

            {/* DTM Readiness */}
            {!loading && dtmUser?.stats && (
              <motion.div variants={itemVariants}>
                <DTMReadinessCards
                  riskStats={dtmUser.stats.risk_stats}
                  dtmReadiness={dtmUser.stats.dtm_readiness}
                  genderResultStats={dtmUser.stats.gender_result_stats}
                />
              </motion.div>
            )}

            {/* Tayyorlik ko'rsatkichi + Til bo'yicha ball */}
            {!loading && dtmUser?.stats?.dtm_readiness && (
              <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
                <ReadinessGauge
                  readinessIndex={dtmUser.stats.dtm_readiness.readiness_index}
                  avgTotalBall={dtmUser.stats.dtm_readiness.avg_total_ball}
                  passedCount={dtmUser.stats.dtm_readiness.passed_count}
                  testedCount={dtmUser.stats.dtm_readiness.tested_count}
                  passLine={dtmUser.stats.dtm_readiness.pass_line ?? 70}
                />
                <LanguageScoreChart users={students as unknown as import("@/lib/dtm-api").DTMUser[]} />
              </motion.div>
            )}

            {/* Gender + Language Charts */}
            {!loading && dtmUser?.stats && (
              <motion.div variants={itemVariants}>
                <GenderLanguageCharts
                  genderStats={dtmUser.stats.gender_stats}
                  languageStats={dtmUser.stats.language_stats}
                />
              </motion.div>
            )}

            {/* Subject Mastery + Mandatory Chart */}
            {!loading && dtmUser?.stats && (
              <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
                <SubjectMasteryChart subjectMastery={dtmUser.stats.subject_mastery} />
                <MandatoryChart mandatoryChart={dtmUser.stats.mandatory_chart} />
              </motion.div>
            )}

            {/* Ball Distribution */}
            {!loading && dtmUser?.stats?.ball_distribution && (
              <motion.div variants={itemVariants}>
                <BallDistributionChart ballDistribution={dtmUser.stats.ball_distribution} />
              </motion.div>
            )}

            {/* Bosqichli tahlil + Kunlik trend */}
            {!loading && dtmUser?.stats && (
              <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
                <FunnelStats
                  registered={stats.totalStudents}
                  answered={stats.studentsWithResults}
                  passed={dtmUser.stats.dtm_readiness?.passed_count}
                  passLine={dtmUser.stats.dtm_readiness?.pass_line}
                />
                <DailyTrend users={students as unknown as import("@/lib/dtm-api").DTMUser[]} />
              </motion.div>
            )}

            {/* Radar + Score Histogram */}
            {!loading && (
              <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
                <RadarSubjects subjectMastery={dtmUser?.stats?.subject_mastery} />
                <ScoreHistogram users={students as unknown as import("@/lib/dtm-api").DTMUser[]} />
              </motion.div>
            )}

            {/* Top o'quvchilar */}
            {!loading && students.length > 0 && (
              <motion.div variants={itemVariants}>
                <TopStudents users={students as unknown as import("@/lib/dtm-api").DTMUser[]} />
              </motion.div>
            )}

            {/* So'nggi ro'yxatdan o'tganlar */}
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    So'nggi ro'yxatdan o'tganlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" />
                      ))}
                    </div>
                  ) : recentStudents.length > 0 ? (
                    <div className="space-y-3">
                      {recentStudents.map((student, idx) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/50 transition-colors"
                        >
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
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                      O'quvchilar topilmadi
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </motion.div>
    </AdminLayout>
  );
}
