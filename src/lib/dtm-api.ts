// DTM API Client Helper
const DEFAULT_MAIN_URL = "https://dtm-api.misterdev.uz/";

export interface DTMTestScore {
  name: string;
  point: number;
}

export interface DTMTestResults {
  mandatory: DTMTestScore[];
  primary: DTMTestScore;
  secondary: DTMTestScore;
}

export interface DTMUser {
  id: number;
  full_name: string;
  chat_id?: string;
  has_result: boolean;
  phone?: string;
  district?: string;
  school_code: string;
  test_results?: DTMTestResults;
  total_point: number | null;
  test_file_url?: string;
  test_result_file_url?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface DTMPageInfo {
  currentCount: number;
  totalCount: number;
  offset: number;
  limit: number;
}

export interface DTMResponse {
  pageInfo: DTMPageInfo;
  entities: DTMUser[];
}

export interface DTMApiSettings {
  mainUrl: string;
  apiKey: string;
}

export interface DashboardStats {
  totalUsers: number;
  resultUsersCount: number;
  noResultUsersCount: number;
  totalSchools: number;
  averageTotalPoint: number;
  recentUsers: DTMUser[];
  isApproximate: boolean;
  loadedCount?: number;
}

// Get API settings from localStorage
export function getApiSettings(): DTMApiSettings | null {
  const settings = localStorage.getItem("dtm_api_settings");
  if (!settings) return null;
  
  try {
    const parsed = JSON.parse(settings);
    if (!parsed.apiKey) return null;
    return {
      mainUrl: parsed.mainUrl || DEFAULT_MAIN_URL,
      apiKey: parsed.apiKey,
    };
  } catch {
    return null;
  }
}

// Save API settings to localStorage
export function saveApiSettings(settings: DTMApiSettings): void {
  localStorage.setItem("dtm_api_settings", JSON.stringify(settings));
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Normalize URL (ensure trailing slash)
export function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

// Fetch DTM users with pagination
export async function fetchDTMUsers(
  settings: DTMApiSettings,
  offset: number = 0,
  limit: number = 50
): Promise<DTMResponse> {
  const baseUrl = normalizeUrl(settings.mainUrl);
  const url = `${baseUrl}api/v1/dtm/users?offset=${offset}&limit=${limit}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": settings.apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error(`API_ERROR_${response.status}`);
  }

  return response.json();
}

// Calculate stats from entities
export function calculateStats(
  entities: DTMUser[],
  totalCount: number,
  isApproximate: boolean
): DashboardStats {
  const resultUsers = entities.filter((u) => u.has_result);
  const noResultUsers = entities.filter((u) => !u.has_result);
  const uniqueSchools = new Set(entities.map((u) => u.school_code).filter(Boolean));
  
  const usersWithPoints = entities.filter(
    (u) => u.total_point !== null && u.total_point !== undefined
  );
  const avgPoint =
    usersWithPoints.length > 0
      ? Math.round(
          usersWithPoints.reduce((sum, u) => sum + (u.total_point || 0), 0) /
            usersWithPoints.length
        )
      : 0;

  const recentUsers = [...entities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return {
    totalUsers: totalCount,
    resultUsersCount: resultUsers.length,
    noResultUsersCount: noResultUsers.length,
    totalSchools: uniqueSchools.size,
    averageTotalPoint: avgPoint,
    recentUsers,
    isApproximate,
    loadedCount: entities.length,
  };
}

// Fetch all users for accurate mode with parallel requests
export async function fetchAllDTMUsers(
  settings: DTMApiSettings,
  onProgress?: (loaded: number, total: number) => void
): Promise<{ entities: DTMUser[]; totalCount: number }> {
  const limit = 100;
  const concurrency = 5; // Parallel requests count

  // First request to get total count
  const firstResponse = await fetchDTMUsers(settings, 0, limit);
  const totalCount = firstResponse.pageInfo.totalCount;
  let allEntities: DTMUser[] = [...firstResponse.entities];
  
  onProgress?.(allEntities.length, totalCount);

  if (allEntities.length >= totalCount) {
    return { entities: allEntities, totalCount };
  }

  // Calculate remaining pages
  const remainingPages = Math.ceil((totalCount - limit) / limit);
  const offsets: number[] = [];
  for (let i = 1; i <= remainingPages; i++) {
    offsets.push(i * limit);
  }

  // Fetch in parallel batches
  for (let i = 0; i < offsets.length; i += concurrency) {
    const batch = offsets.slice(i, i + concurrency);
    const promises = batch.map(offset => fetchDTMUsers(settings, offset, limit));
    
    const results = await Promise.all(promises);
    for (const response of results) {
      allEntities = [...allEntities, ...response.entities];
    }
    
    onProgress?.(Math.min(allEntities.length, totalCount), totalCount);
  }

  return { entities: allEntities, totalCount };
}
