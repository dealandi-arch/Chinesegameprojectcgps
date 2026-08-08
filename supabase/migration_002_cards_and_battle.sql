-- Wok Quest: migration 002 -- pack -> card rename + battle stats.
-- Paste this into the Supabase SQL editor AFTER supabase/schema.sql has
-- already been run. Purely additive/renaming: no rows are dropped or
-- truncated, so every existing pack (now a "card") and its images survive.
--
-- Do NOT rename the "pack-images" Storage bucket. Existing public URLs
-- already stored in image_urls encode that bucket name in their path;
-- renaming the bucket would 404 every previously uploaded image. The
-- bucket keeps its original name -- only UI copy calls its contents
-- "card images".

-- ============================================================
-- 1. Rename tables/columns/indexes: packs -> cards
-- ============================================================
alter table public.packs rename to cards;
alter table public.pack_edit_requests rename to card_edit_requests;
alter table public.card_edit_requests rename column pack_id to card_id;

alter index pack_edit_requests_status_idx rename to card_edit_requests_status_idx;
alter index pack_edit_requests_proposed_by_idx rename to card_edit_requests_proposed_by_idx;

-- ============================================================
-- 2. New battle-stat columns on cards (the live/published table)
-- ============================================================
alter table public.cards
  add column attack    integer not null default 0,
  add column hp        integer not null default 1,
  add column cost      integer not null default 0,
  add column card_type text    not null default '',
  add column abilities jsonb   not null default '[]'::jsonb;

alter table public.cards
  add constraint cards_attack_nonnegative check (attack >= 0),
  add constraint cards_hp_positive check (hp > 0),
  add constraint cards_cost_nonnegative check (cost >= 0),
  add constraint cards_abilities_is_array check (jsonb_typeof(abilities) = 'array');

-- ============================================================
-- 3. Same battle-stat columns on card_edit_requests: a proposal must
--    carry the proposed stat values too, mirroring title/body already
--    stored there.
-- ============================================================
alter table public.card_edit_requests
  add column attack    integer not null default 0,
  add column hp        integer not null default 1,
  add column cost      integer not null default 0,
  add column card_type text    not null default '',
  add column abilities jsonb   not null default '[]'::jsonb;

alter table public.card_edit_requests
  add constraint card_edit_requests_attack_nonnegative check (attack >= 0),
  add constraint card_edit_requests_hp_positive check (hp > 0),
  add constraint card_edit_requests_cost_nonnegative check (cost >= 0),
  add constraint card_edit_requests_abilities_is_array check (jsonb_typeof(abilities) = 'array');

-- ============================================================
-- 4. Replace the approval RPC under its new name, copying the new
--    stat fields across whenever a proposal is approved.
-- ============================================================
drop function if exists public.approve_pack_edit_request(uuid, uuid, boolean);

create or replace function public.approve_card_edit_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_force boolean default false
)
returns table(result text, card_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  req card_edit_requests%rowtype;
  cur_version integer;
  new_card_id uuid;
begin
  select * into req from card_edit_requests where id = p_request_id for update;
  if not found then
    raise exception 'request_not_found';
  end if;
  if req.status <> 'PENDING' then
    raise exception 'already_reviewed';
  end if;

  if req.card_id is null then
    insert into cards (title, body, image_urls, attack, hp, cost, card_type, abilities, created_by, updated_by)
      values (req.title, req.body, req.image_urls, req.attack, req.hp, req.cost, req.card_type, req.abilities, req.proposed_by, p_reviewer_id)
      returning id into new_card_id;
  else
    select version into cur_version from cards where id = req.card_id for update;
    if cur_version is null then
      raise exception 'card_not_found';
    end if;
    if cur_version <> req.base_version and not p_force then
      raise exception 'version_conflict';
    end if;

    update cards
      set title = req.title,
          body = req.body,
          image_urls = req.image_urls,
          attack = req.attack,
          hp = req.hp,
          cost = req.cost,
          card_type = req.card_type,
          abilities = req.abilities,
          version = version + 1,
          updated_by = p_reviewer_id,
          updated_at = now()
      where id = req.card_id;
    new_card_id := req.card_id;
  end if;

  update card_edit_requests
    set status = 'APPROVED', reviewed_by = p_reviewer_id, reviewed_at = now()
    where id = p_request_id;

  return query select 'approved', new_card_id;
end;
$$;
