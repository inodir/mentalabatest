// DTM API Authentication Helper
const DTM_API_BASE = "https://dtm-api.misterdev.uz";

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
  created_at: string;
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
  role: "school" | "district" | "admin";
  region: string;
  district: string;
  school_id: number | null;
  school: DTMSchoolInfo | null;
  stats: {
    registered_count: number;
    answered_count: number;
    school_count: number;
  };
  schools: DTMSchoolInfo[];
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
    const loginRes = await fetch(`${DTM_API_BASE}/api/v1/auth/auth/login`, {
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
    const meRes = await fetch(`${DTM_API_BASE}/api/v1/auth/me`, {
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
    const res = await fetch(`${DTM_API_BASE}/api/v1/auth/auth/refresh`, {
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

  let res = await fetch(`${DTM_API_BASE}/api/v1/auth/me`, {
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
    res = await fetch(`${DTM_API_BASE}/api/v1/auth/me`, {
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

// Logout
export async function dtmLogout(): Promise<void> {
  const { refreshToken } = getDTMTokens();
  if (refreshToken) {
    try {
      await fetch(`${DTM_API_BASE}/api/v1/auth/auth/logout`, {
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
