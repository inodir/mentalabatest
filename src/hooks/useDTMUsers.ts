import { useState, useEffect, useCallback } from "react";
import {
  getApiSettings,
  fetchDTMUsers,
  DTMUser,
  DTMApiSettings,
  DTMPageInfo,
} from "@/lib/dtm-api";

export type UsersError = "NO_CONFIG" | "API_KEY_INVALID" | "NETWORK_ERROR" | null;

interface UseDTMUsersResult {
  users: DTMUser[];
  pageInfo: DTMPageInfo | null;
  loading: boolean;
  error: UsersError;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  retry: () => void;
  settings: DTMApiSettings | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredUsers: DTMUser[];
}

export function useDTMUsers(initialLimit: number = 50): UseDTMUsersResult {
  const [users, setUsers] = useState<DTMUser[]>([]);
  const [pageInfo, setPageInfo] = useState<DTMPageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UsersError>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(initialLimit);
  const [settings, setSettings] = useState<DTMApiSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async (currentPage: number, currentLimit: number) => {
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
      const offset = currentPage * currentLimit;
      const response = await fetchDTMUsers(apiSettings, offset, currentLimit);
      setUsers(response.entities);
      setPageInfo(response.pageInfo);
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
    fetchData(page, limit);
  }, [page, limit, fetchData]);

  const retry = useCallback(() => {
    fetchData(page, limit);
  }, [fetchData, page, limit]);

  // Filter users by search term (client-side)
  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    const searchableText = [
      user.full_name,
      user.school_code,
      user.phone,
      user.bot_id,
      user.chat_id,
    ].filter(Boolean).join(" ").toLowerCase();
    return terms.every((term) => searchableText.includes(term));
  });

  return {
    users,
    pageInfo,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    retry,
    settings,
    searchTerm,
    setSearchTerm,
    filteredUsers,
  };
}
