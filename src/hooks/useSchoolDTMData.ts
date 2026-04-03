import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { DTMStudentItem } from "@/lib/dtm-auth";
import { getUserTotalPoint, hasDTMResult } from "@/lib/stats-utils";

export interface SchoolDTMStats {
  totalStudents: number;
  studentsWithResults: number;
  studentsWithoutResults: number;
  testedPercent: number;
  averageScore: number;
}

export function useSchoolDTMData() {
  const { dtmUser } = useAuth();

  const students: DTMStudentItem[] = dtmUser?.students?.items ?? [];
  const schoolCode = dtmUser?.school?.code ?? null;

  const studentsWithResults = students.filter((student) => hasDTMResult(student));
  const studentsWithScores = students
    .map((student) => getUserTotalPoint(student))
    .filter((point): point is number => point !== null);
  const avgScore = studentsWithScores.length > 0
    ? Math.round(studentsWithScores.reduce((sum, point) => sum + point, 0) / studentsWithScores.length)
    : 0;

  const stats: SchoolDTMStats = {
    totalStudents: dtmUser?.stats?.registered_count ?? students.length,
    studentsWithResults: dtmUser?.stats?.answered_count ?? studentsWithResults.length,
    studentsWithoutResults: (dtmUser?.stats?.registered_count ?? students.length) - (dtmUser?.stats?.answered_count ?? studentsWithResults.length),
    testedPercent: dtmUser?.stats?.tested_percent ?? 0,
    averageScore: avgScore,
  };

  return {
    stats,
    students,
    loading: !dtmUser,
    error: null as string | null,
    schoolCode,
  };
}
