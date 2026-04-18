-- Remove "one diary per author per day" constraint for existing databases.
-- Execute with:
-- psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_remove_diary_daily_limit.sql

do $$
declare
  constraint_name text;
begin
  select con.conname
  into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'diary_entries'
    and con.contype = 'u'
    and pg_get_constraintdef(con.oid) like 'UNIQUE (couple_id, author_id, entry_date)%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.diary_entries drop constraint %I', constraint_name);
  end if;
end;
$$;
