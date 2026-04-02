import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Download,
  GraduationCap,
  MapPin,
  RefreshCw,
  School,
  TrendingUp,
  Users,
} from "lucide-react";
import { usePublicStats } from "@/hooks/usePublicStats";
import { StatsKPI, DashboardSection } from "@/components/dashboard/StatsKPI";
import { DetailedScoreChart } from "@/components/dashboard/DetailedScoreChart";
import { GenderLanguageSection } from "@/components/dashboard/GenderLanguageSection";
import { RegionalRankingSection } from "@/components/dashboard/RegionalRankingSection";
import { SubjectMasterySection } from "@/components/dashboard/SubjectMasterySection";
import { TimeAnalyticsSection } from "@/components/dashboard/TimeAnalyticsSection";
import { SchoolRankingsSection } from "@/components/dashboard/SchoolRankingsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDateTime(date?: Date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function downloadCsv(headers: string[], rows: Array<Array<string | number>>, filename: string) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PublicStatistics() {
  const {
    loading,
    error,
    lastSynced,
    selectedRegion,
    setSelectedRegion,
    selectedDistrict,
    setSelectedDistrict,
    refresh,
    totalUsers,
    resultUsersCount,
    noResultUsersCount,
    passCount,
    passRate,
    averagePoint,
    totalSchools,
    regions,
    districts,
    filteredEntities,
    scoreBands,
    pieData,
    genderData,
    langData,
    regionalRanking,
    subjectMastery,
    timelineData,
    hourlyData,
    schoolRows,
    topSchoolsBySubmit,
    topSchoolsByScore,
    bottomSchoolsBySubmit,
    bottomSchoolsByScore,
    breakdownLevel,
    breakdownRows,
  } = usePublicStats();

  const breakdownTitle =
    breakdownLevel === "regions"
      ? "Hududlar kesimi"
      : breakdownLevel === "districts"
        ? "Tumanlar kesimi"
        : "Maktablar kesimi";

  const breakdownNameLabel =
    breakdownLevel === "regions" ? "Hudud" : breakdownLevel === "districts" ? "Tuman" : "Maktab";

  const exportBreakdown = () => {
    const headers = [
      breakdownNameLabel,
      "Ro'yxatdan o'tganlar",
      "Natijasi bor",
      "Natija chiqmagan",
      "Topshirish foizi",
      "O'tish foizi",
      "O'rtacha ball",
    ];
    const rows = breakdownRows.map((row) => [
      row.name,
      row.registered_count,
      row.result_count,
      row.no_result_count,
      `${row.submit_rate}%`,
      `${row.pass_rate}%`,
      row.avg_point,
    ]);
    downloadCsv(headers, rows, `public_${breakdownLevel}.csv`);
  };

  const exportSchools = () => {
    const headers = [
      "Maktab",
      "Hudud",
      "Tuman",
      "Ro'yxatdan o'tganlar",
      "Natijasi bor",
      "Topshirish foizi",
      "O'tish foizi",
      "O'rtacha ball",
    ];
    const rows = schoolRows.map((row) => [
      row.name,
      row.region || "—",
      row.district || "—",
      row.registered_count,
      row.result_count,
      `${row.submit_rate}%`,
      `${row.pass_rate}%`,
      row.avg_point,
    ]);
    downloadCsv(headers, rows, "public_schools.csv");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/70 backdrop-blur-sm">
        <div className="container mx-auto flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">Public Statistika</p>
              <p className="text-xs text-muted-foreground">Mentalaba test platformasi uchun ochiq agregat ko'rsatkichlar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Bosh sahifa
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Yangilash
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-8">
        <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em]">
                Public Analytics
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hududiy, maktab va natija statistikasi</h1>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                Bu sahifada faqat agregat statistikalar chiqadi. Hech qanday shaxsiy ma'lumot, individual o'quvchi natijasi yoki ichki fayl ko'rsatilmaydi.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Oxirgi yangilanish</p>
                <p className="mt-1 text-sm font-semibold">{formatDateTime(lastSynced)}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Joriy kesim</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedRegion === "all" ? "Barcha hududlar" : selectedDistrict === "all" ? selectedRegion : `${selectedRegion} / ${selectedDistrict}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <p className="font-semibold">Public statistika yuklanmadi</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error === "NO_CONFIG"
                  ? "DTM API konfiguratsiyasi topilmadi. Public sahifa ishlashi uchun env yoki session konfiguratsiya kerak."
                  : error === "API_KEY_INVALID"
                    ? "DTM API kaliti yaroqsiz yoki kirish rad etildi."
                    : "Tarmoq yoki API xatosi yuz berdi."}
              </p>
            </CardContent>
          </Card>
        )}

        <DashboardSection title="Filtrlar">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hudud</p>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hududni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha hududlar</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tuman</p>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={selectedRegion === "all"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tumanni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha tumanlar</SelectItem>
                    {districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRegion("all");
                  setSelectedDistrict("all");
                }}
              >
                Filtrni tozalash
              </Button>

              <Button variant="outline" className="gap-2" onClick={exportBreakdown} disabled={loading || breakdownRows.length === 0}>
                <Download className="h-4 w-4" />
                Joriy kesim eksport
              </Button>
            </CardContent>
          </Card>
        </DashboardSection>

        <DashboardSection title="Asosiy ko'rsatkichlar">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="rounded-2xl">
                  <CardContent className="p-5">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatsKPI index={0} label="Jami o'quvchi" value={totalUsers.toLocaleString()} icon={Users} color="bg-blue-500/15 text-blue-600" />
              <StatsKPI index={1} label="Natijasi bor" value={resultUsersCount.toLocaleString()} icon={BarChart3} color="bg-green-500/15 text-green-600" />
              <StatsKPI index={2} label="Natija chiqmagan" value={noResultUsersCount.toLocaleString()} icon={TrendingUp} color="bg-red-500/15 text-red-600" />
              <StatsKPI index={3} label="O'tish balli olganlar" value={passCount.toLocaleString()} sub={`${passRate}%`} icon={TrendingUp} color="bg-yellow-500/15 text-yellow-600" />
              <StatsKPI index={4} label="O'rtacha ball" value={averagePoint > 0 ? `${averagePoint.toFixed(1)} / 189` : "—"} icon={GraduationCap} color="bg-purple-500/15 text-purple-600" />
              <StatsKPI index={5} label="Maktablar soni" value={totalSchools.toLocaleString()} icon={School} color="bg-cyan-500/15 text-cyan-600" />
            </div>
          )}
        </DashboardSection>

        {!loading && !error && (
          <>
            <DetailedScoreChart
              scoreBands={scoreBands}
              baseEntities={filteredEntities}
              pieData={pieData}
              title="Ballar taqsimoti"
              allowStudentPeek={false}
            />

            <GenderLanguageSection genderData={genderData} langData={langData} />
            <RegionalRankingSection data={regionalRanking} />
            <SubjectMasterySection data={subjectMastery} />
            <TimeAnalyticsSection timelineData={timelineData} hourlyData={hourlyData} />
            <SchoolRankingsSection
              topSchoolsBySubmit={topSchoolsBySubmit}
              topSchoolsByScore={topSchoolsByScore}
              bottomSchoolsBySubmit={bottomSchoolsBySubmit}
              bottomSchoolsByScore={bottomSchoolsByScore}
            />

            <DashboardSection title={breakdownTitle}>
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">{breakdownTitle}</CardTitle>
                    <CardDescription>
                      {breakdownLevel === "regions"
                        ? "Hudud ustiga bosib tumanlar kesimiga o'tishingiz mumkin."
                        : breakdownLevel === "districts"
                          ? "Tuman ustiga bosib maktablar kesimiga o'tishingiz mumkin."
                          : "Tanlangan filtr bo'yicha maktablar statistikasi."}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {breakdownRows.length} ta qator
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-2" onClick={exportBreakdown}>
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{breakdownNameLabel}</TableHead>
                        <TableHead className="text-right">Ro'yxat</TableHead>
                        <TableHead className="text-right">Natija</TableHead>
                        <TableHead className="text-right">Topshirish %</TableHead>
                        <TableHead className="text-right">O'tish %</TableHead>
                        <TableHead className="text-right">O'rtacha ball</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breakdownRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">
                            {breakdownLevel === "regions" ? (
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 text-left hover:text-primary"
                                onClick={() => {
                                  setSelectedRegion(row.name);
                                  setSelectedDistrict("all");
                                }}
                              >
                                {row.name}
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            ) : breakdownLevel === "districts" ? (
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 text-left hover:text-primary"
                                onClick={() => setSelectedDistrict(row.name)}
                              >
                                {row.name}
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            ) : (
                              <div className="space-y-1">
                                <p>{row.name}</p>
                                <p className="text-xs text-muted-foreground">{row.region} · {row.district}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">{row.registered_count.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{row.result_count.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{row.submit_rate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{row.pass_rate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{row.avg_point > 0 ? row.avg_point.toFixed(1) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </DashboardSection>

            <DashboardSection title="Maktablar Jadvali">
              <Card className="rounded-2xl border-border/50 shadow-sm">
                <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Filtrlangan maktablar reytingi</CardTitle>
                    <CardDescription>Joriy filtr bo'yicha eng muhim maktab ko'rsatkichlari.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={exportSchools} disabled={schoolRows.length === 0}>
                    <Download className="h-4 w-4" />
                    Maktablar CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Maktab</TableHead>
                        <TableHead>Hudud</TableHead>
                        <TableHead>Tuman</TableHead>
                        <TableHead className="text-right">Ro'yxat</TableHead>
                        <TableHead className="text-right">Natija</TableHead>
                        <TableHead className="text-right">Topshirish %</TableHead>
                        <TableHead className="text-right">O'tish %</TableHead>
                        <TableHead className="text-right">O'rtacha ball</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schoolRows.slice(0, 20).map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>{row.region || "—"}</TableCell>
                          <TableCell>{row.district || "—"}</TableCell>
                          <TableCell className="text-right font-mono">{row.registered_count.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{row.result_count.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{row.submit_rate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{row.pass_rate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right font-mono">{row.avg_point > 0 ? row.avg_point.toFixed(1) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </DashboardSection>
          </>
        )}
      </main>
    </div>
  );
}
