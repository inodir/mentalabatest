// Export dialog with cascading dependent filters, preview with pagination, and ZIP support
import { useState, useMemo, useCallback, useEffect } from "react";
import { DTMUser } from "@/lib/dtm-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Filter, Search, School, X, FileArchive, Users, Eye, EyeOff, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ExportColumn {
  key: string;
  label: string;
  defaultChecked: boolean;
}

export const ALL_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "school_name", label: "Maktab nomi", defaultChecked: true },
  { key: "school_code", label: "Maktab kodi", defaultChecked: true },
  { key: "region", label: "Viloyat", defaultChecked: true },
  { key: "district", label: "Tuman", defaultChecked: true },
  { key: "full_name", label: "O'quvchi FIO", defaultChecked: true },
  { key: "phone", label: "Telefon", defaultChecked: true },
  { key: "gender", label: "Jinsi", defaultChecked: false },
  { key: "group_name", label: "Guruh nomi", defaultChecked: true },
  { key: "chat_id", label: "Chat ID", defaultChecked: false },
  { key: "bot_id", label: "Bot ID", defaultChecked: false },
  { key: "has_result", label: "Natija bor", defaultChecked: true },
  { key: "total_point", label: "Umumiy ball", defaultChecked: true },
  { key: "language", label: "Til", defaultChecked: false },
  { key: "created_at", label: "Ro'yxatdan o'tgan sana", defaultChecked: true },
];

export interface ExportFilters {
  searchTerm: string;
  gender: string;
  language: string;
  hasResult: string;
  groupName: string;
  region: string;
  district: string;
  schoolCodes: string[];
}

const INITIAL_FILTERS: ExportFilters = {
  searchTerm: "",
  gender: "all",
  language: "all",
  hasResult: "all",
  groupName: "all",
  region: "all",
  district: "all",
  schoolCodes: [],
};

const GENDER_LABELS: Record<string, string> = { male: "Erkak", female: "Ayol" };
const LANG_LABELS: Record<string, string> = { uz: "O'zbekcha", ru: "Ruscha", en: "Inglizcha" };

const PREVIEW_PAGE_SIZE = 50;

interface SchoolInfo {
  code: string;
  name: string;
  region: string;
  district: string;
}

interface ExportColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (selectedColumns: string[], filters: ExportFilters, filteredUsers: DTMUser[]) => void;
  exporting: boolean;
  exportProgress?: string;
  allUsers?: DTMUser[];
  usersLoading?: boolean;
  usersError?: string | null;
  onRetryLoadUsers?: () => void;
  /** Schools from /me or management API — used for region/district mapping */
  schools?: SchoolInfo[];
  /** Students sample from /me — used to derive group/language/gender options */
  meStudents?: DTMUser[];
}

