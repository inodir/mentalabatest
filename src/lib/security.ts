// Security utilities: rate limiting, input sanitization, inactivity tracking

const LOGIN_ATTEMPTS_KEY = "login_attempts";
const LOCKOUT_KEY = "login_lockout_until";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// --- Rate Limiting ---

interface LoginAttempts {
  count: number;
  firstAttemptAt: number;
}

export function getLoginAttempts(): LoginAttempts {
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { count: 0, firstAttemptAt: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, firstAttemptAt: 0 };
  }
}

function setLoginAttempts(attempts: LoginAttempts) {
  sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function clearLoginAttempts() {
  sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  sessionStorage.removeItem(LOCKOUT_KEY);
}

export function recordFailedLogin(): { locked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const attempts = getLoginAttempts();

  // Reset window if older than lockout duration
  if (now - attempts.firstAttemptAt > LOCKOUT_DURATION_MS) {
    const fresh: LoginAttempts = { count: 1, firstAttemptAt: now };
    setLoginAttempts(fresh);
    return { locked: false, remainingSeconds: 0 };
  }

  attempts.count += 1;
  if (attempts.firstAttemptAt === 0) attempts.firstAttemptAt = now;
  setLoginAttempts(attempts);

  if (attempts.count >= MAX_ATTEMPTS) {
    const lockoutUntil = now + LOCKOUT_DURATION_MS;
    sessionStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
    return { locked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  return { locked: false, remainingSeconds: 0 };
}

export function isLoginLocked(): { locked: boolean; remainingSeconds: number } {
  const lockoutUntilRaw = sessionStorage.getItem(LOCKOUT_KEY);
  if (!lockoutUntilRaw) return { locked: false, remainingSeconds: 0 };

  const lockoutUntil = parseInt(lockoutUntilRaw, 10);
  const now = Date.now();

  if (now >= lockoutUntil) {
    clearLoginAttempts();
    return { locked: false, remainingSeconds: 0 };
  }

  return { locked: true, remainingSeconds: Math.ceil((lockoutUntil - now) / 1000) };
}

export function getRemainingAttempts(): number {
  const attempts = getLoginAttempts();
  return Math.max(0, MAX_ATTEMPTS - attempts.count);
}

// --- Inactivity Auto-Logout ---

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let onInactivityLogout: (() => void) | null = null;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown", "mousemove", "keydown", "scroll", "touchstart", "click",
];

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (onInactivityLogout) {
    inactivityTimer = setTimeout(() => {
      onInactivityLogout?.();
    }, INACTIVITY_TIMEOUT_MS);
  }
}

export function startInactivityWatch(logoutCallback: () => void) {
  stopInactivityWatch();
  onInactivityLogout = logoutCallback;
  ACTIVITY_EVENTS.forEach((event) => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();
}

export function stopInactivityWatch() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  onInactivityLogout = null;
  ACTIVITY_EVENTS.forEach((event) => {
    window.removeEventListener(event, resetInactivityTimer);
  });
}

// --- Input Sanitization ---

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, "")
    .trim()
    .slice(0, 100);
}
