/*
# Add atomic Tasbih save function and unique constraint

1. Purpose
- Ensure each user has at most one dhikr_sessions row per day so milestone saves are idempotent.
- Provide an atomic save function that uses GREATEST to never decrease the count, preventing race conditions and multi-device conflicts.

2. Changes
- Deduplicate existing dhikr_sessions rows by merging counts per (user_id, log_date).
- Add unique constraint on (user_id, log_date).
- Create save_dhikr_count(p_log_date, p_count) SECURITY DEFINER function.

3. Security
- The function is SECURITY DEFINER with search_path = public.
- It uses auth.uid() so a user can only save their own dhikr count.
- No existing data is lost — duplicate rows are merged by summing their counts.
*/

-- Step 1: Merge duplicate rows by summing counts into the row with the highest count
DO $$
BEGIN
  UPDATE public.dhikr_sessions AS ds
  SET count = merged.total_count
  FROM (
    SELECT user_id, log_date, sum(count) AS total_count
    FROM public.dhikr_sessions
    GROUP BY user_id, log_date
    HAVING count(*) > 1
  ) AS merged
  WHERE ds.user_id = merged.user_id
    AND ds.log_date = merged.log_date
    AND ds.id = (
      SELECT ds2.id FROM public.dhikr_sessions AS ds2
      WHERE ds2.user_id = ds.user_id AND ds2.log_date = ds.log_date
      ORDER BY ds2.count DESC, ds2.created_at DESC
      LIMIT 1
    );

  DELETE FROM public.dhikr_sessions
  WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, log_date) id
    FROM public.dhikr_sessions
    ORDER BY user_id, log_date, count DESC, created_at DESC
  );
END $$;

-- Step 2: Add unique constraint
ALTER TABLE public.dhikr_sessions
  DROP CONSTRAINT IF EXISTS dhikr_sessions_user_date_unique;
ALTER TABLE public.dhikr_sessions
  ADD CONSTRAINT dhikr_sessions_user_date_unique UNIQUE (user_id, log_date);

-- Step 3: Create atomic save function
CREATE OR REPLACE FUNCTION public.save_dhikr_count(p_log_date date, p_count integer)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  log_date date,
  count integer,
  created_at timestamptz
) AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  RETURN QUERY
  INSERT INTO public.dhikr_sessions (user_id, log_date, count)
  VALUES (v_uid, p_log_date, p_count)
  ON CONFLICT (user_id, log_date) DO UPDATE
    SET count = GREATEST(public.dhikr_sessions.count, EXCLUDED.count)
  RETURNING id, user_id, log_date, count, created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;