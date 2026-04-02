import { useState, useEffect, useCallback } from "react";
import {
  getApiSettings,
  fetchDTMUsers,
  fetchAllDTMUsers,
  DTMUser,
  DTMApiSettings,
  DTMPageInfo,
} from "@/lib/dtm-api";

export type UsersError = "NO_CONFIG" | "API_KEY_INVALID" | "NETWORK_ERROR" | null;
const AUTO_REFRESH_MS = 10 * 60 * 1000;

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
  allUsers: DTMUser[];
  allUsersLoading: boolean;
  loadAllUsers: () => void;
  allUsersLoaded: boolean;
}

export function useDTMUsers(initialLimit: number = 50): UseDTMUsersResult {
  const [users, setUsers] = useState<DTMUser[]>([]);
  const [allUsers, setAllUsers] = useState<DTMUser[]>([]);
  const [allUsersLoaded, setAllUsersLoaded] = useState(false);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState<DTMPageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<UsersError>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(initialLimit);
  const [settings, setSettings] = useState<DTMApiSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async (currentPage: number, currentLimit: number, currentSearch: string = "") => {
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
      const response = await fetchDTMUsers(apiSettings, offset, currentLimit, currentSearch);
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

  const loadAllUsers = useCallback(async () => {
    if (allUsersLoaded || allUsersLoading) return;

    const apiSettings = getApiSettings();
    if (!apiSettings) return;

    setAllUsersLoading(true);
    try {
      const result = await fetchAllDTMUsers(apiSettings);
      setAllUsers(result.entities);
      setAllUsersLoaded(true);
    } catch {
      // Silently fail, filters will work on current page
    } finally {
      setAllUsersLoading(false);
    }
  }, [allUsersLoaded, allUsersLoading]);

  // Handle pagination and search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData(page, limit, searchTerm);
    }, 400); // Debounce search

    return () => clearTimeout(handler);
  }, [page, limit, searchTerm, fetchData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData(page, limit, searchTerm);
      }
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchData, page, limit, searchTerm]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const retry = useCallback(() => {
    setAllUsersLoaded(false);
    setAllUsers([]);
    fetchData(page, limit, searchTerm);
  }, [fetchData, page, limit, searchTerm]);

  // When searchTerm is used, we use the server results (users)
  // When no searchTerm, filteredUsers is same as users (current page)
  const filteredUsers = users;

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
    allUsers,
    allUsersLoading,
    loadAllUsers,
    allUsersLoaded,
  };
}
