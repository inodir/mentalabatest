import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DTMUser } from "@/lib/dtm-api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, School, CheckCircle2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DTMFilters {
  searchTerm: string;
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
  const schoolCodes = useMemo(() => {
    const schoolCodesSet = new Set<string>();

    users.forEach((user) => {
      if (user.school_code) schoolCodesSet.add(user.school_code);
    });

    return [...schoolCodesSet].sort();
  }, [users]);

  const updateFilter = (key: keyof DTMFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      schoolCode: "all",
      hasResult: "all",
    });
  };

  const activeFiltersCount = [
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
              placeholder="Ism, bot ID, telefon yoki maktab kodi bo'yicha qidirish..."
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
      const terms = filters.searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      const searchableText = [
        user.full_name,
        user.school_code,
        user.phone,
        user.bot_id,
        user.chat_id,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = terms.every((term) => searchableText.includes(term));
      if (!matchesSearch) return false;
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
