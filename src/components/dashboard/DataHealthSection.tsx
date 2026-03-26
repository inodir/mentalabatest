import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Copy, Check, Database } from "lucide-react";
import { normalizeGender, normalizeLanguage, normalizeRegion } from "@/lib/stats-utils";
import { toast } from "sonner";
import { DashboardSection } from "./StatsKPI";

interface DataHealthSectionProps {
  users: any[];
}

export function DataHealthSection({ users }: DataHealthSectionProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const issues = useMemo(() => {
    if (users.length === 0) return { gender: [], language: [], region: [] };

    const genderIssues = new Map<string, number>();
    const languageIssues = new Map<string, number>();
    const regionIssues = new Map<string, number>();

    users.forEach(u => {
      // Gender check
      const rawGender = u.gender || "null";
      const normGender = normalizeGender(u.gender);
      // We consider it an 'issue' if it's not exactly 'male' or 'female' in the DB
      if (rawGender !== "male" && rawGender !== "female") {
        genderIssues.set(rawGender, (genderIssues.get(rawGender) || 0) + 1);
      }

      // Language check
      const rawLang = u.language || "null";
      const normLang = normalizeLanguage(u.language);
      if (rawLang !== "uz" && rawLang !== "ru") {
        languageIssues.set(rawLang, (languageIssues.get(rawLang) || 0) + 1);
      }

      // Region check
      const rawRegion = u.region || "null";
      const normRegion = normalizeRegion(u.region);
      if (rawRegion !== normRegion && rawRegion !== "null") {
        regionIssues.set(rawRegion, (regionIssues.get(rawRegion) || 0) + 1);
      }
    });

    return {
      gender: Array.from(genderIssues.entries()).map(([val, count]) => ({ val, count, norm: normalizeGender(val) })),
      language: Array.from(languageIssues.entries()).map(([val, count]) => ({ val, count, norm: normalizeLanguage(val) })),
      region: Array.from(regionIssues.entries()).map(([val, count]) => ({ val, count, norm: normalizeRegion(val) })),
    };
  }, [users]);

  const totalIssues = issues.gender.length + issues.language.length + issues.region.length;

  const generateSQL = (type: 'gender' | 'language' | 'region') => {
    let sql = `-- Data Normalization: ${type.toUpperCase()}\n`;
    const data = issues[type];
    
    data.forEach(item => {
      if (item.val === "null") {
        sql += `UPDATE users SET ${type} = '${item.norm}' WHERE ${type} IS NULL;\n`;
      } else {
        sql += `UPDATE users SET ${type} = '${item.norm}' WHERE ${type} = '${item.val}';\n`;
      }
    });

    navigator.clipboard.writeText(sql);
    setCopied(type);
    toast.success("SQL skripti nusxalandi");
    setTimeout(() => setCopied(null), 2000);
  };

  if (users.length === 0 || totalIssues === 0) return null;

  return (
    <DashboardSection title="Ma'lumotlar salomatligi (Data Health)">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gender Issues */}
        <Card className="rounded-2xl border-red-200 dark:border-red-900/30">
          <CardHeader className="pb-2 border-b border-red-100 dark:border-red-900/20 bg-red-50/30 dark:bg-red-950/5">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Jins (Gender) nomuvofiqligi
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[10px]"
                onClick={() => generateSQL('gender')}
              >
                {copied === 'gender' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                SQL
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-[200px] overflow-auto pr-2">
              {issues.gender.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-border/30 pb-1.5 last:border-0">
                  <span className="font-mono text-muted-foreground bg-muted/50 px-1 rounded">"{item.val}"</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count} ta</span>
                    <Badge variant="outline" className="text-[10px] font-bold">👉 {item.norm}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language Issues */}
        <Card className="rounded-2xl border-orange-200 dark:border-orange-900/30">
          <CardHeader className="pb-2 border-b border-orange-100 dark:border-orange-900/20 bg-orange-50/30 dark:bg-orange-950/5">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-orange-500" />
                Til (Language) nomuvofiqligi
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[10px]"
                onClick={() => generateSQL('language')}
              >
                {copied === 'language' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                SQL
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-[200px] overflow-auto pr-2">
              {issues.language.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-border/30 pb-1.5 last:border-0">
                  <span className="font-mono text-muted-foreground bg-muted/50 px-1 rounded">"{item.val}"</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count} ta</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-orange-600">👉 {item.norm}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Region Issues */}
        <Card className="rounded-2xl border-blue-200 dark:border-blue-900/30">
          <CardHeader className="pb-2 border-b border-blue-100 dark:border-blue-900/20 bg-blue-50/30 dark:bg-blue-950/5">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Viloyat (Region) xatolari
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[10px]"
                onClick={() => generateSQL('region')}
              >
                {copied === 'region' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                SQL
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 max-h-[200px] overflow-auto pr-2">
              {issues.region.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-border/30 pb-1.5 last:border-0">
                  <span className="font-mono text-muted-foreground bg-muted/50 px-1 rounded truncate max-w-[100px]">"{item.val}"</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count} ta</span>
                    <Badge variant="outline" className="text-[10px] font-bold text-blue-600">👉 {item.norm}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
}
