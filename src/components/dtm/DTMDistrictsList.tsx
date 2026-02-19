import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getApiSettings } from "@/lib/dtm-api";
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
  Users,
  CheckCircle2,
  Download,
  ArrowUpDown,
  MapPin,
  Building2,
  School,
  UserCog,
} from "lucide-react";

interface DTMDistrict {
  id: number;
  username: string;
  full_name: string;
  region: string;
  district: string;
  registered_count: number;
  answered_count: number;
  school_count: number;
}

type SortField = "full_name" | "district" | "registered_count" | "answered_count" | "school_count";
type SortDir = "asc" | "desc";

export function DTMDistrictsList() {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState<DTMDistrict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("registered_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchDistricts = useCallback(async () => {
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
      const response = await fetch(`${baseUrl}api/v1/management/districts`, {
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

      const data: DTMDistrict[] = await response.json();
      setDistricts(data);
    } catch (err) {
      console.error("DTM districts fetch error:", err);
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  const regions = [...new Set(districts.map((d) => d.region).filter(Boolean))].sort();

  const filtered = districts
    .filter((d) => {
      const matchesSearch =
        d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === "all" || d.region === regionFilter;
      return matchesSearch && matchesRegion;
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
  const totalSchools = filtered.reduce((s, x) => s + x.school_count, 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleExport = () => {
    const headers = ["Tuman nomi", "Admin", "Viloyat", "Tuman", "Maktablar", "Ro'yxatdan o'tganlar", "Javob berganlar"];
    const rows = filtered.map((d) => [d.full_name, d.username, d.region, d.district, d.school_count, d.registered_count, d.answered_count]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dtm_tumanlar.csv";
    a.click();
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Building2 className="h-12 w-12 text-destructive/60" />
          <div className="text-center">
            <p className="font-medium text-destructive">{error}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              API sozlamalarini tekshiring va qayta urinib ko'ring
            </p>
          </div>
          <Button variant="outline" onClick={fetchDistricts}>
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
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jami tumanlar</p>
              <p className="text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-16" /> : filtered.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <School className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jami maktablar</p>
              <p className="text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-16" /> : totalSchools.toLocaleString()}
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
            placeholder="Tuman nomi, admin yoki viloyat bo'yicha qidiring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Viloyat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha viloyatlar</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchDistricts} disabled={loading} title="Yangilash">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport} disabled={loading || filtered.length === 0} title="CSV Export">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
                    Admin nomi
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableHead>
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
                    onClick={() => handleSort("school_count")}
                  >
                    <School className="h-3.5 w-3.5" />
                    Maktablar
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
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-14 mx-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <UserCog className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">Tuman adminlari topilmadi</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((dist, idx) => {
                  const pct =
                    dist.registered_count > 0
                      ? Math.round((dist.answered_count / dist.registered_count) * 100)
                      : 0;
                  return (
                    <TableRow
                      key={dist.id}
                      className="group cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => navigate(`/super-admin/dtm-districts/${dist.username}`)}
                    >
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                            <UserCog className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium">{dist.full_name}</span>
                            <p className="text-xs text-muted-foreground font-mono">{dist.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span>{dist.district}</span>
                          <p className="text-xs text-muted-foreground">{dist.region}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="tabular-nums font-semibold">
                          {dist.school_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold tabular-nums">{dist.registered_count}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold tabular-nums">{dist.answered_count}</span>
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
              Jami: {filtered.length} tuman · {totalSchools.toLocaleString()} maktab · {totalRegistered.toLocaleString()} ro'yxatdan o'tgan · {totalAnswered.toLocaleString()} javob bergan
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
