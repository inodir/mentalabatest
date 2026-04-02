import { useCallback, useEffect, useMemo, useState } from "react";
import { clearDTMCache, fetchAllDTMUsers, getApiSettings, type DTMApiSettings, type DTMUser } from "@/lib/dtm-api";
import { buildPublicStats } from "@/lib/public-stats";

export type PublicStatsError = "NO_CONFIG" | "API_KEY_INVALID" | "NETWORK_ERROR" | null;

const AUTO_REFRESH_MS = 2 * 60 * 1000;

export function usePublicStats() {
  const [entities, setEntities] = useState<DTMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PublicStatsError>(null);
  const [settings, setSettings] = useState<DTMApiSettings | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    const apiSettings = getApiSettings();
    setSettings(apiSettings);

    if (!apiSettings) {
      setError("NO_CONFIG");
      setLoading(false);
      return;
    }

    try {
      if (forceRefresh) {
        clearDTMCache();
      }

      const result = await fetchAllDTMUsers(apiSettings, undefined, forceRefresh);
      setEntities(result.entities);
      setLastSynced(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "API_KEY_INVALID") {
        setError("API_KEY_INVALID");
      } else {
        setError("NETWORK_ERROR");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(false);
      }
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchData]);

  useEffect(() => {
    setSelectedDistrict("all");
  }, [selectedRegion]);

  const snapshot = useMemo(
    () => buildPublicStats(entities, selectedRegion, selectedDistrict),
    [entities, selectedRegion, selectedDistrict]
  );

  return {
    ...snapshot,
    entities,
    loading,
    error,
    settings,
    lastSynced,
    selectedRegion,
    setSelectedRegion,
    selectedDistrict,
    setSelectedDistrict,
    refresh: () => fetchData(true),
  };
}
