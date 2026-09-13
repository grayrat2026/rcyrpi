-- Seed: real data only (no demo users, no mock content)

-- ============ DEFAULT ADMIN (CHANGE the password right after first login!) ============
-- Default credentials: username `admin` / password `ChangeMe@123`
-- The hash below is sha256("rcy-rpi-v1" + "ChangeMe@123"). After the FIRST
-- login, change the password from Profile — or seed your own hash instead:
--   echo -n "rcy-rpi-v1YOUR_NEW_PASSWORD" | sha256sum
insert into public.members (id, username, full_name, email, phone, password_hash, role, status, blood_group, address, team, sub_team, member_no, created_at)
values (
  'm_admin', 'admin', 'Site Admin', 'admin@example.org', '+8801700000000',
  'eccecf2a6d1399b429cd52d8dc22f12703916aa910189b5d9391c483d955e5e3',
  'admin', 'active', 'O+',
  '{"district":"Rangpur","upazila":"Rangpur Sadar","thana":"Rangpur Sadar","ward":"","para":""}'::jsonb,
  'Youth Red Crescent Team', 'RPI Central Unit', 'YRC-RPI-001', now()
)
on conflict (username) do nothing;

-- ============ home sections (page builder defaults) ============
insert into public.home_sections (key, visible, sort) values
  ('hero', true, 0),
  ('stats', true, 1),
  ('emergency_strip', true, 2),
  ('activities', true, 3),
  ('events', true, 4),
  ('principles', true, 5),
  ('schedule', true, 6),
  ('about', true, 7),
  ('join_cta', true, 8)
on conflict (key) do nothing;

-- ============ contacts (admin can edit/add/remove from Admin Panel) ============
insert into public.contacts (id, kind, label, value, icon, active, sort) values
  ('c_999', 'phone', '{"en":"National Emergency","bn":"জাতীয় ইমার্জেন্সি"}'::jsonb, '999', 'Siren', true, 0),
  ('c_helpline', 'phone', '{"en":"Unit Helpline","bn":"ইউনিট হেল্পলাইন"}'::jsonb, '+8801700000000', 'Phone', true, 1),
  ('c_email', 'email', '{"en":"Official Email","bn":"অফিসিয়াল ইমেইল"}'::jsonb, 'admin@example.org', 'Mail', true, 2)
on conflict (id) do nothing;
