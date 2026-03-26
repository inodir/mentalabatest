import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

interface Student {
  id: number | string;
  full_name: string;
  phone?: string;
  total_point?: number | null;
  has_result?: boolean;
  [key: string]: any;
}

interface ScoreStudentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  scoreRange: { min: number; max: number } | null;
}

export function ScoreStudentsDialog({
  isOpen,
  onClose,
  students,
  scoreRange,
}: ScoreStudentsDialogProps) {
  if (!scoreRange) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>O'quvchilar ro'yxati</span>
            </div>
            <Badge variant="outline" className="text-sm font-semibold px-3 py-1 rounded-full">
              Ball: {scoreRange.min}-{scoreRange.max}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Ushbu ball oralig'ida {students.length} ta o'quvchi topildi.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>F.I.SH</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead className="text-right">Ball</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <TableRow key={student.id || index} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center text-muted-foreground text-xs">{index + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{student.full_name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{student.phone || "—"}</TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          {student.total_point ?? (student.dtm?.total_ball as number) ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                        O'quvchilar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
