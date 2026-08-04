-- IIML Connect · Lost & Found Portal (EPIC-03) · MVP schema
-- 7 tables per PRD Section 2.5. Identity (name/phone/email) is NOT duplicated
-- here — reporter_id / finder_id / custodian_id / approver_id / claimant_id /
-- assignee ids all reference auth.users(id); Team 1's `profiles` table is the
-- source of truth for display identity and is joined by the API layer, not
-- by this schema.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- lost_report
-- ---------------------------------------------------------------------------
create table lost_report (
  id                  uuid primary key default gen_random_uuid(),
  reporter_id         uuid not null references auth.users(id),
  category            text not null,
  description         text not null,
  last_seen_location  text not null,
  lost_date           date not null,
  photo_url           text, -- nullable: losers-without-photos is a first-class path (AC-1)
  sensitivity_tier    smallint not null check (sensitivity_tier between 1 and 3),
  status              text not null default 'open'
                       check (status in ('open','matched','resolved','archived')),
  created_at          timestamptz not null default now(),
  -- FTS source: category + description + last_seen_location (Section 2.5)
  search_vector       tsvector generated always as (
                         to_tsvector('english',
                           coalesce(category,'') || ' ' ||
                           coalesce(description,'') || ' ' ||
                           coalesce(last_seen_location,'')
                         )
                       ) stored
);

create index idx_lost_report_search   on lost_report using gin (search_vector);
create index idx_lost_report_status   on lost_report (status);
create index idx_lost_report_category on lost_report (category);
create index idx_lost_report_tier     on lost_report (sensitivity_tier);
create index idx_lost_report_reporter on lost_report (reporter_id);

-- ---------------------------------------------------------------------------
-- found_report
-- ---------------------------------------------------------------------------
create table found_report (
  id                  uuid primary key default gen_random_uuid(),
  finder_id           uuid not null references auth.users(id),
  category            text not null,
  description         text not null,
  photo_url           text not null, -- required at submit time (AC-2)
  contents_withheld   boolean not null default false,
  pickup_location     text not null default 'Central Lost & Found Room',
  sensitivity_tier    smallint not null check (sensitivity_tier between 1 and 3),
  status              text not null default 'available'
                       check (status in ('available','matched','resolved','archived')),
  created_at          timestamptz not null default now(),
  search_vector       tsvector generated always as (
                         to_tsvector('english',
                           coalesce(category,'') || ' ' ||
                           coalesce(description,'') || ' ' ||
                           coalesce(pickup_location,'')
                         )
                       ) stored
);

create index idx_found_report_search   on found_report using gin (search_vector);
create index idx_found_report_status   on found_report (status);
create index idx_found_report_category on found_report (category);
create index idx_found_report_tier     on found_report (sensitivity_tier);
create index idx_found_report_finder   on found_report (finder_id);

-- ---------------------------------------------------------------------------
-- desk_checkin — physical intake record, distinct from the finder's app report
-- ---------------------------------------------------------------------------
create table desk_checkin (
  id                uuid primary key default gen_random_uuid(),
  found_report_id   uuid references found_report(id), -- nullable: intake can precede/lack an app report
  custodian_id      uuid not null references auth.users(id),
  item_label        text not null,
  received_at       timestamptz not null default now(),
  storage_ref       text
);

create index idx_desk_checkin_found_report on desk_checkin (found_report_id);

-- ---------------------------------------------------------------------------
-- match_candidate — only state='queued' (score >= threshold) reaches the
-- custodian queue; 'proposed' rows are below-threshold and never surfaced.
-- ---------------------------------------------------------------------------
create table match_candidate (
  id                uuid primary key default gen_random_uuid(),
  lost_report_id    uuid not null references lost_report(id),
  found_report_id   uuid not null references found_report(id),
  score             numeric not null,
  signals           jsonb not null default '{}'::jsonb,
  state             text not null default 'proposed'
                     check (state in ('proposed','queued','confirmed','rejected')),
  created_at        timestamptz not null default now(),
  unique (lost_report_id, found_report_id)
);

create index idx_match_candidate_state on match_candidate (state);
create index idx_match_candidate_lost  on match_candidate (lost_report_id);
create index idx_match_candidate_found on match_candidate (found_report_id);

