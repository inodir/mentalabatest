import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  School,
  Users,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Settings,
  MapPin,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const superAdminNavItems: NavItem[] = [
  { title: "Bosh sahifa", href: "/super-admin", icon: LayoutDashboard },
  { title: "Foydalanuvchilar", href: "/super-admin/users", icon: Users },
  { title: "Maktablar", href: "/super-admin/schools", icon: School },
  { title: "Tuman adminlari", href: "/super-admin/district-admins", icon: MapPin },
  { title: "Sozlamalar", href: "/super-admin/settings", icon: Settings },
];

const schoolAdminNavItems: NavItem[] = [
  { title: "Bosh sahifa", href: "/school", icon: LayoutDashboard },
  { title: "O'quvchilar", href: "/school/students", icon: Users },
  { title: "Test natijalari", href: "/school/results", icon: FileText },
];

const districtAdminNavItems: NavItem[] = [
  { title: "Bosh sahifa", href: "/district", icon: LayoutDashboard },
  { title: "Maktablar", href: "/district/schools", icon: School },
];

interface AdminSidebarProps {
  variant: "super" | "school" | "district";
}

export function AdminSidebar({ variant }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = variant === "super"
    ? superAdminNavItems
    : variant === "district"
      ? districtAdminNavItems
      : schoolAdminNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 flex h-screen flex-col shrink-0 sidebar-glass border-r border-sidebar-border z-30"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-sidebar-primary/20 blur-md" />
                <GraduationCap className="relative h-8 w-8 text-sidebar-primary" />
              </div>
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
                Mentalaba
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                to={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className="relative z-10 h-5 w-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10 whitespace-nowrap overflow-hidden"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 rounded-xl text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Chiqish
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </motion.aside>
  );
}
