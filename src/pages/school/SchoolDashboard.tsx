 import { useEffect, useState } from "react";
 import { AdminLayout } from "@/components/layout/AdminLayout";
 import { StatCard } from "@/components/ui/stat-card";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/hooks/useAuth";
 import { Users, FileText, TrendingUp, Calendar } from "lucide-react";
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
 } from "recharts";
 import { format } from "date-fns";
 
 interface Stats {
   totalStudents: number;
   totalTests: number;
   averageScore: number;
 }
 
 interface RecentTest {
   id: string;
   student_name: string;
   test_date: string;
   total_score: number;
   subject1: string;
   subject2: string;
 }
 
 interface ChartData {
   date: string;
   tests: number;
 }
 
 export default function SchoolDashboard() {
   const { schoolId } = useAuth();
   const [stats, setStats] = useState<Stats>({
     totalStudents: 0,
     totalTests: 0,
     averageScore: 0,
   });
   const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
   const [chartData, setChartData] = useState<ChartData[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (schoolId) {
       fetchStats();
     }
   }, [schoolId]);
 
   const fetchStats = async () => {
     try {
       // Fetch students count
       const { count: studentsCount } = await supabase
         .from("students")
         .select("*", { count: "exact", head: true })
         .eq("school_id", schoolId);
 
       // Fetch student IDs for this school
       const { data: students } = await supabase
         .from("students")
         .select("id, full_name")
         .eq("school_id", schoolId);
 
       const studentIds = students?.map((s) => s.id) || [];
       const studentMap = new Map(students?.map((s) => [s.id, s.full_name]) || []);
 
       // Fetch test results
       const { data: testResults } = await supabase
         .from("test_results")
         .select("*")
         .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"])
         .order("test_date", { ascending: false });
 
       const totalTests = testResults?.length || 0;
       const averageScore =
         totalTests > 0
           ? Math.round(
               testResults!.reduce((sum, t) => sum + t.total_score, 0) / totalTests
             )
           : 0;
 
       setStats({
         totalStudents: studentsCount || 0,
         totalTests,
         averageScore,
       });
 
       // Recent tests
       const recent = (testResults || []).slice(0, 5).map((t) => ({
         id: t.id,
         student_name: studentMap.get(t.student_id) || "Noma'lum",
         test_date: t.test_date,
         total_score: t.total_score,
         subject1: t.subject1,
         subject2: t.subject2,
       }));
       setRecentTests(recent);
 
       // Chart data - tests per day for last 7 days
       const dateMap = new Map<string, number>();
       (testResults || []).forEach((t) => {
         const date = t.test_date;
         dateMap.set(date, (dateMap.get(date) || 0) + 1);
       });
 
       const chartDataArr = Array.from(dateMap.entries())
         .sort((a, b) => a[0].localeCompare(b[0]))
         .slice(-7)
         .map(([date, tests]) => ({
           date: format(new Date(date), "dd.MM"),
           tests,
         }));
       setChartData(chartDataArr);
     } catch (error) {
       console.error("Error fetching stats:", error);
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <AdminLayout variant="school">
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
           <p className="text-muted-foreground">Maktabingiz statistikasi</p>
         </div>
 
         {/* Stats Grid */}
         <div className="grid gap-4 md:grid-cols-3">
           <StatCard
             title="Jami ro'yxatdan o'tgan o'quvchilar"
             value={stats.totalStudents}
             icon={Users}
           />
           <StatCard
             title="Jami bajarilgan testlar soni"
             value={stats.totalTests}
             icon={FileText}
           />
           <StatCard
             title="O'rtacha ball"
             value={stats.averageScore}
             icon={TrendingUp}
           />
         </div>
 
         {/* Charts and Recent */}
         <div className="grid gap-4 lg:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Calendar className="h-5 w-5" />
                 Testlar dinamikasi
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-[300px]">
                 {chartData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                       <XAxis dataKey="date" className="text-muted-foreground" />
                       <YAxis className="text-muted-foreground" />
                       <Tooltip
                         contentStyle={{
                           backgroundColor: "hsl(var(--card))",
                           border: "1px solid hsl(var(--border))",
                           borderRadius: "var(--radius)",
                         }}
                       />
                       <Line
                         type="monotone"
                         dataKey="tests"
                         stroke="hsl(var(--primary))"
                         strokeWidth={2}
                         dot={{ fill: "hsl(var(--primary))" }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="flex h-full items-center justify-center text-muted-foreground">
                     Ma'lumotlar mavjud emas
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader>
               <CardTitle>So'nggi 5 ta test</CardTitle>
             </CardHeader>
             <CardContent>
               {recentTests.length > 0 ? (
                 <div className="space-y-4">
                   {recentTests.map((test) => (
                     <div
                       key={test.id}
                       className="flex items-center justify-between rounded-lg border p-3"
                     >
                       <div>
                         <p className="font-medium">{test.student_name}</p>
                         <p className="text-sm text-muted-foreground">
                           {test.subject1} / {test.subject2}
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="text-lg font-bold">{test.total_score}</p>
                         <p className="text-xs text-muted-foreground">
                           {format(new Date(test.test_date), "dd.MM.yyyy")}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="flex h-[260px] items-center justify-center text-muted-foreground">
                   Testlar mavjud emas
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
       </div>
     </AdminLayout>
   );
 }