-- ---------------------------------------------------------------------------
-- confirmation — every custodian confirm/reject decision, logged
-- ---------------------------------------------------------------------------
create table confirmation (
  id                   uuid primary key default gen_random_uuid(),
  match_candidate_id   uuid not null references match_candidate(id),
  custodian_id         uuid not null references auth.users(id),
  decision             text not null check (decision in ('confirm','reject')),
  decided_at           timestamptz not null default now()
);

create index idx_confirmation_candidate on confirmation (match_candidate_id);

-- ---------------------------------------------------------------------------
-- handover — timestamp + approver mandatory (AC-8, AC-9); claimant_id
-- nullable in MVP (FR-4.5 "capture claimant identity" is Could / post-MVP)
-- ---------------------------------------------------------------------------
create table handover (
  id                uuid primary key default gen_random_uuid(),
  found_report_id   uuid not null references found_report(id),
  claimant_id       uuid references auth.users(id),
  approver_id       uuid not null references auth.users(id),
  proof_type        text not null,
  approved_at       timestamptz not null default now()
);

create index idx_handover_found_report on handover (found_report_id);

-- ---------------------------------------------------------------------------
-- recognition — basic finder badge on resolution
-- ---------------------------------------------------------------------------
create table recognition (
  id            uuid primary key default gen_random_uuid(),
  finder_id     uuid not null references auth.users(id),
  badge_type    text not null,
  awarded_at    timestamptz not null default now()
);

create index idx_recognition_finder on recognition (finder_id);

-- ---------------------------------------------------------------------------
-- RLS: enabled with no policies on every table. service_role (used by the
-- NestJS backend) bypasses RLS by default, so the API retains full access.
-- No anon/authenticated policies are defined because the mobile client talks
-- to these tables only through the RBAC-guarded NestJS API, never directly.
-- ---------------------------------------------------------------------------
alter table lost_report    enable row level security;
alter table found_report   enable row level security;
alter table desk_checkin   enable row level security;
alter table match_candidate enable row level security;
alter table confirmation   enable row level security;
alter table handover       enable row level security;
alter table recognition    enable row level security;
-- Lost & Found evidence photo storage.
--
-- Path convention (enforced by the API when it issues upload paths, not by
-- Postgres): {sensitivity_tier}/{lost|found}/{report_id}-{filename}
--   e.g. 1/found/8f2b.../photo.jpg   3/lost/91ac.../photo.jpg
--
-- The tier segment is what the SELECT policies below key on, so that
-- Tier-3 photos are restricted to custodian/admin at the storage layer
-- itself (defense in depth on top of the API's own tier check / FR-2.3,
-- TS-4). Non-tier-3 objects are readable by any authenticated app user
-- since they are "publicly browsable" within the app (Section 7).
--
-- ASSUMPTION (flag to Team 1 / Raghav): the custodian/admin role claim is
-- read from either a top-level `role` claim or `app_metadata.role` on the
-- Supabase JWT. Team 1 owns Auth/RBAC (Section 3) — confirm the exact claim
-- location once their auth hook is in place and adjust the coalesce() below
-- if needed. This does not block MVP build since the API's own RolesGuard
-- (apps/api) is the authoritative RBAC check; this policy is a backstop.

insert into storage.buckets (id, name, public)
values ('lost-found-photos', 'lost-found-photos', false)
on conflict (id) do nothing;

create policy "lf_photos_upload_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'lost-found-photos');

create policy "lf_photos_read_tier1_tier2"
on storage.objects for select
to authenticated
using (
  bucket_id = 'lost-found-photos'
  and (storage.foldername(name))[1] in ('1', '2')
);

create policy "lf_photos_read_tier3_custodian_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'lost-found-photos'
  and (storage.foldername(name))[1] = '3'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') in ('custodian', 'admin')
);

