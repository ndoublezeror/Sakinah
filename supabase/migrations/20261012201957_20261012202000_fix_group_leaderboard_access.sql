/*
# Fix group leaderboard access

1. Purpose
- Ensure the group progress function resolves every table and helper through the public schema.
- This keeps the SECURITY DEFINER function reliable for signed-in group members.

2. Functions
- Modified `get_group_daily_progress(p_group_id, p_date)` only.
- No tables, columns, or stored user data are changed.

3. Security
- The function remains restricted by `is_group_member(p_group_id)`.
- The explicit search path prevents an untrusted schema from changing name resolution inside this privileged function.

4. Notes
- Existing group membership and activity records are preserved.
- The change is safe to apply more than once.
*/

ALTER FUNCTION public.get_group_daily_progress(uuid, date) SET search_path = public;