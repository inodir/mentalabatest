 import { useEffect, useState } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { AdminLayout } from "@/components/layout/AdminLayout";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { TEST_LANGUAGES } from "@/lib/constants";
 import { ArrowLeft, User, Calendar, Award, TrendingUp, Loader2 } from "lucide-react";
 import { format } from "date-fns";
 
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
 }
 
 interface TestResult {
   id: string;
   test_date: string;
   test_language: string;
   subject1: string;
   subject2: string;
   score_subject1: number;
   score_subject2: number;
   total_score: number;
   max_score: number;
   attempt_number: number;
 }
 
 export default function StudentHistory() {
   const { studentId } = useParams<{ studentId: string }>();
   const navigate = useNavigate();
   const [student, setStudent] = useState<Student | null>(null);
   const [results, setResults] = useState<TestResult[]>([]);
   const [loading, setLoading] = useState(true);
   const { toast } = useToast();
 
   useEffect(() => {
     if (studentId) {
       fetchData();
     }
   }, [studentId]);
 
   const fetchData = async () => {
     try {
       // Fetch student
       const { data: studentData, error: studentError } = await supabase
         .from("students")
         .select("*")
         .eq("id", studentId)
         .single();
 
       if (studentError) throw studentError;
       setStudent(studentData);
 
       // Fetch test results
       const { data: resultsData, error: resultsError } = await supabase
         .from("test_results")
         .select("*")
         .eq("student_id", studentId)
         .order("test_date", { ascending: false });
 
       if (resultsError) throw resultsError;
       setResults(resultsData || []);
     } catch (error) {
       console.error("Error fetching data:", error);
       toast({
         title: "Xatolik",
         description: "Ma'lumotlarni yuklashda xatolik",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const getLanguageLabel = (value: string) => {
     return TEST_LANGUAGES.find((l) => l.value === value)?.label || value;
   };
 
   const averageScore = results.length > 0
     ? Math.round(results.reduce((sum, r) => sum + r.total_score, 0) / results.length)
     : 0;
 
   const bestScore = results.length > 0
     ? Math.max(...results.map((r) => r.total_score))
     : 0;
 
   if (loading) {
     return (
       <AdminLayout variant="school">
         <div className="flex h-[50vh] items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin" />
         </div>
       </AdminLayout>
     );
   }
 
   if (!student) {
     return (
       <AdminLayout variant="school">
         <div className="text-center">
           <p className="text-muted-foreground">O'quvchi topilmadi</p>
           <Button onClick={() => navigate(-1)} className="mt-4">
             Orqaga
           </Button>
         </div>
       </AdminLayout>
     );
   }
 
   return (
     <AdminLayout variant="school">
       <div className="space-y-6">
         <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
             <h1 className="text-3xl font-bold tracking-tight">{student.full_name}</h1>
             <p className="text-muted-foreground">O'quvchi tarixi va test natijalari</p>
           </div>
         </div>
 
         {/* Student Info */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Card>
             <CardContent className="flex items-center gap-4 p-4">
               <div className="rounded-lg bg-primary/10 p-3">
                 <User className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Telefon</p>
                 <p className="font-medium">{student.phone_number}</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="flex items-center gap-4 p-4">
               <div className="rounded-lg bg-accent/10 p-3">
                 <Calendar className="h-5 w-5 text-accent" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Jami testlar</p>
                 <p className="font-medium">{results.length}</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="flex items-center gap-4 p-4">
               <div className="rounded-lg bg-success/10 p-3">
                 <Award className="h-5 w-5 text-success" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Eng yaxshi ball</p>
                 <p className="font-medium">{bestScore}</p>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="flex items-center gap-4 p-4">
               <div className="rounded-lg bg-warning/10 p-3">
                 <TrendingUp className="h-5 w-5 text-warning" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">O'rtacha ball</p>
                 <p className="font-medium">{averageScore}</p>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Student Details */}
         <Card>
           <CardHeader>
             <CardTitle>O'quvchi ma'lumotlari</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               <div>
                 <p className="text-sm text-muted-foreground">Test tili</p>
                 <p className="font-medium">{getLanguageLabel(student.test_language)}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">1-fan</p>
                 <p className="font-medium">{student.subject1}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">2-fan</p>
                 <p className="font-medium">{student.subject2}</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Til sertifikati</p>
                 <p className="font-medium">
                   {student.has_language_certificate ? (
                     <Badge>
                       {student.certificate_type} {student.certificate_score && `(${student.certificate_score})`}
                     </Badge>
                   ) : (
                     <Badge variant="secondary">Yo'q</Badge>
                   )}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Test History */}
         <Card>
           <CardHeader>
             <CardTitle>Test tarixi</CardTitle>
           </CardHeader>
           <CardContent>
             {results.length === 0 ? (
               <p className="py-8 text-center text-muted-foreground">
                 Test natijalari mavjud emas
               </p>
             ) : (
               <div className="space-y-4">
                 {results.map((result, index) => (
                   <div
                     key={result.id}
                     className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                   >
                     <div className="flex items-center gap-4">
                       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                         #{result.attempt_number}
                       </div>
                       <div>
                         <p className="font-medium">
                           {format(new Date(result.test_date), "dd MMMM yyyy")}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {getLanguageLabel(result.test_language)}
                         </p>
                       </div>
                     </div>
                     <div className="flex flex-wrap items-center gap-4">
                       <div className="text-center">
                         <p className="text-xs text-muted-foreground">{result.subject1}</p>
                         <Badge variant="outline">{result.score_subject1}</Badge>
                       </div>
                       <div className="text-center">
                         <p className="text-xs text-muted-foreground">{result.subject2}</p>
                         <Badge variant="outline">{result.score_subject2}</Badge>
                       </div>
                       <div className="text-center">
                         <p className="text-xs text-muted-foreground">Jami</p>
                         <Badge
                           variant={
                             result.total_score >= result.max_score * 0.7 ? "default" : "secondary"
                           }
                         >
                           {result.total_score}/{result.max_score}
                         </Badge>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </AdminLayout>
   );
 }