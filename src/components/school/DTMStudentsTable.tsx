import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DTMUser } from "@/lib/dtm-api";

interface DTMStudentsTableProps {
  students: DTMUser[];
  loading: boolean;
  onRefresh?: () => void;
  title?: string;
  emptyMessage?: string;
  showResultStatus?: boolean;
}

export function DTMStudentsTable({ 
  students, 
  loading, 
  onRefresh,
  title = "DTM ro'yxatdagi o'quvchilar",
  emptyMessage = "O'quvchilar topilmadi",
  showResultStatus = true
}: DTMStudentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(term) ||
      (student.phone && student.phone.includes(searchTerm)) ||
      (student.bot_id && student.bot_id.toLowerCase().includes(term)) ||
      (student.chat_id && student.chat_id.toLowerCase().includes(term))
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title} ({students.length})
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                placeholder="Ism, bot ID yoki telefon bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Ism</th>
                    <th className="px-4 py-3 text-left font-medium">Telefon</th>
                    {showResultStatus && (
                      <th className="px-4 py-3 text-left font-medium">Holati</th>
                    )}
                    <th className="px-4 py-3 text-right font-medium">Ball</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">{student.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {student.phone || "-"}
                      </td>
                      {showResultStatus && (
                        <td className="px-4 py-3">
                          {student.has_result ? (
                            <Badge variant="default">Natija bor</Badge>
                          ) : (
                            <Badge variant="secondary">Natija yo'q</Badge>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right font-medium">
                        {student.total_point ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
