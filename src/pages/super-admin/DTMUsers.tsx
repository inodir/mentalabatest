import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDTMUsers } from "@/hooks/useDTMUsers";
import { DTMUsersFilters, DTMFilters, filterDTMUsers } from "@/components/dtm/DTMUsersFilters";
import { SyncSchoolsDialog } from "@/components/dtm/SyncSchoolsDialog";
import {
  RefreshCw,
  Settings,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Phone,
  School,
  Calendar,
  Award,
  BookOpen,
  Calculator,
  History,
  Beaker,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
} from "lucide-react";
import { DTMUser, DTMTestResults } from "@/lib/dtm-api";

// Subject score display component
const SubjectScore = ({ 
  label, 
  score, 
  maxScore, 
  icon: Icon 
}: { 
  label: string; 
  score?: number; 
  maxScore: number;
  icon: React.ComponentType<{ className?: string }>;
}) => {
  if (score === undefined || score === null) return null;
  
  const percentage = (score / maxScore) * 100;
  const colorClass = percentage >= 80 
    ? "text-success bg-success/10 border-success/30" 
    : percentage >= 60 
    ? "text-warning bg-warning/10 border-warning/30"
    : "text-muted-foreground bg-muted border-border";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${colorClass}`}>
            <Icon className="h-3 w-3" />
            <span>{score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}: {score}/{maxScore} ({Math.round(percentage)}%)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// File download button component
const FileButton = ({ 
  url, 
  type, 
  label 
}: { 
  url?: string; 
  type: "test" | "result";
  label: string;
}) => {
  if (!url) return null;

  const config = {
    test: { icon: FileText, className: "text-primary hover:bg-primary/10", variant: "default" as const },
    result: { icon: Download, className: "text-success hover:bg-success/10", variant: "success" as const },
  };

  const { icon: Icon, className } = config[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md transition-colors ${className} border text-xs font-medium`}
          >
            <Icon className="h-3 w-3" />
            <span>{type === "test" ? "Test" : "Natija"}</span>
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Render test results scores
const TestResultsScores = ({ testResults }: { testResults?: DTMTestResults }) => {
  if (!testResults) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const getMandatoryScore = (name: string) => {
    return testResults.mandatory?.find(m => m.name.toLowerCase().includes(name.toLowerCase()))?.point;
  };

  const onaTiliScore = getMandatoryScore("ona tili");
  const mathScore = getMandatoryScore("matematika");
  const tarixScore = getMandatoryScore("tarix");

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <SubjectScore 
        label="Ona tili" 
        score={onaTiliScore} 
        maxScore={11} 
        icon={BookOpen} 
      />
      <SubjectScore 
        label="Matematika" 
        score={mathScore} 
        maxScore={11} 
        icon={Calculator} 
      />
      <SubjectScore 
        label="Tarix" 
        score={tarixScore} 
        maxScore={11} 
        icon={History} 
      />
      {testResults.primary && (
        <SubjectScore 
          label={testResults.primary.name} 
          score={testResults.primary.point} 
          maxScore={93} 
          icon={Beaker} 
        />
      )}
      {testResults.secondary && (
        <SubjectScore 
          label={testResults.secondary.name} 
          score={testResults.secondary.point} 
          maxScore={63} 
          icon={GraduationCap} 
        />
      )}
      {!onaTiliScore && !mathScore && !tarixScore && !testResults.primary && !testResults.secondary && (
        <span className="text-muted-foreground text-xs">—</span>
      )}
    </div>
  );
};

