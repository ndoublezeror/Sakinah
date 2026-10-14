/*
# Fix save_dhikr_count return column names

The previous version returned out_id, out_user_id, etc. which don't match
the DhikrSession TypeScript type (id, log_date, count, created_at).
Rewrite to do the upsert first, then SELECT the row separately to avoid
the PL/pgSQL column name ambiguity entirely.
*/

DROP FUNCTION IF EXISTS public.save_dhikr_count(date, integer);

CREATE OR REPLACE FUNCTION public.save_dhikr_count(p_log_date date, p_count integer)
RETURNS json AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row record;
BEGIN
  IF v_uid IS NULL THEN RETURN json_build_object('error', 'not authenticated'); END IF;

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

  RETURN json_build_object(
    'id', v_row.id,
    'user_id', v_row.user_id,
    'log_date', v_row.log_date,
    'count', v_row.count,
    'created_at', v_row.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;