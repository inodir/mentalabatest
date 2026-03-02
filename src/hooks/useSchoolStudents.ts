import { useState, useEffect, useCallback, useMemo } from "react";
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
  progress: null;
}

export function useSchoolStudents(): UseSchoolStudentsResult {
  const { dtmUser } = useAuth();
  const [allStudents, setAllStudents] = useState<DTMStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchAllSchoolStudents();
      setAllStudents(items);
      setTotalCount(items.length);
    } catch {
      if (dtmUser?.students?.items) {
        setAllStudents(dtmUser.students.items);
        setTotalCount(dtmUser.students.total || dtmUser.students.items.length);
      }
    } finally {
      setLoading(false);
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
    loadingMore: false,
    total,
    page,
    pageSize,
    setPage,
    setPageSize: (s: number) => { setPageSize(s); setPage(1); },
    totalPages,
    paginatedStudents,
    retry: loadAll,
    progress: null,
  };
}
