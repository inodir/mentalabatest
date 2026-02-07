import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth pages
import SuperAdminLogin from "./pages/auth/SuperAdminLogin";
import SchoolAdminLogin from "./pages/auth/SchoolAdminLogin";
import ChangePassword from "./pages/auth/ChangePassword";

// Super Admin pages
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SchoolsManagement from "./pages/super-admin/SchoolsManagement";
import SchoolDetails from "./pages/super-admin/SchoolDetails";
import Settings from "./pages/super-admin/Settings";
import DTMUsers from "./pages/super-admin/DTMUsers";

// School Admin pages
import SchoolDashboard from "./pages/school/SchoolDashboard";
import StudentsManagement from "./pages/school/StudentsManagement";
import TestResults from "./pages/school/TestResults";
import StudentHistory from "./pages/school/StudentHistory";

const queryClient = new QueryClient();

// Protected route wrapper for Super Admin
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/super-admin/login" replace />;
  }

  if (role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Protected route wrapper for School Admin
function SchoolAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, passwordChanged, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/school/login" replace />;
  }

  if (role !== "school_admin") {
    return <Navigate to="/" replace />;
  }

  // Force password change on first login
  if (!passwordChanged) {
    return <Navigate to="/school/change-password" replace />;
  }

  return <>{children}</>;
}

// Route wrapper for password change page (must be school_admin but password not yet changed)
function ChangePasswordRoute({ children }: { children: React.ReactNode }) {
  const { user, role, passwordChanged, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/school/login" replace />;
  }

  if (role !== "school_admin") {
    return <Navigate to="/" replace />;
  }

  // If password already changed, go to dashboard
  if (passwordChanged) {
    return <Navigate to="/school" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      <Route path="/school/login" element={<SchoolAdminLogin />} />
      <Route
        path="/school/change-password"
        element={
          <ChangePasswordRoute>
            <ChangePassword />
          </ChangePasswordRoute>
        }
      />

      {/* Super Admin routes */}
      <Route
        path="/super-admin"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/super-admin/schools"
        element={
          <SuperAdminRoute>
            <SchoolsManagement />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/super-admin/schools/:schoolId"
        element={
          <SuperAdminRoute>
            <SchoolDetails />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/super-admin/settings"
        element={
          <SuperAdminRoute>
            <Settings />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <SuperAdminRoute>
            <DTMUsers />
          </SuperAdminRoute>
        }
      />

      {/* School Admin routes */}
      <Route
        path="/school"
        element={
          <SchoolAdminRoute>
            <SchoolDashboard />
          </SchoolAdminRoute>
        }
      />
      <Route
        path="/school/students"
        element={
          <SchoolAdminRoute>
            <StudentsManagement />
          </SchoolAdminRoute>
        }
      />
      <Route
        path="/school/students/:studentId"
        element={
          <SchoolAdminRoute>
            <StudentHistory />
          </SchoolAdminRoute>
        }
      />
      <Route
        path="/school/results"
        element={
          <SchoolAdminRoute>
            <TestResults />
          </SchoolAdminRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
