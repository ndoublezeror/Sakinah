/*
# Fix SECURITY DEFINER functions search_path

## Problem
The handle_new_user trigger function (SECURITY DEFINER) has a mutable search_path,
which causes "Database error saving new user" during signup on newer Supabase versions.
Supabase requires explicit search_path on SECURITY DEFINER functions for security.

## Fix
Set `search_path = public` on all SECURITY DEFINER functions:
- handle_new_user
- is_group_member
- get_daily_points
- get_group_daily_scores
- finalize_daily_winner

## No data changes
No tables, columns, or data are modified. Only function definitions updated.
*/

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_group_member(uuid) SET search_path = public;
ALTER FUNCTION public.get_daily_points(date) SET search_path = public;
ALTER FUNCTION public.get_group_daily_scores(uuid, date) SET search_path = public;
ALTER FUNCTION public.finalize_daily_winner(uuid, date) SET search_path = public;