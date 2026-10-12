/*
# Add get_group_daily_progress function

1. New Functions
- `get_group_daily_progress(p_group_id uuid, p_date date)` — Returns each group member's
  individual required activity completion status for a given day.
  Columns: user_id, username, display_name, fajr, dhuhr, asr, maghrib, isha,
  quran_read, morning_adhkar, evening_adhkar, completed_count, total_required,
  progress_percent, required_points, bonus_points, total_points, required_activities.
- Uses the same scoring logic as the existing get_group_daily_scores function.
- Enforces group membership via is_group_member() — same security as existing functions.
- Returns all members even if they have zero activities (left join on daily_logs).
- SECURITY DEFINER so it can read all group members' daily_logs regardless of per-row RLS.
*/

CREATE OR REPLACE FUNCTION get_group_daily_progress(p_group_id uuid, p_date date)
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
  v_log daily_logs%ROWTYPE;
  v_req integer;
  v_bonus integer;
  v_act integer;
  v_count integer;
  v_completed integer;
BEGIN
  IF NOT is_group_member(p_group_id) THEN RETURN; END IF;

  FOR v_member IN
    SELECT gm.user_id, p.username, p.display_name
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    WHERE gm.group_id = p_group_id
  LOOP
    v_req := 0; v_bonus := 0; v_act := 0; v_completed := 0;
    SELECT * INTO v_log FROM daily_logs WHERE user_id = v_member.user_id AND log_date = p_date;

    IF v_log.fajr THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.dhuhr THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.asr THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.maghrib THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.isha THEN v_req := v_req + 3; v_act := v_act + 1; v_completed := v_completed + 1; END IF;
    IF v_log.quran_read THEN v_req := v_req + 1; v_completed := v_completed + 1; END IF;
    IF v_log.morning_adhkar THEN v_req := v_req + 2; v_completed := v_completed + 1; END IF;
    IF v_log.evening_adhkar THEN v_req := v_req + 2; v_completed := v_completed + 1; END IF;

    SELECT count(*) INTO v_count FROM sunnah_prayer_logs WHERE user_id = v_member.user_id AND log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM dhikr_sessions WHERE user_id = v_member.user_id AND log_date = p_date AND count >= 33;
    IF v_count > 0 THEN v_bonus := v_bonus + 1; END IF;
    SELECT count(*) INTO v_count FROM optional_adhkar_logs WHERE user_id = v_member.user_id AND log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM knowledge_contributions WHERE user_id = v_member.user_id AND created_at >= p_date AND created_at < p_date + integer '1' AND bonus_awarded = true;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
