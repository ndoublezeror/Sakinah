/*
# Fix ambiguous column reference in save_dhikr_count

The RETURNING clause references `user_id` which is ambiguous between the
PL/pgSQL output column and the table column. Qualify all RETURNING columns
with the table name to resolve the ambiguity.
*/

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
  RETURNING
    public.dhikr_sessions.id,
    public.dhikr_sessions.user_id,
    public.dhikr_sessions.log_date,
    public.dhikr_sessions.count,
    public.dhikr_sessions.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;