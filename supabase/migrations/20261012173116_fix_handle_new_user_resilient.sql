/*
# Make handle_new_user trigger resilient to username conflicts

## Problem
If two users register with the same username (case-insensitive), the trigger
inserts into profiles which hits the unique constraint, causing the entire
signup to fail with "Database error saving new user". The user sees a generic
error instead of a friendly "username taken" message.

## Fix
Update handle_new_user to catch unique constraint violations on username
and append a random suffix to make the username unique. The user can then
change their username later from settings.

This is a last-resort safety net — the frontend already checks username
availability before signup. This handles race conditions.
*/

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
DECLARE
  v_username text;
  v_display_name text;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  
  -- Try inserting with the provided username
  BEGIN
    INSERT INTO profiles (id, username, display_name)
    VALUES (NEW.id, v_username, v_display_name);
  EXCEPTION WHEN unique_violation THEN
    -- Username conflict (race condition): append random suffix
    v_username := v_username || '_' || substr(md5(random()::text), 1, 4);
    INSERT INTO profiles (id, username, display_name)
    VALUES (NEW.id, v_username, v_display_name);
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;