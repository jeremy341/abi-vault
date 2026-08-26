create or replace view public.transparency_goal_progress
with (security_invoker = false)
as
select
  goal.id,
  goal.organization_id,
  goal.title,
  goal.target_amount_minor,
  goal.deadline,
  goal.status,
  goal.visibility,
  coalesce(sum(contribution.allocated_amount_minor), 0)::bigint as saved_amount_minor
from public.fundraising_goals goal
left join public.goal_contributions contribution on contribution.goal_id = goal.id
where goal.organization_id = app_private.current_organization_id()
  and goal.visibility = 'students'
  and goal.status <> 'archived'
group by goal.id;

revoke all on public.transparency_goal_progress from anon, authenticated;
grant select on public.transparency_goal_progress to authenticated;
