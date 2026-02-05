import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, School, CheckCircle2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DTMUser } from "@/lib/dtm-api";

export interface DTMFilters {
  searchTerm: string;
  region: string;
  district: string;
  schoolCode: string;
  hasResult: string;
}

interface DTMUsersFiltersProps {
  users: DTMUser[];
  filters: DTMFilters;
  onFiltersChange: (filters: DTMFilters) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

export function DTMUsersFilters({
  users,
  filters,
  onFiltersChange,
  limit,
  onLimitChange,
}: DTMUsersFiltersProps) {
  // Extract unique values for dropdowns
  const { regions, districts, schoolCodes } = useMemo(() => {
    const regionsSet = new Set<string>();
    const districtsSet = new Set<string>();
    const schoolCodesSet = new Set<string>();

    users.forEach((user) => {
      if (user.region) regionsSet.add(user.region);
      if (user.district) districtsSet.add(user.district);
      if (user.school_code) schoolCodesSet.add(user.school_code);
    });

    return {
      regions: [...regionsSet].sort(),
      districts: [...districtsSet]
        .filter((d) => !filters.region || users.some(u => u.region === filters.region && u.district === d))
        .sort(),
      schoolCodes: [...schoolCodesSet].sort(),
    };
  }, [users, filters.region]);

  const updateFilter = (key: keyof DTMFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters
    if (key === "region") {
      newFilters.district = "all";
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      region: "all",
      district: "all",
      schoolCode: "all",
      hasResult: "all",
    });
  };

  const activeFiltersCount = [
    filters.region !== "all",
    filters.district !== "all",
    filters.schoolCode !== "all",
    filters.hasResult !== "all",
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Search and limit row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ism, maktab kodi yoki telefon bo'yicha qidirish..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ko'rsatish:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => onLimitChange(Number(val))}
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

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filterlar:</span>
          </div>

          {/* Region filter */}
          <Select value={filters.region} onValueChange={(v) => updateFilter("region", v)}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <SelectValue placeholder="Viloyat" />
              </div>
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

          {/* District filter */}
          <Select 
            value={filters.district} 
            onValueChange={(v) => updateFilter("district", v)}
            disabled={filters.region === "all"}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <SelectValue placeholder="Tuman" />
              </div>
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

          {/* School filter */}
          <Select value={filters.schoolCode} onValueChange={(v) => updateFilter("schoolCode", v)}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4" />
                <SelectValue placeholder="Maktab" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha maktablar</SelectItem>
              {schoolCodes.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Has result filter */}
          <Select value={filters.hasResult} onValueChange={(v) => updateFilter("hasResult", v)}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <SelectValue placeholder="Natija" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="true">Natijasi bor</SelectItem>
              <SelectItem value="false">Natijasi yo'q</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Tozalash
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to filter users based on filters
export function filterDTMUsers(users: DTMUser[], filters: DTMFilters): DTMUser[] {
  return users.filter((user) => {
    // Text search
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      const matchesSearch =
        user.full_name?.toLowerCase().includes(term) ||
        user.school_code?.toLowerCase().includes(term) ||
        user.school_name?.toLowerCase().includes(term) ||
        user.phone_number?.includes(term);
      if (!matchesSearch) return false;
    }

    // Region filter
    if (filters.region !== "all" && user.region !== filters.region) {
      return false;
    }

    // District filter
    if (filters.district !== "all" && user.district !== filters.district) {
      return false;
    }

    // School code filter
    if (filters.schoolCode !== "all" && user.school_code !== filters.schoolCode) {
      return false;
    }

    // Has result filter
    if (filters.hasResult !== "all") {
      const hasResult = filters.hasResult === "true";
      if (user.has_result !== hasResult) return false;
    }

    return true;
  });
}
