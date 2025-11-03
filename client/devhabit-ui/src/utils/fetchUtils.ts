import { refresh } from '../api/auth';
import { isTokenExpiringSoon } from './tokenUtils';

type RequestInit = Parameters<typeof fetch>[1];

// Create a store for the auth context handlers
type AuthContextHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  // eslint-disable-next-line no-unused-vars
  onTokenRefreshed: (accessToken: string, refreshToken: string) => void;
};

let authHandlers: AuthContextHandlers | null = null;
let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

// Function to initialize the auth handlers
export function initializeAuthHandlers(handlers: AuthContextHandlers) {
  authHandlers = handlers;
}

// Internal function to refresh token (with concurrency control)
async function refreshTokenIfNeeded(currentAccessToken: string | null): Promise<string | null> {
  if (!currentAccessToken) {
    return null;
  }

  // If token is not expiring soon, return current token
  if (!isTokenExpiringSoon(currentAccessToken, 5)) {
    return currentAccessToken;
  }

  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    try {
      const result = await refreshPromise;
      return result.accessToken;
    } catch {
      return currentAccessToken; // Fallback to current token if refresh fails
    }
  }

  // Start new refresh
  if (!authHandlers) {
    return currentAccessToken;
  }

  const refreshToken = authHandlers.getRefreshToken();
  if (!refreshToken) {
    return currentAccessToken;
  }

  isRefreshing = true;
  refreshPromise = refresh(refreshToken)
    .then((result) => {
      authHandlers?.onTokenRefreshed(result.accessToken, result.refreshToken);
      return result;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  try {
    const result = await refreshPromise;
    return result.accessToken;
  } catch {
    return currentAccessToken; // Fallback to current token if refresh fails
  }
}

interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

class ApiError extends Error {
  details?: ProblemDetails;

  constructor(message: string, details?: ProblemDetails) {
    super(message);
    this.details = details;
  }
}

export async function fetchWithAuth<T>(
  url: string,
  accessToken: string | null,
  options: RequestInit = {}
): Promise<T> {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  // Check if token is expiring soon and refresh proactively
  const freshAccessToken = await refreshTokenIfNeeded(accessToken);
  if (!freshAccessToken) {
    throw new Error('No access token available');
  }

  // Only set Content-Type if we're not sending FormData
  const defaultHeaders: Record<string, string> = {
    Authorization: `Bearer ${freshAccessToken}`,
  };

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized error
  if (response.status === 401) {
    try {
      if (!authHandlers) {
        throw new Error('Auth handlers not initialized');
      }

      const refreshToken = authHandlers.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Attempt to refresh the token
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await refresh(refreshToken);

      // Update tokens in context
      authHandlers.onTokenRefreshed(newAccessToken, newRefreshToken);

      // Retry the original request with the new token
      return fetchWithAuth<T>(url, newAccessToken, options);
    } catch {
      // If refresh fails, throw unauthorized error
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    // Try to get error message from response
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      const text = await response.text();
      throw new ApiError(text || `HTTP error! status: ${response.status}`);
    }
    
    // Build error message from validation errors if available
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    if (errorData.errors && typeof errorData.errors === 'object') {
      // Format validation errors
      const errorMessages = Object.entries(errorData.errors)
        .flatMap(([field, messages]) => {
          if (Array.isArray(messages)) {
            return messages.map(msg => `${field}: ${msg}`);
          }
          return [`${field}: ${messages}`];
        });
      errorMessage = errorMessages.join('\n');
    } else if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
    
    throw new ApiError(errorMessage, errorData);
  }

  // Return null for 204 responses or empty bodies, otherwise parse JSON
  if (response.status === 204) {
    return null as T;
  }
  try {
    return await response.json();
  } catch {
    return null as T;
  }
}