export function ExportColumnsDialog({
  open,
  onOpenChange,
  onExport,
  exporting,
  exportProgress,
  allUsers = [],
  usersLoading = false,
  usersError = null,
  onRetryLoadUsers,
  schools = [],
  meStudents = [],
}: ExportColumnsDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ALL_EXPORT_COLUMNS.filter((c) => c.defaultChecked).map((c) => c.key))
  );
  const [filters, setFilters] = useState<ExportFilters>(INITIAL_FILTERS);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);

  // Build school lookup: code → {region, district, name}
  const schoolMap = useMemo(() => {
    const map = new Map<string, SchoolInfo>();
    schools.forEach((s) => map.set(s.code, s));
    return map;
  }, [schools]);

  // Enrich allUsers with region/language/gender/group from meStudents + schools
  const enrichedUsers = useMemo(() => {
    if (allUsers.length === 0) return [];

    // Build lookups from meStudents by multiple keys for better matching
    const meByPhone = new Map<string, DTMUser>();
    const meByBotId = new Map<string, DTMUser>();
    const meByName = new Map<string, DTMUser>();
    meStudents.forEach((s) => {
      if (s.phone) meByPhone.set(s.phone, s);
      if (s.bot_id) meByBotId.set(s.bot_id, s);
      if (s.full_name) meByName.set(s.full_name.toLowerCase().trim(), s);
    });

    const findMeStudent = (u: DTMUser): DTMUser | undefined => {
      if (u.phone && meByPhone.has(u.phone)) return meByPhone.get(u.phone);
      if (u.bot_id && meByBotId.has(u.bot_id)) return meByBotId.get(u.bot_id);
      if (u.full_name) return meByName.get(u.full_name.toLowerCase().trim());
      return undefined;
    };

    return allUsers.map((u) => {
      const me = findMeStudent(u);
      const school = schoolMap.get(u.school_code);

      return {
        ...u,
        region: u.region || school?.region || me?.region || "",
        district: u.district || school?.district || me?.district || "",
        language: u.language || me?.language || "",
        gender: u.gender || me?.gender || "",
        group_name: u.group_name || me?.group_name || "",
        school_name: u.school_name || school?.name || me?.school_name || u.school_code,
      };
    });
  }, [allUsers, meStudents, schoolMap]);

  // ========== CASCADING FILTER OPTIONS ==========
  // Use schools data for region/district (always complete), meStudents for group/language/gender

  // 1. Regions from schools
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => { if (s.region) set.add(s.region); });
    // Also from enriched users
    enrichedUsers.forEach((u) => { if (u.region) set.add(u.region); });
    return [...set].sort();
  }, [schools, enrichedUsers]);

  // 2. Districts filtered by selected region (from schools)
  const districtOptions = useMemo(() => {
    let source = schools;
    if (filters.region !== "all") {
      source = source.filter((s) => s.region === filters.region);
    }
    const set = new Set<string>();
    source.forEach((s) => { if (s.district) set.add(s.district); });
    return [...set].sort();
  }, [schools, filters.region]);

  // 3. Schools filtered by region + district
  const schoolFilterOptions = useMemo(() => {
    let source = schools;
    if (filters.region !== "all") source = source.filter((s) => s.region === filters.region);
    if (filters.district !== "all") source = source.filter((s) => s.district === filters.district);
    return source.sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, filters.region, filters.district]);

  // 4. Groups — from meStudents filtered by current cascade
  const groupOptions = useMemo(() => {
    let source = meStudents.length > 0 ? meStudents : enrichedUsers;
    if (filters.region !== "all") source = source.filter((u) => u.region === filters.region);
    if (filters.district !== "all") source = source.filter((u) => u.district === filters.district);
    if (filters.schoolCodes.length > 0) {
      const codes = new Set(filters.schoolCodes);
      source = source.filter((u) => codes.has(u.school_code));
    }
    const set = new Set<string>();
    source.forEach((u) => { if (u.group_name) set.add(u.group_name); });
    return [...set].sort();
  }, [meStudents, enrichedUsers, filters.region, filters.district, filters.schoolCodes]);

  // 5. Languages — filtered by cascade + group
  const languageOptions = useMemo(() => {
    let source = meStudents.length > 0 ? meStudents : enrichedUsers;
    if (filters.region !== "all") source = source.filter((u) => u.region === filters.region);
    if (filters.district !== "all") source = source.filter((u) => u.district === filters.district);
    if (filters.schoolCodes.length > 0) {
      const codes = new Set(filters.schoolCodes);
      source = source.filter((u) => codes.has(u.school_code));
    }
    if (filters.groupName !== "all") source = source.filter((u) => u.group_name === filters.groupName);
    const set = new Set<string>();
    source.forEach((u) => { if (u.language) set.add(u.language); });
    return [...set].sort();
  }, [meStudents, enrichedUsers, filters.region, filters.district, filters.schoolCodes, filters.groupName]);

  // Genders
  const genderOptions = useMemo(() => {
    const set = new Set<string>();
    meStudents.forEach((u) => { if (u.gender) set.add(u.gender); });
    enrichedUsers.forEach((u) => { if (u.gender) set.add(u.gender); });
    return [...set].sort();
  }, [meStudents, enrichedUsers]);

  // ========== CASCADING UPDATE LOGIC ==========
  const updateFilter = useCallback((key: keyof ExportFilters, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Reset downstream filters when an upstream one changes
      if (key === "region") {
        next.district = "all";
        next.schoolCodes = [];
        next.groupName = "all";
        next.language = "all";
      } else if (key === "district") {
        next.schoolCodes = [];
        next.groupName = "all";
        next.language = "all";
      } else if (key === "groupName") {
        next.language = "all";
      }
      return next;
    });
    setPreviewPage(0);
  }, []);

  const toggleSchool = useCallback((code: string) => {
    setFilters((prev) => {
      const codes = prev.schoolCodes.includes(code)
        ? prev.schoolCodes.filter((c) => c !== code)
        : [...prev.schoolCodes, code];
      // Reset group + language when schools change
      return { ...prev, schoolCodes: codes, groupName: "all", language: "all" };
    });
    setPreviewPage(0);
  }, []);

  const selectAllSchools = () => {
    setFilters((prev) => ({
      ...prev,
      schoolCodes: schoolFilterOptions.map((s) => s.code),
      groupName: "all",
      language: "all",
    }));
    setPreviewPage(0);
  };

  const deselectAllSchools = () => {
    setFilters((prev) => ({ ...prev, schoolCodes: [], groupName: "all", language: "all" }));
    setPreviewPage(0);
  };

  // ========== FILTERED RESULTS ==========
  const filteredData = useMemo(() => {
    if (enrichedUsers.length === 0) return { users: 0, schools: 0, items: [] as DTMUser[] };
    let result = enrichedUsers;

    if (filters.region !== "all") result = result.filter((u) => u.region === filters.region);
    if (filters.district !== "all") result = result.filter((u) => u.district === filters.district);
    if (filters.schoolCodes.length > 0) {
      const codes = new Set(filters.schoolCodes);
      result = result.filter((u) => codes.has(u.school_code));
    }
    if (filters.groupName !== "all") result = result.filter((u) => u.group_name === filters.groupName);
    if (filters.language !== "all") result = result.filter((u) => u.language === filters.language);
    if (filters.gender !== "all") result = result.filter((u) => u.gender === filters.gender);
    if (filters.hasResult !== "all") {
      const tested = filters.hasResult === "true";
      result = result.filter((u) => (u.dtm?.tested ?? u.has_result) === tested);
    }
    if (filters.searchTerm.trim()) {
      const terms = filters.searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((u) => {
        const text = [u.full_name, u.phone, u.bot_id].filter(Boolean).join(" ").toLowerCase();
        return terms.every((t) => text.includes(t));
      });
    }

    const schoolSet = new Set(result.map((u) => u.school_code).filter(Boolean));
    return { users: result.length, schools: schoolSet.size, items: result };
  }, [enrichedUsers, filters]);

  // ========== COLUMNS ==========
  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(ALL_EXPORT_COLUMNS.map((c) => c.key)));
  const deselectAll = () => setSelected(new Set());

  const hasActiveFilters = filters.gender !== "all" || filters.language !== "all" ||
    filters.hasResult !== "all" || filters.groupName !== "all" || filters.region !== "all" ||
    filters.district !== "all" || filters.searchTerm.trim().length > 0 || filters.schoolCodes.length > 0;

  // Preview pagination
  const totalPreviewPages = Math.max(1, Math.ceil(filteredData.items.length / PREVIEW_PAGE_SIZE));
  const previewItems = filteredData.items.slice(
    previewPage * PREVIEW_PAGE_SIZE,
    (previewPage + 1) * PREVIEW_PAGE_SIZE
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Eksport sozlamalari
          </DialogTitle>
          <DialogDescription>
            Filtrlarni tanlang, ustunlarni belgilang — ZIP fayl yuklab olinadi
          </DialogDescription>
        </DialogHeader>

        {/* ===== CASCADING FILTERS ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtrlar
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilters(INITIAL_FILTERS); setPreviewPage(0); }}
                className="text-xs h-6 ml-auto"
              >
                Tozalash
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="FIO, telefon bo'yicha qidirish..."
              value={filters.searchTerm}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }));
                setPreviewPage(0);
              }}
              className="pl-9 h-9"
            />
          </div>

          {/* Row 1: Region → District */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Viloyat/Shahar</Label>
              <Select value={filters.region} onValueChange={(v) => updateFilter("region", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi ({regionOptions.length})</SelectItem>
                  {regionOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tuman</Label>
              <Select value={filters.district} onValueChange={(v) => updateFilter("district", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi ({districtOptions.length})</SelectItem>
                  {districtOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Schools multi-select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <School className="h-3.5 w-3.5" />
                Maktablar
                {filters.schoolCodes.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {filters.schoolCodes.length} ta
                  </Badge>
                )}
              </Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={selectAllSchools} className="text-xs h-6 px-2">
                  Barchasi
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAllSchools} className="text-xs h-6 px-2">
                  Tozalash
                </Button>
              </div>
            </div>

            {/* Selected schools badges */}
            {filters.schoolCodes.length > 0 && filters.schoolCodes.length <= 8 && (
              <div className="flex flex-wrap gap-1">
                {filters.schoolCodes.map((code) => {
                  const school = schoolFilterOptions.find((s) => s.code === code);
                  return (
                    <Badge key={code} variant="outline" className="text-xs gap-1 pr-1">
                      {school?.name || code}
                      <button onClick={() => toggleSchool(code)} className="ml-0.5 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            <ScrollArea className="h-[120px] rounded-md border p-1.5">
              <div className="space-y-0.5">
                {schoolFilterOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {allUsers.length === 0 ? "Ma'lumotlar yuklanmoqda..." : "Maktab topilmadi"}
                  </p>
                ) : (
                  schoolFilterOptions.map((s) => (
                    <div
                      key={s.code}
                      className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/60 cursor-pointer"
                      onClick={() => toggleSchool(s.code)}
                    >
                      <Checkbox
                        checked={filters.schoolCodes.includes(s.code)}
                        onCheckedChange={() => toggleSchool(s.code)}
                      />
                      <span className="text-sm flex-1 truncate">{s.name}</span>
                      <code className="text-xs text-muted-foreground font-mono">{s.code}</code>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Row 3: Group → Language → Gender → Result */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Guruh</Label>
              <Select value={filters.groupName} onValueChange={(v) => updateFilter("groupName", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi ({groupOptions.length})</SelectItem>
                  {groupOptions.map((g) => (
                    <SelectItem key={g} value={g}>{g} guruh</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Til</Label>
              <Select value={filters.language} onValueChange={(v) => updateFilter("language", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi ({languageOptions.length})</SelectItem>
                  {languageOptions.map((l) => (
                    <SelectItem key={l} value={l}>{LANG_LABELS[l] || l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Jinsi</Label>
              <Select value={filters.gender} onValueChange={(v) => setFilters((prev) => ({ ...prev, gender: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  {genderOptions.map((g) => (
                    <SelectItem key={g} value={g}>{GENDER_LABELS[g] || g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Natija holati</Label>
              <Select value={filters.hasResult} onValueChange={(v) => setFilters((prev) => ({ ...prev, hasResult: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="true">Natijasi bor</SelectItem>
                  <SelectItem value="false">Natijasi yo'q</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* ===== COLUMNS ===== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ustunlar</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">Barchasi</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7">Tozalash</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 max-h-[140px] overflow-y-auto py-1">
            {ALL_EXPORT_COLUMNS.map((col) => (
              <div key={col.key} className="flex items-center gap-2">
                <Checkbox
                  id={`col-${col.key}`}
                  checked={selected.has(col.key)}
                  onCheckedChange={() => toggle(col.key)}
                />
                <Label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">{col.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ===== LOADING / ERROR / PREVIEW ===== */}
        {usersLoading && (
          <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/40 px-4 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">O'quvchilar yuklanmoqda...</span>
          </div>
        )}

        {usersError && !usersLoading && (
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {usersError}
            </div>
            {onRetryLoadUsers && (
              <Button variant="outline" size="sm" onClick={onRetryLoadUsers} className="text-xs gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Qayta yuklash
              </Button>
            )}
          </div>
        )}

        {!usersLoading && !usersError && allUsers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{filteredData.users.toLocaleString()}</span>
                  <span className="text-muted-foreground"> ta o'quvchi, </span>
                  <span className="font-semibold text-foreground">{filteredData.schools}</span>
                  <span className="text-muted-foreground"> ta maktab</span>
                  {hasActiveFilters && (
                    <span className="text-muted-foreground"> (jami: {allUsers.length.toLocaleString()})</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowPreview(!showPreview); setPreviewPage(0); }}
                className="text-xs gap-1.5"
              >
                {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPreview ? "Yopish" : "Ko'rish"}
              </Button>
            </div>

            {showPreview && filteredData.items.length > 0 && (
              <>
                <ScrollArea className="h-[280px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>F.I.O.</TableHead>
                        <TableHead>Maktab</TableHead>
                        <TableHead>Tuman</TableHead>
                        <TableHead>Guruh</TableHead>
                        <TableHead>Til</TableHead>
                        <TableHead className="text-center">Natija</TableHead>
                        <TableHead className="text-right">Ball</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewItems.map((user, idx) => (
                        <TableRow key={user.id || idx}>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {previewPage * PREVIEW_PAGE_SIZE + idx + 1}
                          </TableCell>
                          <TableCell className="text-sm font-medium">{user.full_name}</TableCell>
                          <TableCell className="text-xs">{user.school_name || user.school_code}</TableCell>
                          <TableCell className="text-xs">{user.district || "—"}</TableCell>
                          <TableCell className="text-xs">{user.group_name || "—"}</TableCell>
                          <TableCell className="text-xs">{LANG_LABELS[user.language || ""] || user.language || "—"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={(user.dtm?.tested ?? user.has_result) ? "default" : "secondary"} className="text-xs">
                              {(user.dtm?.tested ?? user.has_result) ? "Ha" : "Yo'q"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {user.total_point != null ? user.total_point : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Pagination */}
                {totalPreviewPages > 1 && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-muted-foreground">
                      {previewPage * PREVIEW_PAGE_SIZE + 1}–{Math.min((previewPage + 1) * PREVIEW_PAGE_SIZE, filteredData.items.length)} / {filteredData.items.length.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={previewPage === 0}
                        onClick={() => setPreviewPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        {previewPage + 1} / {totalPreviewPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        disabled={previewPage >= totalPreviewPages - 1}
                        onClick={() => setPreviewPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {showPreview && filteredData.items.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">
                Filtrlar bo'yicha o'quvchi topilmadi
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Bekor qilish
          </Button>
          <Button
            onClick={() => onExport(Array.from(selected), filters, filteredData.items)}
            disabled={selected.size === 0 || exporting || usersLoading || filteredData.users === 0}
          >
            {exporting ? (
              exportProgress || "Yuklanmoqda..."
            ) : (
              <>
                <FileArchive className="mr-2 h-4 w-4" />
                ZIP eksport ({filteredData.users.toLocaleString()} o'quvchi)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
