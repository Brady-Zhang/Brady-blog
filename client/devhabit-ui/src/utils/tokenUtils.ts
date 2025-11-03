/**
 * Utility functions for token management
 */

/**
 * Decode JWT token to get expiration time
 * Returns null if token is invalid
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Return expiration timestamp (in milliseconds)
    if (payload.exp) {
      return payload.exp * 1000; // Convert to milliseconds
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired or will expire soon
 * @param token JWT token
 * @param bufferMinutes Minutes before expiration to consider as "expiring soon" (default: 5)
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpiringSoon(token: string, bufferMinutes: number = 5): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true; // Treat invalid token as expiring
  }

  const now = Date.now();
  const bufferMs = bufferMinutes * 60 * 1000;
  
  return expiration <= now + bufferMs;
}

/**
 * Get time until token expires (in milliseconds)
 * Returns 0 if token is expired or invalid
 */
export function getTimeUntilExpiration(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return 0;
  }

  const now = Date.now();
  const timeUntilExpiration = expiration - now;
  
  return Math.max(0, timeUntilExpiration);
}