create policy "lf_photos_owner_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'lost-found-photos' and owner = auth.uid());
-- Composite match score for a (lost_report, found_report) pair, computed in
-- Postgres so text matching stays on Postgres FTS only (no app-side text
-- similarity reimplementation, no external search service — Section 2 /
-- Maintainability NFR). Called from the NestJS MatchingService via
-- supabase.rpc('match_score', { p_lost_id, p_found_id }).
--
-- Weights: text 0.55, exact-category match 0.15, location word-overlap 0.15,
-- time plausibility 0.15. Returns jsonb so the API can persist both the
-- total score and the signal breakdown into match_candidate.signals
-- (Section 2.5) without a second query.
create or replace function match_score(p_lost_id uuid, p_found_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_lost lost_report%rowtype;
  v_found found_report%rowtype;
  v_text_score numeric := 0;
  v_location_score numeric := 0;
  v_time_score numeric := 0;
  v_category_match boolean := false;
  v_total numeric := 0;
begin
  select * into v_lost from lost_report where id = p_lost_id;
  select * into v_found from found_report where id = p_found_id;

  if v_lost.id is null or v_found.id is null then
    return jsonb_build_object('score', 0, 'text_score', 0, 'location_score', 0, 'time_score', 0, 'category_match', false);
  end if;

  -- Text similarity: rank each side's tsvector against the other's plain
  -- text query, symmetric average, soft-normalized into [0,1].
  v_text_score := (
    coalesce(ts_rank_cd(v_lost.search_vector, plainto_tsquery('english', v_found.category || ' ' || v_found.description)), 0)
    +
    coalesce(ts_rank_cd(v_found.search_vector, plainto_tsquery('english', v_lost.category || ' ' || v_lost.description)), 0)
  ) / 2.0;
  v_text_score := least(v_text_score / 0.5, 1.0);

  v_category_match := lower(trim(v_lost.category)) = lower(trim(v_found.category));

  -- Location heuristic: does the found pickup/description text overlap with
  -- the lost item's last-seen location text (FR-3.1's "location heuristic").
  v_location_score := coalesce(
    ts_rank_cd(
      to_tsvector('english', coalesce(v_found.pickup_location, '')),
      plainto_tsquery('english', coalesce(v_lost.last_seen_location, ''))
    ), 0
  );
  v_location_score := least(v_location_score / 0.3, 1.0);

  -- Time plausibility: a found report can only plausibly match a lost
  -- report if it was logged on/after the lost date (FR-3.1).
  if v_found.created_at::date >= v_lost.lost_date then
    v_time_score := 1.0;
  else
    v_time_score := 0.0;
  end if;

  v_total := (0.55 * v_text_score)
           + (0.15 * (case when v_category_match then 1.0 else 0.0 end))
           + (0.15 * v_location_score)
           + (0.15 * v_time_score);

  return jsonb_build_object(
    'score', greatest(0, least(1, v_total)),
    'text_score', v_text_score,
    'location_score', v_location_score,
    'time_score', v_time_score,
    'category_match', v_category_match
  );
end;
$$;
-- AC-12 requires purging "~30 days after status=resolved", which is not
-- computable from `created_at` alone (that's the report's creation time,
-- not its resolution time). Section 2.5's table doesn't list a
-- resolved_at column, so this is a necessary, minimal addition — not a
-- silent schema deviation — to make the retention job's timing correct.
-- Still 7 tables; one nullable column added to two of them.

alter table lost_report add column resolved_at timestamptz;
alter table found_report add column resolved_at timestamptz;
-- Discovered while running this locally: this Supabase Postgres image does
-- not auto-grant CRUD privileges to anon/authenticated/service_role on new
-- tables in the public schema (they only inherited TRUNCATE/REFERENCES/
-- TRIGGER by default) — a separate mechanism from RLS. `service_role`
-- already has the bypassrls role attribute (confirmed: rolbypassrls=t), so
-- RLS itself was never the problem; without an explicit GRANT, Postgres
-- rejects the query before RLS is even evaluated ("permission denied for
-- table", not "violates row-level security policy").
--
-- Only service_role needs real access — the backend is the sole caller
-- (Section 2 architecture: "the mobile client never queries these tables
-- directly, only through the RBAC-guarded NestJS API"). anon/authenticated
-- are intentionally left without SELECT/INSERT/UPDATE/DELETE so a stray
-- direct client query still fails closed.
grant select, insert, update, delete on
  lost_report, found_report, desk_checkin, match_candidate, confirmation, handover, recognition
to service_role;

-- Covers any future migration that adds a table without remembering this grant.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

-- Defensive: function privileges are a separate grant surface from table
-- privileges, and this Postgres image already surprised us once on tables.
grant execute on function match_score(uuid, uuid) to service_role;
