// fetchWithAuth.ts
import supabase from "@/lib/supabase";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    console.log("fetchWithAuth - session status:", token ? "Token found" : "No token");

    // Use session token if available, otherwise use anon key
    const authHeaders = {
      Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      ...(options.headers || {}),
    };

    return fetch(url, {
      ...options,
      headers: authHeaders,
      credentials: "include", // Include cookies for session auth as fallback
    });
  } catch (error) {
    console.error("fetchWithAuth - Error getting auth token:", error);
    
    // Use anon key as fallback
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        ...(options.headers || {}),
      },
      credentials: "include", // Include cookies for session auth as fallback
    });
  }
};