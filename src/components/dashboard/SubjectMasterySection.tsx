import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSection } from "./StatsKPI";

interface SubjectMasterySectionProps {
  data: any[];
}

export function SubjectMasterySection({ data }: SubjectMasterySectionProps) {
  const navigate = useNavigate();

  return (
    <DashboardSection title="Fanlar o'zlashtirilishi (%)">
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Fanlar bo'yicha ko'rsatkichlar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-5">
            {data.slice(0, 6).map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold truncate max-w-[180px] uppercase tracking-wider text-muted-foreground">
                    {s.subject}
                  </span>
                  <span className="text-sm font-black text-primary">
                    {s.mastery_percent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      s.mastery_percent > 70 ? 'bg-emerald-500' : 
                      s.mastery_percent > 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${s.mastery_percent}%` }}
                  />
                </div>
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-[10px] font-black uppercase tracking-widest h-9 border border-border/40 hover:bg-secondary rounded-xl mt-2" 
              onClick={() => navigate("/super-admin/subjects")}
            >
              Barcha fanlarni ko'rish
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardSection>
  );
}
