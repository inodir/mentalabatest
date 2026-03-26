import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { DashboardSection } from "./StatsKPI";

interface SchoolRiskSectionProps {
  riskList: any[];
  passLine: number;
}

export function SchoolRiskSection({ riskList, passLine }: SchoolRiskSectionProps) {
  return (
    <DashboardSection title="Natija chiqmagan yoki past ball olganlar">
      <Card className="rounded-2xl border-orange-200 dark:border-orange-900/40 shadow-sm overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-orange-100 dark:border-orange-900/20 bg-orange-50/30 dark:bg-orange-900/10">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-4 w-4" />
            Diqqat talab o'quvchilar
            <Badge variant="destructive" className="ml-auto bg-orange-600 hover:bg-orange-700 text-[10px] h-5 rounded-full px-2">{riskList.length} ta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex-1">
          <div className="space-y-2.5">
            {riskList.length > 0 ? riskList.map((u, i) => {
              const ball = (u.dtm?.total_ball as number) ?? 0;
              const tested = u.dtm?.tested ?? false;
              return (
                <div key={u.id || i} className="flex items-center gap-3 rounded-xl border border-orange-200/40 dark:border-orange-900/20 p-3 bg-background/50 hover:bg-orange-50/20 transition-colors">
                  <FileText className="h-4 w-4 text-orange-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate uppercase tracking-tight">{u.full_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{u.phone || "—"}</p>
                  </div>
                  <div className="text-right">
                    {tested ? (
                      <Badge variant="destructive" className="text-[10px] font-black h-5 bg-red-500/10 text-red-600 border-red-500/20 uppercase">{ball} ball</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-bold h-5 bg-muted/60 text-muted-foreground border-border/50 uppercase">Noma'lum</Badge>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Xavf guruhi aniqlanmadi.<br/>Barcha natijalar ijobiy!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardSection>
  );
}
