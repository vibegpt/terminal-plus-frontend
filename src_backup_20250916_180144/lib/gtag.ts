// src/lib/gtag.ts

declare global {
    interface Window {
      gtag?: (...args: any[]) => void;
    }
  }
  
  /**
   * Tracks a GA4 event if gtag is available.
   * @param event - The name of the event (e.g., "plan_journey_click")
   * @param params - Optional event parameters (category, label, value, etc.)
   */
  export function track(event: string, params: Record<string, any> = {}) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, params);
    } else {
      console.warn("gtag not found: attempted to track", event, params);
    }
  }