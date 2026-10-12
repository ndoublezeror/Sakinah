/*
# Fix group leaderboard score calculation

1. Purpose
- Fix the daily and weekly group scoring functions so they can read activity records without a column-name conflict.
- The conflict happened because the returned `user_id` field had the same name as activity-table columns.

2. Modified Functions
- `get_group_daily_scores(p_group_id, p_date)` now qualifies activity-table columns.
- `get_group_daily_progress(p_group_id, p_date)` now qualifies activity-table columns.
- Both functions continue returning every member, including members with zero activity.

3. Security
- Both functions remain SECURITY DEFINER and still require the requesting user to belong to the selected group.
- Both functions use the fixed `public` search path.
- No table permissions, policies, columns, or stored data are changed.

4. Notes
- Daily and weekly leaderboards now use the same saved activity records as the personal progress screen.
- This migration is safe to apply more than once.
*/

CREATE OR REPLACE FUNCTION public.get_group_daily_scores(p_group_id uuid, p_date date)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  required_points integer,
  bonus_points integer,
  total_points integer,
  required_activities integer
) AS $$
DECLARE
  v_member RECORD;
  v_log public.daily_logs%ROWTYPE;
  v_req integer;
  v_bonus integer;
  v_act integer;
  v_count integer;
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN RETURN; END IF;

  FOR v_member IN
    SELECT gm.user_id, p.username, p.display_name
    FROM public.group_members AS gm
    JOIN public.profiles AS p ON p.id = gm.user_id
    WHERE gm.group_id = p_group_id
  LOOP
    v_req := 0; v_bonus := 0; v_act := 0;
    SELECT dl.* INTO v_log
    FROM public.daily_logs AS dl
    WHERE dl.user_id = v_member.user_id AND dl.log_date = p_date;

    IF v_log.fajr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.dhuhr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.asr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.maghrib THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.isha THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.quran_read THEN v_req := v_req + 1; END IF;
    IF v_log.morning_adhkar THEN v_req := v_req + 2; END IF;
    IF v_log.evening_adhkar THEN v_req := v_req + 2; END IF;

    SELECT count(*) INTO v_count FROM public.sunnah_prayer_logs AS spl WHERE spl.user_id = v_member.user_id AND spl.log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM public.dhikr_sessions AS ds WHERE ds.user_id = v_member.user_id AND ds.log_date = p_date AND ds.count >= 33;
    IF v_count > 0 THEN v_bonus := v_bonus + 1; END IF;
    SELECT count(*) INTO v_count FROM public.optional_adhkar_logs AS oal WHERE oal.user_id = v_member.user_id AND oal.log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM public.knowledge_contributions AS kc WHERE kc.user_id = v_member.user_id AND kc.created_at >= p_date AND kc.created_at < p_date + integer '1' AND kc.bonus_awarded = true;
    v_bonus := v_bonus + (v_count * 2);

    user_id := v_member.user_id;
    username := v_member.username;
    display_name := v_member.display_name;
    required_points := v_req;
    bonus_points := v_bonus;
    total_points := v_req + v_bonus;
    required_activities := v_act;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_group_daily_progress(p_group_id uuid, p_date date)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  fajr boolean,
  dhuhr boolean,
  asr boolean,
  maghrib boolean,
  isha boolean,
  quran_read boolean,
  morning_adhkar boolean,
  evening_adhkar boolean,
  completed_count integer,
  total_required integer,
  progress_percent integer,
  required_points integer,
  bonus_points integer,
  total_points integer,
  required_activities integer
) AS $$
DECLARE
  v_member RECORD;
  v_log public.daily_logs%ROWTYPE;
  v_req integer;
  v_bonus integer;
  v_act integer;
  v_count integer;
  v_completed integer;
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN RETURN; END IF;

  FOR v_member IN
    SELECT gm.user_id, p.username, p.display_name
    FROM public.group_members AS gm
    JOIN public.profiles AS p ON p.id = gm.user_id
    WHERE gm.group_id = p_group_id
  LOOP
    v_req := 0; v_bonus := 0; v_act := 0; v_completed := 0;
    SELECT dl.* INTO v_log
    FROM public.daily_logs AS dl
    WHERE dl.user_id = v_member.user_id AND dl.log_date = p_date;

    IF v_log.fajr THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.dhuhr THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.asr THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.maghrib THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.isha THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.quran_read THEN v_req := v_req + 1; v_completed := v_completed + 1; END IF;
    IF v_log.morning_adhkar THEN v_req := v_req + 2; v_completed := v_completed + 1; END IF;
    IF v_log.evening_adhkar THEN v_req := v_req + 2; v_completed := v_completed + 1; END IF;

    SELECT count(*) INTO v_count FROM public.sunnah_prayer_logs AS spl WHERE spl.user_id = v_member.user_id AND spl.log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM public.dhikr_sessions AS ds WHERE ds.user_id = v_member.user_id AND ds.log_date = p_date AND ds.count >= 33;
    IF v_count > 0 THEN v_bonus := v_bonus + 1; END IF;
    SELECT count(*) INTO v_count FROM public.optional_adhkar_logs AS oal WHERE oal.user_id = v_member.user_id AND oal.log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM public.knowledge_contributions AS kc WHERE kc.user_id = v_member.user_id AND kc.created_at >= p_date AND kc.created_at < p_date + integer '1' AND kc.bonus_awarded = true;
    v_bonus := v_bonus + (v_count * 2);

    user_id := v_member.user_id;
    username := v_member.username;
    display_name := v_member.display_name;
    fajr := COALESCE(v_log.fajr, false);
    dhuhr := COALESCE(v_log.dhuhr, false);
    asr := COALESCE(v_log.asr, false);
    maghrib := COALESCE(v_log.maghrib, false);
    isha := COALESCE(v_log.isha, false);
    quran_read := COALESCE(v_log.quran_read, false);
    morning_adhkar := COALESCE(v_log.morning_adhkar, false);
    evening_adhkar := COALESCE(v_log.evening_adhkar, false);
    completed_count := v_completed;
    total_required := 8;
    progress_percent := CASE WHEN v_completed = 0 THEN 0 ELSE ROUND((v_completed::numeric / 8) * 100) END;
    required_points := v_req;
    bonus_points := v_bonus;
    total_points := v_req + v_bonus;
    required_activities := v_act;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;