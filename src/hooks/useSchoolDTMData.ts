import { useState, useEffect, useCallback } from "react";
import { 
  getApiSettings, 
  fetchAllDTMUsers, 
  DTMUser, 
} from "@/lib/dtm-api";
import { useAuth } from "@/hooks/useAuth";

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
  hasApiSettings: boolean;
  refetch: (forceRefresh?: boolean) => Promise<void>;
  lastUpdated: Date | null;
}

// Cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute cache
const CACHE_KEY_PREFIX = "school_dtm_data_";

interface CachedDTMData {
  stats: SchoolDTMStats;
  students: DTMUser[];
  timestamp: number;
}

function getCachedDTMData(schoolCode: string): CachedDTMData | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${schoolCode}`);
    if (!cached) return null;
    
    const parsed: CachedDTMData = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${schoolCode}`);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

function setCachedDTMData(schoolCode: string, data: Omit<CachedDTMData, "timestamp">): void {
  const cacheData: CachedDTMData = {
    ...data,
    timestamp: Date.now(),
  };
  localStorage.setItem(`${CACHE_KEY_PREFIX}${schoolCode}`, JSON.stringify(cacheData));
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
  const [hasApiSettings, setHasApiSettings] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get school code from DTM auth
  const schoolCode = dtmUser?.school?.code ?? null;

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    if (!schoolCode) {
      setLoading(false);
      return;
    }

    const settings = getApiSettings();
    setHasApiSettings(!!settings);

    if (!settings) {
      setLoading(false);
      setError("API sozlamalari topilmadi. Super admin API kalitini sozlashi kerak.");
      return;
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedDTMData(schoolCode);
      if (cached) {
        setStats(cached.stats);
        setStudents(cached.students);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const { entities } = await fetchAllDTMUsers(settings, undefined, forceRefresh);
      
      // Filter by school code
      const schoolStudents = entities.filter(
        (u) => u.school_code === schoolCode
      );

      setStudents(schoolStudents);

      // Calculate stats
      const studentsWithResults = schoolStudents.filter((u) => u.has_result);
      const studentsWithoutResults = schoolStudents.filter((u) => !u.has_result);
      
      const usersWithPoints = schoolStudents.filter(
        (u) => u.total_point !== null && u.total_point !== undefined
      );
      const avgScore =
        usersWithPoints.length > 0
          ? Math.round(
              usersWithPoints.reduce((sum, u) => sum + (u.total_point || 0), 0) /
                usersWithPoints.length
            )
          : 0;

      const recentStudents = [...schoolStudents]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      const newStats: SchoolDTMStats = {
        totalStudents: schoolStudents.length,
        studentsWithResults: studentsWithResults.length,
        studentsWithoutResults: studentsWithoutResults.length,
        averageScore: avgScore,
        recentStudents,
      };

      setStats(newStats);
      setLastUpdated(new Date());

      // Cache the data
      setCachedDTMData(schoolCode, {
        stats: newStats,
        students: schoolStudents,
      });
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
    hasApiSettings,
    refetch: fetchData,
    lastUpdated,
  };
}
