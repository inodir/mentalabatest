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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { DTMStudentsTable } from "@/components/school/DTMStudentsTable";
import { Search, Loader2, RefreshCw } from "lucide-react";
import type { DTMStudentItem } from "@/lib/dtm-auth";

export default function StudentsManagement() {
  const { dtmUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // DTM data hook for users with test results
  const { 
    students: dtmStudents, 
    loading: dtmLoading, 
    refetch: refetchDTM,
    schoolCode 
  } = useSchoolDTMData();

  // Students from /me endpoint
  const meStudents: DTMStudentItem[] = dtmUser?.students?.items ?? [];
  const meLoading = !dtmUser;

  const filteredMeStudents = meStudents.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(term) ||
      student.phone.includes(searchTerm)
    );
  });

  return (
    <AdminLayout variant="school">
      <div className="space-y-6">
        <Tabs defaultValue="students" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">O'quvchilar</h1>
              <p className="text-muted-foreground">
                Maktab o'quvchilarini ko'ring va boshqaring
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="students">O'quvchilar</TabsTrigger>
              <TabsTrigger value="dtm">DTM natijalari</TabsTrigger>
            </TabsList>
          </div>

          {/* Students from /me */}
          <TabsContent value="students" className="mt-6 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="F.I.O. yoki telefon bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Jami: {dtmUser?.students?.total ?? 0} ta o'quvchi
              </div>
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
                    <TableHead>Ro'yxatdan o'tgan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredMeStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        {searchTerm ? "Qidiruv bo'yicha o'quvchi topilmadi" : "O'quvchilar topilmadi"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMeStudents.map((student, index) => (
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
                        <TableCell className="text-muted-foreground">
                          {new Date(student.created_at).toLocaleDateString("uz-UZ")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* DTM Students Tab - students with test data */}
          <TabsContent value="dtm" className="mt-6">
            {schoolCode ? (
              <DTMStudentsTable 
                students={dtmStudents.filter(s => !s.has_result)} 
                loading={dtmLoading}
                onRefresh={() => refetchDTM(true)}
                title="Natijasi chiqmagan o'quvchilar"
                emptyMessage="Barcha o'quvchilarning natijasi chiqqan"
                showResultStatus={false}
              />
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  DTM ma'lumotlarini ko'rish uchun avval bosh sahifada maktab kodini kiriting
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
