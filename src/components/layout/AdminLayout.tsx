import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, AlertTriangle, RefreshCw } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: ReactNode;
  variant: "super" | "school" | "district";
}

export function AdminLayout({ children, variant }: AdminLayoutProps) {
  const { sessionWarning, setSessionWarning, dtmUser } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [ipInfo, setIpInfo] = useState({ ip: "127.0.0.1", location: "Lokal" });

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => {
        if (d.ip) {
          setIpInfo({ ip: d.ip, location: `${d.city || "Lokal"}, ${d.country_name || ""}` });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dtmUser && variant) {
      const localLogs = JSON.parse(localStorage.getItem("admin_audit_logs") || "[]");
      const currentMin = new Date().toLocaleTimeString().slice(0, 5);
      const isDuplicate = localLogs.some((l: any) => l.user === dtmUser.full_name && l.time === currentMin);
      
      if (!isDuplicate) {
        const newLog = {
          id: Math.floor(Math.random() * 100000),
          user: dtmUser.full_name || "Siz",
          role: variant === "super" ? "Super Admin" : variant === "district" ? "Tuman Admin" : "Maktab Admin",
          ip: ipInfo.ip,
          location: ipInfo.location,
          time: currentMin,
          duration: "Hozirgina",
          status: "Active"
        };
        localStorage.setItem("admin_audit_logs", JSON.stringify([newLog, ...localLogs.slice(0, 49)]));
      }
    }
  }, [dtmUser, variant, ipInfo]);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div className="flex min-h-screen mesh-gradient-bg relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 animate-float-slow" />
        <div className="absolute top-1/2 -left-48 h-80 w-80 rounded-full bg-accent/5 animate-float-medium" />
        <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-chart-5/5 animate-float-fast" />
      </div>
      
      <AdminSidebar variant={variant} />
      <main className="flex-1 overflow-auto relative z-10">
        <div className="absolute top-4 right-6 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/50 backdrop-blur-md border border-border/40 hover:bg-background/80 shadow-sm"
            onClick={() => setDark(!dark)}
            title={dark ? "Yorug' rejim" : "Qorong'u rejim"}
          >
            {dark ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </Button>
        </div>
        <AnimatePresence>
          {sessionWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-card p-6 rounded-2xl border border-border/80 shadow-xl max-w-sm w-full mx-4 text-center space-y-4"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/15">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Faollik to'xtadi</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sessiya muddati tugashiga 2 daqiqa qoldi. Davom etishni xohlaysizmi?
                  </p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setSessionWarning(false)} className="rounded-xl w-full">
                    <RefreshCw className="mr-2 h-4 w-4" /> Davom etish
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="container mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
