import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";

interface PDFExportButtonProps {
  onExport: () => Promise<void>;
  label?: string;
  variant?: "default" | "outline" | "secondary";
}

export function PDFExportButton({
  onExport,
  label = "PDF yuklab olish",
  variant = "outline",
}: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await onExport();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-2 rounded-xl"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {loading ? "Yaratilmoqda..." : label}
    </Button>
  );
}
