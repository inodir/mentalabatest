import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExcelExportButtonProps {
  onExport: () => boolean;
  filename: string;
  label?: string;
}

export function ExcelExportButton({
  onExport,
  filename,
  label = "Excel yuklab olish",
}: ExcelExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Small timeout to allow spinner component re-render
      await new Promise((r) => setTimeout(r, 100));
      const success = onExport();
      if (success) {
        toast.success(`${filename}.xlsx yuklab olindi`);
      } else {
        toast.error("Excel eksportda xato");
      }
    } catch (err) {
      toast.error("Formatlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      className="glass-card hover:bg-muted/50 rounded-xl"
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4 text-green-600" />
      )}
      <span>{loading ? "Yuklanmoqda..." : label}</span>
    </Button>
  );
}
