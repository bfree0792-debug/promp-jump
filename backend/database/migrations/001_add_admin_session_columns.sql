-- Required by the single-admin-session backend flow.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS admin_session_token text,
  ADD COLUMN IF NOT EXISTS admin_session_expires_at timestamp with time zone;
