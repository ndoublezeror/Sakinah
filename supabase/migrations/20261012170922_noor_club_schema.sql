/*
# Noor Club - Complete Database Schema

## Overview
Creates the full database schema for Noor Club, a bilingual Islamic daily worship
and community platform with authentication, daily worship tracking, points system,
groups, leaderboards, and Islamic knowledge sharing.

## Tables
1. profiles — User profiles (username, display_name, language, theme)
2. daily_logs — Required daily worship tracking (5 prayers, Quran, morning/evening adhkar)
3. sunnah_prayer_logs — Optional sunnah prayer tracking (1 bonus point each)
4. dhikr_sessions — Digital tasbih sessions (1 bonus point if count >= 33)
5. optional_adhkar_logs — Optional adhkar tracking (1 bonus point each)
6. quran_journal — Quran reading journal entries
7. knowledge_contributions — Islamic knowledge submissions with moderation
8. knowledge_bookmarks — Saved knowledge contributions
9. groups — Private community groups with invite codes
10. group_members — Group membership
11. daily_winners — Historical finalized daily winners

## Functions
1. handle_new_user — Auto-create profile on signup
2. set_updated_at — Auto-update updated_at timestamp
3. get_daily_points(p_date) — Calculate user's daily points breakdown
4. get_group_daily_scores(p_group_id, p_date) — Get all group members' scores
5. finalize_daily_winner(p_group_id, p_date) — Finalize winner(s) for a past day
6. is_group_member(p_group_id) — Check membership

## Points System
Required (max 20/day): prayers 3pts each (15 max), Quran 1pt, morning adhkar 2pts, evening adhkar 2pts
Bonus: sunnah 1pt each, dhikr>=33 1pt/day, optional adhkar 1pt each, knowledge 2pts once

## Security
- RLS on all tables, owner-scoped CRUD via auth.uid()
- Point calculations use SECURITY DEFINER functions
- Username uniqueness via case-insensitive unique index
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  theme text NOT NULL DEFAULT 'light',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique ON profiles (lower(username));

CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- DAILY LOGS
CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  fajr boolean NOT NULL DEFAULT false,
  dhuhr boolean NOT NULL DEFAULT false,
  asr boolean NOT NULL DEFAULT false,
  maghrib boolean NOT NULL DEFAULT false,
  isha boolean NOT NULL DEFAULT false,
  quran_read boolean NOT NULL DEFAULT false,
  morning_adhkar boolean NOT NULL DEFAULT false,
  evening_adhkar boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_logs_select_own" ON daily_logs;
CREATE POLICY "daily_logs_select_own" ON daily_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_logs_insert_own" ON daily_logs;
CREATE POLICY "daily_logs_insert_own" ON daily_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_logs_update_own" ON daily_logs;
CREATE POLICY "daily_logs_update_own" ON daily_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "daily_logs_delete_own" ON daily_logs;
CREATE POLICY "daily_logs_delete_own" ON daily_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SUNNAH PRAYER LOGS
CREATE TABLE IF NOT EXISTS sunnah_prayer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  prayer_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date, prayer_name)
);
ALTER TABLE sunnah_prayer_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sunnah_select_own" ON sunnah_prayer_logs;
CREATE POLICY "sunnah_select_own" ON sunnah_prayer_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "sunnah_insert_own" ON sunnah_prayer_logs;
CREATE POLICY "sunnah_insert_own" ON sunnah_prayer_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "sunnah_delete_own" ON sunnah_prayer_logs;
CREATE POLICY "sunnah_delete_own" ON sunnah_prayer_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DHIKR SESSIONS
CREATE TABLE IF NOT EXISTS dhikr_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dhikr_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dhikr_select_own" ON dhikr_sessions;
CREATE POLICY "dhikr_select_own" ON dhikr_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "dhikr_insert_own" ON dhikr_sessions;
CREATE POLICY "dhikr_insert_own" ON dhikr_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "dhikr_delete_own" ON dhikr_sessions;
CREATE POLICY "dhikr_delete_own" ON dhikr_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- OPTIONAL ADHKAR LOGS
CREATE TABLE IF NOT EXISTS optional_adhkar_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  adhkar_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date, adhkar_name)
);
ALTER TABLE optional_adhkar_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opt_adhkar_select_own" ON optional_adhkar_logs;
CREATE POLICY "opt_adhkar_select_own" ON optional_adhkar_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "opt_adhkar_insert_own" ON optional_adhkar_logs;
CREATE POLICY "opt_adhkar_insert_own" ON optional_adhkar_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "opt_adhkar_delete_own" ON optional_adhkar_logs;
CREATE POLICY "opt_adhkar_delete_own" ON optional_adhkar_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- QURAN JOURNAL
CREATE TABLE IF NOT EXISTS quran_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  surah text,
  ayah_range text,
  reflection text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE quran_journal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quran_journal_select_own" ON quran_journal;
CREATE POLICY "quran_journal_select_own" ON quran_journal FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "quran_journal_insert_own" ON quran_journal;
CREATE POLICY "quran_journal_insert_own" ON quran_journal FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "quran_journal_update_own" ON quran_journal;
CREATE POLICY "quran_journal_update_own" ON quran_journal FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "quran_journal_delete_own" ON quran_journal;
CREATE POLICY "quran_journal_delete_own" ON quran_journal FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- KNOWLEDGE CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS knowledge_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  explanation text NOT NULL,
  source text,
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'pending',
  bonus_awarded boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE knowledge_contributions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge_contributions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_contributions (category);
DROP POLICY IF EXISTS "knowledge_select_all" ON knowledge_contributions;
CREATE POLICY "knowledge_select_all" ON knowledge_contributions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "knowledge_insert_own" ON knowledge_contributions;
CREATE POLICY "knowledge_insert_own" ON knowledge_contributions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "knowledge_update_own" ON knowledge_contributions;
CREATE POLICY "knowledge_update_own" ON knowledge_contributions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "knowledge_delete_own" ON knowledge_contributions;
CREATE POLICY "knowledge_delete_own" ON knowledge_contributions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- KNOWLEDGE BOOKMARKS
CREATE TABLE IF NOT EXISTS knowledge_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution_id uuid NOT NULL REFERENCES knowledge_contributions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contribution_id)
);
ALTER TABLE knowledge_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookmarks_select_own" ON knowledge_bookmarks;
CREATE POLICY "bookmarks_select_own" ON knowledge_bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_insert_own" ON knowledge_bookmarks;
CREATE POLICY "bookmarks_insert_own" ON knowledge_bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_delete_own" ON knowledge_bookmarks;
CREATE POLICY "bookmarks_delete_own" ON knowledge_bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GROUPS
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select_all" ON groups;
CREATE POLICY "groups_select_all" ON groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "groups_insert_own" ON groups;
CREATE POLICY "groups_insert_own" ON groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "groups_update_creator" ON groups;
CREATE POLICY "groups_update_creator" ON groups FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "groups_delete_creator" ON groups;
CREATE POLICY "groups_delete_creator" ON groups FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- GROUP MEMBERS
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_members_select_member" ON group_members;
CREATE POLICY "group_members_select_member" ON group_members FOR SELECT TO authenticated USING (is_group_member(group_id));
DROP POLICY IF EXISTS "group_members_insert_own" ON group_members;
CREATE POLICY "group_members_insert_own" ON group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "group_members_delete_own" ON group_members;
CREATE POLICY "group_members_delete_own" ON group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DAILY WINNERS
CREATE TABLE IF NOT EXISTS daily_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  winner_date date NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  required_activities integer NOT NULL DEFAULT 0,
  shared_win boolean NOT NULL DEFAULT false,
  finalized boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, winner_date, user_id)
);
ALTER TABLE daily_winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_winners_select_member" ON daily_winners;
CREATE POLICY "daily_winners_select_member" ON daily_winners FOR SELECT TO authenticated USING (is_group_member(group_id));

-- TRIGGERS
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_daily_logs_updated ON daily_logs;
CREATE TRIGGER trigger_daily_logs_updated BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trigger_quran_journal_updated ON quran_journal;
CREATE TRIGGER trigger_quran_journal_updated BEFORE UPDATE ON quran_journal FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trigger_knowledge_updated ON knowledge_contributions;
CREATE TRIGGER trigger_knowledge_updated BEFORE UPDATE ON knowledge_contributions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- POINTS: get_daily_points
CREATE OR REPLACE FUNCTION get_daily_points(p_date date) RETURNS json AS $$
DECLARE
  v_log daily_logs%ROWTYPE;
  v_req integer := 0; v_bonus integer := 0; v_act integer := 0; v_count integer;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('error', 'not authenticated'); END IF;
  SELECT * INTO v_log FROM daily_logs WHERE user_id = v_uid AND log_date = p_date;
  IF v_log.fajr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
  IF v_log.dhuhr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
  IF v_log.asr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
  IF v_log.maghrib THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
  IF v_log.isha THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
  IF v_log.quran_read THEN v_req := v_req + 1; END IF;
  IF v_log.morning_adhkar THEN v_req := v_req + 2; END IF;
  IF v_log.evening_adhkar THEN v_req := v_req + 2; END IF;
  SELECT count(*) INTO v_count FROM sunnah_prayer_logs WHERE user_id = v_uid AND log_date = p_date;
  v_bonus := v_bonus + v_count;
  SELECT count(*) INTO v_count FROM dhikr_sessions WHERE user_id = v_uid AND log_date = p_date AND count >= 33;
  IF v_count > 0 THEN v_bonus := v_bonus + 1; END IF;
  SELECT count(*) INTO v_count FROM optional_adhkar_logs WHERE user_id = v_uid AND log_date = p_date;
  v_bonus := v_bonus + v_count;
  SELECT count(*) INTO v_count FROM knowledge_contributions WHERE user_id = v_uid AND created_at >= p_date AND created_at < p_date + integer '1' AND bonus_awarded = true;
  v_bonus := v_bonus + (v_count * 2);
  RETURN json_build_object('required_points', v_req, 'bonus_points', v_bonus, 'total_points', v_req + v_bonus, 'required_activities', v_act, 'max_required', 20, 'max_prayers', 15);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POINTS: get_group_daily_scores (OUT params — assign to output columns, RETURN NEXT without args)
CREATE OR REPLACE FUNCTION get_group_daily_scores(p_group_id uuid, p_date date)
RETURNS TABLE (user_id uuid, username text, display_name text, required_points integer, bonus_points integer, total_points integer, required_activities integer) AS $$
DECLARE v_member RECORD; v_log daily_logs%ROWTYPE; v_req integer; v_bonus integer; v_act integer; v_count integer;
BEGIN
  IF NOT is_group_member(p_group_id) THEN RETURN; END IF;
  FOR v_member IN SELECT gm.user_id, p.username, p.display_name FROM group_members gm JOIN profiles p ON p.id = gm.user_id WHERE gm.group_id = p_group_id LOOP
    v_req := 0; v_bonus := 0; v_act := 0;
    SELECT * INTO v_log FROM daily_logs WHERE user_id = v_member.user_id AND log_date = p_date;
    IF v_log.fajr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.dhuhr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.asr THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.maghrib THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.isha THEN v_req := v_req + 3; v_act := v_act + 1; END IF;
    IF v_log.quran_read THEN v_req := v_req + 1; END IF;
    IF v_log.morning_adhkar THEN v_req := v_req + 2; END IF;
    IF v_log.evening_adhkar THEN v_req := v_req + 2; END IF;
    SELECT count(*) INTO v_count FROM sunnah_prayer_logs WHERE user_id = v_member.user_id AND log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM dhikr_sessions WHERE user_id = v_member.user_id AND log_date = p_date AND count >= 33;
    IF v_count > 0 THEN v_bonus := v_bonus + 1; END IF;
    SELECT count(*) INTO v_count FROM optional_adhkar_logs WHERE user_id = v_member.user_id AND log_date = p_date;
    v_bonus := v_bonus + v_count;
    SELECT count(*) INTO v_count FROM knowledge_contributions WHERE user_id = v_member.user_id AND created_at >= p_date AND created_at < p_date + integer '1' AND bonus_awarded = true;
    v_bonus := v_bonus + (v_count * 2);
    user_id := v_member.user_id; username := v_member.username; display_name := v_member.display_name;
    required_points := v_req; bonus_points := v_bonus; total_points := v_req + v_bonus; required_activities := v_act;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POINTS: finalize_daily_winner
CREATE OR REPLACE FUNCTION finalize_daily_winner(p_group_id uuid, p_date date) RETURNS void AS $$
DECLARE v_max_total integer; v_max_act integer; v_existing integer; v_tie_count integer;
BEGIN
  SELECT count(*) INTO v_existing FROM daily_winners WHERE group_id = p_group_id AND winner_date = p_date AND finalized = true;
  IF v_existing > 0 THEN RETURN; END IF;
  IF p_date >= CURRENT_DATE THEN RETURN; END IF;
  IF NOT is_group_member(p_group_id) THEN RETURN; END IF;
  SELECT max(total_points) INTO v_max_total FROM get_group_daily_scores(p_group_id, p_date);
  IF v_max_total IS NULL OR v_max_total = 0 THEN RETURN; END IF;
  SELECT max(required_activities) INTO v_max_act FROM get_group_daily_scores(p_group_id, p_date) WHERE total_points = v_max_total;
  SELECT count(*) INTO v_tie_count FROM get_group_daily_scores(p_group_id, p_date) WHERE total_points = v_max_total AND required_activities = v_max_act;
  INSERT INTO daily_winners (group_id, winner_date, user_id, points, required_activities, shared_win, finalized)
  SELECT p_group_id, p_date, user_id, total_points, required_activities, v_tie_count > 1, true
  FROM get_group_daily_scores(p_group_id, p_date) WHERE total_points = v_max_total AND required_activities = v_max_act;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;