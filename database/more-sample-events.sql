-- Adds more sample events for the Actuarial Students Society, 9-13 Nov 2026, so the Calendar list looks full.
-- Run once in the Supabase SQL editor. Safe to run again (skips titles that already exist).
-- Log in as a user who follows (or leads) Actuarial Students Society to see them.

insert into public.events (society_id, title, category, event_date, event_time, building, description)
select s.id, v.title, v.category, v.event_date::date, v.event_time::time, v.building, v.description
from public.societies s
cross join (values
  ('Sample Coffee Catch-up',      'Social',   '2026-11-09', '09:30', '3 Innovation Road',                      'Free coffee and a chat before your first class.'),
  ('Sample Trivia Night',         'Social',   '2026-11-09', '18:30', '1 Central Courtyard',                    'Team trivia with snacks and small prizes.'),
  ('Sample Exam Revision Session','Study',    '2026-11-10', '14:00', '16 Macquarie Walk (Waranara Library)',   'Bring your questions for a group revision session.'),
  ('Sample Industry Panel',       'Careers',  '2026-11-11', '17:30', '3 Innovation Road',                      'Hear from graduates working in insurance and finance.'),
  ('Sample End of Semester Picnic','Social',  '2026-11-12', '12:30', '1 Central Courtyard',                    'Bring a friend and relax on the lawn.'),
  ('Sample Resume Workshop',      'Careers',  '2026-11-13', '11:00', '3 Innovation Road',                      'Get feedback on your resume from senior students.')
) as v(title, category, event_date, event_time, building, description)
where s.name = 'Actuarial Students Society'
  and not exists (select 1 from public.events e where e.title = v.title);
