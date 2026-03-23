import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { format } from "date-fns";

interface School {
  id: string;
  region: string;
  district: string;
  school_name: string;
  school_code: string;
  admin_full_name: string;
  admin_login: string;
  is_active: boolean;
}

export default function SchoolDetails() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [dtmUsers, setDtmUsers] = useState<DTMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dtmLoading, setDtmLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultsSearchTerm, setResultsSearchTerm] = useState("");
  const { toast } = useToast();

  // Derived data
  const registeredUsers = dtmUsers.filter((u) => !u.has_result);
  const usersWithResults = dtmUsers.filter((u) => u.has_result);

  const totalStudents = dtmUsers.length;
  const totalWithResults = usersWithResults.length;
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

  useEffect(() => {
    if (schoolId) {
      fetchSchoolInfo();
    }
  }, [schoolId]);

  // Fetch DTM data when school is loaded
  useEffect(() => {
    if (school?.school_code) {
      fetchDTMData();
    }
  }, [school?.school_code]);

  const fetchSchoolInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single();

      if (error) throw error;
      setSchool(data);
    } catch (error) {
      console.error("Error fetching school:", error);
      toast({
        title: "Xatolik",
        description: "Maktab ma'lumotlarini yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDTMData = useCallback(
    async (forceRefresh = false) => {
      if (!school?.school_code) return;

      const settings = getApiSettings();
      if (!settings) {
        return;
      }

      setDtmLoading(true);
      try {
        const { entities } = await fetchAllDTMUsers(
          settings,
          undefined,
          forceRefresh
        );
        const schoolStudents = entities.filter(
          (u) => u.school_code === school.school_code
        );
        setDtmUsers(schoolStudents);
      } catch (err) {
        console.error("Error fetching DTM data:", err);
        toast({
          title: "Xatolik",
          description: "DTM ma'lumotlarini yuklashda xatolik",
          variant: "destructive",
        });
      } finally {
        setDtmLoading(false);
      }
    },
    [school?.school_code, toast]
  );

  // Filters
  const filteredRegistered = registeredUsers.filter((u) =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone || "").includes(searchTerm)
  );

  const filteredResults = usersWithResults.filter((u) =>
    u.full_name.toLowerCase().includes(resultsSearchTerm.toLowerCase()) ||
    (u.phone || "").includes(resultsSearchTerm)
  );

  // CSV exports
  const handleExportRegisteredCSV = () => {
    const headers = ["F.I.O.", "Telefon", "Tuman", "Ro'yxatdan o'tgan sana"];
    const rows = filteredRegistered.map((u) => [
      u.full_name,
      u.phone || "",
      u.district || "",
      format(new Date(u.created_at), "dd.MM.yyyy"),
    ]);
    downloadCSV(headers, rows, `${school?.school_name || "maktab"}_royxat.csv`);
  };

  const handleExportResultsCSV = () => {
    const headers = [
      "F.I.O.",
      "Telefon",
      "Tuman",
      "Majburiy fanlar",
      "1-fan",
      "1-fan ball",
      "2-fan",
      "2-fan ball",
      "Jami ball",
    ];
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
    downloadCSV(
      headers,
      rows,
      `${school?.school_name || "maktab"}_natijalar.csv`
    );
  };

  const downloadCSV = (
    headers: string[],
    rows: (string | number)[][],
    filename: string
  ) => {
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <AdminLayout variant="super">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!school) {
    return (
      <AdminLayout variant="super">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Maktab topilmadi</p>
          <Link to="/super-admin/schools">
            <Button variant="link">Orqaga qaytish</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

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
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {school.school_name}
            </h1>
            <p className="text-muted-foreground">
              {school.region}, {school.district} • Kod: {school.school_code}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDTMData(true)}
            disabled={dtmLoading}
            title="Yangilash"
          >
            <RefreshCw
              className={`h-4 w-4 ${dtmLoading ? "animate-spin" : ""}`}
            />
          </Button>
          <Badge variant={school.is_active ? "default" : "secondary"}>
            {school.is_active ? "Faol" : "Nofaol"}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                O'quvchilar
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dtmLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  totalStudents
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Natijasi bor
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dtmLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  totalWithResults
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                O'rtacha ball
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dtmLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `${avgScore}/189`
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">F.I.O.: </span>
              <span className="font-medium">{school.admin_full_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Login: </span>
              <span className="font-medium">{school.admin_login}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="results" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registered" className="gap-2">
              <Users className="h-4 w-4" />
              Ro'yxatdan o'tganlar ({registeredUsers.length})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <FileText className="h-4 w-4" />
              Natijalar ({usersWithResults.length})
            </TabsTrigger>
          </TabsList>

          {/* Registered Tab */}
          <TabsContent value="registered" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">
                Ro'yxatdan o'tgan o'quvchilar
              </h2>
              <Button variant="outline" onClick={handleExportRegisteredCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.O.</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Tuman</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-center">Test fayl</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dtmLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredRegistered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        O'quvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegistered.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name}
                        </TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell>{user.district || "—"}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd.MM.yyyy")}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Test natijalari</h2>
              <Button variant="outline" onClick={handleExportResultsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="F.I.O. bo'yicha qidirish..."
                value={resultsSearchTerm}
                onChange={(e) => setResultsSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {dtmLoading ? (
                    <TableRow>
                       <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Natijalar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((user) => {
                      const mandatory = user.test_results?.mandatory || [];
                      const mandatoryTotal = mandatory.reduce(
                        (s, m) => s + m.point,
                        0
                      );
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.full_name}
                          </TableCell>
                          <TableCell>{user.phone || "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{mandatoryTotal}/33</Badge>
                          </TableCell>
                          <TableCell>
                            {user.test_results?.primary?.name || "—"}{" "}
                            <Badge variant="outline" className="ml-1">
                              {user.test_results?.primary?.point || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.test_results?.secondary?.name || "—"}{" "}
                            <Badge variant="outline" className="ml-1">
                              {user.test_results?.secondary?.point || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                (user.total_point || 0) >= 130
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.total_point ?? 0}/189
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {user.test_result_file_url ? (
                              <a
                                href={user.test_result_file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
