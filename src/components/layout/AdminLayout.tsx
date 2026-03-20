import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  variant: "super" | "school" | "district";
}

export function AdminLayout({ children, variant }: AdminLayoutProps) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

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
        <div className="container mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
