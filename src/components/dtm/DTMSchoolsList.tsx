import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getApiSettings, fetchAllDTMUsers, getCachedData, DTMUser } from "@/lib/dtm-api";
import { useAuth } from "@/hooks/useAuth";
import JSZip from "jszip";
import { ExportColumnsDialog, ALL_EXPORT_COLUMNS, type ExportFilters } from "./ExportColumnsDialog";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  School,
  Users,
  CheckCircle2,
  Download,
  ArrowUpDown,
  GraduationCap,
  MapPin,
} from "lucide-react";

interface DTMSchool {
  id: number;
  username: string;
  full_name: string;
  region: string;
  district: string;
  registered_count: number;
  answered_count: number;
}

type SortField = "full_name" | "registered_count" | "answered_count" | "district";
type SortDir = "asc" | "desc";

export function DTMSchoolsList() {
  const navigate = useNavigate();
  const { dtmUser } = useAuth();
  const [schools, setSchools] = useState<DTMSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullExporting, setFullExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("registered_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [preloadedUsers, setPreloadedUsers] = useState<DTMUser[]>([]);
  const [preloadingUsers, setPreloadingUsers] = useState(false);

  // Derive filter options from /me data
  const meFilterOptions = useMemo(() => {
    const regionsSet = new Set<string>();
    const districtsSet = new Set<string>();
    const languagesSet = new Set<string>();
    const groupsSet = new Set<string>();
    const gendersSet = new Set<string>();

    // From schools
    if (dtmUser?.schools) {
      dtmUser.schools.forEach((s) => {
        if (s.region) regionsSet.add(s.region);
        if (s.district) districtsSet.add(s.district);
      });
    }

    // From students items (first batch from /me)
    if (dtmUser?.students?.items) {
      dtmUser.students.items.forEach((item) => {
        if (item.language) languagesSet.add(item.language);
        if (item.group_name) groupsSet.add(item.group_name);
        if (item.gender) gendersSet.add(item.gender);
        if (item.region) regionsSet.add(item.region);
        if (item.district) districtsSet.add(item.district);
      });
    }

    // From stats
    if (dtmUser?.stats?.language_stats) {
      Object.keys(dtmUser.stats.language_stats).forEach((l) => languagesSet.add(l));
    }
    if (dtmUser?.stats?.gender_stats) {
      Object.keys(dtmUser.stats.gender_stats).forEach((g) => gendersSet.add(g));
    }

    // Also enrich from preloaded users
    if (preloadedUsers.length > 0) {
      preloadedUsers.forEach((u) => {
        if (u.language) languagesSet.add(u.language);
        if (u.group_name) groupsSet.add(u.group_name);
        if (u.gender) gendersSet.add(u.gender);
        if (u.region) regionsSet.add(u.region);
        if (u.district) districtsSet.add(u.district);
      });
    }

    return {
      regions: [...regionsSet].sort(),
      districts: [...districtsSet].sort(),
      languages: [...languagesSet].sort(),
      groups: [...groupsSet].sort(),
      genders: [...gendersSet].sort(),
    };
  }, [dtmUser, preloadedUsers]);

  const fetchSchools = useCallback(async () => {
    const settings = getApiSettings();
    if (!settings) {
      setError("API sozlamalari topilmadi. Sozlamalar sahifasida API kalitini kiriting.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = settings.mainUrl.endsWith("/") ? settings.mainUrl : `${settings.mainUrl}/`;
      const response = await fetch(`${baseUrl}api/v1/management/schools`, {
        headers: {
          accept: "application/json",
          "x-api-key": settings.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("API kalit noto'g'ri yoki muddati o'tgan");
        }
        throw new Error(`Server xatosi: ${response.status}`);
      }

      const data: DTMSchool[] = await response.json();
      setSchools(data);
    } catch (err) {
      console.error("DTM schools fetch error:", err);
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const regions = [...new Set(schools.map((s) => s.region).filter(Boolean))].sort();
  const districts = [
    ...new Set(
      schools
        .filter((s) => regionFilter === "all" || s.region === regionFilter)
        .map((s) => s.district)
        .filter(Boolean)
    ),
  ].sort();

  const filtered = schools
    .filter((s) => {
      const matchesSearch =
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === "all" || s.region === regionFilter;
      const matchesDistrict = districtFilter === "all" || s.district === districtFilter;
      return matchesSearch && matchesRegion && matchesDistrict;
    })
    .sort((a, b) => {
      const multiplier = sortDir === "asc" ? 1 : -1;
      if (sortField === "full_name" || sortField === "district") {
        return multiplier * a[sortField].localeCompare(b[sortField]);
      }
      return multiplier * (a[sortField] - b[sortField]);
    });

  const totalRegistered = filtered.reduce((s, x) => s + x.registered_count, 0);
  const totalAnswered = filtered.reduce((s, x) => s + x.answered_count, 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleExport = () => {
    const headers = ["Maktab nomi", "Kod", "Viloyat", "Tuman", "Ro'yxatdan o'tganlar", "Javob berganlar"];
    const rows = filtered.map((s) => [s.full_name, s.username, s.region, s.district, s.registered_count, s.answered_count]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dtm_maktablar.csv";
    a.click();
  };

  const handleFullExport = async (selectedColumns: string[], exportFilters: ExportFilters) => {
    const settings = getApiSettings();
    if (!settings) {
      toast.error("API sozlamalari topilmadi");
      return;
    }

    setFullExporting(true);
    setExportProgress("O'quvchilar yuklanmoqda...");

    try {
      const { entities: allUsers } = await fetchAllDTMUsers(
        settings,
        (loaded, total) => {
          setExportProgress(`O'quvchilar yuklanmoqda... ${loaded}/${total}`);
        },
        true
      );

      setExportProgress("ZIP tayyorlanmoqda...");

      const schoolMap = new Map<string, DTMSchool>();
      for (const s of filtered) {
        schoolMap.set(s.username, s);
      }

      // Determine which schools to export
      const targetSchoolCodes = exportFilters.schoolCodes.length > 0
        ? new Set(exportFilters.schoolCodes)
        : new Set(filtered.map((s) => s.username));

      let relevantUsers = allUsers.filter((u) => targetSchoolCodes.has(u.school_code));

      // Apply additional filters
      if (exportFilters.searchTerm.trim()) {
        const terms = exportFilters.searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
        relevantUsers = relevantUsers.filter((u) => {
          const text = [u.full_name, u.phone, u.bot_id].filter(Boolean).join(" ").toLowerCase();
          return terms.every((t) => text.includes(t));
        });
      }
      if (exportFilters.gender !== "all") {
        relevantUsers = relevantUsers.filter((u) => u.gender === exportFilters.gender);
      }
      if (exportFilters.language !== "all") {
        relevantUsers = relevantUsers.filter((u) => u.language === exportFilters.language);
      }
      if (exportFilters.hasResult !== "all") {
        const tested = exportFilters.hasResult === "true";
        relevantUsers = relevantUsers.filter((u) => (u.dtm?.tested ?? u.has_result) === tested);
      }
      if (exportFilters.groupName !== "all") {
        relevantUsers = relevantUsers.filter((u) => u.group_name === exportFilters.groupName);
      }
      if (exportFilters.region !== "all") {
        relevantUsers = relevantUsers.filter((u) => u.region === exportFilters.region);
      }
      if (exportFilters.district !== "all") {
        relevantUsers = relevantUsers.filter((u) => u.district === exportFilters.district);
      }

      const colDefs = ALL_EXPORT_COLUMNS.filter((c) => selectedColumns.includes(c.key));
      const escapeCSV = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const getColumnValue = (user: DTMUser, key: string, school?: DTMSchool): string => {
        switch (key) {
          case "school_name": return escapeCSV(user.school_name || school?.full_name || "—");
          case "school_code": return user.school_code || "—";
          case "region": return escapeCSV(user.region || school?.region || "—");
          case "district": return escapeCSV(user.district || school?.district || "—");
          case "full_name": return escapeCSV(user.full_name || "—");
          case "phone": return user.phone || "—";
          case "gender": return escapeCSV(user.gender || "—");
          case "group_name": return escapeCSV(user.group_name || "—");
          case "chat_id": return user.chat_id || "—";
          case "bot_id": return user.bot_id || "—";
          case "has_result": return (user.dtm?.tested ?? user.has_result) ? "Ha" : "Yo'q";
          case "total_point": return user.total_point != null ? String(user.total_point) : "—";
          case "language": return escapeCSV(user.language || "—");
          case "created_at": return user.created_at ? new Date(user.created_at).toLocaleDateString("uz-UZ") : "—";
          default: return "—";
        }
      };

      const bom = "\uFEFF";
      const csvHeaders = colDefs.map((c) => c.label);

      // Group users by school
      const bySchool = new Map<string, DTMUser[]>();
      for (const user of relevantUsers) {
        const code = user.school_code || "unknown";
        if (!bySchool.has(code)) bySchool.set(code, []);
        bySchool.get(code)!.push(user);
      }

      const zip = new JSZip();

      // Create a CSV file per school
      for (const [code, users] of bySchool) {
        const school = schoolMap.get(code);
        const rows = users.map((user) =>
          colDefs.map((c) => getColumnValue(user, c.key, school))
        );
        const csv = [csvHeaders, ...rows].map((r) => r.join(",")).join("\n");
        const schoolName = (school?.full_name || code).replace(/[/\\?%*:|"<>]/g, "_");
        zip.file(`${schoolName} (${code}).csv`, bom + csv);
      }

      // Also add a combined summary CSV
      const allRows = relevantUsers.map((user) => {
        const school = schoolMap.get(user.school_code);
        return colDefs.map((c) => getColumnValue(user, c.key, school));
      });
      const summaryCsv = [csvHeaders, ...allRows].map((r) => r.join(",")).join("\n");
      zip.file("Umumiy.csv", bom + summaryCsv);

      setExportProgress("ZIP yaratilmoqda...");
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dtm_export_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${relevantUsers.length} ta o'quvchi, ${bySchool.size} ta maktab eksport qilindi`);
      setExportDialogOpen(false);
    } catch (err) {
      console.error("Full export error:", err);
      toast.error("Eksport qilishda xatolik yuz berdi");
    } finally {
      setFullExporting(false);
      setExportProgress("");
    }
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <School className="h-12 w-12 text-destructive/60" />
          <div className="text-center">
            <p className="font-medium text-destructive">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              API sozlamalarini tekshiring va qayta urinib ko'ring
            </p>
          </div>
          <Button variant="outline" onClick={fetchSchools}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Qayta yuklash
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <School className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jami maktablar</p>
              <p className="text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-16" /> : filtered.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ro'yxatdan o'tganlar</p>
              <p className="text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-16" /> : totalRegistered.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Javob berganlar</p>
              <p className="text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-16" /> : totalAnswered.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Maktab nomi, kodi yoki tuman bo'yicha qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={regionFilter}
          onValueChange={(v) => {
            setRegionFilter(v);
            setDistrictFilter("all");
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Viloyat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha viloyatlar</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tuman" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha tumanlar</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSchools} disabled={loading} title="Yangilash">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} disabled={loading || filtered.length === 0} title="CSV Export">
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            onClick={() => setExportDialogOpen(true)}
            disabled={fullExporting || loading || filtered.length === 0}
            title="To'liq eksport (o'quvchilar bilan)"
          >
            <Download className="mr-2 h-4 w-4" />
            To'liq eksport
          </Button>
        </div>
      </div>

      <ExportColumnsDialog
        open={exportDialogOpen}
        onOpenChange={(open) => {
          setExportDialogOpen(open);
          // Preload users when dialog opens so filter options are populated
          if (open && preloadedUsers.length === 0 && !preloadingUsers) {
            const cached = getCachedData<{ entities: DTMUser[]; totalCount: number }>("users");
            if (cached?.entities?.length) {
              setPreloadedUsers(cached.entities);
            } else {
              const settings = getApiSettings();
              if (settings) {
                setPreloadingUsers(true);
                fetchAllDTMUsers(settings, undefined, false)
                  .then(({ entities }) => setPreloadedUsers(entities))
                  .catch(() => {})
                  .finally(() => setPreloadingUsers(false));
              }
            }
          }
        }}
        onExport={handleFullExport}
        exporting={fullExporting}
        exportProgress={exportProgress}
        allUsers={preloadedUsers}
        schools={filtered.map((s) => ({ code: s.username, name: s.full_name, region: s.region, district: s.district }))}
        availableRegions={meFilterOptions.regions}
        availableDistricts={meFilterOptions.districts}
        availableLanguages={meFilterOptions.languages}
        availableGroups={meFilterOptions.groups}
        availableGenders={meFilterOptions.genders}
      />

      {/* Table */}
      <Card>
        <div className="rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
                    onClick={() => handleSort("full_name")}
                  >
                    Maktab nomi
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
                    onClick={() => handleSort("district")}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Tuman
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground transition-colors mx-auto"
                    onClick={() => handleSort("registered_count")}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Ro'yxatdan
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="text-center">
                  <button
                    className="flex items-center gap-1 font-medium hover:text-foreground transition-colors mx-auto"
                    onClick={() => handleSort("answered_count")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Javob
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
                <TableHead className="text-center">Foiz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-14 mx-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">Maktablar topilmadi</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((school, idx) => {
                  const pct =
                    school.registered_count > 0
                      ? Math.round((school.answered_count / school.registered_count) * 100)
                      : 0;
                  return (
                    <TableRow
                      key={school.id}
                      className="group cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => navigate(`/super-admin/dtm-schools/${school.username}`)}
                    >
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                            <School className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{school.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded-md bg-muted px-2 py-1 text-xs font-mono">
                          {school.username}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span>{school.district}</span>
                          <p className="text-xs text-muted-foreground">{school.region}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold tabular-nums">{school.registered_count}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold tabular-nums">{school.answered_count}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "outline"}
                          className={`tabular-nums ${
                            pct >= 80
                              ? "bg-success/15 text-success hover:bg-success/20 border-success/30"
                              : pct >= 50
                              ? "bg-warning/15 text-warning hover:bg-warning/20 border-warning/30"
                              : ""
                          }`}
                        >
                          {pct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Jami: {filtered.length} maktab · {totalRegistered.toLocaleString()} ro'yxatdan o'tgan · {totalAnswered.toLocaleString()} javob bergan
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
