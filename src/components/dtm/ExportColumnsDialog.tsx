import { useState } from "react";
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
import { Download } from "lucide-react";

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

interface ExportColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (selectedColumns: string[]) => void;
  exporting: boolean;
  exportProgress?: string;
}

export function ExportColumnsDialog({
  open,
  onOpenChange,
  onExport,
  exporting,
  exportProgress,
}: ExportColumnsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_EXPORT_COLUMNS.filter((c) => c.defaultChecked).map((c) => c.key))
  );

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eksport ustunlarini tanlang</DialogTitle>
          <DialogDescription>
            CSV faylga qaysi ma'lumotlar kiritilishini belgilang
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Barchasini tanlash
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Barchasini olib tashlash
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto py-2">
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={() => onExport(Array.from(selected))}
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
