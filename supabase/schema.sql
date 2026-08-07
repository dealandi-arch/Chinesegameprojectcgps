-- Wok Quest: pack content + admin role-governance schema.
-- Paste this whole file into the Supabase SQL editor and run it.
-- Also create a public Storage bucket named "pack-images" via
-- Dashboard -> Storage -> New bucket (Public: on).
--
-- RLS is enabled on every table below with NO policies (deny-all to
-- anon/authenticated). All reads and writes happen server-side through
-- Server Actions using the service-role admin client
-- (src/utils/supabase/admin.ts), which bypasses RLS, exactly like the
-- existing admin/page.tsx already does for auth.admin.listUsers.

-- ============================================================
-- packs: live, published content. Only ADMIN mutates directly.
-- ============================================================
create table public.packs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null default '',
  image_urls   text[] not null default '{}',
  version      integer not null default 1,
  created_by   uuid not null,
  updated_by   uuid not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.packs enable row level security;

-- ============================================================
-- pack_edit_requests: CO_ADMIN proposals pending ADMIN review.
-- pack_id null = proposal for a brand-new pack.
-- pack_id set  = proposal to edit an existing pack.
-- ============================================================
create table public.pack_edit_requests (
  id            uuid primary key default gen_random_uuid(),
  pack_id       uuid references public.packs(id) on delete cascade,
  base_version  integer,
  proposed_by   uuid not null,
  title         text not null,
  body          text not null default '',
  image_urls    text[] not null default '{}',
  status        text not null default 'PENDING'
                  check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by   uuid,
  review_note   text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);

create index pack_edit_requests_status_idx on public.pack_edit_requests (status);
create index pack_edit_requests_proposed_by_idx on public.pack_edit_requests (proposed_by);

alter table public.pack_edit_requests enable row level security;

-- ============================================================
-- role_votes: CO_ADMIN <-> ADMIN promotion/demotion votes.
-- ============================================================
create table public.role_votes (
  id              uuid primary key default gen_random_uuid(),
  target_user_id  uuid not null,
  direction       text not null check (direction in ('PROMOTE', 'DEMOTE')),
  required_count  integer not null check (required_count > 0),
  status          text not null default 'OPEN'
                    check (status in ('OPEN', 'PASSED', 'CANCELLED')),
  initiated_by    uuid not null,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);

-- Only one open vote per target user at a time.
create unique index role_votes_one_open_per_target
  on public.role_votes (target_user_id)
  where status = 'OPEN';

alter table public.role_votes enable row level security;

-- ============================================================
-- role_vote_ballots: one row per admin agreement.
-- ============================================================
create table public.role_vote_ballots (
  id         uuid primary key default gen_random_uuid(),
  vote_id    uuid not null references public.role_votes(id) on delete cascade,
  admin_id   uuid not null,
  created_at timestamptz not null default now(),
  unique (vote_id, admin_id)
);

alter table public.role_vote_ballots enable row level security;

-- ============================================================
-- RPC: cast_role_vote_ballot
-- Atomically inserts a ballot, checks the agreement threshold, and for
-- DEMOTE votes re-checks the live admin count from auth.users before
-- letting the vote pass, so it can never drop the admin count to zero.
-- ============================================================
create or replace function public.cast_role_vote_ballot(
  p_vote_id uuid,
  p_admin_id uuid
)
returns table(result text, target_user_id uuid, direction text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v role_votes%rowtype;
  ballot_count integer;
  admin_count integer;
begin
  select * into v from role_votes where id = p_vote_id for update;
  if not found then
    raise exception 'vote_not_found';
  end if;

  if v.status <> 'OPEN' then
    return query select v.status, v.target_user_id, v.direction;
    return;
  end if;

  begin
    insert into role_vote_ballots (vote_id, admin_id) values (p_vote_id, p_admin_id);
  exception when unique_violation then
    raise exception 'already_voted';
  end;

  select count(*) into ballot_count from role_vote_ballots where vote_id = p_vote_id;

  if ballot_count < v.required_count then
    return query select 'OPEN'::text, v.target_user_id, v.direction;
    return;
  end if;

  if v.direction = 'DEMOTE' then
    select count(*) into admin_count
      from auth.users
      where (raw_app_meta_data->>'role') = 'ADMIN';

    if admin_count <= 1 then
      update role_votes set status = 'CANCELLED', resolved_at = now() where id = p_vote_id;
      raise exception 'last_admin';
    end if;
  end if;

  update role_votes set status = 'PASSED', resolved_at = now() where id = p_vote_id;
  return query select 'PASSED'::text, v.target_user_id, v.direction;
end;
$$;

-- ============================================================
-- RPC: approve_pack_edit_request
-- Atomically applies an approved proposal to `packs`, with an
-- optimistic-concurrency check against base_version.
-- ============================================================
create or replace function public.approve_pack_edit_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_force boolean default false
)
returns table(result text, pack_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  req pack_edit_requests%rowtype;
  cur_version integer;
  new_pack_id uuid;
begin
  select * into req from pack_edit_requests where id = p_request_id for update;
  if not found then
    raise exception 'request_not_found';
  end if;
  if req.status <> 'PENDING' then
    raise exception 'already_reviewed';
  end if;

  if req.pack_id is null then
    insert into packs (title, body, image_urls, created_by, updated_by)
      values (req.title, req.body, req.image_urls, req.proposed_by, p_reviewer_id)
      returning id into new_pack_id;
  else
    select version into cur_version from packs where id = req.pack_id for update;
    if cur_version is null then
      raise exception 'pack_not_found';
    end if;
    if cur_version <> req.base_version and not p_force then
      raise exception 'version_conflict';
    end if;

    update packs
      set title = req.title,
          body = req.body,
          image_urls = req.image_urls,
          version = version + 1,
          updated_by = p_reviewer_id,
          updated_at = now()
      where id = req.pack_id;
    new_pack_id := req.pack_id;
  end if;

  update pack_edit_requests
    set status = 'APPROVED', reviewed_by = p_reviewer_id, reviewed_at = now()
    where id = p_request_id;

  return query select 'approved', new_pack_id;
end;
$$;
