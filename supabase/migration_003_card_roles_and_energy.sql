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
-- 4. Seed real cards -- 3 Attacker (real Cantonese dim sum dumplings),
--    4 Support (Mala, one per effect type -- mala is genuinely Sichuan/
--    Chongqing in origin, not Cantonese, but is called out below for its
--    huge popularity in today's Hong Kong/Guangdong food scene rather than
--    a fabricated Cantonese origin), 2 Energy (real Cantonese/Hong Kong
--    condiments). Requires an existing ADMIN account. Text fields use
--    dollar-quoting ($t$...$t$) so apostrophes need no escaping.
--    image_urls is left empty -- no image-generation tool was available to
--    produce the "AI made pictures"; add real/AI images via the card
--    editor's upload field afterward.
-- ============================================================
insert into public.cards (title, body, role, card_type, hp, energy_amount, abilities, created_by, updated_by)
values
  ($t$Har Gow$t$,
   $t$Har gow (shrimp dumpling) is believed to have originated in a teahouse in Guangzhou's Xiguan district in the early 20th century. Known as one of the "four heavenly kings" of Cantonese dim sum, it's prized for its thin, pleated, translucent wrapper made from wheat and tapioca starch, which turns delicately pink around the shrimp filling when steamed.$t$,
   'ATTACKER', 'Dim Sum', 50, 1,
   '[{"name":"Pleated Wrap","description":"A swift jab from its delicately pleated shell.","damage":15,"energyCost":1},{"name":"Steamed Shrimp Burst","description":"Releases the succulent shrimp filling in a powerful burst.","damage":35,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Siu Mai$t$,
   $t$Siu mai is an open-topped dumpling of ground pork, shrimp, and mushroom wrapped in a thin egg-based wrapper. Its roots trace back to Hohhot in Inner Mongolia, but it was adopted and refined by Cantonese teahouses in Guangzhou and Hong Kong, becoming a dim sum staple often finished with a sliver of carrot or a dot of fish roe.$t$,
   'ATTACKER', 'Dim Sum', 55, 1,
   '[{"name":"Open-Top Slam","description":"Strikes with its signature open crown.","damage":18,"energyCost":1},{"name":"Golden Wrapper Crush","description":"Crushes down with the weight of its savory pork and shrimp filling.","damage":38,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Cantonese Wonton$t$,
   $t$Cantonese wontons are smaller and more delicate than their Northern Chinese counterparts, filled with shrimp and pork and traditionally served in a clear broth with thin egg noodles as wonton noodle soup -- a dish closely tied to Hong Kong's noodle shop culture since the mid-20th century.$t$,
   'ATTACKER', 'Dim Sum', 45, 1,
   '[{"name":"Silk Wrap","description":"Wraps the foe in a delicate dough net.","damage":12,"energyCost":1},{"name":"Broth Splash","description":"A splash of scalding clear broth.","damage":28,"energyCost":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Numbing Rush$t$,
   $t$Mala (numbing-spicy) flavor comes from Sichuan and Chongqing cuisine, built on the tingling "ma" of Sichuan peppercorns and the fiery "la" of dried chilies. In recent decades it has surged in popularity across Hong Kong and Guangdong through mala xiang guo stir-fry stalls, becoming a fixture of the modern Cantonese food scene despite its Sichuan roots.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Numbing Rush","description":"Draw 2 extra cards.","effectType":"DRAW","magnitude":2}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Broth Refill$t$,
   $t$Mala hot pot broth is simmered with doubanjiang, Sichuan peppercorns, dried chilies, and beef tallow. Originally a Chongqing street-food tradition, mala hot pot chains have spread rapidly through Hong Kong in recent years, now standing alongside traditional Cantonese hot pot as a favorite night out.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Broth Refill","description":"Heal 25 HP on your active card.","effectType":"HEAL","magnitude":25}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Oil Drizzle$t$,
   $t$Mala-infused chili oil, drizzled over noodles and dumplings, has become a common condiment on Hong Kong restaurant tables -- a Sichuan import so widely embraced that many diners now consider it a local staple.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Oil Drizzle","description":"Immediately attach 1 bonus energy.","effectType":"ADD_ENERGY","magnitude":1}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Mala Fire Boost$t$,
   $t$Bottled mala seasoning blends now line the shelves of Hong Kong wet markets and supermarkets, letting home cooks recreate Sichuan's signature numbing heat in their own Cantonese kitchens.$t$,
   'SUPPORT', 'Mala', 1, 1,
   '[{"name":"Fire Boost","description":"Your next attack this turn deals +15 damage.","effectType":"BOOST_DAMAGE","magnitude":15}]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$XO Sauce$t$,
   $t$XO sauce is a genuinely Cantonese invention, created by Hong Kong chefs in the early 1980s from dried scallops, dried shrimp, chili, and garlic. Its name evokes the luxury of XO cognac, despite containing no alcohol at all.$t$,
   'ENERGY', 'Sauce', 1, 1,
   '[]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1)),

  ($t$Chiu Chow Chili Oil$t$,
   $t$Chiu Chow (Teochew) chili oil is a beloved condiment from Hong Kong's Chiu Chow community, made by slow-infusing chili flakes, garlic, and shallots in oil. It's a fixture on tables across Hong Kong's noodle shops and dai pai dongs.$t$,
   'ENERGY', 'Sauce', 1, 2,
   '[]'::jsonb,
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1),
   (select id from auth.users where raw_app_meta_data->>'role' = 'ADMIN' limit 1));
