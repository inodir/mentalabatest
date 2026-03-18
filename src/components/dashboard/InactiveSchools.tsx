import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import type { DTMSchoolInfo } from "@/lib/dtm-auth";

interface InactiveSchoolsProps {
  schools?: DTMSchoolInfo[];
}

export function InactiveSchools({ schools }: InactiveSchoolsProps) {
  if (!schools || schools.length === 0) return null;

  const inactive = schools
    .filter((s) => (s.registered_count ?? 0) > 0 && (s.answered_count ?? 0) === 0)
    .sort((a, b) => (b.registered_count ?? 0) - (a.registered_count ?? 0));

  const lowActivity = schools
    .filter((s) => (s.answered_count ?? 0) > 0 && (s.tested_percent ?? 0) < 20 && (s.tested_percent ?? 0) > 0)
    .sort((a, b) => (a.tested_percent ?? 0) - (b.tested_percent ?? 0));

  if (inactive.length === 0 && lowActivity.length === 0) return null;

  return (
    <Card className="border-destructive/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Faol bo'lmagan maktablar
          {inactive.length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {inactive.length} ta 0%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {inactive.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wider">
              Hech kim topshirmagan ({inactive.length} ta)
            </p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {inactive.slice(0, 15).map((school) => (
                <div
                  key={school.code}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{school.name}</p>
                    <p className="text-[10px] text-muted-foreground">{school.district} · {school.code}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs ml-2">
                    {school.registered_count ?? 0} ta ro'yxatda
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowActivity.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-yellow-600 mb-2 uppercase tracking-wider">
              Past faollik — 20% dan kam
            </p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {lowActivity.slice(0, 10).map((school) => (
                <div
                  key={school.code}
                  className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{school.name}</p>
                    <p className="text-[10px] text-muted-foreground">{school.district} · {school.code}</p>
                  </div>
                  <Badge className="shrink-0 text-xs ml-2 bg-yellow-500/80 text-white border-0">
                    {(school.tested_percent ?? 0).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
