import { serve } from "https://deno.land/std@0.152.0/http/server.ts"; // Corrected import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Validate request method
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ error: "Invalid authorization header format" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate the token
  const { data: { user }, error: authError } = await supabase.auth.api.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse request body
  const { flight_number, origin, destination, transit, selected_vibe, departure_time } = await req.json();

  // Validate required fields
  if (!flight_number || !origin || !destination || !selected_vibe || !departure_time) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Insert journey into the database
  const { data, error: insertError } = await supabase.from("journeys").insert([
    {
      flight_number,
      origin,
      destination,
      transit,
      selected_vibe,
      departure_time,
      user_id: user.id, // Store the authenticated user's ID
    },
  ]);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Return success response
  return new Response(JSON.stringify({ success: true, journey_id: data[0].id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});