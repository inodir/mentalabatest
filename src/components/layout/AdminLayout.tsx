 import { ReactNode } from "react";
 import { AdminSidebar } from "./AdminSidebar";
 
 interface AdminLayoutProps {
   children: ReactNode;
   variant: "super" | "school";
 }
 
 export function AdminLayout({ children, variant }: AdminLayoutProps) {
   return (
     <div className="flex min-h-screen bg-background">
       <AdminSidebar variant={variant} />
       <main className="flex-1 overflow-auto">
         <div className="container mx-auto p-6">{children}</div>
       </main>
     </div>
   );
 }