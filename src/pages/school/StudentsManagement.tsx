import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Search, Loader2, ExternalLink } from "lucide-react";
import type { DTMStudentItem } from "@/lib/dtm-auth";

export default function StudentsManagement() {
  const { dtmUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const meStudents: DTMStudentItem[] = dtmUser?.students?.items ?? [];
  const meLoading = !dtmUser;

  const filteredStudents = meStudents.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(term) ||
      student.phone.includes(searchTerm)
    );
  });

  return (
    <AdminLayout variant="school">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">O'quvchilar</h1>
            <p className="text-muted-foreground">
              Maktab o'quvchilari va ularning DTM natijalari
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Jami: {dtmUser?.students?.total ?? 0} ta o'quvchi
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="F.I.O. yoki telefon bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>F.I.O.</TableHead>
                <TableHead>Tel raqami</TableHead>
                <TableHead>Guruh</TableHead>
                <TableHead>Jinsi</TableHead>
                <TableHead>Til</TableHead>
                <TableHead>Test holati</TableHead>
                <TableHead className="text-right">Jami ball</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {searchTerm ? "Qidiruv bo'yicha o'quvchi topilmadi" : "O'quvchilar topilmadi"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.group_name}</Badge>
                    </TableCell>
                    <TableCell>
                      {student.gender === "female" ? "Ayol" : student.gender === "male" ? "Erkak" : student.gender}
                    </TableCell>
                    <TableCell>{student.language === "uz" ? "O'zbek" : student.language === "ru" ? "Rus" : student.language}</TableCell>
                    <TableCell>
                      {student.dtm ? (
                        student.dtm.tested ? (
                          <Badge variant="default">Topshirgan</Badge>
                        ) : (
                          <Badge variant="secondary">Topshirmagan</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Ma'lumot yo'q</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {student.dtm?.total_ball != null ? (
                        <Badge
                          variant={student.dtm.total_ball >= 140 ? "default" : "secondary"}
                          className="text-base"
                        >
                          {student.dtm.total_ball}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
