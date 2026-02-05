 import { useEffect, useState } from "react";
 import { AdminLayout } from "@/components/layout/AdminLayout";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 import { REGIONS } from "@/lib/constants";
 import {
   Plus,
   Search,
   Edit,
   Key,
   Power,
   Download,
   Loader2,
   Copy,
   Eye,
   EyeOff,
 } from "lucide-react";
 
 interface School {
   id: string;
   region: string;
   district: string;
   school_name: string;
   school_code: string;
   admin_full_name: string;
   admin_login: string;
   is_active: boolean;
   created_at: string;
   student_count?: number;
   test_count?: number;
   avg_score?: number;
 }
 
 export default function SchoolsManagement() {
   const [schools, setSchools] = useState<School[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [regionFilter, setRegionFilter] = useState<string>("all");
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
   const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
   const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
   const [generatedPassword, setGeneratedPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const { toast } = useToast();
 
   // Form state
   const [formData, setFormData] = useState({
     region: "",
     district: "",
     school_name: "",
     school_code: "",
     admin_full_name: "",
     admin_login: "",
   });
 
   useEffect(() => {
     fetchSchools();
   }, []);
 
   const fetchSchools = async () => {
     try {
       const { data, error } = await supabase
         .from("schools")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
 
       // Fetch additional stats for each school
       const schoolsWithStats = await Promise.all(
         (data || []).map(async (school) => {
           const { count: studentCount } = await supabase
             .from("students")
             .select("*", { count: "exact", head: true })
             .eq("school_id", school.id);
 
           const { data: testData } = await supabase
             .from("test_results")
             .select("total_score, student_id")
             .in(
               "student_id",
               (await supabase.from("students").select("id").eq("school_id", school.id)).data?.map((s) => s.id) || []
             );
 
           const avgScore =
             testData && testData.length > 0
               ? Math.round(testData.reduce((sum, t) => sum + t.total_score, 0) / testData.length)
               : 0;
 
           return {
             ...school,
             student_count: studentCount || 0,
             test_count: testData?.length || 0,
             avg_score: avgScore,
           };
         })
       );
 
       setSchools(schoolsWithStats);
     } catch (error) {
       console.error("Error fetching schools:", error);
       toast({
         title: "Xatolik",
         description: "Maktablarni yuklashda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const generatePassword = () => {
     const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
     let password = "";
     for (let i = 0; i < 12; i++) {
       password += chars.charAt(Math.floor(Math.random() * chars.length));
     }
     return password;
   };
 
   const handleAddSchool = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSaving(true);
 
     try {
       const password = generatePassword();
       setGeneratedPassword(password);
 
       // First create the school record
       const { data: schoolData, error: schoolError } = await supabase
         .from("schools")
         .insert({
           region: formData.region,
           district: formData.district,
           school_name: formData.school_name,
           school_code: formData.school_code,
           admin_full_name: formData.admin_full_name,
           admin_login: formData.admin_login,
         })
         .select()
         .single();
 
       if (schoolError) throw schoolError;
 
       // Create the school admin user via edge function
       const { data, error } = await supabase.functions.invoke("create-school-admin", {
         body: {
           school_id: schoolData.id,
           admin_login: formData.admin_login,
           admin_password: password,
           admin_full_name: formData.admin_full_name,
         },
       });
 
       if (error) throw error;
 
       toast({
         title: "Maktab qo'shildi",
         description: `Parol: ${password}`,
       });
 
       setShowPassword(true);
       fetchSchools();
       resetForm();
     } catch (error: unknown) {
       console.error("Error adding school:", error);
       toast({
         title: "Xatolik",
         description: error instanceof Error ? error.message : "Maktab qo'shishda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleEditSchool = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!selectedSchool) return;
     setIsSaving(true);
 
     try {
       const { error } = await supabase
         .from("schools")
         .update({
           region: formData.region,
           district: formData.district,
           school_name: formData.school_name,
           admin_full_name: formData.admin_full_name,
         })
         .eq("id", selectedSchool.id);
 
       if (error) throw error;
 
       toast({
         title: "Maktab yangilandi",
         description: "Maktab ma'lumotlari muvaffaqiyatli yangilandi",
       });
 
       setIsEditDialogOpen(false);
       fetchSchools();
       resetForm();
     } catch (error) {
       console.error("Error updating school:", error);
       toast({
         title: "Xatolik",
         description: "Maktabni yangilashda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleResetPassword = async () => {
     if (!selectedSchool) return;
     setIsSaving(true);
 
     try {
       const newPassword = generatePassword();
 
       const { error } = await supabase.functions.invoke("reset-school-admin-password", {
         body: {
           admin_login: selectedSchool.admin_login,
           new_password: newPassword,
         },
       });
 
       if (error) throw error;
 
       setGeneratedPassword(newPassword);
       setShowPassword(true);
 
       toast({
         title: "Parol yangilandi",
         description: `Yangi parol: ${newPassword}`,
       });
     } catch (error) {
       console.error("Error resetting password:", error);
       toast({
         title: "Xatolik",
         description: "Parolni yangilashda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleToggleActive = async (school: School) => {
     try {
       const { error } = await supabase
         .from("schools")
         .update({ is_active: !school.is_active })
         .eq("id", school.id);
 
       if (error) throw error;
 
       toast({
         title: school.is_active ? "Maktab o'chirildi" : "Maktab faollashtirildi",
       });
 
       fetchSchools();
     } catch (error) {
       console.error("Error toggling school status:", error);
       toast({
         title: "Xatolik",
         description: "Maktab holatini o'zgartirishda xatolik",
         variant: "destructive",
       });
     }
   };
 
   const handleExportCSV = () => {
     const headers = ["Viloyat", "Tuman", "Maktab nomi", "Kod", "Admin", "O'quvchilar", "Testlar", "O'rtacha ball"];
     const rows = filteredSchools.map((s) => [
       s.region,
       s.district,
       s.school_name,
       s.school_code,
       s.admin_full_name,
       s.student_count,
       s.test_count,
       s.avg_score,
     ]);
 
     const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
     const blob = new Blob([csv], { type: "text/csv" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = "maktablar.csv";
     a.click();
   };
 
   const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     toast({ title: "Nusxalandi!" });
   };
 
   const resetForm = () => {
     setFormData({
       region: "",
       district: "",
       school_name: "",
       school_code: "",
       admin_full_name: "",
       admin_login: "",
     });
     setSelectedSchool(null);
   };
 
   const openEditDialog = (school: School) => {
     setSelectedSchool(school);
     setFormData({
       region: school.region,
       district: school.district,
       school_name: school.school_name,
       school_code: school.school_code,
       admin_full_name: school.admin_full_name,
       admin_login: school.admin_login,
     });
     setIsEditDialogOpen(true);
   };
 
   const openResetPasswordDialog = (school: School) => {
     setSelectedSchool(school);
     setGeneratedPassword("");
     setShowPassword(false);
     setIsResetPasswordDialogOpen(true);
   };
 
   const filteredSchools = schools.filter((school) => {
     const matchesSearch =
       school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       school.school_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
       school.district.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesRegion = regionFilter === "all" || school.region === regionFilter;
     return matchesSearch && matchesRegion;
   });
 
   return (
     <AdminLayout variant="super">
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold tracking-tight">Maktablar</h1>
             <p className="text-muted-foreground">
               Platformadagi barcha maktablarni boshqaring
             </p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" onClick={handleExportCSV}>
               <Download className="mr-2 h-4 w-4" />
               Export
             </Button>
             <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
               <DialogTrigger asChild>
                 <Button onClick={() => { resetForm(); setGeneratedPassword(""); setShowPassword(false); }}>
                   <Plus className="mr-2 h-4 w-4" />
                   Maktab qo'shish
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-lg">
                 <DialogHeader>
                   <DialogTitle>Yangi maktab qo'shish</DialogTitle>
                   <DialogDescription>
                     Maktab ma'lumotlarini kiriting. Admin paroli avtomatik yaratiladi.
                   </DialogDescription>
                 </DialogHeader>
                 <form onSubmit={handleAddSchool} className="space-y-4">
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-2">
                       <Label>Viloyat</Label>
                       <Select
                         value={formData.region}
                         onValueChange={(v) => setFormData({ ...formData, region: v })}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Tanlang" />
                         </SelectTrigger>
                         <SelectContent>
                           {REGIONS.map((r) => (
                             <SelectItem key={r} value={r}>
                               {r}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label>Tuman</Label>
                       <Input
                         value={formData.district}
                         onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                         placeholder="Yunusobod tumani"
                         required
                       />
                     </div>
                   </div>
                   <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-2">
                       <Label>Maktab nomi</Label>
                       <Input
                         value={formData.school_name}
                         onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                         placeholder="123-maktab"
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Maktab kodi</Label>
                       <Input
                         value={formData.school_code}
                         onChange={(e) => setFormData({ ...formData, school_code: e.target.value })}
                         placeholder="TSH123"
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label>Admin F.I.O.</Label>
                     <Input
                       value={formData.admin_full_name}
                       onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
                       placeholder="Aliyev Ali Aliyevich"
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Admin login</Label>
                     <Input
                       value={formData.admin_login}
                       onChange={(e) => setFormData({ ...formData, admin_login: e.target.value })}
                       placeholder="maktab123"
                       required
                     />
                   </div>
                   {generatedPassword && (
                     <div className="rounded-lg border bg-success/10 p-4">
                       <p className="text-sm font-medium text-success">Yaratilgan parol:</p>
                       <div className="mt-2 flex items-center gap-2">
                         <code className="flex-1 rounded bg-muted px-2 py-1">
                           {showPassword ? generatedPassword : "••••••••••••"}
                         </code>
                         <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           onClick={() => setShowPassword(!showPassword)}
                         >
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         </Button>
                         <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           onClick={() => copyToClipboard(generatedPassword)}
                         >
                           <Copy className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   )}
                   <Button type="submit" className="w-full" disabled={isSaving}>
                     {isSaving ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Saqlanmoqda...
                       </>
                     ) : (
                       "Saqlash"
                     )}
                   </Button>
                 </form>
               </DialogContent>
             </Dialog>
           </div>
         </div>
 
         {/* Filters */}
         <div className="flex flex-col gap-4 sm:flex-row">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="Qidirish..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-9"
             />
           </div>
           <Select value={regionFilter} onValueChange={setRegionFilter}>
             <SelectTrigger className="w-[200px]">
               <SelectValue placeholder="Viloyat bo'yicha" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Barcha viloyatlar</SelectItem>
               {REGIONS.map((r) => (
                 <SelectItem key={r} value={r}>
                   {r}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         {/* Table */}
         <div className="rounded-lg border bg-card">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Maktab</TableHead>
                 <TableHead>Viloyat/Tuman</TableHead>
                 <TableHead>Kod</TableHead>
                 <TableHead>Admin</TableHead>
                 <TableHead className="text-center">O'quvchilar</TableHead>
                 <TableHead className="text-center">Testlar</TableHead>
                 <TableHead className="text-center">O'rtacha ball</TableHead>
                 <TableHead>Holat</TableHead>
                 <TableHead className="text-right">Amallar</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow>
                   <TableCell colSpan={9} className="py-10 text-center">
                     <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                   </TableCell>
                 </TableRow>
               ) : filteredSchools.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                     Maktablar topilmadi
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredSchools.map((school) => (
                   <TableRow key={school.id}>
                     <TableCell className="font-medium">{school.school_name}</TableCell>
                     <TableCell>
                       <div className="text-sm">
                         <div>{school.region}</div>
                         <div className="text-muted-foreground">{school.district}</div>
                       </div>
                     </TableCell>
                     <TableCell>
                       <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                         {school.school_code}
                       </code>
                     </TableCell>
                     <TableCell>{school.admin_full_name}</TableCell>
                     <TableCell className="text-center">{school.student_count}</TableCell>
                     <TableCell className="text-center">{school.test_count}</TableCell>
                     <TableCell className="text-center">{school.avg_score}</TableCell>
                     <TableCell>
                       <Badge variant={school.is_active ? "default" : "secondary"}>
                         {school.is_active ? "Faol" : "Nofaol"}
                       </Badge>
                     </TableCell>
                     <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => openEditDialog(school)}
                           title="Tahrirlash"
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => openResetPasswordDialog(school)}
                           title="Parolni yangilash"
                         >
                           <Key className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => handleToggleActive(school)}
                           title={school.is_active ? "O'chirish" : "Faollashtirish"}
                         >
                           <Power className={`h-4 w-4 ${school.is_active ? "text-destructive" : "text-success"}`} />
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
 
         {/* Edit Dialog */}
         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>Maktabni tahrirlash</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleEditSchool} className="space-y-4">
               <div className="grid gap-4 sm:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Viloyat</Label>
                   <Select
                     value={formData.region}
                     onValueChange={(v) => setFormData({ ...formData, region: v })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Tanlang" />
                     </SelectTrigger>
                     <SelectContent>
                       {REGIONS.map((r) => (
                         <SelectItem key={r} value={r}>
                           {r}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-2">
                   <Label>Tuman</Label>
                   <Input
                     value={formData.district}
                     onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Maktab nomi</Label>
                 <Input
                   value={formData.school_name}
                   onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label>Admin F.I.O.</Label>
                 <Input
                   value={formData.admin_full_name}
                   onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
                   required
                 />
               </div>
               <Button type="submit" className="w-full" disabled={isSaving}>
                 {isSaving ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Saqlanmoqda...
                   </>
                 ) : (
                   "Saqlash"
                 )}
               </Button>
             </form>
           </DialogContent>
         </Dialog>
 
         {/* Reset Password Dialog */}
         <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Parolni yangilash</DialogTitle>
               <DialogDescription>
                 {selectedSchool?.school_name} maktabi admini uchun yangi parol yaratiladi.
               </DialogDescription>
             </DialogHeader>
             {generatedPassword ? (
               <div className="space-y-4">
                 <div className="rounded-lg border bg-success/10 p-4">
                   <p className="text-sm font-medium text-success">Yangi parol:</p>
                   <div className="mt-2 flex items-center gap-2">
                     <code className="flex-1 rounded bg-muted px-2 py-1">
                       {showPassword ? generatedPassword : "••••••••••••"}
                     </code>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                     </Button>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => copyToClipboard(generatedPassword)}
                     >
                       <Copy className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
                 <Button
                   variant="outline"
                   className="w-full"
                   onClick={() => setIsResetPasswordDialogOpen(false)}
                 >
                   Yopish
                 </Button>
               </div>
             ) : (
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   className="flex-1"
                   onClick={() => setIsResetPasswordDialogOpen(false)}
                 >
                   Bekor qilish
                 </Button>
                 <Button className="flex-1" onClick={handleResetPassword} disabled={isSaving}>
                   {isSaving ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Yaratilmoqda...
                     </>
                   ) : (
                     "Yangi parol yaratish"
                   )}
                 </Button>
               </div>
             )}
           </DialogContent>
         </Dialog>
       </div>
     </AdminLayout>
   );
 }