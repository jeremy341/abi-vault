update public.categories as category
set name = renamed.english_name
from (values
  ('Veranstaltung', 'Event'),
  ('Material', 'Supplies'),
  ('Sonstiges', 'Other'),
  ('Spenden', 'Donations')
) as renamed(german_name, english_name)
where category.name = renamed.german_name
  and not exists (
    select 1
    from public.categories existing
    where existing.organization_id = category.organization_id
      and existing.kind = category.kind
      and existing.name = renamed.english_name
  );
