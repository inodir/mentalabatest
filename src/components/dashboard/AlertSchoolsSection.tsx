import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { DashboardSection } from "./StatsKPI";

interface AlertSchoolsSectionProps {
  schools: any[];
  passLine: number;
}

export function AlertSchoolsSection({ schools, passLine }: AlertSchoolsSectionProps) {
  if (schools.length === 0) return null;

  return (
    <DashboardSection title="Diqqat talab maktablar">
      <Card className="rounded-2xl border-orange-200 dark:border-orange-900/40 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-orange-50/50 dark:bg-orange-950/10 border-b border-orange-100 dark:border-orange-900/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Topshirish foizi past (&lt;40%) yoki o'rtacha ball {passLine} dan past
            <Badge variant="destructive" className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black">{schools.length} ta maktab</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/50 text-muted-foreground uppercase tracking-wider font-bold">
                  <th className="text-left py-3 px-4">Maktab</th>
                  <th className="text-left py-3 px-4">Tuman</th>
                  <th className="text-right py-3 px-4">Ro'yxatda</th>
                  <th className="text-right py-3 px-4">Topshirdi</th>
                  <th className="text-right py-3 px-4">Foiz</th>
                  <th className="text-right py-3 px-4">O'rt. ball</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {schools.map((s, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground max-w-[200px] truncate">{s.name}</td>
                    <td className="py-3 px-4 text-muted-foreground font-medium">{s.district}</td>
                    <td className="py-3 px-4 text-right font-mono">{s.registered.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono">{s.answered.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full font-black ${s.pct >= 50 ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-500"}`}>
                        {s.pct.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-black ${s.avg >= 70 ? "text-emerald-600" : s.avg > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {s.avg > 0 ? s.avg.toFixed(1) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardSection>
  );
}
