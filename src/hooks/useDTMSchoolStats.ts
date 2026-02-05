import { useState, useEffect, useCallback } from "react";
import { getApiSettings, fetchAllDTMUsers, DTMUser } from "@/lib/dtm-api";

export interface DTMSchoolStats {
  school_code: string;
  user_count: number;
  result_count: number;
  avg_score: number;
}

interface UseDTMSchoolStatsResult {
  stats: Map<string, DTMSchoolStats>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDTMSchoolStats(): UseDTMSchoolStatsResult {
  const [stats, setStats] = useState<Map<string, DTMSchoolStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    const settings = getApiSettings();
    if (!settings) {
      setError("API sozlamalari topilmadi");
      setLoading(false);
      return;
    }

    try {
      const { entities } = await fetchAllDTMUsers(settings);
      
      // Group by school_code
      const schoolMap = new Map<string, DTMUser[]>();
      
      for (const user of entities) {
        if (!user.school_code) continue;
        
        const existing = schoolMap.get(user.school_code) || [];
        existing.push(user);
        schoolMap.set(user.school_code, existing);
      }

      // Calculate stats for each school
      const statsMap = new Map<string, DTMSchoolStats>();
      
      schoolMap.forEach((users, schoolCode) => {
        const usersWithResult = users.filter(u => u.has_result);
        const usersWithPoints = users.filter(u => u.total_point !== null && u.total_point !== undefined);
        
        const avgScore = usersWithPoints.length > 0
          ? Math.round(
              usersWithPoints.reduce((sum, u) => sum + (u.total_point || 0), 0) / 
              usersWithPoints.length * 10
            ) / 10
          : 0;

        statsMap.set(schoolCode, {
          school_code: schoolCode,
          user_count: users.length,
          result_count: usersWithResult.length,
          avg_score: avgScore,
        });
      });

      setStats(statsMap);
    } catch (err) {
      console.error("Error fetching DTM stats:", err);
      setError("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return {
    stats,
    loading,
    error,
    refresh: calculateStats,
  };
}
