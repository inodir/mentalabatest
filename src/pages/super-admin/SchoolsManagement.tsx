import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DTMSchoolsList } from "@/components/dtm/DTMSchoolsList";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  User,
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
  show_results: boolean;
  created_at: string;
  initial_password?: string;
}

// Separate component for table row with password visibility
function SchoolTableRow({
  school,
  onEdit,
  onResetPassword,
  onToggleActive,
  onToggleShowResults,
  copyToClipboard,
}: {
  school: School;
  onEdit: (school: School) => void;
  onResetPassword: (school: School) => void;
  onToggleActive: (school: School) => void;
  onToggleShowResults: (school: School) => void;
  copyToClipboard: (text: string) => void;
}) {
  const [showCredentials, setShowCredentials] = useState(false);

  return (
    <TableRow>
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
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{school.admin_full_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              {school.admin_login}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(school.admin_login)}
              title="Login nusxalash"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          {school.initial_password && (
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {showCredentials ? school.initial_password : "••••••••••••"}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowCredentials(!showCredentials)}
                title={showCredentials ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showCredentials ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              {showCredentials && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(school.initial_password || "")}
                  title="Parol nusxalash"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {!school.initial_password && (
            <span className="text-xs text-muted-foreground">Parol mavjud emas</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={school.is_active ? "default" : "secondary"}>
          {school.is_active ? "Faol" : "Nofaol"}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={school.show_results}
          onCheckedChange={() => onToggleShowResults(school)}
          className="data-[state=checked]:bg-primary"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link to={`/super-admin/schools/${school.id}`}>
            <Button variant="ghost" size="icon" title="Ko'rish">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(school)}
            title="Tahrirlash"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onResetPassword(school)}
            title="Parolni yangilash"
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleActive(school)}
            title={school.is_active ? "O'chirish" : "Faollashtirish"}
          >
            <Power className={`h-4 w-4 ${school.is_active ? "text-destructive" : "text-success"}`} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
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
  
  // Sanitize CSV cell values to prevent CSV injection
  const sanitizeCSVValue = (value: string): string => {
    if (!value) return value;
    const trimmed = value.trim();
    const firstChar = trimmed.charAt(0);
    // Remove dangerous first characters that could be interpreted as formulas
    if (['=', '+', '-', '@', '|', '%'].includes(firstChar)) {
      return trimmed.substring(1).trim();
    }
    return trimmed;
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const data: Array<Record<string, string>> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        // Sanitize each cell value
        row[header] = sanitizeCSVValue(values[idx] || "");
      });
      data.push(row);
    }
    
    return data;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fayl hajmi juda katta",
        description: "Maksimal fayl hajmi: 5MB",
        variant: "destructive",
      });
      e.target.value = ""; // Reset input
      return;
    }
    
    // Validate file type
    if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Noto'g'ri fayl turi",
        description: "Faqat CSV fayllar qabul qilinadi",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    
    setImportFile(file);
    const text = await file.text();
    const parsed = parseCSV(text);
    
    // Validate row count (max 1000 schools)
    const MAX_ROWS = 1000;
    if (parsed.length > MAX_ROWS) {
      toast({
        title: "Juda ko'p qatorlar",
        description: `Maksimal ${MAX_ROWS} ta maktab import qilish mumkin. Sizning faylingizda ${parsed.length} ta qator bor.`,
        variant: "destructive",
      });
      e.target.value = "";
      setImportFile(null);
      return;
    }
    
    // Validate required fields exist
    if (parsed.length > 0) {
      const requiredFields = ['viloyat', 'tuman', 'maktab_nomi', 'kod', 'admin_fio', 'login'];
      const alternativeFields: Record<string, string[]> = {
        'viloyat': ['region'],
        'tuman': ['district'],
        'maktab_nomi': ['school_name', 'maktab'],
        'kod': ['school_code', 'maktab_kodi'],
        'admin_fio': ['admin_full_name', 'admin'],
        'login': ['admin_login'],
      };
      
      const headers = Object.keys(parsed[0]);
      const missingFields: string[] = [];
      
      for (const field of requiredFields) {
        const alternatives = [field, ...(alternativeFields[field] || [])];
        const found = alternatives.some(alt => headers.includes(alt));
        if (!found) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        toast({
          title: "Majburiy ustunlar yo'q",
          description: `Quyidagi ustunlar topilmadi: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        e.target.value = "";
        setImportFile(null);
        return;
      }
    }
    
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
        password: row.parol || row.password || "",
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
    const headers = "viloyat,tuman,maktab_nomi,kod,admin_fio,login,parol";
    const example = "Toshkent shahri,Yunusobod tumani,123-maktab,TSH123,Aliyev Ali Aliyevich,maktab123,MyPassword123";
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
      const [schoolsRes, credentialsRes] = await Promise.all([
        supabase
          .from("schools")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("school_admin_credentials")
          .select("school_id, initial_password"),
      ]);

      if (schoolsRes.error) throw schoolsRes.error;

      const credentialsMap = new Map(
        (credentialsRes.data || []).map((c) => [c.school_id, c.initial_password])
      );

      const schoolsWithStats = (schoolsRes.data || []).map((school) => ({
        ...school,
        initial_password: credentialsMap.get(school.id) || "",
      }));

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
    const headers = ["Viloyat", "Tuman", "Maktab nomi", "Kod", "Admin F.I.O.", "Admin login", "Parol"];
    const rows = filteredSchools.map((s) => [
      s.region,
      s.district,
      s.school_name,
      s.school_code,
      s.admin_full_name,
      s.admin_login,
      s.initial_password || "",
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
 
  // Get unique districts based on selected region
  const availableDistricts = [...new Set(
    schools
      .filter(s => regionFilter === "all" || s.region === regionFilter)
      .map(s => s.district)
  )].sort();

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.school_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === "all" || school.region === regionFilter;
    const matchesDistrict = districtFilter === "all" || school.district === districtFilter;
    return matchesSearch && matchesRegion && matchesDistrict;
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
          </div>

          <Tabs defaultValue="dtm-schools" className="space-y-6">
            <TabsList>
              <TabsTrigger value="dtm-schools">DTM maktablar</TabsTrigger>
              <TabsTrigger value="platform-schools">Platforma maktablari</TabsTrigger>
            </TabsList>

            <TabsContent value="dtm-schools" className="space-y-0">
              <DTMSchoolsList />
            </TabsContent>

            <TabsContent value="platform-schools" className="space-y-6">
          <div className="flex justify-end gap-2">
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
                      CSV ustunlari: viloyat, tuman, maktab_nomi, kod, admin_fio, login, parol (ixtiyoriy)
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
          <Select value={regionFilter} onValueChange={(value) => {
            setRegionFilter(value);
            setDistrictFilter("all"); // Reset district when region changes
          }}>
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
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tuman bo'yicha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha tumanlar</SelectItem>
              {availableDistricts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
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
                <TableHead>Login / Parol</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-center">Natijalar</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Maktablar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <SchoolTableRow
                    key={school.id}
                    school={school}
                    onEdit={openEditDialog}
                    onResetPassword={openResetPasswordDialog}
                    onToggleActive={handleToggleActive}
                    copyToClipboard={copyToClipboard}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

            </TabsContent>
          </Tabs>

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