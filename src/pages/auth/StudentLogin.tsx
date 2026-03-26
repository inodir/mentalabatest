import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(username, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Xush kelibsiz!");
        navigate("/student");
      }
    } catch (err) {
      toast.error("Tizimga kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mb-4">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Student Portal</h1>
          <p className="text-muted-foreground">O'z natijalaringizni kuzatib boring</p>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Kirish</CardTitle>
            <CardDescription>
              DTM platformasidagi login va parolingizni kiriting
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Login</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Loginni kiriting"
                    className="pl-10 h-11"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Parol</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kirilmoqda...
                  </>
                ) : (
                  "Tizimga kirish"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Parolni unutdingizmi? Iltimos, maktab administratoriga murojaat qiling.
        </p>
      </motion.div>
    </div>
  );
}
