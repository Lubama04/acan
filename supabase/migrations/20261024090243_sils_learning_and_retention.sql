-- SILS phase 7: admins may PROPOSE detection rules, which are always created disabled.
-- Activation is a separate, explicit human action (detection_rules_update_admin).
create policy detection_rules_insert_proposal on public.detection_rules for insert to authenticated
  with check ((select private.is_admin()) and enabled = false and proposed_by = 'system');

-- Retention announced in the privacy policy: security events kept 12 months.
create or replace function private.purge_expired_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.leads where created_at < now() - interval '24 months' and status in ('lost', 'archived', 'new');
  delete from public.contact_messages where created_at < now() - interval '12 months';
  delete from public.newsletter_subscribers where status = 'unsubscribed' and created_at < now() - interval '1 month';
  delete from public.newsletter_subscribers where status = 'pending' and created_at < now() - interval '30 days';
  delete from public.ad_events where created_at < now() - interval '13 months';
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.blocked_entities where lifted_at is not null and lifted_at < now() - interval '6 months';
  delete from public.security_events where created_at < now() - interval '12 months';
end;
$$;
revoke all on function private.purge_expired_data() from public;
