import { useState, useEffect, useCallback } from "react";
import {
  getApiSettings,
  fetchAllDTMUsers,
  DTMUser,
  DTMApiSettings,
} from "@/lib/dtm-api";
import { supabase } from "@/integrations/supabase/client";

export interface DistrictSchoolDTMStats {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  totalStudents: number;
  studentsWithResults: number;
  averageScore: number;
}

export interface DistrictDTMStats {
  totalStudents: number;
  studentsWithResults: number;
  studentsWithoutResults: number;
  totalSchools: number;
  averageScore: number;
  recentUsers: DTMUser[];
  schoolStats: DistrictSchoolDTMStats[];
  isApproximate: boolean;
}

export type DistrictDashboardError = "NO_CONFIG" | "API_KEY_INVALID" | "NETWORK_ERROR" | null;

interface UseDistrictDTMDashboardResult {
  stats: DistrictDTMStats | null;
  loading: boolean;
  error: DistrictDashboardError;
  progress: { loaded: number; total: number } | null;
  retry: () => void;
}

export function useDistrictDTMDashboard() {
  const [stats, setStats] = useState<DistrictDTMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DistrictDashboardError>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    const apiSettings = getApiSettings();
    if (!apiSettings) {
      setError("NO_CONFIG");
      setLoading(false);
      return;
    }

    try {
      // 1. Get district schools from DB (RLS filters by district automatically)
      const { data: schools, error: schoolsError } = await supabase
        .from("schools")
        .select("id, school_name, school_code")
        .order("school_name");

      if (schoolsError) throw schoolsError;
      if (!schools || schools.length === 0) {
        setStats({
          totalStudents: 0,
          studentsWithResults: 0,
          studentsWithoutResults: 0,
          totalSchools: 0,
          averageScore: 0,
          recentUsers: [],
          schoolStats: [],
          isApproximate: false,
        });
        setLoading(false);
        return;
      }

      const schoolCodes = new Set(schools.map((s) => s.school_code));

      // 2. Fetch all DTM users
      const { entities } = await fetchAllDTMUsers(
        apiSettings,
        (loaded, total) => setProgress({ loaded, total })
      );

      // 3. Filter by district school codes
      const districtStudents = entities.filter((u) => schoolCodes.has(u.school_code));

      // 4. Per-school stats
      const schoolStats: DistrictSchoolDTMStats[] = schools.map((school) => {
        const students = districtStudents.filter((u) => u.school_code === school.school_code);
        const withResults = students.filter((u) => u.has_result);
        const withPoints = students.filter((u) => u.total_point != null);
        const avg = withPoints.length > 0
          ? Math.round(withPoints.reduce((s, u) => s + (u.total_point || 0), 0) / withPoints.length)
          : 0;

        return {
          schoolId: school.id,
          schoolName: school.school_name,
          schoolCode: school.school_code,
          totalStudents: students.length,
          studentsWithResults: withResults.length,
          averageScore: avg,
        };
      });

      // 5. Aggregated stats
      const withResults = districtStudents.filter((u) => u.has_result);
      const withPoints = districtStudents.filter((u) => u.total_point != null);
      const avgScore = withPoints.length > 0
        ? Math.round(withPoints.reduce((s, u) => s + (u.total_point || 0), 0) / withPoints.length)
        : 0;

      const recentUsers = [...districtStudents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setStats({
        totalStudents: districtStudents.length,
        studentsWithResults: withResults.length,
        studentsWithoutResults: districtStudents.length - withResults.length,
        totalSchools: schools.length,
        averageScore: avgScore,
        recentUsers,
        schoolStats,
        isApproximate: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "API_KEY_INVALID") {
        setError("API_KEY_INVALID");
      } else {
        setError("NETWORK_ERROR");
      }
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { stats, loading, error, progress, retry } as UseDistrictDTMDashboardResult;
}
