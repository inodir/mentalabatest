import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Users, CheckCircle, TrendingUp, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CompareSchools() {
  const { dtmUser } = useAuth();
  const schools = dtmUser?.schools ?? [];

  const [schoolA, setSchoolA] = useState<string>("none");
  const [schoolB, setSchoolB] = useState<string>("none");

  const dataA = schools.find(s => s.code === schoolA);
  const dataB = schools.find(s => s.code === schoolB);

  return (
    <AdminLayout variant="super">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-7 w-7 text-primary" /> Maktablarni solishtirish
          </h1>
          <p className="text-muted-foreground mt-1">Ikki maktab statistikasini yonma-yon tahlil qilish</p>
        </div>

        {/* Selection Row */}
        <div className="grid gap-4 sm:grid-cols-2 bg-card p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">1-Maktab</Label>
            <Select value={schoolA} onValueChange={setSchoolA}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Maktabni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {schools.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">2-Maktab</Label>
            <Select value={schoolB} onValueChange={setSchoolB}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Maktabni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanlanmagan</SelectItem>
                {schools.map(s => <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Dashboard */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* School A */}
          <SchoolCompareCard title="1-Maktab" school={dataA} />
          {/* School B */}
          <SchoolCompareCard title="2-Maktab" school={dataB} />
        </div>
      </div>
    </AdminLayout>
  );
}

function SchoolCompareCard({ title, school }: { title: string, school: any }) {
  if (!school) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="rounded-full bg-muted p-3 mb-3">
            <School className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">{title} tanlanmagan</p>
        </CardContent>
      </Card>
    );
  }

  const registered = school.registered_count ?? 0;
  const answered = school.answered_count ?? 0;
  const pct = Math.round(school.tested_percent ?? 0);
  const avg = Math.round((school.avg_total_ball ?? 0) * 10) / 10;

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-b from-transparent to-primary/5">
      <CardHeader className="border-b border-border/40 pb-4">
        <Badge variant="secondary" className="w-fit mb-1">{title}</Badge>
        <CardTitle className="text-xl font-bold">{school.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{school.district}, {school.region} | Kod: {school.code}</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background/80 rounded-xl p-3 border border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" /> Jami
            </div>
            <p className="text-lg font-bold">{registered.toLocaleString()}</p>
          </div>

          <div className="bg-background/80 rounded-xl p-3 border border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Topshirdi
            </div>
            <p className="text-lg font-bold">{answered.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Topshirish ko'rsatkichi</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">O'rtacha ball (Max 189)</span>
              <span className="font-bold">{avg} ball</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(avg / 189) * 100}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
