// DTM API Client Helper
const DEFAULT_MAIN_URL = import.meta.env.VITE_DTM_API_URL || "https://dtm-api.misterdev.uz/";
const ENV_API_KEY = import.meta.env.VITE_DTM_API_KEY || "";

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
  bot_id?: string;
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

// Cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute cache

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache storage
const dtmCache: {
  users?: CacheEntry<{ entities: DTMUser[]; totalCount: number }>;
  stats?: CacheEntry<DashboardStats>;
} = {};

// Get cached data if valid
export function getCachedData<T>(key: keyof typeof dtmCache): T | null {
  const entry = dtmCache[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    // Cache expired
    delete dtmCache[key];
    return null;
  }
  
  return entry.data;
}

// Set cache data
export function setCachedData<T>(key: keyof typeof dtmCache, data: T): void {
  (dtmCache as Record<string, CacheEntry<T>>)[key] = {
    data,
    timestamp: Date.now(),
  };
}

// Clear all cache
export function clearDTMCache(): void {
  delete dtmCache.users;
  delete dtmCache.stats;
}

// API settings cache TTL: 30 days
const API_SETTINGS_TTL = 30 * 24 * 60 * 60 * 1000;

// Get API settings from localStorage, falling back to env vars
export function getApiSettings(): DTMApiSettings | null {
  const settings = localStorage.getItem("dtm_api_settings");
  
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      if (parsed.apiKey) {
        // Check 30-day expiry
        if (parsed.savedAt && Date.now() - parsed.savedAt > API_SETTINGS_TTL) {
          localStorage.removeItem("dtm_api_settings");
        } else {
          return {
            mainUrl: parsed.mainUrl || DEFAULT_MAIN_URL,
            apiKey: parsed.apiKey,
          };
        }
      }
    } catch {
      // fall through to env vars
    }
  }

  // Fallback to env vars
  if (ENV_API_KEY) {
    return {
      mainUrl: DEFAULT_MAIN_URL,
      apiKey: ENV_API_KEY,
    };
  }

  return null;
}

// Save API settings to localStorage with timestamp
export function saveApiSettings(settings: DTMApiSettings): void {
  localStorage.setItem("dtm_api_settings", JSON.stringify({
    ...settings,
    savedAt: Date.now(),
  }));
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

// Fetch DTM users with pagination (using API key)
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

  const responseText = await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error(`API_ERROR_${response.status}: ${responseText.substring(0, 200)}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`API returned non-JSON response`);
  }
}

// Fetch DTM users with Bearer token + API key (for school/district admins)
export async function fetchDTMUsersWithToken(
  accessToken: string,
  offset: number = 0,
  limit: number = 50
): Promise<DTMResponse> {
  const settings = getApiSettings();
  const baseUrl = settings ? normalizeUrl(settings.mainUrl) : DEFAULT_MAIN_URL;
  const url = `${baseUrl}api/v1/dtm/users?offset=${offset}&limit=${limit}`;

  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  // Use API key from super admin settings if available
  if (settings?.apiKey) {
    headers["x-api-key"] = settings.apiKey;
  }

  const response = await fetch(url, { method: "GET", headers });

  const responseText = await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error(`API_ERROR_${response.status}: ${responseText.substring(0, 200)}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`API returned non-JSON response`);
  }
}

// Fetch all users with Bearer token (for district/school admins)
export async function fetchAllDTMUsersWithToken(
  accessToken: string,
  onProgress?: (loaded: number, total: number) => void,
  forceRefresh: boolean = false
): Promise<{ entities: DTMUser[]; totalCount: number }> {
  if (!forceRefresh) {
    const cached = getCachedData<{ entities: DTMUser[]; totalCount: number }>("users");
    if (cached) {
      onProgress?.(cached.entities.length, cached.totalCount);
      return cached;
    }
  }

  const limit = 100;
  const concurrency = 5;

  const firstResponse = await fetchDTMUsersWithToken(accessToken, 0, limit);
  const totalCount = firstResponse.pageInfo.totalCount;
  let allEntities: DTMUser[] = [...firstResponse.entities];

  onProgress?.(allEntities.length, totalCount);

  if (allEntities.length >= totalCount) {
    const result = { entities: allEntities, totalCount };
    setCachedData("users", result);
    return result;
  }

  const remainingPages = Math.ceil((totalCount - limit) / limit);
  const offsets: number[] = [];
  for (let i = 1; i <= remainingPages; i++) {
    offsets.push(i * limit);
  }

  for (let i = 0; i < offsets.length; i += concurrency) {
    const batch = offsets.slice(i, i + concurrency);
    const promises = batch.map(offset => fetchDTMUsersWithToken(accessToken, offset, limit));
    const results = await Promise.all(promises);
    for (const response of results) {
      allEntities = [...allEntities, ...response.entities];
    }
    onProgress?.(Math.min(allEntities.length, totalCount), totalCount);
  }

  const result = { entities: allEntities, totalCount };
  setCachedData("users", result);
  return result;
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

// Fetch all users for accurate mode with parallel requests (with caching)
export async function fetchAllDTMUsers(
  settings: DTMApiSettings,
  onProgress?: (loaded: number, total: number) => void,
  forceRefresh: boolean = false
): Promise<{ entities: DTMUser[]; totalCount: number }> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedData<{ entities: DTMUser[]; totalCount: number }>("users");
    if (cached) {
      onProgress?.(cached.entities.length, cached.totalCount);
      return cached;
    }
  }

  const limit = 100;
  const concurrency = 5; // Parallel requests count

  // First request to get total count
  const firstResponse = await fetchDTMUsers(settings, 0, limit);
  const totalCount = firstResponse.pageInfo.totalCount;
  let allEntities: DTMUser[] = [...firstResponse.entities];
  
  onProgress?.(allEntities.length, totalCount);

  if (allEntities.length >= totalCount) {
    const result = { entities: allEntities, totalCount };
    setCachedData("users", result);
    return result;
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

  const result = { entities: allEntities, totalCount };
  setCachedData("users", result);
  return result;
}
