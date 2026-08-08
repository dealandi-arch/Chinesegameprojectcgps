-- Wok Quest: migration 004 -- online multiplayer battles (room codes).
-- Run after migration_003_card_roles_and_energy.sql.
--
-- `state` holds the full authoritative BattleState (both hands, full deck
-- order, everything) exactly as produced by src/lib/battle/engine.ts.
-- Redaction (hiding each side's hand from the opponent) happens only at
-- read time in src/lib/battle/redact.ts -- never at rest here.

create table public.battles (
  id          uuid primary key default gen_random_uuid(),
  join_code   text unique,
  status      text not null default 'WAITING' check (status in ('WAITING', 'ACTIVE', 'FINISHED')),
  host_id     uuid not null,
  guest_id    uuid,
  state       jsonb not null default '{}'::jsonb,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.battles enable row level security;
-- No policies -- service-role only, same deny-all pattern as cards/role_votes.
