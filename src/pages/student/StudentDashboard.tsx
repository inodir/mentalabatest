import { useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { calculateDTMPrediction } from "@/lib/stats-utils";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Clock, 
  GraduationCap,
  ChevronRight,
  Download,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { ChartTooltipStyle } from "@/lib/stats-utils";

export default function StudentDashboard() {
  const { dtmUser } = useAuth();
  
  // For a student login, we assume their own student record is either the user object 
  // or they are the first item in the students list (depending on backend implementation)
  // Here we'll take the first student record if available, otherwise use stats from dtmUser
  const studentData = dtmUser?.students?.items?.[0] || null;
  const score = studentData?.dtm?.total_ball ?? 0;
  const prediction = useMemo(() => calculateDTMPrediction(score), [score]);

  const fullName = dtmUser?.full_name || studentData?.full_name || "Talaba";
  const schoolName = dtmUser?.school?.name || studentData?.school_name || "Noma'lum maktab";
  const groupName = studentData?.group_name || "Noma'lum guruh";

  // Mock trend data for visualization
  const trendData = [
    { name: "Sentyabr", score: 45 },
    { name: "Oktyabr", score: 52 },
    { name: "Noyabr", score: 58 },
    { name: "Dekabr", score: 65 },
    { name: "Yanvar", score: 72 },
    { name: "Fevral", score: 68 },
    { name: "Mart", score: score || 75 },
  ];

  const subjectBreakdown = useMemo(() => {
    if (!studentData?.dtm?.subjects) {
      // Return default/mock if no subjects
      return [
        { subject: "Ona tili", score: 10, max: 11.4, pct: 88, fill: "hsl(217 91% 60%)" },
        { subject: "Matematika", score: 12, max: 93, pct: 13, fill: "hsl(142 71% 45%)" },
        { subject: "Tarix", score: 25, max: 63, pct: 40, fill: "hsl(35 92% 50%)" },
      ];
    }
    return studentData.dtm.subjects.map((s, i) => ({
      subject: s.subject_name,
      score: s.earned_ball,
      max: s.max_ball,
      pct: s.percent,
      fill: `hsl(${i * 60 + 200} 70% 50%)`
    }));
  }, [studentData]);

  return (
    <AdminLayout variant="school"> {/* Using school variant layout for now */}
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Profile Card */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-1">
          <div className="relative z-10 grid gap-6 md:grid-cols-2 p-8 bg-card/40 backdrop-blur-3xl rounded-[22px]">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 shrink-0">
                <User size={40} className="text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
                <div className="flex flex-wrap gap-2 items-center text-muted-foreground">
                  <Badge variant="secondary" className="rounded-full bg-primary/10 border-none px-3">Student</Badge>
                  <span className="flex items-center gap-1.5 ml-2"><GraduationCap size={16} /> {schoolName}</span>
                  <span className="flex items-center gap-1.5 ml-2"><BookOpen size={16} /> {groupName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-center border border-primary/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">So'nggi natija</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{score}</span>
                  <span className="text-sm text-muted-foreground">/ 189</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col justify-center border border-primary/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Ehtimollik</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{prediction.percent}%</span>
                  <Badge variant="outline" className="ml-2 bg-primary/5 text-[10px] h-5">{prediction.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Chart */}
          <Card className="lg:col-span-2 rounded-[32px] border-none shadow-xl shadow-primary/5">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">O'sish dinamikasi</CardTitle>
                  <CardDescription>Oylik natijalar o'zgarishi</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">+12% o'sish</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={ChartTooltipStyle}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* DTM Prediction Detail */}
          <Card className="rounded-[32px] border-none shadow-xl shadow-primary/5 bg-gradient-to-b from-card to-primary/5">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Target className="text-primary h-6 w-6" />
                DTM Bashorati
              </CardTitle>
              <CardDescription>Joriy ball asosida ehtimollik</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                 <svg className="h-full w-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="70"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted/20"
                    />
                    <motion.circle
                      initial={{ strokeDasharray: "0, 1000" }}
                      animate={{ strokeDasharray: `${(prediction.percent / 100) * 440}, 1000` }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      cx="50%"
                      cy="50%"
                      r="70"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      className="text-primary"
                    />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black">{prediction.percent}%</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Ehtimollik</span>
                 </div>
              </div>

              <div className="bg-background/50 rounded-2xl p-4 space-y-3 border border-primary/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Holat:</span>
                  <span className="font-bold text-primary">{prediction.status}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  * Bashorat sizning so'nggi repetitsion test natijangiz asosida hisoblanadi. O'rganishda davom eting!
                </p>
              </div>
              
              <Button className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20" variant="default">
                Tavsiyalarni ko'rish
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Detailed Subject Stats */}
          <Card className="lg:col-span-2 rounded-[32px] border-none shadow-xl shadow-primary/5">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Fanlar bo'yicha tahlil</CardTitle>
                  <CardDescription>O'zlashtirish ko'rsatkichlari</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <div className="grid gap-5">
                 {subjectBreakdown.map((s, idx) => (
                   <div key={idx} className="space-y-2">
                     <div className="flex justify-between items-end">
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                         <span className="text-sm font-semibold">{s.subject}</span>
                       </div>
                       <div className="flex items-baseline gap-1 text-xs">
                          <span className="font-bold text-sm">{s.score}</span>
                          <span className="text-muted-foreground">/ {s.max} ball</span>
                       </div>
                     </div>
                     <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 1.5, delay: idx * 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: s.fill }}
                        />
                     </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          {/* Test History Listing (Mock) */}
          <Card className="rounded-[32px] border-none shadow-xl shadow-primary/5 overflow-hidden">
            <CardHeader className="p-8 bg-primary/5">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className="text-primary h-6 w-6" />
                Testlar tarixi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border/40">
                 {[
                   { date: "15.03.2024", score: score, title: "Repetitsion #5", type: "Full" },
                   { date: "01.03.2024", score: 68, title: "Repetitsion #4", type: "Full" },
                   { date: "15.02.2024", score: 72, title: "Repetitsion #3", type: "Full" },
                   { date: "01.02.2024", score: 65, title: "Repetitsion #2", type: "Full" },
                 ].map((t, idx) => (
                   <div key={idx} className="p-5 hover:bg-muted/30 transition-colors flex items-center justify-between group cursor-pointer">
                      <div className="space-y-1">
                        <p className="font-bold group-hover:text-primary transition-colors">{t.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                           <Clock size={12} /> {t.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="font-bold text-primary">{t.score}</p>
                           <p className="text-[10px] text-muted-foreground uppercase font-bold">ball</p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                           <Download size={14} className="text-muted-foreground group-hover:text-primary" />
                        </Button>
                      </div>
                   </div>
                 ))}
               </div>
               <div className="p-4">
                  <Button variant="ghost" className="w-full text-xs text-muted-foreground font-semibold">Barchasini ko'rish</Button>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}
