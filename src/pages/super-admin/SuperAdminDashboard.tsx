 import { useEffect, useState } from "react";
 import { AdminLayout } from "@/components/layout/AdminLayout";
 import { StatCard } from "@/components/ui/stat-card";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { supabase } from "@/integrations/supabase/client";
 import { School, Users, FileText, TrendingUp } from "lucide-react";
 import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
 } from "recharts";
 
 interface Stats {
   totalSchools: number;
   totalStudents: number;
   totalTests: number;
   averageScore: number;
 }
 
 interface SchoolStat {
   school_name: string;
   student_count: number;
 }
 
 export default function SuperAdminDashboard() {
   const [stats, setStats] = useState<Stats>({
     totalSchools: 0,
     totalStudents: 0,
     totalTests: 0,
     averageScore: 0,
   });
   const [schoolStats, setSchoolStats] = useState<SchoolStat[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     fetchStats();
   }, []);
 
   const fetchStats = async () => {
     try {
       // Fetch schools count
       const { count: schoolsCount } = await supabase
         .from("schools")
         .select("*", { count: "exact", head: true });
 
       // Fetch students count
       const { count: studentsCount } = await supabase
         .from("students")
         .select("*", { count: "exact", head: true });
 
       // Fetch test results
       const { data: testResults } = await supabase
         .from("test_results")
         .select("total_score, max_score");
 
       const totalTests = testResults?.length || 0;
       const averageScore =
         totalTests > 0
           ? Math.round(
               (testResults!.reduce((sum, t) => sum + t.total_score, 0) /
                 totalTests)
             )
           : 0;
 
       setStats({
         totalSchools: schoolsCount || 0,
         totalStudents: studentsCount || 0,
         totalTests,
         averageScore,
       });
 
       // Fetch school stats for chart
       const { data: schools } = await supabase
         .from("schools")
         .select("id, school_name");
 
       if (schools) {
         const schoolStatsData = await Promise.all(
           schools.slice(0, 10).map(async (school) => {
             const { count } = await supabase
               .from("students")
               .select("*", { count: "exact", head: true })
               .eq("school_id", school.id);
             return {
               school_name: school.school_name.substring(0, 15),
               student_count: count || 0,
             };
           })
         );
         setSchoolStats(schoolStatsData);
       }
     } catch (error) {
       console.error("Error fetching stats:", error);
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <AdminLayout variant="super">
       <div className="space-y-6">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
           <p className="text-muted-foreground">
             Mentalaba platformasi umumiy statistikasi
           </p>
         </div>
 
         {/* Stats Grid */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <StatCard
             title="Jami maktablar"
             value={stats.totalSchools}
             icon={School}
           />
           <StatCard
             title="Jami o'quvchilar"
             value={stats.totalStudents}
             icon={Users}
           />
           <StatCard
             title="Jami testlar"
             value={stats.totalTests}
             icon={FileText}
           />
           <StatCard
             title="O'rtacha ball"
             value={stats.averageScore}
             icon={TrendingUp}
           />
         </div>
 
         {/* Charts */}
         <div className="grid gap-4 lg:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle>Maktablar bo'yicha o'quvchilar soni</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-[300px]">
                 {schoolStats.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={schoolStats}>
                       <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                       <XAxis
                         dataKey="school_name"
                         tick={{ fontSize: 12 }}
                         className="text-muted-foreground"
                       />
                       <YAxis className="text-muted-foreground" />
                       <Tooltip
                         contentStyle={{
                           backgroundColor: "hsl(var(--card))",
                           border: "1px solid hsl(var(--border))",
                           borderRadius: "var(--radius)",
                         }}
                       />
                       <Bar
                         dataKey="student_count"
                         fill="hsl(var(--primary))"
                         radius={[4, 4, 0, 0]}
                       />
                     </BarChart>
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
               <CardTitle>So'nggi yangiliklar</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                 Hozircha yangiliklar yo'q
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </AdminLayout>
   );
 }