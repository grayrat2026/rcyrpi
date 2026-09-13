-- 08: Supabase Storage — "avatars" bucket (public read, service-role write)
--
-- User-uploaded images (member avatars) are auto-compressed client-side
-- to <= 500KB JPEG, then uploaded through POST /api/uploads/avatar into
-- this bucket. The member's avatar_url stores the public URL.
-- If Storage is unavailable/full, the app automatically falls back to the
-- legacy inline base64 data-URL path (no user-facing failure).
-- NOTE: the API route also auto-creates this bucket if it is missing,
-- so this file is a no-op on live projects that already have it.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;
