-- 20260324202819_create_agent_interactions.sql
-- Applied to production on 24 Mar 2026; no local file existed. Recovered verbatim on
-- 27 Sep 2026 from supabase_migrations.schema_migrations.statements so the local
-- history matches the remote one. Do not re-run: the table exists.
CREATE TABLE IF NOT EXISTS public.agent_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  terminal TEXT,
  gate TEXT,
  time_until_boarding INTEGER,
  vibe_requested TEXT,
  amenities_shown JSONB,
  amenity_clicked TEXT,
  mode TEXT DEFAULT 'conversational',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_interactions_created ON agent_interactions(created_at);
CREATE INDEX idx_agent_interactions_terminal ON agent_interactions(terminal);
CREATE INDEX idx_agent_interactions_vibe ON agent_interactions(vibe_requested);

ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything" ON agent_interactions
  FOR ALL USING (true) WITH CHECK (true);
