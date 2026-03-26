import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { calculateDTMPrediction } from "@/lib/stats-utils";

interface PredictiveInsightsProps {
  score: number;
  userName?: string;
  subjectMastery?: { subject: string; mastery_percent: number }[];
}

export function PredictiveInsights({ score, userName, subjectMastery }: PredictiveInsightsProps) {
  const { percent, status } = calculateDTMPrediction(score);
  
  // Find weakest subject
  const weakest = subjectMastery?.sort((a, b) => a.mastery_percent - b.mastery_percent)[0];

  const getStatusColor = (s: string) => {
    switch (s) {
      case "Juda yuqori": return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
      case "Yuqori": return "text-blue-600 bg-blue-500/10 border-blue-500/20";
      case "O'rtacha": return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      default: return "text-red-600 bg-red-500/10 border-red-500/20";
    }
  };

  return (
    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-lg overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-16 w-16 text-primary" />
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          DTM Bashorati {userName ? `(${userName})` : ""}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className="relative flex items-center justify-center">
            <svg className="h-32 w-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted/20"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 * (1 - percent / 100)}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black block">{percent}%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ehtimollik</span>
            </div>
          </div>
          
          <Badge className={`rounded-full px-4 py-1 border shadow-sm ${getStatusColor(status)}`}>
            {status} natija kutilmoqda
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="bg-background/80 p-4 rounded-xl border border-border/40 space-y-3 shadow-inner">
            <h4 className="text-xs font-bold flex items-center gap-2 text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> Tavsiyalar
            </h4>
            
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />
                <span>O'rtacha ballingiz 189 balldan <strong>{score.toFixed(1)}</strong> ballni tashkil qiladi.</span>
              </li>
              
              {weakest && (
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                  <span><strong>{weakest.subject}</strong> fanidan o'zlashtirish past ({weakest.mastery_percent.toFixed(1)}%). Ko'proq test yechish tavsiya etiladi.</span>
                </li>
              )}
              
              {percent < 50 && (
                <li className="flex items-start gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5" />
                  <span>Maqsadli OTMga kirish uchun ballingizni yana kamida 40-50 ballga oshirishingiz kerak.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
