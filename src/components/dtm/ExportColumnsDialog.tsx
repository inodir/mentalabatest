// Export dialog with school filtering and ZIP support
import { useState, useMemo } from "react";
import { DTMUser } from "@/lib/dtm-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Filter, Search, School, X, FileArchive } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface ExportColumn {
  key: string;
  label: string;
  defaultChecked: boolean;
}

export const ALL_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "school_name", label: "Maktab nomi", defaultChecked: true },
  { key: "school_code", label: "Maktab kodi", defaultChecked: true },
  { key: "region", label: "Viloyat", defaultChecked: true },
  { key: "district", label: "Tuman", defaultChecked: true },
  { key: "full_name", label: "O'quvchi FIO", defaultChecked: true },
  { key: "phone", label: "Telefon", defaultChecked: true },
  { key: "gender", label: "Jinsi", defaultChecked: false },
  { key: "group_name", label: "Guruh nomi", defaultChecked: true },
  { key: "chat_id", label: "Chat ID", defaultChecked: false },
  { key: "bot_id", label: "Bot ID", defaultChecked: false },
  { key: "has_result", label: "Natija bor", defaultChecked: true },
  { key: "total_point", label: "Umumiy ball", defaultChecked: true },
  { key: "language", label: "Til", defaultChecked: false },
  { key: "created_at", label: "Ro'yxatdan o'tgan sana", defaultChecked: true },
];

export interface ExportFilters {
  searchTerm: string;
  gender: string;
  language: string;
  hasResult: string;
  groupName: string;
  district: string;
  schoolCodes: string[];
}

const INITIAL_FILTERS: ExportFilters = {
  searchTerm: "",
  gender: "all",
  language: "all",
  hasResult: "all",
  groupName: "all",
  district: "all",
  schoolCodes: [],
};

interface SchoolOption {
  code: string;
  name: string;
}

interface ExportColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (selectedColumns: string[], filters: ExportFilters) => void;
  exporting: boolean;
  exportProgress?: string;
  allUsers?: DTMUser[];
  schools?: SchoolOption[];
}

