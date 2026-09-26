-- Rollback for rls_lockdown_part_a: restores the 26 Sep grants (anon and authenticated held all privileges; RLS off on the 28 tables below).
drop policy if exists route_templates_read on public.route_templates;
drop policy if exists route_stops_read on public.route_stops;
do $$
declare t text;
begin
  foreach t in array array['collections','collection_amenities','route_templates','route_stops',
    'users','user_profiles','social_activities','user_social_stats','user_visits',
    'vibes','vibe_collections','collection_amenity_mappings','amenity_access_points','amenity_terminal_access',
    'amenity_detail_backup_vibes','amenity_detail_backup_before_cleanup','amenity_detail_backup_20250104',
    'collection_amenities_backup','staging_missing_venues','csv_staging',
    'ab_experiments','ab_variants','ab_assignments',
    'smart7_performance_metrics','smart7_feedback','error_logs','cache_performance','network_performance'] loop
    execute format('alter table public.%I disable row level security', t);
  end loop;
end $$;
grant all on
  public.amenity_detail, public.amenity_vibe_descriptions, public.amenity_vibe_mappings,
  public.collections, public.collection_amenities, public.route_templates, public.route_stops,
  public.users, public.user_profiles, public.social_activities, public.user_social_stats, public.user_visits,
  public.vibes, public.vibe_collections, public.collection_amenity_mappings, public.amenity_access_points, public.amenity_terminal_access,
  public.amenity_detail_backup_vibes, public.amenity_detail_backup_before_cleanup, public.amenity_detail_backup_20250104,
  public.collection_amenities_backup, public.staging_missing_venues, public.csv_staging,
  public.ab_experiments, public.ab_variants, public.ab_assignments,
  public.smart7_performance_metrics, public.smart7_feedback, public.error_logs, public.cache_performance, public.network_performance,
  public.collection_stats, public.collection_stats_v2, public.collection_amenity_details,
  public.session_analytics, public.smart7_effectiveness, public.smart7_performance_summary,
  public.vibe_performance_analytics, public.collection_counts_cached, public.ab_experiment_results
to anon, authenticated;
grant execute on function public.get_amenities_for_vibe(varchar, varchar, varchar, integer, integer) to public, anon, authenticated;
