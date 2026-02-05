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
import { useDTMUsers } from "@/hooks/useDTMUsers";
import {
  Search,
  RefreshCw,
  Settings,
  AlertCircle,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  ExternalLink,
} from "lucide-react";

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

  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle null/undefined
    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";

    // Handle dates
    if (sortColumn === "created_at" || sortColumn === "updated_at") {
      aVal = new Date(aVal as string).getTime();
      bVal = new Date(bVal as string).getTime();
    }

    // Handle numbers
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    // Handle strings
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const totalPages = pageInfo ? Math.ceil(pageInfo.totalCount / limit) : 0;

  // Render error state
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
            <h1 className="text-3xl font-bold tracking-tight">Foydalanuvchilar</h1>
            <p className="text-muted-foreground">
              DTM platformasi foydalanuvchilari
              {pageInfo && (
                <span className="ml-2">
                  (Jami: <strong>{pageInfo.totalCount.toLocaleString()}</strong>)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={retry} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
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
              <UsersIcon className="h-5 w-5" />
              Foydalanuvchilar ro'yxati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("full_name")}
                      >
                        F.I.O. {sortColumn === "full_name" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("school_code")}
                      >
                        Maktab {sortColumn === "school_code" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-center"
                        onClick={() => handleSort("has_result")}
                      >
                        Natija {sortColumn === "has_result" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-right"
                        onClick={() => handleSort("total_point")}
                      >
                        Ball {sortColumn === "total_point" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="text-center">Fayllar</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("created_at")}
                      >
                        Sana {sortColumn === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchTerm
                            ? "Qidiruv natijasi topilmadi"
                            : "Foydalanuvchilar topilmadi"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedUsers.map((user, index) => (
                        <TableRow key={user.id || index}>
                          <TableCell className="text-muted-foreground">
                            {page * limit + index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <p className="truncate max-w-[200px]">{user.full_name || "—"}</p>
                              {user.region && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {user.region}
                                  {user.district && `, ${user.district}`}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="font-mono">
                                {user.school_code || "—"}
                              </Badge>
                              {user.school_name && (
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                                  {user.school_name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone_number ? (
                              <a
                                href={`tel:${user.phone_number}`}
                                className="text-primary hover:underline text-sm"
                              >
                                {user.phone_number}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {user.has_result ? (
                              <Badge variant="default" className="bg-success text-success-foreground">
                                Bor
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Yo'q</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {user.total_point != null ? (
                              <span
                                className={
                                  user.total_point >= 150
                                    ? "text-success"
                                    : user.total_point >= 100
                                    ? "text-warning"
                                    : "text-muted-foreground"
                                }
                              >
                                {user.total_point}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {user.pdf_url && (
                                <a
                                  href={user.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                                  title="PDF yuklab olish"
                                >
                                  <FileText className="h-4 w-4 text-destructive" />
                                </a>
                              )}
                              {user.excel_url && (
                                <a
                                  href={user.excel_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                                  title="Excel yuklab olish"
                                >
                                  <FileSpreadsheet className="h-4 w-4 text-success" />
                                </a>
                              )}
                              {user.file_url && (
                                <a
                                  href={user.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                                  title="Fayl yuklab olish"
                                >
                                  <Download className="h-4 w-4 text-primary" />
                                </a>
                              )}
                              {!user.pdf_url && !user.excel_url && !user.file_url && (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString("uz-UZ")
                              : "—"}
                          </TableCell>
                        </TableRow>
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
                  {page * limit + 1} - {Math.min((page + 1) * limit, pageInfo.totalCount)} /{" "}
                  {pageInfo.totalCount.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Oldingi
                  </Button>
                  <span className="text-sm px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1 || loading}
                  >
                    Keyingi
                    <ChevronRight className="h-4 w-4" />
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
