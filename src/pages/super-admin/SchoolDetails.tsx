import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUBJECTS } from "@/lib/constants";
import {
  ArrowLeft,
  Search,
  Users,
  FileText,
  TrendingUp,
  Download,
  Loader2,
  Calendar,
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

interface Student {
  id: string;
  full_name: string;
  phone_number: string;
  test_language: string;
  subject1: string;
  subject2: string;
  has_language_certificate: boolean;
  certificate_type: string | null;
  certificate_score: string | null;
  created_at: string;
  test_count?: number;
  avg_score?: number;
}

interface TestResult {
  id: string;
  student_id: string;
  student_name: string;
  test_date: string;
  test_language: string;
  subject1: string;
  subject2: string;
  score_ona_tili: number;
  score_matematika: number;
  score_tarix: number;
  score_subject1: number;
  score_subject2: number;
  total_score: number;
  max_score: number;
  attempt_number: number;
}

export default function SchoolDetails() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultsSearchTerm, setResultsSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [certificateFilter, setCertificateFilter] = useState<string>("all");
  const { toast } = useToast();

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTests: 0,
    avgScore: 0,
  });

  useEffect(() => {
    if (schoolId) {
      fetchSchoolData();
    }
  }, [schoolId]);

  const fetchSchoolData = async () => {
    try {
      // Fetch school info
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      const studentIds = studentsData?.map((s) => s.id) || [];
      const studentMap = new Map(
        studentsData?.map((s) => [s.id, s.full_name]) || []
      );

      // Fetch all test results for this school's students
      let allTestResults: TestResult[] = [];
      if (studentIds.length > 0) {
        const { data: resultsData } = await supabase
          .from("test_results")
          .select("*")
          .in("student_id", studentIds)
          .order("test_date", { ascending: false });

        allTestResults = (resultsData || []).map((r) => ({
          ...r,
          student_name: studentMap.get(r.student_id) || "Noma'lum",
        }));
      }

      setTestResults(allTestResults);

      // Calculate student stats
      const studentsWithStats = (studentsData || []).map((student) => {
        const studentTests = allTestResults.filter(
          (t) => t.student_id === student.id
        );
        const avgScore =
          studentTests.length > 0
            ? Math.round(
                studentTests.reduce((sum, t) => sum + t.total_score, 0) /
                  studentTests.length
              )
            : 0;

        return {
          ...student,
          test_count: studentTests.length,
          avg_score: avgScore,
        };
      });

      setStudents(studentsWithStats);

      // Calculate overall stats
      const totalTests = allTestResults.length;
      const avgScore =
        allTestResults.length > 0
          ? Math.round(
              allTestResults.reduce((sum, t) => sum + t.total_score, 0) /
                allTestResults.length
            )
          : 0;

      setStats({
        totalStudents: studentsWithStats.length,
        totalTests,
        avgScore,
      });
    } catch (error) {
      console.error("Error fetching school data:", error);
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportStudentsCSV = () => {
    const headers = [
      "F.I.O.",
      "Telefon",
      "Test tili",
      "1-fan",
      "2-fan",
      "Sertifikat",
      "Sertifikat turi",
      "Ball",
      "Testlar soni",
      "O'rtacha ball",
    ];
    const rows = filteredStudents.map((s) => [
      s.full_name,
      s.phone_number,
      s.test_language,
      s.subject1,
      s.subject2,
      s.has_language_certificate ? "Ha" : "Yo'q",
      s.certificate_type || "",
      s.certificate_score || "",
      s.test_count,
      s.avg_score,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${school?.school_name || "maktab"}_oquvchilar.csv`;
    a.click();
  };

  const handleExportResultsCSV = () => {
    const headers = [
      "Sana",
      "F.I.O.",
      "Test tili",
      "Ona tili",
      "Matematika",
      "Tarix",
      "1-fan",
      "Ball",
      "2-fan",
      "Ball",
      "Jami",
    ];
    const rows = filteredResults.map((r) => [
      format(new Date(r.test_date), "dd.MM.yyyy"),
      r.student_name,
      getLanguageLabel(r.test_language),
      r.score_ona_tili,
      r.score_matematika,
      r.score_tarix,
      r.subject1,
      r.score_subject1,
      r.subject2,
      r.score_subject2,
      r.total_score,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${school?.school_name || "maktab"}_natijalar.csv`;
    a.click();
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone_number.includes(searchTerm);
    const matchesSubject =
      subjectFilter === "all" ||
      student.subject1 === subjectFilter ||
      student.subject2 === subjectFilter;
    const matchesCertificate =
      certificateFilter === "all" ||
      (certificateFilter === "yes" && student.has_language_certificate) ||
      (certificateFilter === "no" && !student.has_language_certificate);
    return matchesSearch && matchesSubject && matchesCertificate;
  });

  const filteredResults = testResults.filter((result) =>
    result.student_name.toLowerCase().includes(resultsSearchTerm.toLowerCase())
  );

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case "uzbek":
        return "O'zbek";
      case "russian":
        return "Rus";
      case "english":
        return "Ingliz";
      default:
        return lang;
    }
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
          <Badge variant={school.is_active ? "default" : "secondary"}>
            {school.is_active ? "Faol" : "Nofaol"}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'quvchilar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Testlar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha ball</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}/500</div>
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
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Ro'yxatdan o'tganlar ({stats.totalStudents})
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <FileText className="h-4 w-4" />
              Natijalar ({stats.totalTests})
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">O'quvchilar ro'yxati</h2>
              <Button variant="outline" onClick={handleExportStudentsCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Fan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha fanlar</SelectItem>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Students Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.O.</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Test tili</TableHead>
                    <TableHead>1-fan</TableHead>
                    <TableHead>2-fan</TableHead>
                    <TableHead className="text-center">Testlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">O'quvchilar topilmadi</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.full_name}
                        </TableCell>
                        <TableCell>{student.phone_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getLanguageLabel(student.test_language)}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.subject1}</TableCell>
                        <TableCell>{student.subject2}</TableCell>
                        <TableCell className="text-center">
                          {student.test_count}
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

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="F.I.O. bo'yicha qidirish..."
                value={resultsSearchTerm}
                onChange={(e) => setResultsSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Results Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>F.I.O.</TableHead>
                    <TableHead>Test tili</TableHead>
                    <TableHead className="text-center">Ona tili</TableHead>
                    <TableHead className="text-center">Matematika</TableHead>
                    <TableHead className="text-center">Tarix</TableHead>
                    <TableHead>1-fan (ball)</TableHead>
                    <TableHead>2-fan (ball)</TableHead>
                    <TableHead className="text-center">Jami</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-muted-foreground">Natijalar topilmadi</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(result.test_date), "dd.MM.yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {result.student_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getLanguageLabel(result.test_language)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{result.score_ona_tili}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{result.score_matematika}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{result.score_tarix}</Badge>
                        </TableCell>
                        <TableCell>
                          {result.subject1}{" "}
                          <Badge variant="outline" className="ml-1">
                            {result.score_subject1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.subject2}{" "}
                          <Badge variant="outline" className="ml-1">
                            {result.score_subject2}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              result.total_score >= result.max_score * 0.7
                                ? "default"
                                : "secondary"
                            }
                          >
                            {result.total_score}/{result.max_score}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
