-- Applied 2026-09-26 via Supabase MCP as version 20260926085601 (rls_lockdown_part_a).
-- Rollback: supabase/rollbacks/20260926085601_rls_lockdown_part_a_rollback.sql
-- A1. Catalogue tables the app and API read: RLS on, read-only
alter table public.collections          enable row level security;  -- existing SELECT policy activates
alter table public.collection_amenities enable row level security;  -- existing SELECT policy activates
alter table public.route_templates      enable row level security;
alter table public.route_stops          enable row level security;
create policy route_templates_read on public.route_templates for select to anon, authenticated using (true);
create policy route_stops_read     on public.route_stops     for select to anon, authenticated using (true);

-- A2. No client writes on any catalogue table
revoke insert, update, delete, truncate on
  public.amenity_detail, public.amenity_vibe_descriptions, public.amenity_vibe_mappings,
  public.collections, public.collection_amenities, public.route_templates, public.route_stops
from anon, authenticated;

-- A3. Legacy, PII, backup, staging and A/B tables: no client access
do $$
declare t text;
begin
  foreach t in array array[
    'users','user_profiles','social_activities','user_social_stats','user_visits',
    'vibes','vibe_collections','collection_amenity_mappings','amenity_access_points','amenity_terminal_access',
    'amenity_detail_backup_vibes','amenity_detail_backup_before_cleanup','amenity_detail_backup_20250104',
    'collection_amenities_backup','staging_missing_venues','csv_staging',
    'ab_experiments','ab_variants','ab_assignments',
    'smart7_performance_metrics','smart7_feedback','error_logs','cache_performance','network_performance'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- A4. Legacy SECURITY DEFINER views and materialized views
revoke all on
  public.collection_stats, public.collection_stats_v2, public.collection_amenity_details,
  public.session_analytics, public.smart7_effectiveness, public.smart7_performance_summary,
  public.vibe_performance_analytics, public.collection_counts_cached, public.ab_experiment_results
from anon, authenticated;

-- A5. SECURITY DEFINER RPC that anon can call
revoke execute on function public.get_amenities_for_vibe(varchar, varchar, varchar, integer, integer)
  from public, anon, authenticated;
