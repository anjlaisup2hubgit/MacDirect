-- Sample data copied from data/societies.json and data/events.json.
-- Run after schema.sql. Societies load straight away; events need an admin (see below).

insert into public.societies (name, category, description, building, contact, website) values
  ('Sample Robotics Society', 'Academic', 'Build and program robots, enter competitions and run weekend workshops for beginners.', '16MW (Waranara Library)', 'robotics@example.com', 'https://example.com/robotics'),
  ('Sample Chinese Students Association', 'Cultural', 'Cultural festivals, language exchange and social nights open to all students.', '1CC', 'csa@example.com', 'https://example.com/csa'),
  ('Sample Indian Society', 'Cultural', 'Celebrate festivals such as Diwali and Holi with food, dance and community events.', '1CC', 'indian@example.com', 'https://example.com/indian'),
  ('Sample Futsal Club', 'Sport', 'Weekly social futsal games and an entry in the inter-uni competition.', '10GR (Macquarie University Sport and Aquatic Centre)', 'futsal@example.com', 'https://example.com/futsal'),
  ('Sample Dance Society', 'Arts', 'Weekly classes in hip hop, contemporary and K-pop, with an end-of-semester showcase.', '27WW (Lotus Theatre)', 'dance@example.com', 'https://example.com/dance'),
  ('Sample Film and Media Society', 'Arts', 'Movie nights, short-film making and screenings of student work.', '21WW (Macquarie Theatre)', 'film@example.com', 'https://example.com/film'),
  ('Sample Business Society', 'Academic', 'Industry panels, case competitions and networking with employers.', '3IR', 'business@example.com', 'https://example.com/business'),
  ('Sample Volunteers Network', 'Social impact', 'Community volunteering, charity drives and fundraising for local causes.', '18WW (Service Connect)', 'volunteers@example.com', 'https://example.com/volunteers'),
  ('Sample Sustainability Collective', 'Social impact', 'Campus clean-ups, community garden and campaigns for a greener university.', '4WW', 'green@example.com', 'https://example.com/green'),
  ('Sample Board Games Club', 'Social', 'Casual board game and trading card nights. All skill levels welcome.', '1CC', 'games@example.com', 'https://example.com/games'),
  ('Sample Law Students Society', 'Academic', 'Mooting, careers nights and study groups for law students.', '17WW (Michael Kirby Building)', 'law@example.com', 'https://example.com/law'),
  ('Sample Pride Collective', 'Social', 'A welcoming space for LGBTQIA+ students and allies, with events and peer support.', '18WW (Service Connect)', 'pride@example.com', 'https://example.com/pride');

-- events.created_by must reference a real user, so the sample events are attached to
-- the first admin. Promote yourself first (see the end of schema.sql), then run this.
-- If no admin exists yet, this inserts nothing.
insert into public.events (society_id, title, category, event_date, event_time, building, description, created_by)
select s.id, e.title, e.category, e.event_date::date, e.event_time::time, e.building, e.description, a.id
from (values
  (null,                              'Sample Welcome BBQ',            'Social',   '2026-10-27', '12:00', '1CC',                          'Free sausage sizzle and live music on the lawn.'),
  (null,                              'Sample Careers Fair',           'Career',   '2026-10-28', '10:00', '3IR',                          'Meet graduate employers and pick up internship opportunities.'),
  (null,                              'Sample Study Skills Workshop',  'Academic', '2026-10-29', '14:00', '16MW (Waranara Library)',      'Exam preparation tips and time management strategies.'),
  ('Sample Film and Media Society',   'Sample Movie Night',            'Social',   '2026-10-30', '18:30', '21WW (Macquarie Theatre)',     'Student-run screening with popcorn provided.'),
  ('Sample Volunteers Network',       'Sample Volunteering Drive',     'Community','2026-11-03', '11:00', '18WW (Service Connect)',       'Sign up for local community volunteering projects.'),
  ('Sample Robotics Society', 'Sample Robot Build Night', 'Academic', '2026-10-27', '18:00', '16MW (Waranara Library)', 'Hands-on robot building. Parts provided, beginners welcome.'),
  ('Sample Chinese Students Association', 'Sample Mid-Autumn Lantern Night', 'Social', '2026-10-29', '17:30', '1CC', 'Lanterns, mooncakes and games on the lawn.'),
  ('Sample Indian Society', 'Sample Diwali Celebration', 'Social', '2026-11-05', '18:00', '1CC', 'Food, music and dance to celebrate the festival of lights.'),
  ('Sample Futsal Club', 'Sample Futsal Social Match', 'Social', '2026-10-28', '19:00', '10GR (Macquarie University Sport and Aquatic Centre)', 'Casual 5-a-side games. All skill levels welcome.'),
  ('Sample Dance Society', 'Sample Open Dance Class', 'Social', '2026-10-31', '16:00', '27WW (Lotus Theatre)', 'Try hip hop and K-pop with our instructors.'),
  ('Sample Business Society', 'Sample Industry Panel', 'Career', '2026-11-04', '17:00', '3IR', 'Hear from graduates working in consulting, finance and marketing.'),
  ('Sample Sustainability Collective', 'Sample Campus Clean-up', 'Community', '2026-11-01', '09:30', '4WW', 'Gloves and bags provided. Free breakfast for volunteers.'),
  ('Sample Board Games Club', 'Sample Board Games Night', 'Social', '2026-10-30', '19:00', '1CC', 'Bring a game or borrow ours. Snacks provided.'),
  ('Sample Law Students Society', 'Sample Moot Practice', 'Academic', '2026-11-02', '15:00', '17WW (Michael Kirby Building)', 'Practice your oral advocacy with feedback from senior students.'),
  ('Sample Pride Collective', 'Sample Pride Morning Tea', 'Community', '2026-11-06', '10:30', '18WW (Service Connect)', 'Tea, cake and a chat. Everyone is welcome.'),
  ('Sample Film and Media Society', 'Sample Short Film Workshop', 'Academic', '2026-11-07', '13:00', '21WW (Macquarie Theatre)', 'Plan and shoot a one-minute film on your phone.'),
  ('Sample Volunteers Network', 'Sample Charity Bake Sale', 'Community', '2026-11-09', '11:30', '18WW (Service Connect)', 'Cakes and cookies; all funds go to a local food bank.')
) as e(society_name, title, category, event_date, event_time, building, description)
left join public.societies s on s.name = e.society_name
cross join lateral (select id from public.profiles where role = 'admin' order by created_at limit 1) a;

-- Sample hashtags (run after the "Hashtags and event posters" block of schema.sql).
update public.societies s set hashtags = h.tags
from (values
  ('Sample Robotics Society', array['robotics','engineering','workshops']),
  ('Sample Chinese Students Association', array['culture','language','social']),
  ('Sample Indian Society', array['culture','festivals','food']),
  ('Sample Futsal Club', array['sport','futsal','social']),
  ('Sample Dance Society', array['dance','arts','performance']),
  ('Sample Film and Media Society', array['film','arts','movienights']),
  ('Sample Business Society', array['business','networking','careers']),
  ('Sample Volunteers Network', array['volunteering','charity','community']),
  ('Sample Sustainability Collective', array['sustainability','community','green']),
  ('Sample Board Games Club', array['boardgames','social','casual']),
  ('Sample Law Students Society', array['law','moot','careers']),
  ('Sample Pride Collective', array['pride','community','support'])
) as h(name, tags)
where s.name = h.name;
