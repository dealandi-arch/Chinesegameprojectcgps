-- Wok Quest: grant / revoke the super admin flag.
--
-- NOT a migration -- no table changes. Super admin is a flag stored
-- alongside the role in Supabase Auth's app_metadata (auth.users
-- .raw_app_meta_data), exactly where "role" already lives, so there is
-- nothing to create. Run this by hand in the Supabase SQL editor.
--
-- New accounts can instead be bootstrapped by entering SUPER_ADMIN_CODE
-- in the admin-code field on the Create Profile form. This file is for
-- promoting an account that already exists.
--
-- A super admin is an ADMIN carrying super_admin = true. The flag is what
-- grants staff-chat moderation; the role stays "ADMIN" so every existing
-- admin check keeps working.

-- GRANT: replace 'your_username' with the target account's username.
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'ADMIN', 'super_admin', true)
where raw_app_meta_data->>'username' = 'your_username';

-- REVOKE: drops the flag but leaves the account an ordinary admin.
-- update auth.users
-- set raw_app_meta_data =
--   coalesce(raw_app_meta_data, '{}'::jsonb)
--   || jsonb_build_object('super_admin', false)
-- where raw_app_meta_data->>'username' = 'your_username';

-- Check who currently holds the flag.
-- select raw_app_meta_data->>'username' as username,
--        raw_app_meta_data->>'role' as role,
--        raw_app_meta_data->>'super_admin' as super_admin
-- from auth.users
-- where raw_app_meta_data->>'super_admin' = 'true';
