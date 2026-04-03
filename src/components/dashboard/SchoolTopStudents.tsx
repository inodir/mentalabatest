import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { exportCertificate } from "@/lib/exportCertificate";
import { DashboardSection } from "./StatsKPI";
import { getUserTotalPoint } from "@/lib/stats-utils";

interface SchoolTopStudentsProps {
  students: any[];
}

export function SchoolTopStudents({ students }: SchoolTopStudentsProps) {
  if (students.length === 0) return null;

  return (
    <DashboardSection title="Eng yuqori natija ko'rsatgan o'quvchilar">
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-2 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top 10 o'quvchi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {students.map((u, i) => {
              const ball = getUserTotalPoint(u) ?? 0;
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-border/40 p-3 bg-background/50 hover:bg-muted/30 transition-colors duration-200">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black
                    ${i === 0 ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30" : 
                      i === 1 ? "bg-slate-300/40 text-slate-600 border border-slate-300/50" : 
                      i === 2 ? "bg-orange-500/20 text-orange-600 border border-orange-500/30" : 
                      "bg-muted text-muted-foreground border border-border/50"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate uppercase tracking-tight">{u.full_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{u.phone || "—"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-xl text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-600 border border-transparent hover:border-yellow-500/20"
                      onClick={() => exportCertificate(u.full_name)}
                      title="Sertifikat yuklash"
                    >
                      <Trophy className="h-4 w-4" />
                    </Button>
                    <div className="text-right min-w-[50px]">
                      <p className={`text-xl font-black font-mono leading-none ${ball >= 70 ? "text-emerald-600" : "text-red-500"}`}>{ball}</p>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter mt-1 opacity-70">/ 189 ball</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardSection>
  );
}
