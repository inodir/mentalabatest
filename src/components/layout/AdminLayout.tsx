import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  variant: "super" | "school" | "district";
}

export function AdminLayout({ children, variant }: AdminLayoutProps) {
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
        <div className="container mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
