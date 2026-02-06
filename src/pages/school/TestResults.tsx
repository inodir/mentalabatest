import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSchoolDTMData } from "@/hooks/useSchoolDTMData";
import { 
  Search, 
  Download, 
  RefreshCw, 
  FileText, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { DTMUser } from "@/lib/dtm-api";

export default function TestResults() {
  const { 
    students: allStudents, 
    loading, 
    refetch,
    schoolCode,
    error 
  } = useSchoolDTMData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("total_point");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter only students with results
  const studentsWithResults = allStudents.filter(s => s.has_result);

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

  const filteredResults = studentsWithResults.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.phone && student.phone.includes(searchTerm));
    const matchesMinScore = !minScore || (student.total_point ?? 0) >= parseInt(minScore);
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
      case "total_point":
        aVal = a.total_point ?? 0;
        bVal = b.total_point ?? 0;
        break;
      default:
        aVal = a[sortColumn as keyof DTMUser];
        bVal = b[sortColumn as keyof DTMUser];
    }
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleExportCSV = () => {
    const headers = ["#", "F.I.O.", "Telefon", "Jami ball"];
    const rows = sortedResults.map((s, i) => [
      i + 1,
      s.full_name,
      s.phone || "-",
      s.total_point ?? "-",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-natijalari.csv";
    a.click();
  };

  // Calculate stats
  const avgScore = studentsWithResults.length > 0
    ? Math.round(
        studentsWithResults.reduce((sum, s) => sum + (s.total_point || 0), 0) /
          studentsWithResults.length
      )
    : 0;
  
  const maxScore = studentsWithResults.length > 0
    ? Math.max(...studentsWithResults.map(s => s.total_point || 0))
    : 0;

  return (
    <AdminLayout variant="school">
      <div className="space-y-6">
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch(true)}
              disabled={loading || !schoolCode}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Yangilash
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={sortedResults.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No School Code State */}
        {!schoolCode && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Maktab kodi kiritilmagan</h3>
                <p className="text-muted-foreground">
                  DTM natijalarini ko'rish uchun avval Bosh sahifada maktab kodingizni kiriting
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {schoolCode && (
          <>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Natijasi bor o'quvchilar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{studentsWithResults.length}</p>
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

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="F.I.O. yoki telefon bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Natijalar jadvali ({sortedResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
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
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handleSort("total_point")}
                            >
                              <div className="flex items-center justify-end">
                                Jami ball {getSortIcon("total_point")}
                              </div>
                            </TableHead>
                            <TableHead className="text-right">Hujjatlar</TableHead>
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
                              <TableCell className="text-right">
                                <Badge 
                                  variant={(student.total_point ?? 0) >= 140 ? "default" : "secondary"}
                                  className="text-base"
                                >
                                  {student.total_point ?? 0}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {student.test_file_url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                    >
                                      <a 
                                        href={student.test_file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Test
                                      </a>
                                    </Button>
                                  )}
                                  {student.test_result_file_url && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                    >
                                      <a 
                                        href={student.test_result_file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Natija
                                      </a>
                                    </Button>
                                  )}
                                </div>
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
      </div>
    </AdminLayout>
  );
}
