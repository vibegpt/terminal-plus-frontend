// fetchWithAuth.ts
import { supabase } from "@/lib/supabase";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    console.log("fetchWithAuth - session status:", token ? "Token found" : "No token");

    // If no token is available, still make the request but without auth headers
    // This allows fallback to session-based auth or endpoints that don't require auth
    const authHeaders = token 
      ? {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        }
      : (options.headers || {});

    return fetch(url, {
      ...options,
      headers: authHeaders,
      credentials: "include", // Include cookies for session auth as fallback
    });
  } catch (error) {
    console.error("fetchWithAuth - Error getting auth token:", error);
    
    // Still attempt the request without auth headers
    return fetch(url, {
      ...options,
      credentials: "include", // Include cookies for session auth as fallback
    });
  }
};