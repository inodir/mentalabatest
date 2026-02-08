import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { StatCard } from "@/components/ui/stat-card";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  School,
  Users,
  TrendingUp,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  MapPin,
} from "lucide-react";

interface SchoolData {
  id: string;
  school_name: string;
  school_code: string;
  admin_full_name: string;
  admin_login: string;
  is_active: boolean;
  district: string;
  region: string;
}

export default function DistrictDashboard() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("school_name", { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
      toast({
        title: "Xatolik",
        description: "Maktablarni yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const filteredSchools = schools.filter(
    (s) =>
      s.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.school_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admin_full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSchools = schools.filter((s) => s.is_active).length;
  const district = schools.length > 0 ? schools[0].district : "";

  return (
    <AdminLayout variant="district">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bosh sahifa</h1>
            <p className="text-muted-foreground">
              Tuman maktablari statistikasi
              {district && (
                <Badge variant="secondary" className="ml-2">
                  <MapPin className="mr-1 h-3 w-3" />
                  {district}
                </Badge>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchSchools()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Jami maktablar"
            value={schools.length}
            icon={School}
          />
          <StatCard
            title="Faol maktablar"
            value={activeSchools}
            icon={TrendingUp}
          />
          <StatCard
            title="O'quvchilar"
            value="—"
            icon={Users}
            description="DTM ma'lumotlari"
          />
        </div>

        {/* Schools List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Maktablar ro'yxati
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
                    <TableHead>Admin</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Maktablar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.school_name}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                            {school.school_code}
                          </code>
                        </TableCell>
                        <TableCell>{school.admin_full_name}</TableCell>
                        <TableCell>
                          <Badge variant={school.is_active ? "default" : "secondary"}>
                            {school.is_active ? "Faol" : "Nofaol"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/district/schools/${school.id}`}>
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
