 import { useState } from "react";
 import { Link, useLocation } from "react-router-dom";
 import { cn } from "@/lib/utils";
 import { Button } from "@/components/ui/button";
 import { useAuth } from "@/hooks/useAuth";
 import {
   LayoutDashboard,
   School,
   Users,
   FileText,
   LogOut,
   ChevronLeft,
   ChevronRight,
   GraduationCap,
 } from "lucide-react";
 
 interface NavItem {
   title: string;
   href: string;
   icon: React.ElementType;
 }
 
 const superAdminNavItems: NavItem[] = [
   { title: "Bosh sahifa", href: "/super-admin", icon: LayoutDashboard },
   { title: "Maktablar", href: "/super-admin/schools", icon: School },
 ];
 
 const schoolAdminNavItems: NavItem[] = [
   { title: "Bosh sahifa", href: "/school", icon: LayoutDashboard },
   { title: "O'quvchilar", href: "/school/students", icon: Users },
   { title: "Test natijalari", href: "/school/results", icon: FileText },
 ];
 
 interface AdminSidebarProps {
   variant: "super" | "school";
 }
 
 export function AdminSidebar({ variant }: AdminSidebarProps) {
   const [collapsed, setCollapsed] = useState(false);
   const location = useLocation();
   const { signOut } = useAuth();
 
   const navItems = variant === "super" ? superAdminNavItems : schoolAdminNavItems;
 
   const handleSignOut = async () => {
     await signOut();
   };
 
   return (
     <aside
       className={cn(
         "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
         collapsed ? "w-16" : "w-64"
       )}
     >
       {/* Header */}
       <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
         {!collapsed && (
           <div className="flex items-center gap-2">
             <GraduationCap className="h-8 w-8 text-sidebar-primary" />
             <span className="text-lg font-bold text-sidebar-foreground">
               Mentalaba
             </span>
           </div>
         )}
         <Button
           variant="ghost"
           size="icon"
           onClick={() => setCollapsed(!collapsed)}
           className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
         >
           {collapsed ? (
             <ChevronRight className="h-4 w-4" />
           ) : (
             <ChevronLeft className="h-4 w-4" />
           )}
         </Button>
       </div>
 
       {/* Navigation */}
       <nav className="flex-1 space-y-1 p-2">
         {navItems.map((item) => {
           const isActive = location.pathname === item.href;
           return (
             <Link
               key={item.href}
               to={item.href}
               className={cn(
                 "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                 isActive
                   ? "bg-sidebar-primary text-sidebar-primary-foreground"
                   : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
               )}
             >
               <item.icon className="h-5 w-5 flex-shrink-0" />
               {!collapsed && <span>{item.title}</span>}
             </Link>
           );
         })}
       </nav>
 
       {/* Footer */}
       <div className="border-t border-sidebar-border p-2">
         <Button
           variant="ghost"
           onClick={handleSignOut}
           className={cn(
             "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
             collapsed && "justify-center"
           )}
         >
           <LogOut className="h-5 w-5" />
           {!collapsed && <span>Chiqish</span>}
         </Button>
       </div>
     </aside>
   );
 }