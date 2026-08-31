-- The server-side bootstrap client uses Supabase's service role for Clerk
-- synchronization. Keep its local and hosted privilege model consistent with
-- the trusted service-role contract used by the application.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