// User detail card component for expanded view
const UserDetailCard = ({ user }: { user: DTMUser }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Shaxsiy ma'lumotlar
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-medium truncate">{user.full_name || "—"}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <a href={`tel:${user.phone}`} className="hover:text-primary">
                {user.phone}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Maktab
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <School className="h-3 w-3 text-muted-foreground" />
            <Badge variant="outline" className="font-mono text-xs">
              {user.school_code || "—"}
            </Badge>
          </div>
          {user.district && (
            <p className="text-xs text-muted-foreground pl-5 truncate">
              {user.district}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Test natijalari
        </h4>
        <div className="space-y-1">
          {user.test_results?.primary && (
            <div className="text-xs">
              <span className="text-muted-foreground">Asosiy fan: </span>
              <span className="font-medium">{user.test_results.primary.name}</span>
              <Badge variant="secondary" className="ml-1">{user.test_results.primary.point}</Badge>
            </div>
          )}
          {user.test_results?.secondary && (
            <div className="text-xs">
              <span className="text-muted-foreground">Ikkinchi fan: </span>
              <span className="font-medium">{user.test_results.secondary.name}</span>
              <Badge variant="secondary" className="ml-1">{user.test_results.secondary.point}</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sana
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">
              {user.created_at ? new Date(user.created_at).toLocaleDateString("uz-UZ") : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DTMUsers() {
  const navigate = useNavigate();
  const { dtmUser } = useAuth();
  const allSchools = useMemo(() =>
    (dtmUser?.schools || []).map((s) => ({ code: s.code, name: s.name })),
    [dtmUser?.schools]
  );
  const {
    users,
    pageInfo,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    retry,
  } = useDTMUsers(50);

  const [filters, setFilters] = useState<DTMFilters>({
    searchTerm: "",
    schoolCode: "all",
    hasResult: "all",
  });

  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply filters
  const filteredUsers = filterDTMUsers(users, filters);

  // Apply sorting
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal: string | number | boolean | null = null;
    let bVal: string | number | boolean | null = null;

    if (sortColumn === "created_at") {
      aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
      bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
    } else if (sortColumn === "total_point") {
      aVal = a.total_point ?? 0;
      bVal = b.total_point ?? 0;
    } else if (sortColumn === "has_result") {
      aVal = a.has_result ? 1 : 0;
      bVal = b.has_result ? 1 : 0;
    } else if (sortColumn === "full_name") {
      aVal = a.full_name?.toLowerCase() || "";
      bVal = b.full_name?.toLowerCase() || "";
    } else if (sortColumn === "school_code") {
      aVal = a.school_code?.toLowerCase() || "";
      bVal = b.school_code?.toLowerCase() || "";
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal || "");
    const bStr = String(bVal || "");
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const totalPages = pageInfo ? Math.ceil(pageInfo.totalCount / limit) : 0;

  const SortIndicator = ({ column }: { column: string }) => (
    sortColumn === column ? (
      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
    ) : null
  );

  // Error state
  if (error) {
    return (
      <AdminLayout variant="super">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
            <p className="text-muted-foreground">DTM platformasi foydalanuvchilari</p>
          </div>

          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {error === "NO_CONFIG" && "API sozlamalari topilmadi"}
                {error === "API_KEY_INVALID" && "API kaliti noto'g'ri"}
                {error === "NETWORK_ERROR" && "Tarmoq xatosi"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                {error === "NO_CONFIG" &&
                  "Foydalanuvchilarni ko'rish uchun avval API sozlamalarini kiriting."}
                {error === "API_KEY_INVALID" &&
                  "API kalitingiz noto'g'ri. Sozlamalarni tekshiring."}
                {error === "NETWORK_ERROR" && "Serverga ulanib bo'lmadi."}
              </p>
              <div className="flex gap-3">
                {error !== "NO_CONFIG" && (
                  <Button variant="outline" onClick={retry}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Qayta urinish
                  </Button>
                )}
                <Button onClick={() => navigate("/super-admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Sozlamalarni ochish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-primary" />
              Foydalanuvchilar
            </h1>
            <p className="text-muted-foreground">
              DTM platformasi foydalanuvchilari
              {pageInfo && (
                <Badge variant="secondary" className="ml-2">
                  Jami: {pageInfo.totalCount.toLocaleString()}
                </Badge>
              )}
              {filteredUsers.length !== users.length && (
                <Badge variant="outline" className="ml-2">
                  Filtrlangan: {filteredUsers.length}
                </Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SyncSchoolsDialog />
            <Button variant="outline" size="icon" onClick={retry} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <DTMUsersFilters
          users={users}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            setPage(0);
          }}
          limit={limit}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(0);
          }}
          allSchools={allSchools}
        />

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Foydalanuvchilar ro'yxati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 min-w-[200px]"
                        onClick={() => handleSort("full_name")}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          F.I.O.
                          <SortIndicator column="full_name" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("school_code")}
                      >
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4" />
                          Maktab
                          <SortIndicator column="school_code" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefon
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort("has_result")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Holat
                          <SortIndicator column="has_result" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Fan ballari
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort("total_point")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Award className="h-4 w-4" />
                          Jami
                          <SortIndicator column="total_point" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Download className="h-4 w-4" />
                          Fayllar
                        </div>
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <UsersIcon className="h-8 w-8 opacity-50" />
                            {filters.searchTerm || filters.schoolCode !== "all" || filters.hasResult !== "all"
                              ? "Qidiruv natijasi topilmadi"
                              : "Foydalanuvchilar topilmadi"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUsers.map((user, index) => (
                        <>
                          <TableRow 
                            key={user.id}
                            className={expandedUser === user.id ? "bg-muted/30" : ""}
                          >
                            <TableCell className="text-muted-foreground font-mono text-xs">
                              {page * limit + index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium truncate max-w-[200px]">
                                  {user.full_name || "—"}
                                </p>
                                {user.district && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className="truncate max-w-[180px]">
                                      {user.district}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {user.school_code || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.phone ? (
                                <a
                                  href={`tel:${user.phone}`}
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                                >
                                  <Phone className="h-3 w-3" />
                                  {user.phone}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {user.has_result ? (
                                <Badge className="bg-success/20 text-success border-success/30 gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Bor
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Yo'q
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <TestResultsScores testResults={user.test_results} />
                            </TableCell>
                            <TableCell className="text-center">
                              {user.total_point != null ? (
                                <Badge 
                                  className={
                                    user.total_point >= 150
                                      ? "bg-success/20 text-success border-success/30"
                                      : user.total_point >= 100
                                      ? "bg-warning/20 text-warning border-warning/30"
                                      : "bg-muted text-muted-foreground"
                                  }
                                >
                                  <Award className="h-3 w-3 mr-1" />
                                  {user.total_point}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <FileButton 
                                  url={user.test_file_url} 
                                  type="test" 
                                  label="Test faylini yuklab olish" 
                                />
                                <FileButton 
                                  url={user.test_result_file_url} 
                                  type="result" 
                                  label="Natija faylini yuklab olish" 
                                />
                                {!user.test_file_url && !user.test_result_file_url && (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setExpandedUser(
                                        expandedUser === user.id ? null : user.id
                                      )}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Batafsil ko'rish</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                          {expandedUser === user.id && (
                            <TableRow>
                              <TableCell colSpan={9} className="p-0">
                                <UserDetailCard user={user} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pageInfo && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {page * limit + 1} - {Math.min((page + 1) * limit, pageInfo.totalCount)}
                  </Badge>
                  <span className="mx-2">/</span>
                  <Badge variant="secondary">
                    {pageInfo.totalCount.toLocaleString()} ta
                  </Badge>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Oldingi
                  </Button>
                  <Badge variant="secondary" className="px-3">
                    {page + 1} / {totalPages}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    Keyingi
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
