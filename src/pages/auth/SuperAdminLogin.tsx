 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { useAuth } from "@/hooks/useAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { GraduationCap, Loader2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 export default function SuperAdminLogin() {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const { signIn } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
 
     try {
       const { error } = await signIn(email, password);
       if (error) {
         toast({
           title: "Xatolik",
           description: "Login yoki parol noto'g'ri",
           variant: "destructive",
         });
       } else {
         navigate("/super-admin");
       }
     } catch (error) {
       toast({
         title: "Xatolik",
         description: "Tizimga kirishda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setIsLoading(false);
     }
   };
 
   return (
     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
       <Card className="w-full max-w-md animate-scale-in">
         <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
             <GraduationCap className="h-8 w-8 text-primary" />
           </div>
           <CardTitle className="text-2xl">Super Admin</CardTitle>
           <CardDescription>
             Mentalaba.uz platformasi boshqaruv paneli
           </CardDescription>
         </CardHeader>
         <CardContent>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                 id="email"
                 type="email"
                 placeholder="admin@mentalaba.uz"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
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