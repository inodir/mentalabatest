import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiSettings } from "@/lib/dtm-api";
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  Download,
  RefreshCw,
  School,
  Building2,
  ArrowUpDown,
  TrendingUp,
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

type SortField = "full_name" | "registered_count" | "answered_count";
type SortDir = "asc" | "desc";

export default function DTMDistrictDetails() {
  const { districtUsername } = useParams<{ districtUsername: string }>();
  const navigate = useNavigate();
  const [districtInfo, setDistrictInfo] = useState<DTMDistrict | null>(null);
  const [schools, setSchools] = useState<DTMSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("registered_count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchData = useCallback(async () => {
    const settings = getApiSettings();
    if (!settings) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const baseUrl = settings.mainUrl.endsWith("/") ? settings.mainUrl : `${settings.mainUrl}/`;

      // Fetch district info and schools in parallel
      const [distRes, schoolsRes] = await Promise.all([
        fetch(`${baseUrl}api/v1/management/districts`, {
          headers: { accept: "application/json", "x-api-key": settings.apiKey },
        }),
        fetch(`${baseUrl}api/v1/management/schools`, {
          headers: { accept: "application/json", "x-api-key": settings.apiKey },
        }),
      ]);

      if (distRes.ok) {
        const allDistricts: DTMDistrict[] = await distRes.json();
        const found = allDistricts.find((d) => d.username === districtUsername);
        if (found) setDistrictInfo(found);

        // Filter schools by this district's district name
        if (schoolsRes.ok && found) {
          const allSchools: DTMSchool[] = await schoolsRes.json();
          const districtSchools = allSchools.filter(
            (s) => s.district === found.district && s.region === found.region
          );
          setSchools(districtSchools);
        }
      }
    } catch (err) {
      console.error("Error fetching district data:", err);
    } finally {
      setLoading(false);
    }
  }, [districtUsername]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = schools
    .filter(
      (s) =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDir === "asc" ? 1 : -1;
      if (sortField === "full_name") {
        return multiplier * a.full_name.localeCompare(b.full_name);
      }
      return multiplier * (a[sortField] - b[sortField]);
    });

  const totalRegistered = filtered.reduce((s, x) => s + x.registered_count, 0);
  const totalAnswered = filtered.reduce((s, x) => s + x.answered_count, 0);
  const overallPct = totalRegistered > 0 ? Math.round((totalAnswered / totalRegistered) * 100) : 0;

  const handleExport = () => {
    const headers = ["Maktab nomi", "Kod", "Ro'yxatdan o'tganlar", "Javob berganlar", "Foiz"];
    const rows = filtered.map((s) => {
      const pct = s.registered_count > 0 ? Math.round((s.answered_count / s.registered_count) * 100) : 0;
      return [s.full_name, s.username, s.registered_count, s.answered_count, `${pct}%`];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${districtInfo?.district || "tuman"}_maktablar.csv`;
    a.click();
  };

  const displayName = districtInfo?.district || districtUsername || "";

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/super-admin/district-admins">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate sm:text-3xl">
              {loading && !districtInfo ? (
                <Skeleton className="h-8 w-64" />
              ) : (
                displayName
              )}
            </h1>
            {districtInfo && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {districtInfo.region} •{" "}
                <span className="font-medium">{districtInfo.full_name}</span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            title="Yangilash"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <School className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maktablar</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : filtered.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ro'yxatdan o'tganlar</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : totalRegistered}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Javob berganlar</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : totalAnswered}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Umumiy foiz</p>
                <p className="text-2xl font-bold tracking-tight">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${overallPct}%`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Maktab nomi bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Schools Table */}
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
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center">
                      <School className="mx-auto h-10 w-10 text-muted-foreground/40" />
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
    </AdminLayout>
  );
}
