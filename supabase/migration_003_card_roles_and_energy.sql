-- Wok Quest: migration 003 -- card roles (Attacker/Support/Energy), Pokemon-style
-- energy attachment, and a member -> co-admin promotion vote.
-- Run after migration_002_cards_and_battle.sql.
--
-- Section 4 (seed cards) requires at least one ADMIN account to already exist --
-- its created_by/updated_by subquery will fail the NOT NULL constraint otherwise.
-- If you don't have an admin yet, run sections 1-3 now and section 4 later.

-- ============================================================
-- 1. Card roles: Attacker (has attacks) / Support (has one effect) / Energy
--    (attaches to an active attacker). Replaces flat attack/cost columns --
--    attack damage/cost now live per-ability inside the existing `abilities`
--    jsonb column instead.
-- ============================================================
alter table public.cards
  add column role text not null default 'ATTACKER',
  add column energy_amount integer not null default 1;

alter table public.cards
  add constraint cards_role_valid check (role in ('ATTACKER', 'SUPPORT', 'ENERGY')),
  add constraint cards_energy_amount_positive check (energy_amount > 0);

alter table public.cards drop constraint cards_attack_nonnegative;
alter table public.cards drop constraint cards_cost_nonnegative;
alter table public.cards drop column attack;
alter table public.cards drop column cost;

alter table public.card_edit_requests
  add column role text not null default 'ATTACKER',
  add column energy_amount integer not null default 1;

alter table public.card_edit_requests
  add constraint card_edit_requests_role_valid check (role in ('ATTACKER', 'SUPPORT', 'ENERGY')),
  add constraint card_edit_requests_energy_amount_positive check (energy_amount > 0);

alter table public.card_edit_requests drop constraint card_edit_requests_attack_nonnegative;
alter table public.card_edit_requests drop constraint card_edit_requests_cost_nonnegative;
alter table public.card_edit_requests drop column attack;
alter table public.card_edit_requests drop column cost;

-- ============================================================
-- 2. approve_card_edit_request now copies role/energy_amount instead of
--    attack/cost.
-- ============================================================
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
    insert into cards (title, body, image_urls, role, hp, energy_amount, card_type, abilities, created_by, updated_by)
      values (req.title, req.body, req.image_urls, req.role, req.hp, req.energy_amount, req.card_type, req.abilities, req.proposed_by, p_reviewer_id)
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
          role = req.role,
          hp = req.hp,
          energy_amount = req.energy_amount,
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

-- ============================================================
-- 3. Governance: widen role_votes.direction for a member -> co-admin
--    promotion vote (2 agreements, same shared admin/co-admin vote pool).
-- ============================================================
alter table public.role_votes drop constraint if exists role_votes_direction_check;
alter table public.role_votes add constraint role_votes_direction_check
  check (direction in ('PROMOTE', 'DEMOTE', 'PROMOTE_MEMBER'));

-- ============================================================
-- 4. Seed real cards -- 3 Attacker (Dumpling), 4 Support (Mala, one per
--    effect type), 2 Energy (Sauce). Requires an existing ADMIN account.
-- ============================================================
insert into public.cards (title, body, role, card_type, hp, energy_amount, abilities, created_by, updated_by)
values
  ('Xiao Long Bao',
   'Xiao long bao originated in Shanghai''s Nanxiang region in the 19th century and are famous for the hot, savory soup sealed inside a thin dough wrapper.',
   'ATTACKER', 'Dumpling', 60, 1,
   '[{"name":"Soup Burst","description":"Releases a burst of scalding broth.","damage":20,"energyCost":1},{"name":"Steamer Slam","description":"Crashes down with the weight of a bamboo steamer.","damage":40,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Potsticker',
   'Potstickers (guotie) are pan-fried on one side then steamed, giving them a crisp bottom and soft top -- a Northern Chinese specialty.',
   'ATTACKER', 'Dumpling', 50, 1,
   '[{"name":"Pan Sear","description":"A quick sizzling strike.","damage":15,"energyCost":1},{"name":"Crispy Crush","description":"Slams down with a crackling crust.","damage":35,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Wonton',
   'Cantonese wontons are typically filled with shrimp and pork and served in a light broth alongside noodles.',
   'ATTACKER', 'Dumpling', 45, 1,
   '[{"name":"Silk Wrap","description":"Wraps the foe in a delicate dough net.","damage":10,"energyCost":1},{"name":"Broth Splash","description":"A splash of scalding broth.","damage":25,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Mala Numbing Rush',
   'Sichuan peppercorns create the tingling "mala" (numbing-spicy) sensation central to Sichuan cuisine.',
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Numbing Rush","description":"Draw 2 extra cards.","effectType":"DRAW","magnitude":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Mala Broth Refill',
   'A rich Sichuan hot pot broth, simmered with chili oil, doubanjiang, and Sichuan peppercorns.',
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Broth Refill","description":"Heal 25 HP on your active card.","effectType":"HEAL","magnitude":25}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Mala Oil Drizzle',
   'Chili-infused Sichuan pepper oil, drizzled generously over noodles and dumplings alike.',
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Oil Drizzle","description":"Immediately attach 1 bonus energy.","effectType":"ADD_ENERGY","magnitude":1}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Mala Fire Boost',
   'An extra-fiery mala seasoning blend, said to double the intensity of the next bite.',
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Fire Boost","description":"Your next attack this turn deals +15 damage.","effectType":"BOOST_DAMAGE","magnitude":15}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Soy Sauce Energy',
   'Soy sauce is a fermented condiment made from soybeans, wheat, and salt -- a foundational seasoning in Chinese cooking.',
   'ENERGY', 'Sauce', 1, 1,
   '[]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ('Chili Oil Energy',
   'Chili oil infuses dried chilies and spices into hot oil, adding heat and aroma to countless dishes.',
   'ENERGY', 'Sauce', 1, 2,
   '[]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1));
