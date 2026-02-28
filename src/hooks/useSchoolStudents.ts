import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fetchAllSchoolStudents, DTMStudentItem } from "@/lib/dtm-auth";
import { useAuth } from "./useAuth";

interface UseSchoolStudentsResult {
  allStudents: DTMStudentItem[];
  loading: boolean;
  loadingMore: boolean;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const firstBatchReceived = useRef(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadingMore(false);
    setProgress(null);
    firstBatchReceived.current = false;

    try {
      await fetchAllSchoolStudents(
        (loaded, total) => {
          setProgress({ loaded, total });
        },
        (items, total) => {
          setAllStudents(items);
          setTotalCount(total);
          if (!firstBatchReceived.current) {
            firstBatchReceived.current = true;
            setLoading(false);
            if (items.length < total) setLoadingMore(true);
          }
        }
      );
    } catch {
      if (dtmUser?.students?.items) {
        setAllStudents(dtmUser.students.items);
        setTotalCount(dtmUser.students.total || dtmUser.students.items.length);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setProgress(null);
    }
  }, [dtmUser]);

  useEffect(() => {
    if (dtmUser) loadAll();
  }, [dtmUser, loadAll]);

  const total = totalCount || allStudents.length;
  const totalPages = Math.max(1, Math.ceil(allStudents.length / pageSize));

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allStudents.slice(start, start + pageSize);
  }, [allStudents, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return {
    allStudents,
    loading,
    loadingMore,
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
