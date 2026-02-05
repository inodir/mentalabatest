 import { useState } from "react";
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
   const { signIn } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsLoading(true);
 
     try {
       // School admin login uses login@mentalaba.uz format
       const email = login.includes("@") ? login : `${login}@mentalaba.uz`;
       const { error } = await signIn(email, password);
       if (error) {
         toast({
           title: "Xatolik",
           description: "Login yoki parol noto'g'ri",
           variant: "destructive",
         });
       } else {
         navigate("/school");
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