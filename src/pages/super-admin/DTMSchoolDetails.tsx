import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getApiSettings,
  fetchAllDTMUsers,
  DTMUser,
} from "@/lib/dtm-api";
import {
  ArrowLeft,
  Search,
  Users,
  FileText,
  TrendingUp,
  Download,
  Loader2,
  RefreshCw,
  School,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function DTMSchoolDetails() {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [schoolInfo, setSchoolInfo] = useState<{
    full_name: string;
    username: string;
    region: string;
    district: string;
    registered_count: number;
    answered_count: number;
  } | null>(null);
  const [dtmUsers, setDtmUsers] = useState<DTMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultsSearchTerm, setResultsSearchTerm] = useState("");

  const registeredUsers = dtmUsers.filter((u) => !u.has_result);
  const usersWithResults = dtmUsers.filter((u) => u.has_result);

  const avgScore =
    usersWithResults.length > 0
      ? Math.round(
          usersWithResults
            .filter((u) => u.total_point !== null && u.total_point !== undefined)
            .reduce((sum, u) => sum + (u.total_point || 0), 0) /
            usersWithResults.filter(
              (u) => u.total_point !== null && u.total_point !== undefined
            ).length
        )
      : 0;

  // Fetch school info from API
  const fetchSchoolInfo = useCallback(async () => {
    if (!schoolCode) return;
    const settings = getApiSettings();
    if (!settings) return;

    try {
      const baseUrl = settings.mainUrl.endsWith("/") ? settings.mainUrl : `${settings.mainUrl}/`;
      const response = await fetch(`${baseUrl}api/v1/management/schools`, {
        headers: { accept: "application/json", "x-api-key": settings.apiKey },
      });
      if (response.ok) {
        const schools = await response.json();
        const found = schools.find(
          (s: { username: string }) => s.username === schoolCode
        );
        if (found) setSchoolInfo(found);
      }
    } catch (err) {
      console.error("Error fetching school info:", err);
    }
  }, [schoolCode]);

  // Fetch DTM users for this school
  const fetchDTMData = useCallback(
    async (forceRefresh = false) => {
      if (!schoolCode) return;
      const settings = getApiSettings();
      if (!settings) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { entities } = await fetchAllDTMUsers(settings, undefined, forceRefresh);
        const schoolStudents = entities.filter((u) => u.school_code === schoolCode);
        setDtmUsers(schoolStudents);
      } catch (err) {
        console.error("Error fetching DTM data:", err);
      } finally {
        setLoading(false);
      }
    },
    [schoolCode]
  );

  useEffect(() => {
    if (schoolCode) {
      fetchSchoolInfo();
      fetchDTMData();
    }
  }, [schoolCode, fetchSchoolInfo, fetchDTMData]);

  // Filters
  const filteredRegistered = registeredUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || "").includes(searchTerm)
  );

  const filteredResults = usersWithResults.filter(
    (u) =>
      u.full_name.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
      (u.phone || "").includes(resultsSearchTerm)
  );

  // CSV exports
  const downloadCSV = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleExportRegisteredCSV = () => {
    const headers = ["F.I.O.", "Telefon", "Tuman", "Ro'yxatdan o'tgan sana"];
    const rows = filteredRegistered.map((u) => [
      u.full_name,
      u.phone || "",
      u.district || "",
      format(new Date(u.created_at), "dd.MM.yyyy"),
    ]);
    downloadCSV(headers, rows, `${schoolCode}_royxat.csv`);
  };

  const handleExportResultsCSV = () => {
    const headers = ["F.I.O.", "Telefon", "Tuman", "Majburiy fanlar", "1-fan", "1-fan ball", "2-fan", "2-fan ball", "Jami ball"];
    const rows = filteredResults.map((u) => {
      const mandatory = u.test_results?.mandatory || [];
      const mandatoryTotal = mandatory.reduce((s, m) => s + m.point, 0);
      return [
        u.full_name,
        u.phone || "",
        u.district || "",
        mandatoryTotal,
        u.test_results?.primary?.name || "",
        u.test_results?.primary?.point || 0,
        u.test_results?.secondary?.name || "",
        u.test_results?.secondary?.point || 0,
        u.total_point ?? 0,
      ];
    });
    downloadCSV(headers, rows, `${schoolCode}_natijalar.csv`);
  };

  const displayName = schoolInfo?.full_name || schoolCode || "";

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/super-admin/schools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate sm:text-3xl">
              {loading && !schoolInfo ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                displayName
              )}
            </h1>
            {schoolInfo && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {schoolInfo.region}, {schoolInfo.district} •{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                  {schoolInfo.username}
                </code>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDTMData(true)}
            disabled={loading}
            title="Yangilash"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami o'quvchilar</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : dtmUsers.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Natijasi bor</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : usersWithResults.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <XCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Natijasi yo'q</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : registeredUsers.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">O'rtacha ball</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${avgScore}/189`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="results" className="gap-2">
              <FileText className="h-4 w-4" />
              Natijalar ({usersWithResults.length})
            </TabsTrigger>
            <TabsTrigger value="registered" className="gap-2">
              <Users className="h-4 w-4" />
              Ro'yxatdan o'tganlar ({registeredUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="F.I.O. bo'yicha qidirish..."
                  value={resultsSearchTerm}
                  onChange={(e) => setResultsSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={handleExportResultsCSV} disabled={filteredResults.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card>
              <div className="rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>F.I.O.</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead className="text-center">Majburiy</TableHead>
                      <TableHead>1-fan (ball)</TableHead>
                      <TableHead>2-fan (ball)</TableHead>
                      <TableHead className="text-center">Jami</TableHead>
                      <TableHead className="text-center">Test fayl</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-16 text-center">
                          <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                          <p className="mt-3 text-sm text-muted-foreground">Natijalar topilmadi</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredResults.map((user, idx) => {
                        const mandatory = user.test_results?.mandatory || [];
                        const mandatoryTotal = mandatory.reduce((s, m) => s + m.point, 0);
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="text-center text-muted-foreground text-xs">{idx + 1}</TableCell>
                            <TableCell className="font-medium">{user.full_name}</TableCell>
                            <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="tabular-nums">{mandatoryTotal}/33</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{user.test_results?.primary?.name || "—"}</span>
                              {user.test_results?.primary && (
                                <Badge variant="outline" className="ml-1.5 tabular-nums">
                                  {user.test_results.primary.point}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{user.test_results?.secondary?.name || "—"}</span>
                              {user.test_results?.secondary && (
                                <Badge variant="outline" className="ml-1.5 tabular-nums">
                                  {user.test_results.secondary.point}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  (user.total_point || 0) >= 130 ? "default" : "secondary"
                                }
                                className={`tabular-nums ${
                                  (user.total_point || 0) >= 130
                                    ? "bg-success/15 text-success border-success/30"
                                    : ""
                                }`}
                              >
                                {user.total_point ?? 0}/189
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {user.test_file_url ? (
                                <a href={user.test_file_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm">
                                    <Download className="mr-1 h-3 w-3" />
                                    Yuklab olish
                                  </Button>
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {!loading && filteredResults.length > 0 && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Jami: {filteredResults.length} natija · O'rtacha: {avgScore}/189
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Registered Tab */}
          <TabsContent value="registered" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={handleExportRegisteredCSV} disabled={filteredRegistered.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            <Card>
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>F.I.O.</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Tuman</TableHead>
                      <TableHead>Sana</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredRegistered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-16 text-center">
                          <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                          <p className="mt-3 text-sm text-muted-foreground">O'quvchilar topilmadi</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRegistered.map((user, idx) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-center text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{user.district || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), "dd.MM.yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {!loading && filteredRegistered.length > 0 && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Jami: {filteredRegistered.length} o'quvchi
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
