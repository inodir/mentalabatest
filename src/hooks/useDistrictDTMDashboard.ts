import { useState, useEffect, useCallback } from "react";
import {
  fetchAllDTMUsersWithToken,
  fetchAllDTMUsers,
  getApiSettings,
  DTMUser,
} from "@/lib/dtm-api";
import { useAuth } from "@/hooks/useAuth";
import { getDTMTokens } from "@/lib/dtm-auth";

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
  const { dtmUser } = useAuth();
  const [stats, setStats] = useState<DistrictDTMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DistrictDashboardError>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    // Get schools from DTM auth user data
    const schools = dtmUser?.schools || [];
    if (schools.length === 0 && dtmUser?.school) {
      schools.push(dtmUser.school);
    }

    if (schools.length === 0) {
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

    const schoolCodes = new Set(schools.map((s) => s.code));

    try {
      let entities: DTMUser[];

      // Try DTM auth token first, then fall back to API key
      const { accessToken } = getDTMTokens();
      if (accessToken) {
        const result = await fetchAllDTMUsersWithToken(
          accessToken,
          (loaded, total) => setProgress({ loaded, total })
        );
        entities = result.entities;
      } else {
        const apiSettings = getApiSettings();
        if (!apiSettings) {
          setError("NO_CONFIG");
          setLoading(false);
          return;
        }
        const result = await fetchAllDTMUsers(
          apiSettings,
          (loaded, total) => setProgress({ loaded, total })
        );
        entities = result.entities;
      }

      // Filter by district school codes
      const districtStudents = entities.filter((u) => schoolCodes.has(u.school_code));

      // Per-school stats
      const schoolStats: DistrictSchoolDTMStats[] = schools.map((school) => {
        const students = districtStudents.filter((u) => u.school_code === school.code);
        const withResults = students.filter((u) => u.has_result);
        const withPoints = students.filter((u) => u.total_point != null);
        const avg = withPoints.length > 0
          ? Math.round(withPoints.reduce((s, u) => s + (u.total_point || 0), 0) / withPoints.length)
          : 0;

        return {
          schoolId: String(school.id),
          schoolName: school.name,
          schoolCode: school.code,
          totalStudents: students.length,
          studentsWithResults: withResults.length,
          averageScore: avg,
        };
      });

      // Aggregated stats
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
  }, [dtmUser]);

  useEffect(() => {
    if (dtmUser) {
      fetchData();
    }
  }, [fetchData, dtmUser]);

  const retry = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { stats, loading, error, progress, retry } as UseDistrictDTMDashboardResult;
}
