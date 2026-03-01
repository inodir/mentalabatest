import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  isLoginLocked,
  recordFailedLogin,
  clearLoginAttempts,
  getRemainingAttempts,
  sanitizeInput,
} from "@/lib/security";

export default function SchoolAdminLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const { user, role, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const check = () => {
      const { locked, remainingSeconds } = isLoginLocked();
      setLockoutSeconds(locked ? remainingSeconds : 0);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && user && role) {
      if (role === "school_admin") navigate("/school", { replace: true });
      else if (role === "super_admin") navigate("/super-admin", { replace: true });
      else if (role === "district_admin") navigate("/district", { replace: true });
    }
  }, [loading, user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { locked, remainingSeconds } = isLoginLocked();
    if (locked) {
      setLockoutSeconds(remainingSeconds);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(sanitizeInput(login), password);
      if (error) {
        const result = recordFailedLogin();
        if (result.locked) {
          setLockoutSeconds(result.remainingSeconds);
          toast({
            title: "Kirish bloklandi",
            description: `Ko'p urinish. ${Math.ceil(result.remainingSeconds / 60)} daqiqa kuting.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Xatolik",
            description: `${error}. Qolgan urinishlar: ${getRemainingAttempts()}`,
            variant: "destructive",
          });
        }
      } else {
        clearLoginAttempts();
        navigate("/school");
      }
    } catch {
      recordFailedLogin();
      toast({
        title: "Xatolik",
        description: "Tizimga kirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent/5 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <School className="h-8 w-8 text-accent" />
          </div>
          <CardTitle className="text-2xl">Maktab Admin</CardTitle>
          <CardDescription>
            Maktab boshqaruv paneliga kirish
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLocked && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                Ko'p urinish. {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, "0")} kuting.
              </span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                type="text"
                placeholder="maktab_login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                disabled={isLocked}
                maxLength={100}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLocked}
                  className="pr-10"
                  maxLength={128}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kirish...
                </>
              ) : (
                "Kirish"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
