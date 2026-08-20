-- ----------------------------------------------------------------------------
-- Content items can target multiple channels at once (e.g. the same post
-- going out on Instagram + Facebook together) instead of needing a separate
-- row per channel. `channel content_channel` becomes `channels
-- content_channel[]` — a plain array of the existing enum, not a join
-- table: channel is a small fixed set of tags on a content item, not an
-- entity with its own attributes, so a join table would be pure overhead
-- for zero benefit here.
-- ----------------------------------------------------------------------------
alter table content_items
  alter column channel type content_channel[] using array[channel];

alter table content_items rename column channel to channels;

alter table content_items
  add constraint content_items_channels_not_empty check (array_length(channels, 1) >= 1);
