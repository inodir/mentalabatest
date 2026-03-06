import { useState, useEffect, useCallback } from "react";
import {
  getApiSettings,
  fetchDTMUsers,
  fetchAllDTMUsers,
  calculateStats,
  DashboardStats,
  DTMApiSettings,
  DTMUser,
} from "@/lib/dtm-api";

export type DashboardMode = "fast" | "accurate";
export type DashboardError = "NO_CONFIG" | "API_KEY_INVALID" | "NETWORK_ERROR" | "INVALID_URL" | null;

interface UseDTMDashboardResult {
  stats: DashboardStats | null;
  loading: boolean;
  error: DashboardError;
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  progress: { loaded: number; total: number } | null;
  retry: () => void;
  settings: DTMApiSettings | null;
  loadedEntities: DTMUser[];
}

export function useDTMDashboard(): UseDTMDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError>(null);
  const [mode, setMode] = useState<DashboardMode>("fast");
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [settings, setSettings] = useState<DTMApiSettings | null>(null);
  const [loadedEntities, setLoadedEntities] = useState<DTMUser[]>([]);

  const fetchData = useCallback(async (currentMode: DashboardMode) => {
    setLoading(true);
    setError(null);
    setProgress(null);

    const apiSettings = getApiSettings();
    setSettings(apiSettings);

    if (!apiSettings) {
      setError("NO_CONFIG");
      setLoading(false);
      return;
    }

    try {
      if (currentMode === "fast") {
        // Fast mode: single request, approximate stats
        const response = await fetchDTMUsers(apiSettings, 0, 100);
        const calculatedStats = calculateStats(
          response.entities,
          response.pageInfo.totalCount,
          true
        );
        setStats(calculatedStats);
        setLoadedEntities(response.entities);
      } else {
        // Accurate mode: fetch all pages
        const { entities, totalCount } = await fetchAllDTMUsers(
          apiSettings,
          (loaded, total) => setProgress({ loaded, total })
        );
        const calculatedStats = calculateStats(entities, totalCount, false);
        setStats(calculatedStats);
        setLoadedEntities(entities);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      
      if (message === "API_KEY_INVALID") {
        setError("API_KEY_INVALID");
      } else if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setError("NETWORK_ERROR");
      } else {
        setError("NETWORK_ERROR");
      }
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    fetchData(mode);
  }, [mode, fetchData]);

  const retry = useCallback(() => {
    fetchData(mode);
  }, [fetchData, mode]);

  const handleModeChange = useCallback((newMode: DashboardMode) => {
    setMode(newMode);
  }, []);

  return {
    stats,
    loading,
    error,
    mode,
    setMode: handleModeChange,
    progress,
    retry,
    settings,
    loadedEntities,
  };
}
