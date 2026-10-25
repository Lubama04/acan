-- Ad events without a valid server-issued token (or cross-site clicks) are kept but flagged.
alter table public.ad_events drop constraint if exists ad_events_flag_reason_check,
  add constraint ad_events_flag_reason_check
  check (flag_reason in ('bot', 'repeat_click', 'ip_cap', 'session_cap', 'invalid_token'));
