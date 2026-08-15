-- Wok Quest: migration 009 -- info slideshow content.
-- Run after migration_008_chat_message_length.sql.
--
-- Adds a "slides" content type for the public /info page (a slideshow of
-- admin-authored info, separate from battle cards). Admins edit slides
-- directly; co-admins can only propose edits, which need one admin's
-- approval -- the exact same governance shape already used for cards.
-- Reuses the existing "pack-images" storage bucket (already public) rather
-- than creating a new one.

create table public.slides (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null default '',
  image_urls   text[] not null default '{}',
  order_index  integer not null default 0,
  version      integer not null default 1,
  created_by   uuid not null,
  updated_by   uuid not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index slides_order_idx on public.slides (order_index, title);
alter table public.slides enable row level security;
-- No policies -- service-role only, same deny-all pattern as every other table.

create table public.slide_edit_requests (
  id            uuid primary key default gen_random_uuid(),
  slide_id      uuid references public.slides(id) on delete cascade,
  base_version  integer,
  proposed_by   uuid not null,
  title         text not null,
  body          text not null default '',
  image_urls    text[] not null default '{}',
  order_index   integer not null default 0,
  status        text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  reviewed_by   uuid,
  review_note   text,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index slide_edit_requests_status_idx on public.slide_edit_requests (status);
create index slide_edit_requests_proposed_by_idx on public.slide_edit_requests (proposed_by);
alter table public.slide_edit_requests enable row level security;

-- RPC: approve a slide edit request atomically, with the same
-- optimistic-concurrency check used by approve_card_edit_request.
create or replace function public.approve_slide_edit_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_force boolean default false
)
returns table(result text, slide_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  req slide_edit_requests%rowtype;
  cur_version integer;
  new_slide_id uuid;
begin
  select * into req from slide_edit_requests where id = p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if req.status <> 'PENDING' then raise exception 'already_reviewed'; end if;

  if req.slide_id is null then
    insert into slides (title, body, image_urls, order_index, created_by, updated_by)
      values (req.title, req.body, req.image_urls, req.order_index, req.proposed_by, p_reviewer_id)
      returning id into new_slide_id;
  else
    select version into cur_version from slides where id = req.slide_id for update;
    if cur_version is null then raise exception 'slide_not_found'; end if;
    if cur_version <> req.base_version and not p_force then raise exception 'version_conflict'; end if;

    update slides
      set title = req.title, body = req.body, image_urls = req.image_urls,
          order_index = req.order_index, version = version + 1,
          updated_by = p_reviewer_id, updated_at = now()
      where id = req.slide_id;
    new_slide_id := req.slide_id;
  end if;

  update slide_edit_requests set status = 'APPROVED', reviewed_by = p_reviewer_id, reviewed_at = now()
    where id = p_request_id;

  return query select 'approved', new_slide_id;
end;
$$;
