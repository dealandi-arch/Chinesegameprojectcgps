-- Wok Quest: migration 007 -- chat (staff, global, in-battle).
-- Run after migration_004_online_battles.sql (needs the battles table for
-- the channel_id foreign key).
--
-- One table with a channel discriminator instead of three near-identical
-- tables. GLOBAL and STAFF are singleton channels (channel_id null);
-- BATTLE messages reference a specific battles.id.

create table public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  channel_type text not null check (channel_type in ('GLOBAL', 'STAFF', 'BATTLE')),
  channel_id   uuid references public.battles(id) on delete cascade,
  sender_id    uuid not null,
  body         text not null check (char_length(body) between 1 and 500),
  created_at   timestamptz not null default now()
);

create index chat_messages_channel_idx on public.chat_messages (channel_type, channel_id, created_at);

alter table public.chat_messages enable row level security;
-- No policies -- service-role only, same deny-all pattern as every other table.
