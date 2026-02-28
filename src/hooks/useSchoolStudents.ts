import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchAllSchoolStudents, DTMStudentItem } from "@/lib/dtm-auth";
import { useAuth } from "./useAuth";

interface UseSchoolStudentsResult {
  allStudents: DTMStudentItem[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  totalPages: number;
  paginatedStudents: DTMStudentItem[];
  retry: () => void;
  progress: { loaded: number; total: number } | null;
}

export function useSchoolStudents(): UseSchoolStudentsResult {
  const { dtmUser } = useAuth();
  const [allStudents, setAllStudents] = useState<DTMStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setProgress(null);
    try {
      let latestTotal = 0;
      const items = await fetchAllSchoolStudents((loaded, total) => {
        latestTotal = total;
        setProgress({ loaded, total });
      });

      if (items.length > 0) {
        setAllStudents(items);
        setTotalCount(latestTotal || items.length);
      } else if (dtmUser?.students?.items) {
        // Fallback to /me data if batch fetch returns nothing
        setAllStudents(dtmUser.students.items);
        setTotalCount(dtmUser.students.total || dtmUser.students.items.length);
      } else {
        setAllStudents([]);
        setTotalCount(0);
      }
    } catch {
      if (dtmUser?.students?.items) {
        setAllStudents(dtmUser.students.items);
        setTotalCount(dtmUser.students.total || dtmUser.students.items.length);
      } else {
        setAllStudents([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [dtmUser]);

  useEffect(() => {
    if (dtmUser) loadAll();
  }, [dtmUser, loadAll]);

  const total = totalCount || allStudents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allStudents.slice(start, start + pageSize);
  }, [allStudents, page, pageSize]);

  // Reset page when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return {
    allStudents,
    loading,
    total,
    page,
    pageSize,
    setPage,
    setPageSize: (s: number) => { setPageSize(s); setPage(1); },
    totalPages,
    paginatedStudents,
    retry: loadAll,
    progress,
  };
}
