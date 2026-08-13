-- Wok Quest: migration 008 -- allow longer chat messages.
-- Run after migration_007_chat.sql.

alter table public.chat_messages drop constraint chat_messages_body_check;

alter table public.chat_messages
  add constraint chat_messages_body_check check (char_length(body) between 1 and 4000);
