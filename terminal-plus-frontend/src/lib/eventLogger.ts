// src/lib/eventLogger.ts

const getAnonId = (): string => {
    let anonId = localStorage.getItem("anon_id");
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem("anon_id", anonId);
    }
    return anonId;
  };
  
  export const logEvent = async ({
    action,
    label,
    path = window.location.pathname,
  }: {
    action: string;
    label: string;
    path?: string;
  }) => {
    const anonId = getAnonId();
  
    // Log to console (for now)
    console.log("[Event]", { anonId, action, label, path });
  
    // Optional: send to Supabase or your analytics backend
    // await fetch("/api/log-event", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ anonId, action, label, path, timestamp: new Date().toISOString() }),
    // });
  };