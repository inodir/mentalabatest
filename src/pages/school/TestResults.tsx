 import { useEffect, useState } from "react";
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
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { useToast } from "@/hooks/use-toast";
 import { SUBJECTS, TEST_LANGUAGES } from "@/lib/constants";
 import { Search, Download, Loader2, Calendar, Eye } from "lucide-react";
 import { format } from "date-fns";
 import { useNavigate } from "react-router-dom";
 
interface TestResult {
  id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
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
  has_certificate: boolean;
  certificate_type: string | null;
  certificate_score: string | null;
  attempt_number: number;
}
 
 export default function TestResults() {
   const { schoolId } = useAuth();
   const navigate = useNavigate();
   const [results, setResults] = useState<TestResult[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [subjectFilter, setSubjectFilter] = useState<string>("all");
   const [dateFrom, setDateFrom] = useState("");
   const [dateTo, setDateTo] = useState("");
   const [minScore, setMinScore] = useState("");
   const { toast } = useToast();
 
   useEffect(() => {
     if (schoolId) {
       fetchResults();
     }
   }, [schoolId]);
 
   const fetchResults = async () => {
     try {
      // First get students for this school
        const { data: students } = await supabase
          .from("students")
          .select("id, full_name, phone_number, has_language_certificate, certificate_type, certificate_score")
          .eq("school_id", schoolId);

        const studentIds = students?.map((s) => s.id) || [];
        const studentMap = new Map(
          students?.map((s) => [s.id, { 
            name: s.full_name, 
            phone: s.phone_number,
            hasCert: s.has_language_certificate,
            certType: s.certificate_type,
            certScore: s.certificate_score,
          }]) || []
        );

        // Get test results
        const { data, error } = await supabase
          .from("test_results")
          .select("*")
          .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])
          .order("test_date", { ascending: false });

        if (error) throw error;

        const resultsWithNames = (data || []).map((r) => {
          const studentInfo = studentMap.get(r.student_id);
          return {
            ...r,
            student_name: studentInfo?.name || "Noma'lum",
            student_phone: studentInfo?.phone || "",
            has_certificate: studentInfo?.hasCert || false,
            certificate_type: studentInfo?.certType || null,
            certificate_score: studentInfo?.certScore || null,
          };
        });

        setResults(resultsWithNames);
     } catch (error) {
       console.error("Error fetching results:", error);
       toast({
         title: "Xatolik",
         description: "Natijalarni yuklashda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const getLanguageLabel = (value: string) => {
     return TEST_LANGUAGES.find((l) => l.value === value)?.label || value;
   };
 
    const handleExportCSV = () => {
      const headers = [
        "Sana",
        "F.I.O.",
        "Test tili",
        "Ona tili",
        "Matematika",
        "Tarix",
        "Fan 1",
        "Ball 1",
        "Fan 2",
        "Ball 2",
        "Jami ball",
        "Til sertifikati",
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
        r.has_certificate ? "Ha" : "Yo'q",
      ]);
 
     const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
     const blob = new Blob([csv], { type: "text/csv" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = "test-natijalari.csv";
     a.click();
   };
 
   const filteredResults = results.filter((result) => {
     const matchesSearch = result.student_name.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesSubject =
       subjectFilter === "all" ||
       result.subject1 === subjectFilter ||
       result.subject2 === subjectFilter;
     const matchesDateFrom = !dateFrom || result.test_date >= dateFrom;
     const matchesDateTo = !dateTo || result.test_date <= dateTo;
     const matchesMinScore = !minScore || result.total_score >= parseInt(minScore);
     return matchesSearch && matchesSubject && matchesDateFrom && matchesDateTo && matchesMinScore;
   });
 
   return (
     <AdminLayout variant="school">
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">Test natijalari</h1>
             <p className="text-muted-foreground">
               O'quvchilaringizning test natijalari
             </p>
           </div>
           <Button variant="outline" onClick={handleExportCSV}>
             <Download className="mr-2 h-4 w-4" />
             Export
           </Button>
         </div>
 
         {/* Filters */}
         <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
           <div className="relative sm:col-span-2 lg:col-span-1">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="F.I.O. bo'yicha..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9"
             />
           </div>
           <Select value={subjectFilter} onValueChange={setSubjectFilter}>
             <SelectTrigger>
               <SelectValue placeholder="Fan bo'yicha" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Barcha fanlar</SelectItem>
               {SUBJECTS.map((s) => (
                 <SelectItem key={s} value={s}>
                   {s}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
           <div className="space-y-1">
             <Label className="text-xs">Sanadan</Label>
             <Input
               type="date"
               value={dateFrom}
               onChange={(e) => setDateFrom(e.target.value)}
             />
           </div>
           <div className="space-y-1">
             <Label className="text-xs">Sanagacha</Label>
             <Input
               type="date"
               value={dateTo}
               onChange={(e) => setDateTo(e.target.value)}
             />
           </div>
           <div className="space-y-1">
             <Label className="text-xs">Min ball</Label>
             <Input
               type="number"
               placeholder="0"
               value={minScore}
               onChange={(e) => setMinScore(e.target.value)}
             />
           </div>
         </div>
 
         {/* Table */}
         <div className="rounded-lg border bg-card">
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>F.I.O.</TableHead>
                  <TableHead>Test tili</TableHead>
                  <TableHead>Ona tili (M)</TableHead>
                  <TableHead>Matematika (M)</TableHead>
                  <TableHead>Tarix (M)</TableHead>
                  <TableHead>1-fan (ball)</TableHead>
                  <TableHead>2-fan (ball)</TableHead>
                  <TableHead>Jami ball</TableHead>
                  <TableHead>Sertifikat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                      Natijalar topilmadi
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
                      <TableCell className="font-medium">{result.student_name}</TableCell>
                      <TableCell>{getLanguageLabel(result.test_language)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.score_ona_tili}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.score_matematika}</Badge>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Badge
                          variant={result.total_score >= result.max_score * 0.7 ? "default" : "secondary"}
                        >
                          {result.total_score}/{result.max_score}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.has_certificate ? "default" : "secondary"}>
                          {result.has_certificate ? "Ha" : "Yo'q"}
                        </Badge>
                      </TableCell>
                     <TableCell className="text-right">
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => navigate(`/school/students/${result.student_id}`)}
                         title="O'quvchi tarixini ko'rish"
                       >
                         <Eye className="h-4 w-4" />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
       </div>
     </AdminLayout>
   );
 }