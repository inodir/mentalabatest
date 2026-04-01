import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DTMUser } from "@/lib/dtm-api";
import { DebouncedInput } from "@/components/ui/debounced-input";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, School, CheckCircle2, Filter, X, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

export interface DTMFilters {
  searchTerm: string;
  schoolCode: string[];
  hasResult: string;
  hasTestFile: string;
  groupName: string[];
}

interface SchoolOption {
  code: string;
  name?: string;
}

interface DTMUsersFiltersProps {
  users: DTMUser[];
  filters: DTMFilters;
  onFiltersChange: (filters: DTMFilters) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  allSchools?: SchoolOption[];
  allGroupNames?: string[];
}

export function DTMUsersFilters({
  users,
  filters,
  onFiltersChange,
  limit,
  onLimitChange,
  allSchools,
  allGroupNames = [],
}: DTMUsersFiltersProps) {
  // Extract unique values for dropdowns
  const schoolCodes = useMemo(() => {
    if (allSchools && allSchools.length > 0) {
      return allSchools
        .map((s) => ({ code: s.code, name: s.name }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }
    // Fallback: extract from current page users
    const schoolCodesSet = new Set<string>();
    users.forEach((user) => {
      if (user.school_code) schoolCodesSet.add(user.school_code);
    });
    return [...schoolCodesSet].sort().map((code) => ({ code, name: undefined }));
  }, [users, allSchools]);

  const updateFilter = (key: keyof DTMFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      schoolCode: [],
      hasResult: "all",
      hasTestFile: "all",
      groupName: [],
    });
  };

  const activeFiltersCount = [
    filters.schoolCode.length > 0,
    filters.hasResult !== "all",
    filters.hasTestFile !== "all",
    filters.groupName.length > 0,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Search and limit row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <DebouncedInput
              placeholder="Ism, bot ID, telefon yoki maktab kodi bo'yicha qidirish..."
              value={filters.searchTerm}
              onDebounceChange={(v) => updateFilter("searchTerm", v)}
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
          <MultiSelect
            options={schoolCodes.map(s => ({ label: s.name ? `${s.name} (${s.code})` : s.code, value: s.code }))}
            selected={filters.schoolCode}
            onChange={(v: any) => updateFilter("schoolCode", v)}
            placeholder="Maktablar"
            icon={School}
            className="w-[220px]"
          />

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

          <Select value={filters.hasTestFile} onValueChange={(v) => updateFilter("hasTestFile", v)}>
            <SelectTrigger className="w-[170px]">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <SelectValue placeholder="Test fayli" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Test fayli: barchasi</SelectItem>
              <SelectItem value="true">Test fayli bor</SelectItem>
              <SelectItem value="false">Test fayli yo'q</SelectItem>
            </SelectContent>
          </Select>

          {/* Group name filter */}
          {allGroupNames.length > 0 && (
            <MultiSelect
              options={allGroupNames.map(g => ({ label: g, value: g }))}
              selected={filters.groupName}
              onChange={(v: any) => updateFilter("groupName", v)}
              placeholder="Guruhlar"
              icon={Users}
              className="w-[180px]"
            />
          )}

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
    if (filters.schoolCode.length > 0 && !filters.schoolCode.includes(user.school_code)) {
      return false;
    }

    // Has result filter
    if (filters.hasResult !== "all") {
      const hasResult = filters.hasResult === "true";
      if (user.has_result !== hasResult) return false;
    }

    if (filters.hasTestFile !== "all") {
      const hasTestFile = filters.hasTestFile === "true";
      if (Boolean(user.test_file_url) !== hasTestFile) return false;
    }

    // Group name filter
    if (filters.groupName.length > 0 && (!user.group_name || !filters.groupName.includes(user.group_name))) {
      return false;
    }

    return true;
  });
}
