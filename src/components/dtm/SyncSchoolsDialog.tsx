import { useState, useCallback } from "react";
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
  Loader2,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getApiSettings,
  fetchAllDTMUsers,
  getCachedData,
  DTMUser,
} from "@/lib/dtm-api";

interface SyncResult {
  success: boolean;
  school_code: string;
  school_name: string;
  admin_login: string;
  password?: string;
  error?: string;
}

type SyncStep = "idle" | "fetching" | "checking" | "syncing" | "done";

interface SyncSchoolsDialogProps {
  onSyncComplete?: () => void;
}

export function SyncSchoolsDialog({ onSyncComplete }: SyncSchoolsDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SyncStep>("idle");
  const [statusText, setStatusText] = useState("");
  const [progress, setProgress] = useState(0);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [existingCount, setExistingCount] = useState(0);
  const [usedCache, setUsedCache] = useState(false);
  const { toast } = useToast();

  const extractUniqueSchools = (users: DTMUser[]) => {
    const schoolMap = new Map<string, { school_code: string; district: string }>();
    users.forEach((user) => {
      if (!user.school_code || schoolMap.has(user.school_code)) return;
      schoolMap.set(user.school_code, {
        school_code: user.school_code,
        district: user.district || "",
      });
    });
    return [...schoolMap.values()];
  };

  const runFullSync = useCallback(async () => {
    const settings = getApiSettings();
    if (!settings) {
      toast({
        title: "API sozlamalari topilmadi",
        description: "Avval API sozlamalarini kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Fetch users (or use cache)
      setStep("fetching");
      const cached = getCachedData<{ entities: DTMUser[]; totalCount: number }>("users");
      
      let entities: DTMUser[];
      if (cached) {
        entities = cached.entities;
        setUsedCache(true);
        setStatusText(`Keshdan ${cached.entities.length} ta foydalanuvchi olindi`);
        setProgress(33);
      } else {
        setUsedCache(false);
        setStatusText("DTM API'dan yuklanmoqda...");
        const result = await fetchAllDTMUsers(settings, (loaded, total) => {
          const pct = total > 0 ? Math.round((loaded / total) * 30) : 0;
          setProgress(pct);
          setStatusText(`${loaded.toLocaleString()} / ${total.toLocaleString()} foydalanuvchi`);
        });
        entities = result.entities;
        setProgress(33);
      }

      // Step 2: Check existing schools
      setStep("checking");
      setStatusText("Mavjud maktablar tekshirilmoqda...");
      
      const uniqueSchools = extractUniqueSchools(entities);
      const { data: existingSchools } = await supabase
        .from("schools")
        .select("school_code");
      
      const existingSet = new Set((existingSchools || []).map((s) => s.school_code));
      const newSchools = uniqueSchools.filter((s) => !existingSet.has(s.school_code));
      
      setNewCount(newSchools.length);
      setExistingCount(uniqueSchools.length - newSchools.length);
      setProgress(50);

      if (newSchools.length === 0) {
        setStep("done");
        setSyncResults([]);
        setStatusText("Yangi maktab topilmadi — hammasi bazada mavjud");
        setProgress(100);
        toast({ title: "Yangi maktab yo'q", description: "Barcha maktablar allaqachon bazada mavjud" });
        return;
      }

      // Step 3: Bulk create new schools
      setStep("syncing");
      setStatusText(`${newSchools.length} ta yangi maktab qo'shilmoqda...`);

      const schoolsToCreate = newSchools.map((s) => ({
        region: "Noma'lum",
        district: s.district || "Noma'lum",
        school_name: `Maktab ${s.school_code}`,
        school_code: s.school_code,
        admin_full_name: `Admin ${s.school_code}`,
        admin_login: s.school_code.toLowerCase().replace(/[^a-z0-9]/g, ""),
      }));

      // Send in chunks of 100 (edge function limit)
      const allResults: SyncResult[] = [];
      const chunkSize = 100;
      
      for (let i = 0; i < schoolsToCreate.length; i += chunkSize) {
        const chunk = schoolsToCreate.slice(i, i + chunkSize);
        const { data, error } = await supabase.functions.invoke("bulk-create-schools", {
          body: { schools: chunk },
        });

        if (error) throw error;
        allResults.push(...data.results);

        const syncPct = 50 + Math.round(((i + chunk.length) / schoolsToCreate.length) * 50);
        setProgress(syncPct);
        setStatusText(`${allResults.length} / ${schoolsToCreate.length} maktab yaratildi`);
      }

      setSyncResults(allResults);
      setStep("done");
      setProgress(100);
      
      const successCount = allResults.filter((r) => r.success).length;
      setStatusText(`${successCount} ta maktab muvaffaqiyatli qo'shildi`);
      
      toast({
        title: "Sinxronlash yakunlandi",
        description: `${successCount}/${allResults.length} maktab muvaffaqiyatli qo'shildi`,
      });

      onSyncComplete?.();
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Xatolik",
        description: "Sinxronlashda xatolik yuz berdi",
        variant: "destructive",
      });
      setStep("idle");
      setProgress(0);
    }
  }, [toast, onSyncComplete]);

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
    setSyncResults([]);
    setProgress(0);
    setStatusText("");
    setNewCount(0);
    setExistingCount(0);
    setUsedCache(false);
  };

  const isRunning = step === "fetching" || step === "checking" || step === "syncing";
  const successCount = syncResults.filter((r) => r.success).length;
  const errorCount = syncResults.filter((r) => !r.success).length;

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
            <Zap className="h-5 w-5" />
            Tezkor sinxronlash
          </DialogTitle>
          <DialogDescription>
            Bir tugma bilan DTM API'dan yangi maktablarni topib, bazaga qo'shadi.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Idle - one click start */}
          {step === "idle" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <School className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2 text-sm">
                DTM API'dan barcha foydalanuvchilarni yuklab, yangi maktablarni avtomatik qo'shadi
              </p>
              {getCachedData("users") && (
                <Badge variant="secondary" className="mb-4 gap-1">
                  <Zap className="h-3 w-3" />
                  Keshdan tezkor yuklash
                </Badge>
              )}
              <Button onClick={runFullSync} size="lg" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Sinxronlashni boshlash
              </Button>
            </div>
          )}

          {/* Running - progress */}
          {isRunning && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="font-medium mb-2">{statusText}</p>
              <Progress value={progress} className="w-72 mb-3" />
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant={step === "fetching" ? "default" : "secondary"} className="text-xs">
                  1. Yuklash
                </Badge>
                <Badge variant={step === "checking" ? "default" : "secondary"} className="text-xs">
                  2. Tekshirish
                </Badge>
                <Badge variant={step === "syncing" ? "default" : "secondary"} className="text-xs">
                  3. Qo'shish
                </Badge>
              </div>
              {usedCache && (
                <p className="text-xs text-muted-foreground mt-2">
                  ⚡ Keshdan tezkor yuklandi
                </p>
              )}
            </div>
          )}

          {/* Done - results */}
          {step === "done" && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex gap-3 flex-wrap">
                {newCount > 0 && (
                  <Badge className="gap-1 text-base py-1 px-3 bg-success/20 text-success border-success/30">
                    <CheckCircle2 className="h-4 w-4" />
                    Yangi: {newCount}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-base py-1 px-3">
                  <School className="h-4 w-4" />
                  Mavjud: {existingCount}
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1 text-base py-1 px-3">
                    <XCircle className="h-4 w-4" />
                    Xato: {errorCount}
                  </Badge>
                )}
              </div>

              {/* Results table */}
              {syncResults.length > 0 && (
                <ScrollArea className="h-[280px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Holat</TableHead>
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
              )}

              {syncResults.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
                  <p>{statusText}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {syncResults.length > 0 && (
                  <Button variant="outline" onClick={downloadResults} className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    CSV yuklab olish
                  </Button>
                )}
                <Button variant="outline" onClick={reset} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Qayta sinxronlash
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
