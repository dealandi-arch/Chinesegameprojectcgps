-- Wok Quest: migration 006 -- "No" votes on role votes.
-- Run after migration_002_cards_and_battle.sql (needs role_votes/
-- role_vote_ballots to already exist).
--
-- A ballot now carries a value: +1 for "Agree", -1 for "No". A vote passes
-- once the NET score (sum of all ballot values) reaches required_count,
-- rather than a raw agreement count -- so a "No" vote reduces the running
-- total by 1, making the vote need one more "Agree" to make up for it.

alter table public.role_vote_ballots
  add column value integer not null default 1;

alter table public.role_vote_ballots
  add constraint role_vote_ballots_value_valid check (value in (1, -1));

drop function if exists public.cast_role_vote_ballot(uuid, uuid);

create or replace function public.cast_role_vote_ballot(
  p_vote_id uuid,
  p_admin_id uuid,
  p_value integer default 1
)
returns table(result text, target_user_id uuid, direction text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v role_votes%rowtype;
  net_score integer;
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
    insert into role_vote_ballots (vote_id, admin_id, value) values (p_vote_id, p_admin_id, p_value);
  exception when unique_violation then
    raise exception 'already_voted';
  end;

  select coalesce(sum(value), 0) into net_score from role_vote_ballots where vote_id = p_vote_id;

  if net_score < v.required_count then
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
