import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { REGIONS } from "@/lib/constants";
import {
  Plus,
  Search,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";

interface DistrictAdmin {
  id: string;
  district: string;
  region: string;
  admin_login: string;
  admin_full_name: string;
  initial_password: string;
  created_at: string;
}

export default function DistrictAdminsManagement() {
  const [admins, setAdmins] = useState<DistrictAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    region: "",
    district: "",
    admin_full_name: "",
    admin_login: "",
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("district_admin_credentials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error("Error fetching district admins:", error);
      toast({
        title: "Xatolik",
        description: "Tuman adminlarini yuklashda xatolik",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const password = generatePassword();

      const { data, error } = await supabase.functions.invoke("create-district-admin", {
        body: {
          district: formData.district,
          region: formData.region,
          admin_login: formData.admin_login,
          admin_password: password,
          admin_full_name: formData.admin_full_name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Muvaffaqiyat",
        description: `Tuman admini yaratildi. Login: ${formData.admin_login}, Parol: ${password}`,
      });

      setIsAddDialogOpen(false);
      setFormData({ region: "", district: "", admin_full_name: "", admin_login: "" });
      fetchAdmins();
    } catch (error) {
      console.error("Error creating district admin:", error);
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Tuman adminini yaratishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Nusxalandi", description: "Matn nusxalandi" });
  };

  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      a.admin_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.admin_login.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === "all" || a.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tuman adminlari</h1>
            <p className="text-muted-foreground">
              Tuman rahbarlarini yarating va boshqaring
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tuman admin qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi tuman admin</DialogTitle>
                <DialogDescription>
                  Tuman rahbari uchun admin hisobini yarating
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Viloyat</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(v) => setFormData({ ...formData, region: v, district: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Viloyatni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tuman</Label>
                  <Input
                    placeholder="Tuman nomi"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admin F.I.O.</Label>
                  <Input
                    placeholder="To'liq ism"
                    value={formData.admin_full_name}
                    onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Login</Label>
                  <Input
                    placeholder="tuman_login"
                    value={formData.admin_login}
                    onChange={(e) => setFormData({ ...formData, admin_login: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yaratilmoqda...
                    </>
                  ) : (
                    "Yaratish"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Viloyat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha viloyatlar</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>F.I.O.</TableHead>
                <TableHead>Viloyat / Tuman</TableHead>
                <TableHead>Login / Parol</TableHead>
                <TableHead>Yaratilgan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Tuman adminlari topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <DistrictAdminRow
                    key={admin.id}
                    admin={admin}
                    copyToClipboard={copyToClipboard}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

function DistrictAdminRow({
  admin,
  copyToClipboard,
}: {
  admin: DistrictAdmin;
  copyToClipboard: (text: string) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{admin.admin_full_name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{admin.region}</div>
          <div className="text-muted-foreground">{admin.district}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{admin.admin_login}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(admin.admin_login)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              {showPassword ? admin.initial_password : "••••••••••••"}
            </code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            {showPassword && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(admin.initial_password)}>
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(admin.created_at).toLocaleDateString("uz-UZ")}
      </TableCell>
    </TableRow>
  );
}
