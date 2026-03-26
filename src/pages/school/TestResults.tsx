import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DebouncedInput } from "@/components/ui/debounced-input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSchoolStudents } from "@/hooks/useSchoolStudents";
import { useShowResults } from "@/hooks/useShowResults";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, 
  Download, 
  FileText, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  AlertCircle,
  FileDown,
} from "lucide-react";
import type { DTMStudentItem } from "@/lib/dtm-auth";

function hasStudentResult(student: DTMStudentItem) {
  return Boolean(
    student.dtm?.tested ||
    student.dtm?.total_ball != null ||
    student.dtm?.result_file ||
    (student.dtm?.subjects?.length ?? 0) > 0
  );
}

export default function TestResults() {
  const { allStudents, loading } = useSchoolStudents();
  const { showResults } = useShowResults();
  const { dtmUser } = useAuth();
  const schoolCode = dtmUser?.school?.code ?? null;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("total_ball");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Some API responses have incomplete `tested` flags even when score/file data exists.
  const testedStudents = allStudents.filter(hasStudentResult);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const filteredResults = testedStudents.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.phone && student.phone.includes(searchTerm));
    const matchesMinScore = !minScore || (student.dtm?.total_ball ?? 0) >= parseInt(minScore);
    return matchesSearch && matchesMinScore;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    switch (sortColumn) {
      case "full_name":
        aVal = a.full_name.toLowerCase();
        bVal = b.full_name.toLowerCase();
        break;
      case "total_ball":
        aVal = a.dtm?.total_ball ?? 0;
        bVal = b.dtm?.total_ball ?? 0;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleExportCSV = () => {
    // Collect all unique subject names
    const subjectNames = new Set<string>();
    sortedResults.forEach(s => s.dtm?.subjects?.forEach(sub => subjectNames.add(sub.subject_name)));
    const subjectList = [...subjectNames];

    const headers = ["#", "F.I.O.", "Telefon", ...subjectList, "Jami ball"];
    const rows = sortedResults.map((s, i) => [
      i + 1,
      s.full_name,
      s.phone || "-",
      ...subjectList.map(name => {
        const sub = s.dtm?.subjects?.find(x => x.subject_name === name);
        return sub ? `${sub.earned_ball}/${sub.max_ball}` : "-";
      }),
      s.dtm?.total_ball ?? "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-natijalari.csv";
    a.click();
  };

  const avgScore = testedStudents.length > 0
    ? Math.round(
        testedStudents.reduce((sum, s) => sum + (s.dtm?.total_ball || 0), 0) /
          testedStudents.length
      )
    : 0;
  
  const maxScore = testedStudents.length > 0
    ? Math.max(...testedStudents.map(s => s.dtm?.total_ball || 0))
    : 0;

  return (
    <AdminLayout variant="school">
      <div className="space-y-6">
        {!showResults ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold">Natijalar hozircha yopiq</h2>
            <p className="text-muted-foreground mt-2">
              Admin tomonidan natijalarni ko'rish vaqtincha o'chirilgan. Iltimos, keyinroq qayta tekshiring.
            </p>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test natijalari</h1>
            <p className="text-muted-foreground">
              DTM test natijalari chiqqan o'quvchilar
              {schoolCode && (
                <Badge variant="secondary" className="ml-2">
                  Maktab kodi: {schoolCode}
                </Badge>
              )}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={sortedResults.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {!schoolCode && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Maktab kodi kiritilmagan</h3>
                <p className="text-muted-foreground">
                  DTM natijalarini ko'rish uchun avval tizimga kiring
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {schoolCode && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Topshirgan o'quvchilar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{testedStudents.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    O'rtacha ball
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{avgScore}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Eng yuqori ball
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{maxScore}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <DebouncedInput
                  placeholder="F.I.O. yoki telefon bo'yicha qidirish..."
                  value={searchTerm}
                  onDebounceChange={setSearchTerm}
                  className="pl-9"
                />

              </div>
              <div className="w-[150px]">
                <Input
                  type="number"
                  placeholder="Min ball"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Natijalar jadvali ({sortedResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Yuklanmoqda...
                  </div>
                ) : sortedResults.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    Natijali o'quvchilar topilmadi
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="max-h-[500px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">#</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort("full_name")}
                            >
                              <div className="flex items-center">
                                F.I.O. {getSortIcon("full_name")}
                              </div>
                            </TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead>Fanlar</TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handleSort("total_ball")}
                            >
                              <div className="flex items-center justify-end">
                                Jami ball {getSortIcon("total_ball")}
                              </div>
                            </TableHead>
                            <TableHead className="text-center">Fayl</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedResults.map((student, index) => (
                            <TableRow key={student.id}>
                              <TableCell className="text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.full_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {student.phone || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-[300px]">
                                  {student.dtm?.subjects?.length ? (
                                    student.dtm.subjects.map(sub => (
                                      <TooltipProvider key={sub.subject_id}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant={sub.earned_ball > 0 ? "default" : "secondary"} className="text-xs cursor-default">
                                              {sub.subject_name.replace(/ *\(majburiy\)/, " (M)")}: {sub.earned_ball}/{sub.max_ball}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>{sub.subject_name} — {sub.percent}%</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant={(student.dtm?.total_ball ?? 0) >= 140 ? "default" : "secondary"}
                                  className="text-base"
                                >
                                  {student.dtm?.total_ball ?? 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {student.dtm?.result_file ? (
                                  <a
                                    href={student.dtm.result_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-primary hover:underline"
                                  >
                                    <FileDown className="h-4 w-4" />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </>
        )}
      </div>
    </AdminLayout>
  );
}
