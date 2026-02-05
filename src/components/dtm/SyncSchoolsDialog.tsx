import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  RefreshCw,
  School,
  CheckCircle2,
  XCircle,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getApiSettings,
  fetchAllDTMUsers,
  DTMUser,
} from "@/lib/dtm-api";

interface UniqueSchool {
  school_code: string;
  district: string;
  userCount: number;
}

interface SyncResult {
  success: boolean;
  school_code: string;
  school_name: string;
  admin_login: string;
  password?: string;
  error?: string;
}

interface SyncSchoolsDialogProps {
  onSyncComplete?: () => void;
}

export function SyncSchoolsDialog({ onSyncComplete }: SyncSchoolsDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "loading" | "preview" | "syncing" | "results">("idle");
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [uniqueSchools, setUniqueSchools] = useState<UniqueSchool[]>([]);
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const { toast } = useToast();

  const extractUniqueSchools = (users: DTMUser[]): UniqueSchool[] => {
    const schoolMap = new Map<string, UniqueSchool>();

    users.forEach((user) => {
      if (!user.school_code) return;

      const existing = schoolMap.get(user.school_code);
      if (existing) {
        existing.userCount++;
        // Update district if available
        if (!existing.district && user.district) existing.district = user.district;
      } else {
        schoolMap.set(user.school_code, {
          school_code: user.school_code,
          district: user.district || "",
          userCount: 1,
        });
      }
    });

    return [...schoolMap.values()].sort((a, b) => b.userCount - a.userCount);
  };

  const loadSchoolsFromAPI = async () => {
    const settings = getApiSettings();
    if (!settings) {
      toast({
        title: "API sozlamalari topilmadi",
        description: "Avval API sozlamalarini kiriting",
        variant: "destructive",
      });
      return;
    }

    setStep("loading");
    setLoadProgress({ loaded: 0, total: 0 });

    try {
      // Fetch all users from DTM API
      const { entities } = await fetchAllDTMUsers(settings, (loaded, total) => {
        setLoadProgress({ loaded, total });
      });

      // Extract unique schools
      const schools = extractUniqueSchools(entities);
      setUniqueSchools(schools);

      // Check which schools already exist in database
      const { data: existingSchools } = await supabase
        .from("schools")
        .select("school_code");

      const existingSet = new Set((existingSchools || []).map((s) => s.school_code));
      setExistingCodes(existingSet);

      setStep("preview");
    } catch (error) {
      console.error("Error loading schools:", error);
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
      setStep("idle");
    }
  };

  const syncSchools = async () => {
    const newSchools = uniqueSchools.filter((s) => !existingCodes.has(s.school_code));
    
    if (newSchools.length === 0) {
      toast({
        title: "Yangi maktab yo'q",
        description: "Barcha maktablar allaqachon bazada mavjud",
      });
      return;
    }

    setStep("syncing");

    try {
      // Prepare schools data for bulk create
      const schoolsToCreate = newSchools.map((s) => ({
        region: "Noma'lum",
        district: s.district || "Noma'lum",
        school_name: `Maktab ${s.school_code}`,
        school_code: s.school_code,
        admin_full_name: `Admin ${s.school_code}`,
        admin_login: s.school_code.toLowerCase().replace(/[^a-z0-9]/g, ""),
      }));

      // Call bulk create edge function
      const { data, error } = await supabase.functions.invoke("bulk-create-schools", {
        body: { schools: schoolsToCreate },
      });

      if (error) throw error;

      setSyncResults(data.results);
      setStep("results");

      const successCount = data.results.filter((r: SyncResult) => r.success).length;
      toast({
        title: "Sinxronlash yakunlandi",
        description: `${successCount}/${data.results.length} maktab muvaffaqiyatli qo'shildi`,
      });

      onSyncComplete?.();
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Xatolik",
        description: "Sinxronlashda xatolik yuz berdi",
        variant: "destructive",
      });
      setStep("preview");
    }
  };

  const downloadResults = () => {
    const headers = "maktab_kodi,maktab_nomi,login,parol,holat,xato";
    const rows = syncResults.map((r) =>
      `${r.school_code},"${r.school_name}",${r.admin_login},${r.password || ""},${r.success ? "Muvaffaqiyatli" : "Xato"},"${r.error || ""}"`
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sinxronlash_natijalar.csv";
    a.click();
  };

  const reset = () => {
    setStep("idle");
    setUniqueSchools([]);
    setExistingCodes(new Set());
    setSyncResults([]);
    setLoadProgress({ loaded: 0, total: 0 });
  };

  const newSchoolsCount = uniqueSchools.filter((s) => !existingCodes.has(s.school_code)).length;
  const existingSchoolsCount = uniqueSchools.filter((s) => existingCodes.has(s.school_code)).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          DTM dan sinxronlash
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Maktablarni DTM API dan sinxronlash
          </DialogTitle>
          <DialogDescription>
            DTM API'dan foydalanuvchilarni yuklab, unique maktablarni aniqlang va bazaga qo'shing.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === "idle" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <School className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                DTM API'dan barcha foydalanuvchilarni yuklab, unique maktab kodlarini aniqlang
              </p>
              <Button onClick={loadSchoolsFromAPI} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Boshlash
              </Button>
            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="font-medium mb-2">Ma'lumotlar yuklanmoqda...</p>
              {loadProgress.total > 0 && (
                <>
                  <Progress 
                    value={(loadProgress.loaded / loadProgress.total) * 100} 
                    className="w-64 mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {loadProgress.loaded.toLocaleString()} / {loadProgress.total.toLocaleString()} foydalanuvchi
                  </p>
                </>
              )}
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Badge variant="secondary" className="gap-1 text-base py-1 px-3">
                  <School className="h-4 w-4" />
                  Jami: {uniqueSchools.length}
                </Badge>
                <Badge className="gap-1 text-base py-1 px-3 bg-success/20 text-success border-success/30">
                  <CheckCircle2 className="h-4 w-4" />
                  Yangi: {newSchoolsCount}
                </Badge>
                <Badge variant="outline" className="gap-1 text-base py-1 px-3">
                  <AlertCircle className="h-4 w-4" />
                  Mavjud: {existingSchoolsCount}
                </Badge>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Tuman</TableHead>
                      <TableHead className="text-center">Foydalanuvchilar</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueSchools.map((school) => (
                      <TableRow key={school.school_code}>
                        <TableCell className="font-mono text-xs">
                          {school.school_code}
                        </TableCell>
                        <TableCell className="text-sm">
                          {school.district || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{school.userCount}</Badge>
                        </TableCell>
                        <TableCell>
                          {existingCodes.has(school.school_code) ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              Mavjud
                            </Badge>
                          ) : (
                            <Badge className="bg-success/20 text-success border-success/30">
                              Yangi
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Bekor qilish
                </Button>
                <Button 
                  onClick={syncSchools} 
                  disabled={newSchoolsCount === 0} 
                  className="flex-1 gap-2"
                >
                  <School className="h-4 w-4" />
                  {newSchoolsCount} ta yangi maktab qo'shish
                </Button>
              </div>
            </div>
          )}

          {step === "syncing" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="font-medium">Maktablar yaratilmoqda...</p>
              <p className="text-sm text-muted-foreground">Bu biroz vaqt olishi mumkin</p>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Badge className="gap-1 text-base py-1 px-3 bg-success/20 text-success border-success/30">
                  <CheckCircle2 className="h-4 w-4" />
                  Muvaffaqiyatli: {syncResults.filter((r) => r.success).length}
                </Badge>
                <Badge variant="destructive" className="gap-1 text-base py-1 px-3">
                  <XCircle className="h-4 w-4" />
                  Xato: {syncResults.filter((r) => !r.success).length}
                </Badge>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
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
                    {syncResults.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {result.success ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{result.school_name}</TableCell>
                        <TableCell className="font-mono text-xs">{result.admin_login}</TableCell>
                        <TableCell>
                          {result.password ? (
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              {result.password}
                            </code>
                          ) : (
                            <span className="text-destructive text-xs">{result.error}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadResults} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Natijalarni yuklab olish
                </Button>
                <Button onClick={() => setOpen(false)} className="flex-1">
                  Yopish
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
