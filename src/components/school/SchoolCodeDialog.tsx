import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiSettings, fetchDTMUsers } from "@/lib/dtm-api";

interface SchoolCodeDialogProps {
  open: boolean;
  onSchoolCodeSaved: (schoolCode: string) => void;
}

const SCHOOL_CODE_KEY = "school_dtm_code";

export function getStoredSchoolCode(): string | null {
  return localStorage.getItem(SCHOOL_CODE_KEY);
}

export function setStoredSchoolCode(code: string): void {
  localStorage.setItem(SCHOOL_CODE_KEY, code);
}

export function clearStoredSchoolCode(): void {
  localStorage.removeItem(SCHOOL_CODE_KEY);
}

export function SchoolCodeDialog({ open, onSchoolCodeSaved }: SchoolCodeDialogProps) {
  const [schoolCode, setSchoolCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schoolCode.trim()) {
      toast({
        title: "Xatolik",
        description: "Maktab kodini kiriting",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Check if API settings are configured
      const settings = getApiSettings();
      if (!settings) {
        // If no API settings, just save the code and proceed
        setStoredSchoolCode(schoolCode.trim());
        onSchoolCodeSaved(schoolCode.trim());
        toast({
          title: "Muvaffaqiyat",
          description: "Maktab kodi saqlandi",
        });
        return;
      }

      // Verify school code exists in DTM API
      const response = await fetchDTMUsers(settings, 0, 1);
      const hasSchool = response.entities.some(
        (u) => u.school_code === schoolCode.trim()
      );

      // Even if school not found in first page, save the code
      // The actual data fetch will filter by this code
      setStoredSchoolCode(schoolCode.trim());
      onSchoolCodeSaved(schoolCode.trim());
      
      toast({
        title: "Muvaffaqiyat",
        description: hasSchool 
          ? "Maktab kodi tasdiqlandi va saqlandi" 
          : "Maktab kodi saqlandi",
      });
    } catch (error) {
      console.error("Error verifying school code:", error);
      // Still save the code even if verification fails
      setStoredSchoolCode(schoolCode.trim());
      onSchoolCodeSaved(schoolCode.trim());
      toast({
        title: "Muvaffaqiyat",
        description: "Maktab kodi saqlandi",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <School className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Maktab kodini kiriting</DialogTitle>
          <DialogDescription className="text-center">
            DTM tizimidan ma'lumotlarni olish uchun maktabingiz kodini kiriting. 
            Bu kod faqat bir marta kiritiladi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="schoolCode">Maktab kodi</Label>
              <Input
                id="schoolCode"
                placeholder="Masalan: 001"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                disabled={isVerifying}
              />
              <p className="text-xs text-muted-foreground">
                Bu kod DTM tizimidagi maktabingiz identifikatori
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tekshirilmoqda...
                </>
              ) : (
                "Saqlash"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
