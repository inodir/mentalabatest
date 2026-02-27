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
import { Download, Filter, Search } from "lucide-react";
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
  { key: "group_name", label: "Guruh nomi", defaultChecked: false },
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
}

const INITIAL_FILTERS: ExportFilters = {
  searchTerm: "",
  gender: "all",
  language: "all",
  hasResult: "all",
  groupName: "all",
};

interface ExportColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (selectedColumns: string[], filters: ExportFilters) => void;
  exporting: boolean;
  exportProgress?: string;
  allUsers?: DTMUser[];
}

export function ExportColumnsDialog({
  open,
  onOpenChange,
  onExport,
  exporting,
  exportProgress,
  allUsers = [],
}: ExportColumnsDialogProps) {
  const groupNames = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach((u) => { if (u.group_name) set.add(u.group_name); });
    return [...set].sort();
  }, [allUsers]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_EXPORT_COLUMNS.filter((c) => c.defaultChecked).map((c) => c.key))
  );
  const [filters, setFilters] = useState<ExportFilters>(INITIAL_FILTERS);

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

  const hasActiveFilters = filters.gender !== "all" || filters.language !== "all" ||
    filters.hasResult !== "all" || filters.groupName !== "all" || filters.searchTerm.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Eksport sozlamalari</DialogTitle>
          <DialogDescription>
            Ustunlarni tanlang va kerak bo'lsa filtrlarni qo'llang
          </DialogDescription>
        </DialogHeader>

        {/* Filters section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtrlar
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
            <Select value={filters.gender} onValueChange={(v) => updateFilter("gender", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Jinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha jins</SelectItem>
                <SelectItem value="male">Erkak</SelectItem>
                <SelectItem value="female">Ayol</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.language} onValueChange={(v) => updateFilter("language", v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Til" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha tillar</SelectItem>
                <SelectItem value="uz">O'zbekcha</SelectItem>
                <SelectItem value="ru">Ruscha</SelectItem>
                <SelectItem value="en">Inglizcha</SelectItem>
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
            <Button variant="ghost" size="sm" onClick={() => setFilters(INITIAL_FILTERS)} className="text-xs">
              Filtrlarni tozalash
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

          <div className="grid grid-cols-2 gap-2.5 max-h-[200px] overflow-y-auto py-1">
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
                <Download className="mr-2 h-4 w-4" />
                Eksport ({selected.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