export function ExportColumnsDialog({
  open,
  onOpenChange,
  onExport,
  exporting,
  exportProgress,
  allUsers = [],
  schools = [],
}: ExportColumnsDialogProps) {
  const groupNames = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((u) => { if (u.group_name) set.add(u.group_name); });
    return [...set].sort();
  }, [allUsers]);

  const genders = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((u) => { if (u.gender) set.add(u.gender); });
    return [...set].sort();
  }, [allUsers]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((u) => { if (u.language) set.add(u.language); });
    return [...set].sort();
  }, [allUsers]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((u) => { if (u.district) set.add(u.district); });
    return [...set].sort();
  }, [allUsers]);

  const GENDER_LABELS: Record<string, string> = { male: "Erkak", female: "Ayol" };
  const LANG_LABELS: Record<string, string> = { uz: "O'zbekcha", ru: "Ruscha", en: "Inglizcha" };

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_EXPORT_COLUMNS.filter((c) => c.defaultChecked).map((c) => c.key))
  );
  const [filters, setFilters] = useState<ExportFilters>(INITIAL_FILTERS);
  const [schoolSearch, setSchoolSearch] = useState("");

  const filteredSchools = useMemo(() => {
    if (!schoolSearch.trim()) return schools;
    const term = schoolSearch.toLowerCase();
    return schools.filter(
      (s) => s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)
    );
  }, [schools, schoolSearch]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(ALL_EXPORT_COLUMNS.map((c) => c.key)));
  const deselectAll = () => setSelected(new Set());

  const updateFilter = (key: keyof ExportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSchool = (code: string) => {
    setFilters((prev) => {
      const codes = prev.schoolCodes.includes(code)
        ? prev.schoolCodes.filter((c) => c !== code)
        : [...prev.schoolCodes, code];
      return { ...prev, schoolCodes: codes };
    });
  };

  const selectAllSchools = () => {
    setFilters((prev) => ({ ...prev, schoolCodes: filteredSchools.map((s) => s.code) }));
  };

  const deselectAllSchools = () => {
    setFilters((prev) => ({ ...prev, schoolCodes: [] }));
  };

  const hasActiveFilters = filters.gender !== "all" || filters.language !== "all" ||
    filters.hasResult !== "all" || filters.groupName !== "all" || filters.district !== "all" ||
    filters.searchTerm.trim().length > 0 || filters.schoolCodes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Eksport sozlamalari
          </DialogTitle>
          <DialogDescription>
            Maktablarni tanlang, ustunlarni belgilang — ZIP fayl yuklab olinadi
          </DialogDescription>
        </DialogHeader>

        {/* School filter section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <School className="h-4 w-4 text-muted-foreground" />
              Maktablar
              {filters.schoolCodes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.schoolCodes.length} ta tanlangan
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllSchools} className="text-xs h-7">
                Barchasi
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAllSchools} className="text-xs h-7">
                Tozalash
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Maktab nomi yoki kodi bo'yicha qidirish..."
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Selected schools badges */}
          {filters.schoolCodes.length > 0 && filters.schoolCodes.length <= 10 && (
            <div className="flex flex-wrap gap-1.5">
              {filters.schoolCodes.map((code) => {
                const school = schools.find((s) => s.code === code);
                return (
                  <Badge key={code} variant="outline" className="text-xs gap-1 pr-1">
                    {school?.name || code}
                    <button onClick={() => toggleSchool(code)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          <ScrollArea className="h-[160px] rounded-md border p-2">
            <div className="space-y-1">
              {filteredSchools.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Maktab topilmadi</p>
              ) : (
                filteredSchools.map((s) => (
                  <div
                    key={s.code}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer"
                    onClick={() => toggleSchool(s.code)}
                  >
                    <Checkbox
                      checked={filters.schoolCodes.includes(s.code)}
                      onCheckedChange={() => toggleSchool(s.code)}
                    />
                    <span className="text-sm flex-1 truncate">{s.name}</span>
                    <code className="text-xs text-muted-foreground font-mono">{s.code}</code>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Other filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Qo'shimcha filtrlar
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="FIO, telefon bo'yicha qidirish..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.district} onValueChange={(v) => updateFilter("district", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tuman/Shahar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha tuman/shahar</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.gender} onValueChange={(v) => updateFilter("gender", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Jinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha jins</SelectItem>
                {genders.map((g) => (
                  <SelectItem key={g} value={g}>{GENDER_LABELS[g] || g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.language} onValueChange={(v) => updateFilter("language", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Til" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha tillar</SelectItem>
                {languages.map((l) => (
                  <SelectItem key={l} value={l}>{LANG_LABELS[l] || l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.hasResult} onValueChange={(v) => updateFilter("hasResult", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Natija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="true">Natijasi bor</SelectItem>
                <SelectItem value="false">Natijasi yo'q</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.groupName} onValueChange={(v) => updateFilter("groupName", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Guruh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha guruhlar</SelectItem>
                {groupNames.map((g) => (
                  <SelectItem key={g} value={g}>{g} guruh</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setFilters(INITIAL_FILTERS); setSchoolSearch(""); }} className="text-xs">
              Barcha filtrlarni tozalash
            </Button>
          )}
        </div>

        <Separator />

        {/* Columns section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ustunlar</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                Barchasi
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7">
                Tozalash
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto py-1">
            {ALL_EXPORT_COLUMNS.map((col) => (
              <div key={col.key} className="flex items-center gap-2">
                <Checkbox
                  id={`col-${col.key}`}
                  checked={selected.has(col.key)}
                  onCheckedChange={() => toggle(col.key)}
                />
                <Label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">
                  {col.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Bekor qilish
          </Button>
          <Button
            onClick={() => onExport(Array.from(selected), filters)}
            disabled={selected.size === 0 || exporting}
          >
            {exporting ? (
              exportProgress || "Yuklanmoqda..."
            ) : (
              <>
                <FileArchive className="mr-2 h-4 w-4" />
                ZIP eksport ({selected.size} ustun)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
