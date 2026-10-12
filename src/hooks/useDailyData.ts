import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type DailyLog = {
  id: string;
  log_date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  quran_read: boolean;
  morning_adhkar: boolean;
  evening_adhkar: boolean;
};

export type PointsBreakdown = {
  required_points: number;
  bonus_points: number;
  total_points: number;
  required_activities: number;
  max_required: number;
  max_prayers: number;
};

export type SunnahLog = {
  id: string;
  log_date: string;
  prayer_name: string;
};

export type OptionalAdhkarLog = {
  id: string;
  log_date: string;
  adhkar_name: string;
};

export type DhikrSession = {
  id: string;
  log_date: string;
  count: number;
  created_at: string;
};

export type QuranEntry = {
  id: string;
  log_date: string;
  surah: string | null;
  ayah_range: string | null;
  reflection: string | null;
};

export type KnowledgeContribution = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  explanation: string;
  source: string | null;
  language: string;
  status: string;
  created_at: string;
};

export type GroupData = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  timezone: string;
};

export type GroupMember = {
  id: string;
  user_id: string;
};

export type GroupScore = {
  user_id: string;
  username: string;
  display_name: string;
  required_points: number;
  bonus_points: number;
  total_points: number;
  required_activities: number;
};

export function useDailyData(date?: string) {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [points, setPoints] = useState<PointsBreakdown | null>(null);
  const [sunnahLogs, setSunnahLogs] = useState<SunnahLog[]>([]);
  const [optionalAdhkarLogs, setOptionalAdhkarLogs] = useState<OptionalAdhkarLog[]>([]);
  const [dhikrSessions, setDhikrSessions] = useState<DhikrSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logDate = date || new Date().toISOString().split('T')[0];

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const [logRes, pointsRes, sunnahRes, optAdhkarRes, dhikrRes] = await Promise.all([
        supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', logDate).maybeSingle(),
        supabase.rpc('get_daily_points', { p_date: logDate }),
        supabase.from('sunnah_prayer_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
        supabase.from('optional_adhkar_logs').select('*').eq('user_id', user.id).eq('log_date', logDate),
        supabase.from('dhikr_sessions').select('*').eq('user_id', user.id).eq('log_date', logDate),
      ]);

      if (logRes.error) throw logRes.error;
      setLog(logRes.data as DailyLog | null);

      if (!pointsRes.error && pointsRes.data) {
        setPoints(pointsRes.data as PointsBreakdown);
      }

      setSunnahLogs((sunnahRes.data || []) as SunnahLog[]);
      setOptionalAdhkarLogs((optAdhkarRes.data || []) as OptionalAdhkarLog[]);
      setDhikrSessions((dhikrRes.data || []) as DhikrSession[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user, logDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateLog = async (updates: Partial<DailyLog>) => {
    if (!user) return;
    try {
      const existing = log;
      if (existing) {
        const { data, error: err } = await supabase
          .from('daily_logs')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (err) throw err;
        setLog(data as DailyLog);
      } else {
        const { data, error: err } = await supabase
          .from('daily_logs')
          .insert({ user_id: user.id, log_date: logDate, ...updates })
          .select()
          .single();
        if (err) throw err;
        setLog(data as DailyLog);
      }
      // Refresh points
      const { data: pts } = await supabase.rpc('get_daily_points', { p_date: logDate });
      if (pts) setPoints(pts as PointsBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const toggleSunnah = async (prayerName: string) => {
    if (!user) return;
    const existing = sunnahLogs.find(s => s.prayer_name === prayerName);
    try {
      if (existing) {
        await supabase.from('sunnah_prayer_logs').delete().eq('id', existing.id);
        setSunnahLogs(prev => prev.filter(s => s.id !== existing.id));
      } else {
        const { data, error: err } = await supabase
          .from('sunnah_prayer_logs')
          .insert({ user_id: user.id, log_date: logDate, prayer_name: prayerName })
          .select()
          .single();
        if (err) throw err;
        setSunnahLogs(prev => [...prev, data as SunnahLog]);
      }
      const { data: pts } = await supabase.rpc('get_daily_points', { p_date: logDate });
      if (pts) setPoints(pts as PointsBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const toggleOptionalAdhkar = async (adhkarName: string) => {
    if (!user) return;
    const existing = optionalAdhkarLogs.find(a => a.adhkar_name === adhkarName);
    try {
      if (existing) {
        await supabase.from('optional_adhkar_logs').delete().eq('id', existing.id);
        setOptionalAdhkarLogs(prev => prev.filter(a => a.id !== existing.id));
      } else {
        const { data, error: err } = await supabase
          .from('optional_adhkar_logs')
          .insert({ user_id: user.id, log_date: logDate, adhkar_name: adhkarName })
          .select()
          .single();
        if (err) throw err;
        setOptionalAdhkarLogs(prev => [...prev, data as OptionalAdhkarLog]);
      }
      const { data: pts } = await supabase.rpc('get_daily_points', { p_date: logDate });
      if (pts) setPoints(pts as PointsBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const saveDhikrSession = async (count: number) => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('dhikr_sessions')
        .insert({ user_id: user.id, log_date: logDate, count })
        .select()
        .single();
      if (err) throw err;
      setDhikrSessions(prev => [...prev, data as DhikrSession]);
      const { data: pts } = await supabase.rpc('get_daily_points', { p_date: logDate });
      if (pts) setPoints(pts as PointsBreakdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return {
    logDate, log, points, sunnahLogs, optionalAdhkarLogs, dhikrSessions,
    loading, error, fetchAll,
    updateLog, toggleSunnah, toggleOptionalAdhkar, saveDhikrSession,
  };
}
