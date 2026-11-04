-- Gives the three sample events to the Actuarial Students Society, moves them to 9-11 Nov 2026
-- and expands their building codes so Get directions works.
-- Run once in the Supabase SQL editor. Safe to run again.

update public.events set
  society_id = (select id from public.societies where name = 'Actuarial Students Society' limit 1),
  event_date = case title
    when 'Sample Welcome BBQ' then date '2026-11-09'
    when 'Sample Careers Fair' then date '2026-11-10'
    when 'Sample Study Skills Workshop' then date '2026-11-11'
  end,
  building = case building
    when '1CC' then '1 Central Courtyard'
    when '3IR' then '3 Innovation Road'
    when '16MW (Waranara Library)' then '16 Macquarie Walk (Waranara Library)'
    else building
  end
where title in ('Sample Welcome BBQ', 'Sample Careers Fair', 'Sample Study Skills Workshop')
  and society_id is null;
