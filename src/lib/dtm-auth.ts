// DTM API Authentication Helper
import { getApiSettings } from "./dtm-api";

const DEFAULT_DTM_API_BASE = (import.meta.env.VITE_DTM_API_URL || "https://dtm-api.misterdev.uz").replace(/\/+$/, "");

function getDTMApiBase(): string {
  const settings = getApiSettings();
  const url = settings?.mainUrl || DEFAULT_DTM_API_BASE;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const TOKEN_KEYS = {
  accessToken: "dtm_access_token",
  refreshToken: "dtm_refresh_token",
  userData: "dtm_user_data",
};

export interface DTMSchoolInfo {
  id: number;
  region: string;
  district: string;
  name: string;
  code: string;
  registered_count?: number;
  answered_count?: number;
  tested_percent?: number;
  avg_total_ball?: number;
  avg_mandatory_ball?: number;
  avg_primary_ball?: number;
  avg_secondary_ball?: number;
}

export interface DTMDistrictInfo {
  region: string;
  district: string;
  registered_count: number;
  answered_count: number;
  tested_percent: number;
  school_count: number;
}

export interface DTMSubjectScore {
  subject_id: number;
  subject_name: string;
  earned_ball: number;
  max_ball: number;
  percent: number;
}

export interface DTMStudentTestInfo {
  tested: boolean;
  test_id: number | null;
  total_ball: number | null;
  mandatory_ball: number | null;
  primary_ball: number | null;
  secondary_ball: number | null;
  first_subject_point: number | null;
  second_subject_point: number | null;
  result_file: string | null;
  created_at: string;
  subjects?: DTMSubjectScore[];
}

export interface DTMStudentItem {
  id: number;
  bot_id: string;
  phone: string;
  full_name: string;
  school_code: string;
  school_name: string | null;
  language: string;
  region: string;
  district: string;
  gender: string;
  group_name: string;
  created_at: string;
  dtm?: DTMStudentTestInfo;
}

export interface DTMStudentsData {
  total: number;
  limit: number;
  offset: number;
  items: DTMStudentItem[];
}

export interface DTMUserData {
  id: number;
  username: string;
  full_name: string;
  role: "school" | "district" | "admin" | "superadmin";
  region: string;
  district: string;
  school_id: number | null;
  school: DTMSchoolInfo | null;
  stats: {
    registered_count: number;
    answered_count: number;
    tested_percent: number;
    school_count: number;
    gender_stats?: Record<string, number>;
    language_stats?: Record<string, number>;
    subject_mastery?: {
      subject_id: number;
      subject: string;
      questions_count: number;
      earned_sum: number;
      avg_point: number;
      mastery_percent: number;
    }[];
    subject_mastery_chart?: { labels: string[]; data: number[] };
    mandatory_chart?: { labels: string[]; data: number[] };
    ball_distribution?: { labels: string[]; data: number[] };
    risk_stats?: {
      pass_line: number;
      tested_count: number;
      risk_count: number;
      risk_percent: number;
    };
    gender_result_stats?: Record<string, {
      count: number;
      avg_total_ball: number;
      passed_count: number;
      passed_percent: number;
    }>;
    dtm_readiness?: {
      pass_line: number;
      tested_count: number;
      avg_total_ball: number;
      passed_count: number;
      readiness_index: number;
    };
  };
  schools: DTMSchoolInfo[];
  districts: DTMDistrictInfo[];
  students?: DTMStudentsData;
}

interface DTMLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Token storage
export function getDTMTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEYS.accessToken),
    refreshToken: localStorage.getItem(TOKEN_KEYS.refreshToken),
  };
}

export function setDTMTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEYS.accessToken, accessToken);
  localStorage.setItem(TOKEN_KEYS.refreshToken, refreshToken);
}

export function clearDTMTokens() {
  localStorage.removeItem(TOKEN_KEYS.accessToken);
  localStorage.removeItem(TOKEN_KEYS.refreshToken);
  localStorage.removeItem(TOKEN_KEYS.userData);
}

