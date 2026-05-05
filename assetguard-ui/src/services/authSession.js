const AUTH_STORAGE_KEY = "assetguard:auth-token";
const AUTH_TIMESTAMP_KEY = "assetguard:auth-timestamp";
const TOKEN_EXPIRY_HOURS = 24;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

let unauthorizedHandler = null;

export function setAuthToken(token) {
  if (!token) {
    // Clear storage when token is cleared
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    } catch {
      // Ignore storage failures (e.g., private mode restrictions)
    }
    return;
  }

  // Store token and timestamp
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Ignore storage failures (e.g., private mode restrictions)
    // Token will still work in memory for this session
  }
}

export function getAuthToken() {
  try {
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

    if (!token || !timestamp) {
      return "";
    }

    // Check if token has expired (24 hours)
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    const age = now - tokenTime;

    if (age > TOKEN_EXPIRY_MS) {
      // Token expired, clear it
      clearAuthToken();
      notifyUnauthorized();
      return "";
    }

    return token;
  } catch {
    // If localStorage fails, return empty string
    return "";
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
  } catch {
    // Ignore storage failures
  }
}

export function restoreAuthToken() {
  // This function is called on app startup to restore token from storage
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

  if (!token || !timestamp) {
    return null;
  }

  // Check expiry
  const tokenTime = parseInt(timestamp, 10);
  const now = Date.now();
  const age = now - tokenTime;

  if (age > TOKEN_EXPIRY_MS) {
    // Token expired, clear it
    clearAuthToken();
    return null;
  }

  return token;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

export function notifyUnauthorized() {
  unauthorizedHandler?.();
}
