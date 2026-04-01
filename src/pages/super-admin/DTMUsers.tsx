import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
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
import { RegisterUserDialog } from "@/components/dtm/RegisterUserDialog";
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
  Trash2,
  Loader2,
  Send,
} from "lucide-react";
import { DTMUser, DTMTestResults, getApiSettings, deleteDTMUser } from "@/lib/dtm-api";
import { exportCertificate } from "@/lib/exportCertificate";
import { exportToExcel } from "@/lib/exportExcel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
    ? "text-green-600 bg-green-500/10 border-green-500/30" 
    : percentage >= 60 
    ? "text-yellow-600 bg-yellow-500/10 border-yellow-500/30"
    : "text-muted-foreground bg-muted/60 border-border/50";

  const getShortLabel = (str: string) => {
    const s = str.toLowerCase();
    if (s.includes("ona tili")) return "Ona";
    if (s.includes("matematika")) return "Mat";
    if (s.includes("tarix")) return "Tar";
    return str.split(" ")[0].slice(0, 4);
  };
  
  const displayLabel = getShortLabel(label);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${colorClass} hover:shadow-sm transition-all cursor-help`}>
            <Icon className="h-2.5 w-2.5 opacity-80" />
            <span>{displayLabel}: <span className="font-bold">{score}</span></span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          <p className="font-semibold">{label}</p>
          <p className="text-muted-foreground">{score} / {maxScore} ({Math.round(percentage)}%)</p>
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
          {user.id && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs">ID:</span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono select-all">
                {user.id}
              </code>
            </div>
          )}
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
    (dtmUser?.schools || []).map((s) => ({ code: s.code, name: s.name, region: s.region, district: s.district })),
    [dtmUser?.schools]
  );
  const allGroupNames = useMemo(() => {
    const set = new Set<string>();
    (dtmUser?.students?.items ?? []).forEach((s) => { if (s.group_name) set.add(s.group_name); });
    return [...set].sort();
  }, [dtmUser?.students?.items]);
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
    allUsers,
    allUsersLoading,
    loadAllUsers,
    allUsersLoaded,
  } = useDTMUsers(50);

  const [filters, setFilters] = useState<DTMFilters>({
    searchTerm: "",
    schoolCode: [],
    hasResult: "all",
    hasTestFile: "all",
    groupName: [],
  });

  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteUser, setDeleteUser] = useState<DTMUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteUser = useCallback(async () => {
    if (!deleteUser) return;
    const settings = getApiSettings();
    if (!settings) {
      toast.error("API sozlamalari topilmadi");
      return;
    }
    setDeleting(true);
    const result = await deleteDTMUser(settings, deleteUser.id);
    setDeleting(false);
    setDeleteUser(null);
    if (result.success) {
      toast.success(`${deleteUser.full_name} muvaffaqiyatli o'chirildi`);
      retry();
    } else {
      toast.error(result.error || "O'chirishda xatolik yuz berdi");
    }
  }, [deleteUser, retry]);

  // Check if any filter or search is active
  const hasActiveFilter =
    filters.schoolCode.length > 0 ||
    filters.hasResult !== "all" ||
    filters.hasTestFile !== "all" ||
    filters.groupName.length > 0 ||
    filters.searchTerm.trim().length > 0;

  // Auto-load all users when a filter/search is activated
  useEffect(() => {
    if (hasActiveFilter && !allUsersLoaded && !allUsersLoading) {
      loadAllUsers();
    }
  }, [hasActiveFilter, allUsersLoaded, allUsersLoading, loadAllUsers]);

  // Use allUsers only when they are fully loaded, otherwise use the hook's 'users' 
  // which now supports server-side search
  const sourceUsers = allUsersLoaded ? allUsers : users;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply filters
  const filteredUsers = filterDTMUsers(sourceUsers, filters);

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

  const handleExportUsers = useCallback(() => {
    if (sortedUsers.length === 0) {
      toast.error("Eksport uchun foydalanuvchilar topilmadi");
      return;
    }

    const exportRows = sortedUsers.map((user, index) => ({
      "#": index + 1,
      "F.I.O.": user.full_name || "—",
      "Telefon": user.phone || "—",
      "Maktab kodi": user.school_code || "—",
      "Guruh": user.group_name || "—",
      "Natijasi bor": user.has_result ? "Ha" : "Yo'q",
      "Test fayli bor": user.test_file_url ? "Ha" : "Yo'q",
      "Natija fayli bor": user.test_result_file_url ? "Ha" : "Yo'q",
      "Telegram status": user.file_status === true ? "True" : "False",
      "Jami ball": user.total_point ?? "—",
      "Yaratilgan sana": user.created_at ? new Date(user.created_at).toLocaleString("uz-UZ") : "—",
      "Test fayli URL": user.test_file_url || "—",
      "Natija fayli URL": user.test_result_file_url || "—",
    }));

    const ok = exportToExcel(exportRows, "DTM_Foydalanuvchilar", "Foydalanuvchilar");
    if (ok) {
      toast.success(`${exportRows.length} ta foydalanuvchi eksport qilindi`);
    } else {
      toast.error("Eksportda xatolik yuz berdi");
    }
  }, [sortedUsers]);

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
              {hasActiveFilter && allUsersLoading && (
                <Badge variant="outline" className="ml-2">
                  Barcha foydalanuvchilar yuklanmoqda...
                </Badge>
              )}
              {hasActiveFilter && allUsersLoaded && (
                <Badge variant="outline" className="ml-2">
                  Filtrlangan: {filteredUsers.length} / {allUsers.length}
                </Badge>
              )}
              {!hasActiveFilter && filteredUsers.length !== users.length && (
                <Badge variant="outline" className="ml-2">
                  Filtrlangan: {filteredUsers.length}
                </Badge>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportUsers} disabled={sortedUsers.length === 0 || (hasActiveFilter && allUsersLoading)}>
              <Download className="mr-2 h-4 w-4" />
              Eksport
            </Button>
            <RegisterUserDialog onUserCreated={retry} allSchools={allSchools} />
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
          allGroupNames={allGroupNames}
        />

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Foydalanuvchilar ro'yxati
              </CardTitle>
              {loading && filters.searchTerm.trim() && (
                <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground animate-pulse bg-muted/50 px-2 py-1 rounded-full border border-border/40">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Qidirilmoqda...
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading || (hasActiveFilter && allUsersLoading) ? (
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
                        className="cursor-pointer hover:bg-muted/50 hidden lg:table-cell"
                        onClick={() => handleSort("school_code")}
                      >
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4" />
                          Maktab
                          <SortIndicator column="school_code" />
                        </div>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefon
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center hidden md:table-cell"
                        onClick={() => handleSort("has_result")}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Holat
                          <SortIndicator column="has_result" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Fan ballari
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort("total_point")}
                      >
                        <div className="flex items-center justify-center gap-2 font-bold text-primary">
                          <Award className="h-4 w-4" />
                          Jami
                          <SortIndicator column="total_point" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center hidden xl:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <Download className="h-4 w-4" />
                          Fayllar
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Send className="h-4 w-4" />
                          Telegram
                        </div>
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <UsersIcon className="h-8 w-8 opacity-50" />
                             {filters.searchTerm || filters.schoolCode.length > 0 || filters.hasResult !== "all" || filters.groupName.length > 0
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
                            <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                              {page * limit + index + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary border border-primary/20 shadow-sm">
                                  {user.full_name ? user.full_name[0].toUpperCase() : "?"}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <p className="font-semibold text-sm truncate max-w-[150px] sm:max-w-[200px] text-foreground group-hover:text-primary transition-colors">
                                    {user.full_name || "—"}
                                  </p>
                                  <div className="flex flex-col gap-1 md:hidden">
                                     {user.school_code && (
                                       <Badge variant="outline" className="w-fit text-[9px] h-4 px-1 py-0 border-border/40">
                                         {user.school_code}
                                       </Badge>
                                     )}
                                     {!user.has_result && <span className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Natija yo'q</span>}
                                  </div>
                                  {user.district && (
                                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                                      <span className="truncate max-w-[180px]">
                                        {user.district}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono rounded-lg bg-background/50 border-border/60 hover:bg-background">
                                {user.school_code || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.phone ? (
                                <a
                                  href={`tel:${user.phone}`}
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
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
                                <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1 rounded-full px-2.5 py-0.5 font-medium shadow-none">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Bor
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-0.5 shadow-none text-muted-foreground bg-muted/50">
                                  <XCircle className="h-3.5 w-3.5" />
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
                                  className={cn(
                                    "gap-1 rounded-lg px-2 py-1 font-bold shadow-none",
                                    user.total_point >= 70 // Updated pass score limit frame from earlier instructions
                                      ? "bg-gradient-to-br from-green-500/15 to-green-500/5 text-green-600 border-green-500/30"
                                      : user.total_point >= 40
                                      ? "bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 text-yellow-600 border-yellow-500/30"
                                      : "bg-gradient-to-br from-red-500/15 to-red-500/5 text-red-600 border-red-500/30"
                                  )}
                                >
                                  <Award className="h-3.5 w-3.5" />
                                  {user.total_point}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1.5">
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
                            <TableCell className="text-center">
                              {user.file_status === true ? (
                                <Badge className="bg-green-500/15 text-green-600 border-green-500/30 gap-1 rounded-full px-2.5 py-0.5 shadow-none">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Yuborilgan
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-0.5 shadow-none">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Yuborilmagan
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                        onClick={() => exportCertificate(user.full_name)}
                                        disabled={!user.has_result}
                                      >
                                        <Award className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Sertifikat yuklash</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

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

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setDeleteUser(user)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>O'chirish</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedUser === user.id && (
                            <TableRow>
                              <TableCell colSpan={10} className="p-0">
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

            {/* Pagination - now always visible if multiple pages, even during search */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteUser?.full_name}</strong> (ID: {deleteUser?.id}) ni o'chirishni xohlaysizmi? 
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  O'chirilmoqda...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  O'chirish
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
