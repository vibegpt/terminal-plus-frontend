// supabase/functions/saveJourney/index.ts
import { serve } from "https://deno.land/std@0.204.0/http/server.ts";

serve(async (req) => {
  console.log("Starting saveJourney function...");

  try {
    const body = await req.json();
    console.log("Body parsed successfully:", body);

    const { flight_number, origin, destination, selected_vibe, departure_time } = body;

    if (!flight_number || !origin || !destination || !selected_vibe || !departure_time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = `${Deno.env.get("PUBLIC_SUPABASE_URL")}/rest/v1/journeys`;
    const anonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY");

    console.log("About to POST to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        flight_number,
        origin,
        destination,
        selected_vibe,
        departure_time,
        created_at: new Date().toISOString(),
      }),
    });

    console.log("Fetch completed with status", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});