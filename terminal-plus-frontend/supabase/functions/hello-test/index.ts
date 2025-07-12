// supabase/functions/hello-test/index.ts
import { serve } from "https://deno.land/std@0.204.0/http/server.ts";

serve((_req) => {
  return new Response(JSON.stringify({ success: true, msg: "Hello from Supabase Functions!" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});