export function getDTMUserData(): DTMUserData | null {
  const data = localStorage.getItem(TOKEN_KEYS.userData);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setDTMUserData(data: DTMUserData) {
  localStorage.setItem(TOKEN_KEYS.userData, JSON.stringify(data));
}

// Login via DTM API
export async function dtmLogin(
  username: string,
  password: string
): Promise<{ userData: DTMUserData; error: null } | { userData: null; error: string }> {
  try {
    // Step 1: Login to get tokens
    const loginRes = await fetch(`${getDTMApiBase()}/api/v1/auth/auth/login`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!loginRes.ok) {
      if (loginRes.status === 401 || loginRes.status === 403 || loginRes.status === 422) {
        return { userData: null, error: "Login yoki parol noto'g'ri" };
      }
      return { userData: null, error: `Server xatoligi: ${loginRes.status}` };
    }

    const loginData: DTMLoginResponse = await loginRes.json();
    setDTMTokens(loginData.access_token, loginData.refresh_token);

    // Step 2: Fetch user data
    const meRes = await fetch(`${getDTMApiBase()}/api/v1/auth/me`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${loginData.access_token}`,
      },
    });

    if (!meRes.ok) {
      clearDTMTokens();
      return { userData: null, error: "Foydalanuvchi ma'lumotlarini olishda xatolik" };
    }

    const userData: DTMUserData = await meRes.json();
    setDTMUserData(userData);

    return { userData, error: null };
  } catch {
    clearDTMTokens();
    return { userData: null, error: "Tarmoq xatoligi. Internetni tekshiring" };
  }
}

// Refresh access token
export async function dtmRefreshToken(): Promise<boolean> {
  const { refreshToken } = getDTMTokens();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${getDTMApiBase()}/api/v1/auth/auth/refresh`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearDTMTokens();
      return false;
    }

    const data: DTMLoginResponse = await res.json();
    setDTMTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// Fetch current user data (with auto-refresh)
export async function dtmFetchMe(): Promise<DTMUserData | null> {
  const { accessToken } = getDTMTokens();
  if (!accessToken) return null;

  let res = await fetch(`${getDTMApiBase()}/api/v1/auth/me?limit=1000&offset=0`, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // If 401, try refresh
  if (res.status === 401) {
    const refreshed = await dtmRefreshToken();
    if (!refreshed) {
      clearDTMTokens();
      return null;
    }
    const { accessToken: newToken } = getDTMTokens();
    res = await fetch(`${getDTMApiBase()}/api/v1/auth/me?limit=1000&offset=0`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  if (!res.ok) {
    clearDTMTokens();
    return null;
  }

  const userData: DTMUserData = await res.json();
  setDTMUserData(userData);
  return userData;
}

// Fetch all school students in batches (for school admin)
export async function fetchAllSchoolStudents(
  onProgress?: (loaded: number, total: number) => void,
  onBatch?: (items: DTMStudentItem[], total: number) => void
): Promise<DTMStudentItem[]> {
  const { accessToken } = getDTMTokens();
  if (!accessToken) return [];

  const base = getDTMApiBase();
  const batchSize = 50;
  const uniqueById = new Map<number, DTMStudentItem>();

  const fetchPage = async (token: string, offset: number) => {
    return fetch(`${base}/api/v1/auth/me?limit=${batchSize}&offset=${offset}`, {
      headers: { accept: "application/json", Authorization: `Bearer ${token}` },
    });
  };

  let token = accessToken;

  // First page
  let firstRes: Response;
  try {
    firstRes = await fetchPage(token, 0);
  } catch {
    return [];
  }

  if (firstRes.status === 401) {
    const refreshed = await dtmRefreshToken();
    if (!refreshed) return [];
    const { accessToken: newToken } = getDTMTokens();
    if (!newToken) return [];
    token = newToken;
    try {
      firstRes = await fetchPage(token, 0);
    } catch {
      return [];
    }
  }

  if (!firstRes.ok) return [];

  let firstData: DTMUserData;
  try {
    firstData = await firstRes.json();
  } catch {
    return [];
  }

  const firstItems = firstData.students?.items ?? [];
  let total = firstData.students?.total ?? firstItems.length;

  firstItems.forEach((s) => uniqueById.set(s.id, s));
  onProgress?.(uniqueById.size, total);
  onBatch?.(Array.from(uniqueById.values()), total);

  let totalPages = Math.max(1, Math.ceil(total / batchSize));

  // Fetch remaining pages strictly by offset: 1..(totalPages-1)
  for (let pageOffset = 1; pageOffset < totalPages; pageOffset += 1) {
    const { accessToken: currentToken } = getDTMTokens();
    if (!currentToken) break;

    let batchRes: Response;
    try {
      batchRes = await fetchPage(currentToken, pageOffset);
    } catch {
      break;
    }

    if (!batchRes.ok) break;

    let batchData: DTMUserData;
    try {
      batchData = await batchRes.json();
    } catch {
      break;
    }

    const pageItems = batchData.students?.items ?? [];
    const batchTotal = batchData.students?.total;

    if (typeof batchTotal === "number" && batchTotal > total) {
      total = batchTotal;
      totalPages = Math.max(1, Math.ceil(total / batchSize));
    }

    pageItems.forEach((s) => uniqueById.set(s.id, s));
    onProgress?.(uniqueById.size, total);
    onBatch?.(Array.from(uniqueById.values()), total);

    if (uniqueById.size >= total) break;
  }

  return Array.from(uniqueById.values());
}

// Logout
export async function dtmLogout(): Promise<void> {
  const { refreshToken } = getDTMTokens();
  if (refreshToken) {
    try {
      await fetch(`${getDTMApiBase()}/api/v1/auth/auth/logout`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Ignore logout errors
    }
  }
  clearDTMTokens();
}
