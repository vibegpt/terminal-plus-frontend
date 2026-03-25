import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const { user_id, emotion, detailed_emotion, confidence, source, tone, pace, warmth, language, gpt_response } = await req.json();

  if (!user_id || !emotion || !confidence) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await client.from('emotion_logs').insert({
    user_id,
    emotion,
    detailed_emotion,
    confidence,
    source,
    tone,
    pace,
    warmth,
    language,
    gpt_response
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
})
