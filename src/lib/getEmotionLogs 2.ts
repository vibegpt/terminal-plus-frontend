import { supabase } from './supabaseClient';

export async function getEmotionLogs(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('emotion_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return data;
} 