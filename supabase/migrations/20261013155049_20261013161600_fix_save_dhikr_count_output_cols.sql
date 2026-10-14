/*
# Fix save_dhikr_count output column name collision

Drop and recreate the function with distinct output column names to avoid
PL/pgSQL ambiguity between output columns and table columns.
*/

DROP FUNCTION IF EXISTS public.save_dhikr_count(date, integer);

CREATE OR REPLACE FUNCTION public.save_dhikr_count(p_log_date date, p_count integer)
RETURNS TABLE (
  out_id uuid,
  out_user_id uuid,
  out_log_date date,
  out_count integer,
  out_created_at timestamptz
) AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row record;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  INSERT INTO public.dhikr_sessions (user_id, log_date, count)
  VALUES (v_uid, p_log_date, p_count)
  ON CONFLICT (user_id, log_date) DO UPDATE
    SET count = GREATEST(public.dhikr_sessions.count, EXCLUDED.count)
  RETURNING
    public.dhikr_sessions.id,
    public.dhikr_sessions.user_id,
    public.dhikr_sessions.log_date,
    public.dhikr_sessions.count,
    public.dhikr_sessions.created_at
  INTO v_row;

  out_id := v_row.id;
  out_user_id := v_row.user_id;
  out_log_date := v_row.log_date;
  out_count := v_row.count;
  out_created_at := v_row.created_at;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;