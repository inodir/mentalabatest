import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface SchoolTargetBannerProps {
  targetPct: number;
  submitPct: string;
  onTargetChange: (val: number) => void;
}

export function SchoolTargetBanner({ targetPct, submitPct, onTargetChange }: SchoolTargetBannerProps) {
  const currentPct = parseFloat(submitPct);
  const progress = Math.min(100, (currentPct / targetPct) * 100);

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden mb-6">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600 animate-pulse" />
              <h3 className="font-bold text-lg">Ko'rsatkich Maqsadi (Target)</h3>
            </div>
            <p className="text-sm text-muted-foreground">Maqsad: {targetPct}%. Joriysi: {submitPct}%</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">O'zgartirish:</span>
              <input 
                type="range" min="10" max="100" step="5" 
                value={targetPct} onChange={(e) => onTargetChange(parseInt(e.target.value))} 
                className="w-24 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
              />
            </div>
          </div>
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Progress</span>
              <span className={currentPct >= targetPct ? "text-green-600 font-bold" : "text-muted-foreground"}>
                {currentPct >= targetPct ? "Maqsad bajarildi! 🎉" : `${Math.round(progress)}%`}
              </span>
            </div>
            <div className="h-4 bg-muted/40 rounded-full border border-border/20 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-green-500/80 to-green-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
              />
              <div 
                className="absolute top-0 bottom-0 border-r border-red-500/80" 
                style={{ left: `${targetPct}%` }} 
                title={`Target: ${targetPct}%`} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
