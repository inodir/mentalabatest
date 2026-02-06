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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { DTMStudentsTable } from "@/components/school/DTMStudentsTable";
import { SUBJECTS, TEST_LANGUAGES, CERTIFICATE_TYPES } from "@/lib/constants";
import { Plus, Search, Edit, Trash2, Loader2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
 
 interface Student {
   id: string;
   full_name: string;
   phone_number: string;
   test_language: string;
   subject1: string;
   subject2: string;
   has_language_certificate: boolean;
   certificate_type: string | null;
   certificate_score: string | null;
   created_at: string;
 }
 
export default function StudentsManagement() {
  const { schoolId } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [certificateFilter, setCertificateFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // DTM data hook
  const { 
    students: dtmStudents, 
    loading: dtmLoading, 
    refetch: refetchDTM,
    schoolCode 
  } = useSchoolDTMData();
 
   const [formData, setFormData] = useState({
     full_name: "",
     phone_number: "",
     test_language: "uzbek",
     subject1: "",
     subject2: "",
     has_language_certificate: false,
     certificate_type: "",
     certificate_score: "",
   });
 
   useEffect(() => {
     if (schoolId) {
       fetchStudents();
     }
   }, [schoolId]);
 
   const fetchStudents = async () => {
     try {
       const { data, error } = await supabase
         .from("students")
         .select("*")
         .eq("school_id", schoolId)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setStudents(data || []);
     } catch (error) {
       console.error("Error fetching students:", error);
       toast({
         title: "Xatolik",
         description: "O'quvchilarni yuklashda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     if (formData.subject1 === formData.subject2) {
       toast({
         title: "Xatolik",
         description: "1-fan va 2-fan bir xil bo'lmasligi kerak",
         variant: "destructive",
       });
       return;
     }
 
     setIsSaving(true);
 
     try {
       const studentData = {
         school_id: schoolId,
         full_name: formData.full_name,
         phone_number: formData.phone_number,
         test_language: formData.test_language as "uzbek" | "russian" | "english",
         subject1: formData.subject1,
         subject2: formData.subject2,
         has_language_certificate: formData.has_language_certificate,
         certificate_type: formData.has_language_certificate ? formData.certificate_type as "IELTS" | "CEFR" | "Duolingo" | "TOEFL" | "Other" : null,
         certificate_score: formData.has_language_certificate ? formData.certificate_score : null,
       };
 
       if (isEditing && selectedStudent) {
         const { error } = await supabase
           .from("students")
           .update(studentData)
           .eq("id", selectedStudent.id);
 
         if (error) throw error;
         toast({ title: "O'quvchi yangilandi" });
       } else {
         const { error } = await supabase.from("students").insert(studentData);
         if (error) throw error;
         toast({ title: "O'quvchi qo'shildi" });
       }
 
       setIsDialogOpen(false);
       fetchStudents();
       resetForm();
     } catch (error) {
       console.error("Error saving student:", error);
       toast({
         title: "Xatolik",
         description: "O'quvchini saqlashda xatolik yuz berdi",
         variant: "destructive",
       });
     } finally {
       setIsSaving(false);
     }
   };
 
   const handleDelete = async (student: Student) => {
     if (!confirm(`${student.full_name} o'chirilsinmi?`)) return;
 
     try {
       const { error } = await supabase.from("students").delete().eq("id", student.id);
       if (error) throw error;
       toast({ title: "O'quvchi o'chirildi" });
       fetchStudents();
     } catch (error) {
       console.error("Error deleting student:", error);
       toast({
         title: "Xatolik",
         description: "O'quvchini o'chirishda xatolik",
         variant: "destructive",
       });
     }
   };
 
   const resetForm = () => {
     setFormData({
       full_name: "",
       phone_number: "",
       test_language: "uzbek",
       subject1: "",
       subject2: "",
       has_language_certificate: false,
       certificate_type: "",
       certificate_score: "",
     });
     setSelectedStudent(null);
     setIsEditing(false);
   };
 
   const openEditDialog = (student: Student) => {
     setSelectedStudent(student);
     setFormData({
       full_name: student.full_name,
       phone_number: student.phone_number,
       test_language: student.test_language,
       subject1: student.subject1,
       subject2: student.subject2,
       has_language_certificate: student.has_language_certificate,
       certificate_type: student.certificate_type || "",
       certificate_score: student.certificate_score || "",
     });
     setIsEditing(true);
     setIsDialogOpen(true);
   };
 
   const getLanguageLabel = (value: string) => {
     return TEST_LANGUAGES.find((l) => l.value === value)?.label || value;
   };
 
   const filteredStudents = students.filter((student) => {
     const matchesSearch =
       student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.phone_number.includes(searchTerm);
     const matchesLanguage = languageFilter === "all" || student.test_language === languageFilter;
     const matchesCertificate =
       certificateFilter === "all" ||
       (certificateFilter === "yes" && student.has_language_certificate) ||
       (certificateFilter === "no" && !student.has_language_certificate);
     return matchesSearch && matchesLanguage && matchesCertificate;
   });
 
   return (
     <AdminLayout variant="school">
       <div className="space-y-6">
        <Tabs defaultValue="dtm" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">O'quvchilar</h1>
              <p className="text-muted-foreground">
                O'quvchilarni ro'yxatdan o'tkazing va boshqaring
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="dtm">DTM ro'yxati</TabsTrigger>
              <TabsTrigger value="local">Mahalliy ro'yxat</TabsTrigger>
            </TabsList>
          </div>

          {/* DTM Students Tab */}
          <TabsContent value="dtm" className="mt-6">
            {schoolCode ? (
              <DTMStudentsTable 
                students={dtmStudents} 
                loading={dtmLoading}
                onRefresh={() => refetchDTM(true)}
              />
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  DTM ma'lumotlarini ko'rish uchun avval bosh sahifada maktab kodini kiriting
                </p>
              </div>
            )}
          </TabsContent>

          {/* Local Students Tab */}
          <TabsContent value="local" className="mt-6 space-y-6">
            <div className="flex items-center justify-end">
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    O'quvchi qo'shish
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}
                    </DialogTitle>
                    <DialogDescription>
                      O'quvchi ma'lumotlarini kiriting
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>F.I.O. *</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Aliyev Ali Aliyevich"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon raqami *</Label>
                      <Input
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+998901234567"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Test tili *</Label>
                      <Select
                        value={formData.test_language}
                        onValueChange={(v) => setFormData({ ...formData, test_language: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEST_LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>1-fan *</Label>
                        <Select
                          value={formData.subject1}
                          onValueChange={(v) => setFormData({ ...formData, subject1: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>2-fan *</Label>
                        <Select
                          value={formData.subject2}
                          onValueChange={(v) => setFormData({ ...formData, subject2: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBJECTS.filter((s) => s !== formData.subject1).map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="certificate"
                        checked={formData.has_language_certificate}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, has_language_certificate: !!checked })
                        }
                      />
                      <Label htmlFor="certificate">Til sertifikati bor</Label>
                    </div>
                    {formData.has_language_certificate && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Sertifikat turi</Label>
                          <Select
                            value={formData.certificate_type}
                            onValueChange={(v) => setFormData({ ...formData, certificate_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {CERTIFICATE_TYPES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ball/daraja</Label>
                          <Input
                            value={formData.certificate_score}
                            onChange={(e) =>
                              setFormData({ ...formData, certificate_score: e.target.value })
                            }
                            placeholder="7.0"
                          />
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
                  placeholder="F.I.O. yoki telefon bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Test tili" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha tillar</SelectItem>
                  {TEST_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={certificateFilter} onValueChange={setCertificateFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sertifikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="yes">Sertifikati bor</SelectItem>
                  <SelectItem value="no">Sertifikati yo'q</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>F.I.O.</TableHead>
                    <TableHead>Tel raqami</TableHead>
                    <TableHead>Test tili</TableHead>
                    <TableHead>Fan 1</TableHead>
                    <TableHead>Fan 2</TableHead>
                    <TableHead>Til sertifikati</TableHead>
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
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        O'quvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.phone_number}</TableCell>
                        <TableCell>{getLanguageLabel(student.test_language)}</TableCell>
                        <TableCell>{student.subject1}</TableCell>
                        <TableCell>{student.subject2}</TableCell>
                        <TableCell>
                          {student.has_language_certificate ? (
                            <Badge variant="default">
                              {student.certificate_type} {student.certificate_score && `(${student.certificate_score})`}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Yo'q</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/school/students/${student.id}`)}
                              title="Ko'rish"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(student)}
                              title="Tahrirlash"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(student)}
                              title="O'chirish"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}