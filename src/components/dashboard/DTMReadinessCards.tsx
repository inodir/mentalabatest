import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Target, Users, TrendingDown } from "lucide-react";

interface RiskStats {
  pass_line: number;
  tested_count: number;
  risk_count: number;
  risk_percent: number;
}

interface DTMReadiness {
  pass_line: number;
  tested_count: number;
  avg_total_ball: number;
  passed_count: number;
  readiness_index: number;
}

interface GenderResultStats {
  [key: string]: {
    count: number;
    avg_total_ball: number;
    passed_count: number;
    passed_percent: number;
  };
}

interface DTMReadinessCardsProps {
  riskStats?: RiskStats;
  dtmReadiness?: DTMReadiness;
  genderResultStats?: GenderResultStats;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Erkak",
  female: "Ayol",
};

export function DTMReadinessCards({ riskStats, dtmReadiness, genderResultStats }: DTMReadinessCardsProps) {
  const hasAny = riskStats || dtmReadiness || genderResultStats;
  if (!hasAny) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* DTM Readiness */}
      {dtmReadiness && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              DTM Tayyorgarlik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {dtmReadiness.readiness_index.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tayyorgarlik indeksi</p>
            </div>
            <Progress value={dtmReadiness.readiness_index} className="h-2" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-semibold">{dtmReadiness.avg_total_ball.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">O'rtacha ball</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-semibold">{dtmReadiness.passed_count}/{dtmReadiness.tested_count}</p>
                <p className="text-xs text-muted-foreground">O'tganlar</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <span>O'tish balli</span>
              <Badge variant="outline" className="text-xs">{dtmReadiness.pass_line} ball</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Stats */}
      {riskStats && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Xavf tahlili
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-destructive">
                {riskStats.risk_percent.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Xavf darajasi</p>
            </div>
            <Progress
              value={riskStats.risk_percent}
              className="h-2 [&>div]:bg-destructive"
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-destructive/10 p-2.5 text-center">
                <p className="text-lg font-semibold text-destructive">{riskStats.risk_count}</p>
                <p className="text-xs text-muted-foreground">Xavfli</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-semibold">{riskStats.tested_count}</p>
                <p className="text-xs text-muted-foreground">Test topshirgan</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <span>O'tish balli</span>
              <Badge variant="outline" className="text-xs">{riskStats.pass_line} ball</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gender Result Stats */}
      {genderResultStats && Object.keys(genderResultStats).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Jins bo'yicha natijalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(genderResultStats).map(([gender, data]) => (
              <div key={gender} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{GENDER_LABELS[gender] || gender}</span>
                  <Badge variant="secondary" className="text-xs">{data.count} ta</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-base font-semibold">{data.avg_total_ball.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">O'rt. ball</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-base font-semibold">{data.passed_percent.toFixed(2)}%</p>
                    <p className="text-[10px] text-muted-foreground">O'tganlar</p>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(genderResultStats).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ma'lumot mavjud emas
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
