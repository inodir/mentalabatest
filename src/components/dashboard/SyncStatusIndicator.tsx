import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SyncStatusIndicatorProps {
  progress: { loaded: number; total: number } | null;
  loading: boolean;
  lastSynced?: Date;
  error?: string | null;
}

export function SyncStatusIndicator({ progress, loading, lastSynced, error }: SyncStatusIndicatorProps) {
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (loading || progress) {
      setShowProgress(true);
    } else {
      const timer = setTimeout(() => setShowProgress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, progress]);

  const percentage = progress ? Math.round((progress.loaded / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex items-center justify-between gap-3">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
            >
              <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                <AlertCircle className="h-3 w-3" />
                Xatolik yuz berdi
              </Badge>
            </motion.div>
          ) : loading || progress ? (
            <motion.div
              key="syncing"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
            >
              <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold bg-primary/5 border-primary/20 text-primary animate-pulse">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Sinxronlanmoqda...
              </Badge>
            </motion.div>
          ) : (
            <motion.div
              key="synced"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
            >
              <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Ma'lumotlar dolzarb
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <Clock className="h-3 w-3 opacity-70" />
          <span>
            {lastSynced ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Hozirgina"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {showProgress && progress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Progress</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-1 bg-muted/50" />
            <p className="text-[9px] text-muted-foreground text-center">
              {progress.loaded.toLocaleString()} / {progress.total.toLocaleString()} foydalanuvchi yuklandi
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
