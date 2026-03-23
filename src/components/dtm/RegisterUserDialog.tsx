import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { createDTMUser, getApiSettings } from "@/lib/dtm-api";
import { toast } from "sonner";

interface RegisterUserDialogProps {
  onUserCreated?: () => void;
  allSchools?: { code: string; name?: string | null; region?: string; district?: string }[];
}

const SUBJECTS = [
  { mt_id: 6, name_uz: "Biologiya" },
  { mt_id: 7, name_uz: "Kimyo" },
  { mt_id: 20, name_uz: "Matematika" },
  { mt_id: 23, name_uz: "Ingliz tili" },
  { mt_id: 24, name_uz: "Fizika" },
  { mt_id: 25, name_uz: "Geografiya" },
  { mt_id: 26, name_uz: "Tarix" },
  { mt_id: 27, name_uz: "Ona tili va adabiyot" },
  { mt_id: 35, name_uz: "Davlat va huquq asoslari" },
];

export function RegisterUserDialog({ onUserCreated, allSchools = [] }: RegisterUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bot_id: "",
    full_name: "",
    phone: "",
    school_code: "",
    first_subject_id: "20",
    second_subject_id: "23",
    password: "1111",
    role: "user",
    language: "uz",
    gender: "male",
    region: "",
    district: "",
    group_name: "",
  });

  // Dynamic Location Lists
  const regions = useMemo(() => {
    return Array.from(new Set(allSchools.map(s => s.region).filter(Boolean))).sort() as string[];
  }, [allSchools]);

  const districts = useMemo(() => {
    if (!formData.region) return [];
    return Array.from(new Set(allSchools.filter(s => s.region === formData.region).map(s => s.district).filter(Boolean))).sort() as string[];
  }, [allSchools, formData.region]);

  const filteredSchools = useMemo(() => {
    return allSchools.filter(s => {
      const matchRegion = !formData.region || s.region === formData.region;
      const matchDistrict = !formData.district || s.district === formData.district;
      return matchRegion && matchDistrict;
    });
  }, [allSchools, formData.region, formData.district]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      
      // Drilling resets
      if (key === "region") {
        next.district = "";
        next.school_code = "";
      } else if (key === "district") {
        next.school_code = "";
      } else if (key === "school_code") {
        const school = allSchools.find(s => s.code === value);
        if (school) {
          next.region = school.region || prev.region;
          next.district = school.district || prev.district;
        }
      }
      
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.school_code || !formData.bot_id) {
      toast.error("Iltimos, barcha majburiy maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    const settings = getApiSettings();
    if (!settings) {
      toast.error("API sozlamalari topilmadi");
      setLoading(false);
      return;
    }

    const payload = {
       ...formData,
       first_subject_id: Number(formData.first_subject_id),
       second_subject_id: Number(formData.second_subject_id),
    };

    console.log("Submitting DTM User Payload:", payload);

    const result = await createDTMUser(settings, payload);
    setLoading(false);

    if (result.success) {
      toast.success(`${formData.full_name} muvaffaqiyatli qo'shildi`);
      setOpen(false);
      // Reset form
      setFormData({
        bot_id: "",
        full_name: "",
        phone: "",
        school_code: "",
        first_subject_id: "20",
        second_subject_id: "23",
        password: "1111",
        role: "user",
        language: "uz",
        gender: "male",
        region: "",
        district: "",
        group_name: "",
      });
      onUserCreated?.();
    } else {
      toast.error(result.error || "Foydalanuvchini qo'shishda xatolik");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Foydalanuvchi qo'shish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Foydalanuvchi Ro'yxatdan o'tkazish
          </DialogTitle>
          <DialogDescription>
            DTM tizimi uchun yangi foydalanuvchi ma'lumotlarini kiriting.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bot_id">Bot ID <span className="text-destructive">*</span></Label>
            <Input
              id="bot_id"
              placeholder="5935882106"
              value={formData.bot_id}
              onChange={(e) => handleChange("bot_id", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">F.I.O. <span className="text-destructive">*</span></Label>
              <Input
                id="full_name"
                placeholder="Xabibullayev"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                placeholder="+998901234567"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="region">Viloyat</Label>
              {regions.length > 0 ? (
                <Select value={formData.region} onValueChange={(v) => handleChange("region", v)}>
                  <SelectTrigger id="region" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="region"
                  placeholder="Toshkent shahar"
                  value={formData.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="district">Tuman</Label>
              {districts.length > 0 ? (
                <Select value={formData.district} onValueChange={(v) => handleChange("district", v)}>
                  <SelectTrigger id="district" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="district"
                  placeholder="Yunusobod tumani"
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  disabled={!formData.region && regions.length > 0}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="school_code">Maktab kodi <span className="text-destructive">*</span></Label>
              {filteredSchools.length > 0 ? (
                <Select value={formData.school_code} onValueChange={(v) => handleChange("school_code", v)}>
                  <SelectTrigger id="school_code" className="h-9">
                    <SelectValue placeholder="Tanlang" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {filteredSchools.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.code} {s.name ? `(${s.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="school_code"
                  placeholder="YUN80"
                  value={formData.school_code}
                  onChange={(e) => handleChange("school_code", e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group_name">Guruh nomi</Label>
              <Input
                id="group_name"
                placeholder="B"
                value={formData.group_name}
                onChange={(e) => handleChange("group_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_subject_id">1-Fan</Label>
              <Select value={formData.first_subject_id} onValueChange={(v) => handleChange("first_subject_id", v)}>
                <SelectTrigger id="first_subject_id" className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.mt_id} value={String(s.mt_id)}>
                      {s.name_uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="second_subject_id">2-Fan</Label>
              <Select value={formData.second_subject_id} onValueChange={(v) => handleChange("second_subject_id", v)}>
                <SelectTrigger id="second_subject_id" className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.mt_id} value={String(s.mt_id)}>
                      {s.name_uz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="language">Til</Label>
              <Select value={formData.language} onValueChange={(v) => handleChange("language", v)}>
                <SelectTrigger id="language" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="ru">Ruscha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">Jins</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger id="gender" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkak</SelectItem>
                  <SelectItem value="female">Ayol</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading} size="sm" className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
