import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Users, FileText } from "lucide-react";
import { DashboardSection } from "./StatsKPI";

interface GenderLanguageSectionProps {
  genderData: any[];
  langData: any[];
}

const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,.08)",
};

export function GenderLanguageSection({ genderData, langData }: GenderLanguageSectionProps) {
  return (
    <DashboardSection title="Demografik va Til tahlili">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Gender Analysis */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Jins bo'yicha tahlil
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            {genderData.length === 0 ? (
              <div className="h-[220px] w-full flex items-center justify-center text-sm text-muted-foreground">
                Jins bo'yicha ma'lumot topilmadi
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={ChartTooltipStyle} />
                    <Pie
                      data={genderData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                      ))}
                    </Pie>
                    <Legend 
                      iconType="circle" 
                      iconSize={8} 
                      wrapperStyle={{ fontSize: "11px", fontWeight: 600, paddingTop: "10px" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language Analysis */}
        <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Test tili bo'yicha tahlil
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            {langData.length === 0 ? (
              <div className="h-[220px] w-full flex items-center justify-center text-sm text-muted-foreground">
                Test tili bo'yicha ma'lumot topilmadi
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={ChartTooltipStyle} />
                    <Pie
                      data={langData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {langData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                      ))}
                    </Pie>
                    <Legend 
                      iconType="circle" 
                      iconSize={8} 
                      wrapperStyle={{ fontSize: "11px", fontWeight: 600, paddingTop: "10px" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardSection>
  );
}
