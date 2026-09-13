-- fixups for migration 2
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.payments'::regclass;
alter publication supabase_realtime add table public.broadcasts;
