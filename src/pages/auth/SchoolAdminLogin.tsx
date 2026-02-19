import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SchoolAdminLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, role, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && user && role) {
      if (role === "school_admin") navigate("/school", { replace: true });
      else if (role === "super_admin") navigate("/super-admin", { replace: true });
      else if (role === "district_admin") navigate("/district", { replace: true });
    }
  }, [loading, user, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(login.trim(), password);
      if (error) {
        toast({
          title: "Xatolik",
          description: error,
          variant: "destructive",
        });
      } else {
        navigate("/school");
      }
    } catch {
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
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
