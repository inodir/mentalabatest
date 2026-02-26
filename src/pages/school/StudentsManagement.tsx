import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Search, Loader2, FileDown, X } from "lucide-react";
import type { DTMStudentItem } from "@/lib/dtm-auth";
import { format } from "date-fns";

export default function StudentsManagement() {
  const { dtmUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [testStatusFilter, setTestStatusFilter] = useState("all");

  const meStudents: DTMStudentItem[] = dtmUser?.students?.items ?? [];
  const meLoading = !dtmUser;

  // Extract unique values for filters
  const groups = useMemo(() => [...new Set(meStudents.map(s => s.group_name))].sort(), [meStudents]);
  const languages = useMemo(() => [...new Set(meStudents.map(s => s.language))], [meStudents]);
  const genders = useMemo(() => [...new Set(meStudents.map(s => s.gender))], [meStudents]);

  const filteredStudents = meStudents.filter((student) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || student.full_name.toLowerCase().includes(term) || student.phone.includes(searchTerm) || student.bot_id?.toLowerCase().includes(term);
    const matchesGroup = groupFilter === "all" || student.group_name === groupFilter;
    const matchesGender = genderFilter === "all" || student.gender === genderFilter;
    const matchesLang = langFilter === "all" || student.language === langFilter;
    const matchesTest =
      testStatusFilter === "all" ||
      (testStatusFilter === "tested" && student.dtm?.tested) ||
      (testStatusFilter === "not_tested" && (!student.dtm || !student.dtm.tested));
    return matchesSearch && matchesGroup && matchesGender && matchesLang && matchesTest;
  });

  const activeFilters = [groupFilter, genderFilter, langFilter, testStatusFilter].filter(f => f !== "all").length;

  const clearFilters = () => {
    setSearchTerm("");
    setGroupFilter("all");
    setGenderFilter("all");
    setLangFilter("all");
    setTestStatusFilter("all");
  };

  const formatLang = (l: string) => l === "uz" ? "O'zbek" : l === "ru" ? "Rus" : l === "en" ? "Ingliz" : l;
  const formatGender = (g: string) => g === "female" ? "Ayol" : g === "male" ? "Erkak" : g;
  const formatDate = (d: string) => {
    try { return format(new Date(d), "dd.MM.yyyy HH:mm"); } catch { return d; }
  };

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
            {activeFilters > 0 && ` · Filtrlangan: ${filteredStudents.length}`}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="F.I.O. yoki telefon bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Guruh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha guruh</SelectItem>
              {groups.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Jinsi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha jins</SelectItem>
              {genders.map(g => (
                <SelectItem key={g} value={g}>{formatGender(g)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={langFilter} onValueChange={setLangFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Til" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha til</SelectItem>
              {languages.map(l => (
                <SelectItem key={l} value={l}>{formatLang(l)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={testStatusFilter} onValueChange={setTestStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Test holati" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holat</SelectItem>
              <SelectItem value="tested">Topshirgan</SelectItem>
              <SelectItem value="not_tested">Topshirmagan</SelectItem>
            </SelectContent>
          </Select>

          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Tozalash ({activeFilters})
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-auto">
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
                <TableHead>Test holati</TableHead>
                <TableHead>1-fan</TableHead>
                <TableHead>2-fan</TableHead>
                <TableHead className="text-right">Jami ball</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    {searchTerm || activeFilters > 0 ? "Qidiruv bo'yicha o'quvchi topilmadi" : "O'quvchilar topilmadi"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{student.full_name}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.group_name}</Badge>
                    </TableCell>
                    <TableCell>{formatGender(student.gender)}</TableCell>
                    <TableCell>{formatLang(student.language)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatDate(student.created_at)}
                    </TableCell>
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
                    {(() => {
                      const subjects = student.dtm?.subjects ?? [];
                      const mandatory = subjects.filter(s => s.subject_name.includes("majburiy"));
                      const elective = subjects.filter(s => !s.subject_name.includes("majburiy"));
                      const fan1 = elective[0];
                      const fan2 = elective[1];
                      return (
                        <>
                          <TableCell>
                            {fan1 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={fan1.earned_ball > 0 ? "default" : "secondary"} className="text-xs cursor-default">
                                      {fan1.subject_name}: {fan1.earned_ball}/{fan1.max_ball}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>{fan1.percent}%</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {fan2 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant={fan2.earned_ball > 0 ? "default" : "secondary"} className="text-xs cursor-default">
                                      {fan2.subject_name}: {fan2.earned_ball}/{fan2.max_ball}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>{fan2.percent}%</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        </>
                      );
                    })()}
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
