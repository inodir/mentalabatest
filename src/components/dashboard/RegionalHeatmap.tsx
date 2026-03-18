import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map } from "lucide-react";
import type { DTMDistrictInfo } from "@/lib/dtm-auth";

interface RegionalHeatmapProps {
  districts?: DTMDistrictInfo[];
}

function pctColor(pct: number): { bg: string; text: string } {
  if (pct >= 80) return { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400" };
  if (pct >= 60) return { bg: "bg-blue-500/15",  text: "text-blue-600 dark:text-blue-400" };
  if (pct >= 40) return { bg: "bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400" };
  return { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400" };
}

export function RegionalHeatmap({ districts }: RegionalHeatmapProps) {
  if (!districts || districts.length === 0) return null;

  // Group by region using a plain record to avoid TSX generic syntax issues
  const regionMap: Record<string, {
    dists: DTMDistrictInfo[];
    totalRegistered: number;
    totalAnswered: number;
    totalSchools: number;
  }> = {};

  for (const d of districts) {
    if (!regionMap[d.region]) {
      regionMap[d.region] = { dists: [], totalRegistered: 0, totalAnswered: 0, totalSchools: 0 };
    }
    regionMap[d.region].dists.push(d);
    regionMap[d.region].totalRegistered += d.registered_count;
    regionMap[d.region].totalAnswered += d.answered_count;
    regionMap[d.region].totalSchools += d.school_count;
  }

  const regions = Object.entries(regionMap)
    .map(([name, v]) => ({
      name,
      registered: v.totalRegistered,
      answered: v.totalAnswered,
      schools: v.totalSchools,
      districts: v.dists.length,
      pct: v.totalRegistered > 0
        ? Math.round((v.totalAnswered / v.totalRegistered) * 100)
        : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="h-4 w-4 text-primary" />
          Viloyatlar bo'yicha qamrov jadvali
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Viloyat</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Tumanlar</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Maktablar</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Ro'yxatda</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Topshirgan</th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground">Foiz</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r) => {
                const { bg, text } = pctColor(r.pct);
                return (
                  <tr key={r.name} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{r.name}</td>
                    <td className="text-center py-2.5 px-2 text-muted-foreground">{r.districts}</td>
                    <td className="text-center py-2.5 px-2 text-muted-foreground">{r.schools}</td>
                    <td className="text-center py-2.5 px-2">{r.registered.toLocaleString()}</td>
                    <td className="text-center py-2.5 px-2">{r.answered.toLocaleString()}</td>
                    <td className="text-center py-2.5 px-2">
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${bg} ${text}`}>
                        {r.pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td className="py-2.5 pr-4">Jami</td>
                <td className="text-center py-2.5 px-2 text-muted-foreground">{regions.reduce((s, r) => s + r.districts, 0)}</td>
                <td className="text-center py-2.5 px-2 text-muted-foreground">{regions.reduce((s, r) => s + r.schools, 0)}</td>
                <td className="text-center py-2.5 px-2">{regions.reduce((s, r) => s + r.registered, 0).toLocaleString()}</td>
                <td className="text-center py-2.5 px-2">{regions.reduce((s, r) => s + r.answered, 0).toLocaleString()}</td>
                <td className="text-center py-2.5 px-2">
                  {(() => {
                    const reg = regions.reduce((s, r) => s + r.registered, 0);
                    const ans = regions.reduce((s, r) => s + r.answered, 0);
                    const pct = reg > 0 ? Math.round((ans / reg) * 100) : 0;
                    const { bg, text } = pctColor(pct);
                    return (
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${bg} ${text}`}>
                        {pct}%
                      </span>
                    );
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
