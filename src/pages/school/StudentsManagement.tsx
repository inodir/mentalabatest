import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, X, ChevronLeft, ChevronRight, RefreshCw, Eye, EyeOff, Copy, Check, FileText } from "lucide-react";
import { format } from "date-fns";
import { useSchoolStudents } from "@/hooks/useSchoolStudents";
import { DTMStudentItem } from "@/lib/dtm-auth";
import { toast } from "sonner";
export default function StudentsManagement() {
  const {
    allStudents, loading, loadingMore, total, page, pageSize, setPage, setPageSize,
    totalPages, paginatedStudents, retry, progress,
  } = useSchoolStudents();

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [testStatusFilter, setTestStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const groups = useMemo(() => [...new Set(allStudents.map(s => s.group_name))].filter(Boolean).sort(), [allStudents]);
  const languages = useMemo(() => [...new Set(allStudents.map(s => s.language))].filter(Boolean), [allStudents]);
  const genders = useMemo(() => [...new Set(allStudents.map(s => s.gender))].filter(Boolean), [allStudents]);

  // Filter ALL students first, then paginate
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || student.full_name.toLowerCase().includes(term) || student.bot_id?.toLowerCase().includes(term);
      const matchesGroup = groupFilter === "all" || student.group_name === groupFilter;
      const matchesGender = genderFilter === "all" || student.gender === genderFilter;
      const matchesLang = langFilter === "all" || student.language === langFilter;
      const matchesTest =
        testStatusFilter === "all" ||
        (testStatusFilter === "tested" && student.dtm?.tested) ||
        (testStatusFilter === "not_tested" && (!student.dtm || !student.dtm.tested));
      return matchesSearch && matchesGroup && matchesGender && matchesLang && matchesTest;
    });
  }, [allStudents, searchTerm, groupFilter, genderFilter, langFilter, testStatusFilter]);

  // Paginate filtered results
  const hasFilters = searchTerm || groupFilter !== "all" || genderFilter !== "all" || langFilter !== "all" || testStatusFilter !== "all";
  const displayStudents = hasFilters
    ? filteredStudents.slice((page - 1) * pageSize, page * pageSize)
    : paginatedStudents;
  const displayTotal = hasFilters ? filteredStudents.length : total;
  const displayPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  const activeFilters = [groupFilter, genderFilter, langFilter, testStatusFilter].filter(f => f !== "all").length + (searchTerm ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm("");
    setGroupFilter("all");
    setGenderFilter("all");
    setLangFilter("all");
    setTestStatusFilter("all");
    setPage(1);
  };

  const formatLang = (l: string) => l === "uz" ? "O'zbek" : l === "ru" ? "Rus" : l === "en" ? "Ingliz" : l;
  const formatGender = (g: string) => g === "female" ? "Ayol" : g === "male" ? "Erkak" : g;
  const formatDate = (d: string) => {
    try { return format(new Date(d), "dd.MM.yyyy HH:mm"); } catch { return d; }
  };

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    toast.success("ID nusxalandi");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset page on filter change
  const handleFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
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
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={retry} disabled={loading} className="gap-1">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Yangilash
            </Button>
            <div className="text-sm text-muted-foreground">
              {loading
                ? "Yuklanmoqda..."
                : <>
                    Jami: {total} ta o'quvchi
                    {hasFilters && ` · Filtrlangan: ${displayTotal}`}
                  </>
              }
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="F.I.O. bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>

          <Select value={groupFilter} onValueChange={handleFilterChange(setGroupFilter)}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Guruh" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha guruh</SelectItem>
              {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={handleFilterChange(setGenderFilter)}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Jinsi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha jins</SelectItem>
              {genders.map(g => <SelectItem key={g} value={g}>{formatGender(g)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={langFilter} onValueChange={handleFilterChange(setLangFilter)}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Til" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha til</SelectItem>
              {languages.map(l => <SelectItem key={l} value={l}>{formatLang(l)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={testStatusFilter} onValueChange={handleFilterChange(setTestStatusFilter)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Test holati" /></SelectTrigger>
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
                <TableHead className="w-10"></TableHead>
                <TableHead>F.I.O.</TableHead>
                <TableHead>Guruh</TableHead>
                <TableHead>Jinsi</TableHead>
                <TableHead>Til</TableHead>
                <TableHead>Ro'yxatdan o'tgan</TableHead>
                <TableHead>Test holati</TableHead>
                <TableHead>1-fan</TableHead>
                <TableHead>2-fan</TableHead>
                <TableHead className="text-right">Jami ball</TableHead>
                <TableHead className="text-center">Natija fayli</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Yuklanmoqda...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                    {hasFilters ? "Qidiruv bo'yicha o'quvchi topilmadi" : "O'quvchilar topilmadi"}
                  </TableCell>
                </TableRow>
              ) : (
                displayStudents.map((student, index) => {
                  const rowNum = (page - 1) * pageSize + index + 1;
                  const subjects = student.dtm?.subjects ?? [];
                  const mandatory = subjects.filter(s => s.subject_name.includes("majburiy"));
                  const elective = subjects.filter(s => !s.subject_name.includes("majburiy"));
                  const fan1 = elective[0];
                  const fan2 = elective[1];
                  const isExpanded = expandedId === student.id;
                  return (
                    <>
                      <TableRow key={student.id} className={isExpanded ? "border-b-0 bg-muted/30" : ""}>
                        <TableCell className="text-muted-foreground">{rowNum}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setExpandedId(isExpanded ? null : student.id)}
                          >
                            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{student.full_name}</TableCell>
                        <TableCell><Badge variant="outline">{student.group_name}</Badge></TableCell>
                        <TableCell>{formatGender(student.gender)}</TableCell>
                        <TableCell>{formatLang(student.language)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{formatDate(student.created_at)}</TableCell>
                        <TableCell>
                          {student.dtm ? (
                            student.dtm.tested
                              ? <Badge variant="default">Topshirgan</Badge>
                              : <Badge variant="secondary">Topshirmagan</Badge>
                          ) : <Badge variant="outline">Ma'lumot yo'q</Badge>}
                        </TableCell>
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
                        <TableCell className="text-right">
                          {student.dtm?.total_ball != null ? (
                            <Badge variant={student.dtm.total_ball >= 140 ? "default" : "secondary"} className="text-base">
                              {student.dtm.total_ball}
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {student.dtm?.result_file ? (
                            <a
                              href={student.dtm.result_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Natija
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-50">
                              <FileText className="h-3.5 w-3.5" />
                              Yo'q
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`detail-${student.id}`} className="bg-muted/20 hover:bg-muted/30">
                          <TableCell colSpan={11} className="py-4 px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                              {/* ID */}
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">User ID</span>
                                <div className="flex items-center gap-2">
                                  <code className="rounded bg-muted px-2 py-1 text-xs font-mono select-all">
                                    {student.id}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(student.id)}
                                  >
                                    {copiedId === student.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                  </Button>
                                </div>
                              </div>
                              {/* Bot ID */}
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Bot ID</span>
                                <p className="font-medium">{student.bot_id || "—"}</p>
                              </div>
                              {/* Phone */}
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Telefon</span>
                                <p className="font-medium">{student.phone || "—"}</p>
                              </div>
                              {/* School */}
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Maktab</span>
                                <p className="font-medium">{student.school_name || student.school_code}</p>
                              </div>
                              {/* Region / District */}
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Viloyat / Tuman</span>
                                <p className="font-medium">{student.region}, {student.district}</p>
                              </div>
                              {/* Group */}
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Guruh</span>
                                <p className="font-medium">{student.group_name}</p>
                              </div>
                              {/* Mandatory subjects */}
                              {mandatory.length > 0 && (
                                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                  <span className="text-xs text-muted-foreground">Majburiy fanlar</span>
                                  <div className="flex flex-wrap gap-2">
                                    {mandatory.map((s, i) => (
                                      <Badge key={i} variant={s.earned_ball > 0 ? "default" : "secondary"} className="text-xs">
                                        {s.subject_name}: {s.earned_ball}/{s.max_ball} ({s.percent}%)
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* DTM detailed scores */}
                              {student.dtm && (
                                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                  <span className="text-xs text-muted-foreground">DTM batafsil</span>
                                  <div className="flex flex-wrap gap-3 text-xs">
                                    {student.dtm.mandatory_ball != null && (
                                      <span>Majburiy: <strong>{student.dtm.mandatory_ball}</strong></span>
                                    )}
                                    {student.dtm.primary_ball != null && (
                                      <span>1-fan: <strong>{student.dtm.primary_ball}</strong></span>
                                    )}
                                    {student.dtm.secondary_ball != null && (
                                      <span>2-fan: <strong>{student.dtm.secondary_ball}</strong></span>
                                    )}
                                    {student.dtm.total_ball != null && (
                                      <span>Jami: <strong>{student.dtm.total_ball}</strong></span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && displayTotal > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sahifada:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
              <span>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, displayTotal)} / {displayTotal}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: displayPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === displayPages || Math.abs(p - page) <= 2)
                .reduce<(number | "dots")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "dots" ? (
                    <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === page ? "default" : "outline"}
                      size="sm"
                      className="min-w-[32px]"
                      onClick={() => setPage(item as number)}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= displayPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
