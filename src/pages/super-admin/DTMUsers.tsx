import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDTMUsers } from "@/hooks/useDTMUsers";
import {
  Search,
  RefreshCw,
  Settings,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Phone,
  MapPin,
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
import { DTMUser } from "@/lib/dtm-api";

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
  type: "pdf" | "excel" | "file";
  label: string;
}) => {
  if (!url) return null;

  const config = {
    pdf: { icon: FileText, className: "text-destructive hover:bg-destructive/10" },
    excel: { icon: FileSpreadsheet, className: "text-success hover:bg-success/10" },
    file: { icon: Download, className: "text-primary hover:bg-primary/10" },
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
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors ${className}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// User detail card component for expanded view
const UserDetailCard = ({ user }: { user: DTMUser }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
      {/* Personal Info */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Shaxsiy ma'lumotlar
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-medium truncate">{user.full_name || "—"}</span>
          </div>
          {user.phone_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <a href={`tel:${user.phone_number}`} className="hover:text-primary">
                {user.phone_number}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Manzil
        </h4>
        <div className="space-y-1">
          {user.region && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{user.region}</span>
            </div>
          )}
          {user.district && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pl-5">
              <span>{user.district}</span>
            </div>
          )}
        </div>
      </div>

      {/* School */}
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
          {user.school_name && (
            <p className="text-xs text-muted-foreground pl-5 truncate">
              {user.school_name}
            </p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sanalar
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">
              Yaratilgan: {user.created_at ? new Date(user.created_at).toLocaleDateString("uz-UZ") : "—"}
            </span>
          </div>
          {user.updated_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pl-5">
              <span className="text-xs">
                Yangilangan: {new Date(user.updated_at).toLocaleDateString("uz-UZ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DTMUsers() {
  const navigate = useNavigate();
  const {
    filteredUsers,
    pageInfo,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    retry,
    searchTerm,
    setSearchTerm,
  } = useDTMUsers(50);

  const [expandedUser, setExpandedUser] = useState<string | null>(null);
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

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";

    if (sortColumn === "created_at" || sortColumn === "updated_at") {
      aVal = new Date(aVal as string).getTime();
      bVal = new Date(bVal as string).getTime();
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
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
            </p>
          </div>

          <Button variant="outline" size="icon" onClick={retry} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ism, maktab kodi yoki telefon bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ko'rsatish:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                            {searchTerm
                              ? "Qidiruv natijasi topilmadi"
                              : "Foydalanuvchilar topilmadi"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUsers.map((user, index) => (
                        <>
                          <TableRow 
                            key={user.id || index}
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
                                {(user.region || user.district) && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[180px]">
                                      {user.region}
                                      {user.district && `, ${user.district}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline" className="font-mono">
                                  {user.school_code || "—"}
                                </Badge>
                                {user.school_name && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {user.school_name}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.phone_number ? (
                                <a
                                  href={`tel:${user.phone_number}`}
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                                >
                                  <Phone className="h-3 w-3" />
                                  {user.phone_number}
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
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                <SubjectScore 
                                  label="Ona tili" 
                                  score={user.ona_tili_ball} 
                                  maxScore={11} 
                                  icon={BookOpen} 
                                />
                                <SubjectScore 
                                  label="Matematika" 
                                  score={user.matematika_ball} 
                                  maxScore={11} 
                                  icon={Calculator} 
                                />
                                <SubjectScore 
                                  label="Tarix" 
                                  score={user.tarix_ball} 
                                  maxScore={11} 
                                  icon={History} 
                                />
                                <SubjectScore 
                                  label={user.fan1_nomi || "1-fan"} 
                                  score={user.fan1_ball} 
                                  maxScore={93} 
                                  icon={Beaker} 
                                />
                                <SubjectScore 
                                  label={user.fan2_nomi || "2-fan"} 
                                  score={user.fan2_ball} 
                                  maxScore={63} 
                                  icon={GraduationCap} 
                                />
                                {!user.ona_tili_ball && !user.matematika_ball && !user.tarix_ball && 
                                 !user.fan1_ball && !user.fan2_ball && (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </div>
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
                                <FileButton url={user.pdf_url} type="pdf" label="PDF yuklab olish" />
                                <FileButton url={user.excel_url} type="excel" label="Excel yuklab olish" />
                                <FileButton url={user.file_url} type="file" label="Fayl yuklab olish" />
                                {!user.pdf_url && !user.excel_url && !user.file_url && (
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