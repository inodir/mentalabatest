import { useState, useEffect, useCallback } from "react";
import { 
  fetchAllDTMUsersWithToken, 
  DTMUser, 
} from "@/lib/dtm-api";
import { useAuth } from "@/hooks/useAuth";
import { getDTMTokens, dtmRefreshToken } from "@/lib/dtm-auth";

export interface SchoolDTMStats {
  totalStudents: number;
  studentsWithResults: number;
  studentsWithoutResults: number;
  averageScore: number;
  recentStudents: DTMUser[];
}

interface UseSchoolDTMDataReturn {
  stats: SchoolDTMStats;
  students: DTMUser[];
  loading: boolean;
  error: string | null;
  schoolCode: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  lastUpdated: Date | null;
}

export function useSchoolDTMData(): UseSchoolDTMDataReturn {
  const { dtmUser } = useAuth();
  const [stats, setStats] = useState<SchoolDTMStats>({
    totalStudents: 0,
    studentsWithResults: 0,
    studentsWithoutResults: 0,
    averageScore: 0,
    recentStudents: [],
  });
  const [students, setStudents] = useState<DTMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const schoolCode = dtmUser?.school?.code ?? null;

  // Set stats from /me immediately
  useEffect(() => {
    if (dtmUser?.stats) {
      setStats(prev => ({
        ...prev,
        totalStudents: dtmUser.stats.registered_count ?? 0,
        studentsWithResults: dtmUser.stats.answered_count ?? 0,
        studentsWithoutResults: (dtmUser.stats.registered_count ?? 0) - (dtmUser.stats.answered_count ?? 0),
      }));
    }
  }, [dtmUser]);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    if (!schoolCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let { accessToken } = getDTMTokens();
      if (!accessToken) {
        setError("Tizimga qayta kiring");
        setLoading(false);
        return;
      }

      let result;
      try {
        result = await fetchAllDTMUsersWithToken(accessToken, undefined, forceRefresh);
      } catch (err) {
        // Try refresh token on auth error
        if (err instanceof Error && err.message === "API_KEY_INVALID") {
          const refreshed = await dtmRefreshToken();
          if (refreshed) {
            const tokens = getDTMTokens();
            if (tokens.accessToken) {
              result = await fetchAllDTMUsersWithToken(tokens.accessToken, undefined, forceRefresh);
            }
          }
          if (!result) {
            setError("Sessiya tugagan. Qayta kiring.");
            setLoading(false);
            return;
          }
        } else {
          throw err;
        }
      }

      const schoolStudents = result.entities.filter(
        (u) => u.school_code === schoolCode
      );

      setStudents(schoolStudents);

      // Calculate detailed stats from actual data
      const withResults = schoolStudents.filter((u) => u.has_result);
      const withPoints = schoolStudents.filter(
        (u) => u.total_point !== null && u.total_point !== undefined
      );
      const avgScore =
        withPoints.length > 0
          ? Math.round(
              withPoints.reduce((sum, u) => sum + (u.total_point || 0), 0) /
                withPoints.length
            )
          : 0;

      const recentStudents = [...schoolStudents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalStudents: schoolStudents.length,
        studentsWithResults: withResults.length,
        studentsWithoutResults: schoolStudents.length - withResults.length,
        averageScore: avgScore,
        recentStudents,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching DTM data:", err);
      setError(err instanceof Error ? err.message : "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [schoolCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    students,
    loading,
    error,
    schoolCode,
    refetch: fetchData,
    lastUpdated,
  };
}
