import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useDistrictDTMDashboard } from "@/hooks/useDistrictDTMDashboard";
import {
  School,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

export default function DistrictSchools() {
  const { dtmUser } = useAuth();
  const { stats, loading, retry } = useDistrictDTMDashboard();
  const [searchTerm, setSearchTerm] = useState("");

  // Use schools from dtmUser directly, enriched with stats if available
  const schools = (dtmUser?.schools || []).map((school) => {
    const stat = stats?.schoolStats?.find((s) => s.schoolCode === school.code);
    return {
      ...school,
      totalStudents: stat?.totalStudents ?? 0,
      studentsWithResults: stat?.studentsWithResults ?? 0,
      averageScore: stat?.averageScore ?? 0,
    };
  });

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout variant="district">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maktablar</h1>
            <p className="text-muted-foreground">
              {dtmUser?.district || "Tuman"} maktablari ro'yxati
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={retry} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Maktablar ({filteredSchools.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Maktab nomi yoki kod bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maktab nomi</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead className="text-center">O'quvchilar</TableHead>
                    <TableHead className="text-center">Natijasi bor</TableHead>
                    <TableHead className="text-center">O'rtacha ball</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Maktablar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.code}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                            {school.code}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          {loading ? (
                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                          ) : (
                            <Badge variant="outline">{school.totalStudents}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {loading ? (
                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                          ) : (
                            <Badge variant={school.studentsWithResults > 0 ? "default" : "secondary"}>
                              {school.studentsWithResults}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {loading ? (
                            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                          ) : school.averageScore > 0 ? (
                            <Badge variant={
                              school.averageScore >= 150 ? "default" :
                              school.averageScore >= 100 ? "secondary" : "destructive"
                            }>
                              {school.averageScore}/189
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/district/schools/${school.code}`}>
                            <Button variant="ghost" size="icon" title="Ko'rish">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}