import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
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
  initial_password?: string;
 }
 
 export default function SchoolsManagement() {
   const [schools, setSchools] = useState<School[]>([]);
   const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
   const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
   const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
   const [generatedPassword, setGeneratedPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Array<Record<string, string>>>([]);
  const [importResults, setImportResults] = useState<Array<{
    success: boolean;
    school_code: string;
    school_name: string;
    admin_login: string;
    password?: string;
    error?: string;
  }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "results">("upload");
   const { toast } = useToast();
  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const data: Array<Record<string, string>> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      data.push(row);
    }
    
    return data;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    const text = await file.text();
    const parsed = parseCSV(text);
    setImportPreview(parsed);
    setImportStep("preview");
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    setIsImporting(true);
    
    try {
      const schools = importPreview.map(row => ({
        region: row.viloyat || row.region || "",
        district: row.tuman || row.district || "",
        school_name: row.maktab_nomi || row.school_name || row.maktab || "",
        school_code: row.kod || row.school_code || row.maktab_kodi || "",
        admin_full_name: row.admin_fio || row.admin_full_name || row.admin || "",
        admin_login: row.login || row.admin_login || "",
      }));
      
      const { data, error } = await supabase.functions.invoke("bulk-create-schools", {
        body: { schools },
      });
      
      if (error) throw error;
      
      setImportResults(data.results);
      setImportStep("results");
      fetchSchools();
      
      const successCount = data.results.filter((r: { success: boolean }) => r.success).length;
      toast({
        title: "Import yakunlandi",
        description: `${successCount}/${data.results.length} maktab muvaffaqiyatli qo'shildi`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Xatolik",
        description: "Import qilishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportResults([]);
    setImportStep("upload");
  };

  const downloadImportTemplate = () => {
    const headers = "viloyat,tuman,maktab_nomi,kod,admin_fio,login";
    const example = "Toshkent shahri,Yunusobod tumani,123-maktab,TSH123,Aliyev Ali Aliyevich,maktab123";
    const csv = headers + "\n" + example;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maktablar_shablon.csv";
    a.click();
  };

  const downloadImportResults = () => {
    const headers = "maktab_kodi,maktab_nomi,login,parol,holat,xato";
    const rows = importResults.map(r => 
      `${r.school_code},${r.school_name},${r.admin_login},${r.password || ""},${r.success ? "Muvaffaqiyatli" : "Xato"},${r.error || ""}`
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_natijalar.csv";
    a.click();
  };

 
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
 
      // Fetch credentials for all schools
      const { data: credentialsData } = await supabase
        .from("school_admin_credentials")
        .select("school_id, initial_password");

      const credentialsMap = new Map(
        (credentialsData || []).map((c) => [c.school_id, c.initial_password])
      );

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
            initial_password: credentialsMap.get(school.id) || "",
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
    const headers = ["Viloyat", "Tuman", "Maktab nomi", "Kod", "Admin F.I.O.", "Admin login", "Parol", "O'quvchilar", "Testlar", "O'rtacha ball"];
     const rows = filteredSchools.map((s) => [
       s.region,
       s.district,
       s.school_name,
       s.school_code,
       s.admin_full_name,
      s.admin_login,
      s.initial_password || "",
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
            <Dialog open={isImportDialogOpen} onOpenChange={(open) => { setIsImportDialogOpen(open); if (!open) resetImport(); }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Maktablarni import qilish</DialogTitle>
                  <DialogDescription>
                    CSV fayldan maktablarni yuklang
                  </DialogDescription>
                </DialogHeader>
                
                {importStep === "upload" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed p-8 text-center">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        CSV faylni tanlang
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="mt-4"
                      />
                    </div>
                    <Button variant="outline" onClick={downloadImportTemplate} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Shablon yuklab olish
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      CSV ustunlari: viloyat, tuman, maktab_nomi, kod, admin_fio, login
                    </p>
                  </div>
                )}
                
                {importStep === "preview" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {importPreview.length} ta maktab topildi
                    </p>
                    <div className="max-h-60 overflow-auto rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Viloyat</TableHead>
                            <TableHead>Tuman</TableHead>
                            <TableHead>Maktab</TableHead>
                            <TableHead>Kod</TableHead>
                            <TableHead>Login</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importPreview.slice(0, 10).map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs">{row.viloyat || row.region}</TableCell>
                              <TableCell className="text-xs">{row.tuman || row.district}</TableCell>
                              <TableCell className="text-xs">{row.maktab_nomi || row.school_name || row.maktab}</TableCell>
                              <TableCell className="text-xs">{row.kod || row.school_code || row.maktab_kodi}</TableCell>
                              <TableCell className="text-xs">{row.login || row.admin_login}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {importPreview.length > 10 && (
                        <p className="p-2 text-center text-xs text-muted-foreground">
                          va yana {importPreview.length - 10} ta...
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetImport} className="flex-1">
                        Bekor qilish
                      </Button>
                      <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                        {isImporting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Import qilinmoqda...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Import qilish
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {importStep === "results" && (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{importResults.filter(r => r.success).length} muvaffaqiyatli</span>
                      </div>
                      <div className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-5 w-5" />
                        <span>{importResults.filter(r => !r.success).length} xato</span>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-auto rounded border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Holat</TableHead>
                            <TableHead>Maktab</TableHead>
                            <TableHead>Login</TableHead>
                            <TableHead>Parol</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResults.map((result, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                {result.success ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell className="text-xs">{result.school_name}</TableCell>
                              <TableCell className="text-xs">{result.admin_login}</TableCell>
                              <TableCell className="text-xs">
                                {result.password ? (
                                  <code className="rounded bg-muted px-1">{result.password}</code>
                                ) : (
                                  <span className="text-destructive">{result.error}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={downloadImportResults} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Natijalarni yuklab olish
                      </Button>
                      <Button onClick={() => setIsImportDialogOpen(false)} className="flex-1">
                        Yopish
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
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
                          <Link to={`/super-admin/schools/${school.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Ko'rish"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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