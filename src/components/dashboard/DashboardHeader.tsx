import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Settings, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  progress?: { loaded: number; total: number } | null;
  mode: "accurate" | "fast";
  onModeChange: (checked: boolean) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  onRetry: () => void;
  loading: boolean;
  isApproximate?: boolean;
  actions?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  progress,
  mode,
  onModeChange,
  autoRefresh,
  onAutoRefreshChange,
  onRetry,
  loading,
  isApproximate,
  actions,
}: DashboardHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1.5 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {progress && (
          <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground bg-secondary/50 backdrop-blur-md rounded-full px-4 py-2 border border-border/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>{progress.loaded}/{progress.total} yuklandi</span>
          </div>
        )}

        {isApproximate && !loading && (
          <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
            Taxminiy
          </Badge>
        )}

        <div className="flex items-center gap-3 bg-background/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-border/40 shadow-sm">
          <Label htmlFor="mode-toggle" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Aniq ma'lumot</Label>
          <Switch
            id="mode-toggle"
            checked={mode === "accurate"}
            onCheckedChange={onModeChange}
            disabled={loading}
            className="scale-90"
          />
        </div>

        <div className="flex items-center gap-3 bg-background/40 backdrop-blur-sm rounded-full px-4 py-1.5 border border-border/40 shadow-sm">
          <Label htmlFor="refresh-toggle" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Avto-yangilash</Label>
          <Switch
            id="refresh-toggle"
            checked={autoRefresh}
            onCheckedChange={onAutoRefreshChange}
            className="scale-90"
          />
        </div>

        {actions}

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRetry} 
            disabled={loading} 
            className="rounded-full h-9 w-9 border-border/60 hover:bg-secondary transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/super-admin/security")} 
            className="rounded-full h-9 px-4 border-border/60 text-xs font-bold"
          >
            <Shield className="mr-2 h-3.5 w-3.5 text-primary" /> Xavfsizlik
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate("/super-admin/settings")} 
            className="rounded-full h-9 px-4 font-bold text-xs shadow-md shadow-primary/20"
          >
            <Settings className="mr-2 h-3.5 w-3.5" /> Sozlamalar
          </Button>
        </div>
      </div>
    </div>
  );
}
