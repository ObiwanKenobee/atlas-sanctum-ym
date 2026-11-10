-- Atlas Sanctum tenant-schema reconnaissance
-- READ ONLY: safe to run in the Supabase SQL Editor against the target project.
-- Do not paste secrets or row-level personal/beneficiary data into issue threads.
-- This script intentionally does not create, alter, insert, update, or delete objects.

-- 0. Confirm the key schemas and migration-history relation exist.
select
  to_regnamespace('public') as public_schema,
  to_regnamespace('auth') as auth_schema,
  to_regnamespace('storage') as storage_schema,
  to_regclass('auth.users') as auth_users_relation,
  to_regclass('supabase_migrations.schema_migrations') as migration_history_relation;

-- 1. Inventory likely Atlas domain tables.
select
  table_schema,
  table_name,
  table_type
from information_schema.tables
where table_schema in ('public', 'storage')
  and (
    table_name ilike '%org%'
    or table_name ilike '%member%'
    or table_name ilike '%portfolio%'
    or table_name ilike '%project%'
    or table_name ilike '%place%'
    or table_name ilike '%evidence%'
    or table_name ilike '%decision%'
    or table_name ilike '%action%'
    or table_name ilike '%outcome%'
    or table_name ilike '%field%'
    or table_name ilike '%water%'
  )
order by table_schema, table_name;

-- 2. Column definitions for the relevant tables (no row data).
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and (
    table_name ilike '%org%'
    or table_name ilike '%member%'
    or table_name ilike '%portfolio%'
    or table_name ilike '%project%'
    or table_name ilike '%place%'
    or table_name ilike '%evidence%'
    or table_name ilike '%decision%'
    or table_name ilike '%action%'
    or table_name ilike '%outcome%'
    or table_name ilike '%field%'
    or table_name ilike '%water%'
  )
order by table_name, ordinal_position;

-- 3. Primary keys, unique constraints, check constraints and foreign keys.
select
  ns.nspname as schema_name,
  tbl.relname as table_name,
  con.conname as constraint_name,
  case con.contype
    when 'p' then 'PRIMARY KEY'
    when 'u' then 'UNIQUE'
    when 'f' then 'FOREIGN KEY'
    when 'c' then 'CHECK'
    else con.contype::text
  end as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition,
  con.convalidated as is_validated
from pg_constraint con
join pg_class tbl on tbl.oid = con.conrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public'
  and (
    tbl.relname ilike '%org%'
    or tbl.relname ilike '%member%'
    or tbl.relname ilike '%portfolio%'
    or tbl.relname ilike '%project%'
    or tbl.relname ilike '%place%'
    or tbl.relname ilike '%evidence%'
    or tbl.relname ilike '%decision%'
    or tbl.relname ilike '%action%'
    or tbl.relname ilike '%outcome%'
    or tbl.relname ilike '%field%'
    or tbl.relname ilike '%water%'
  )
order by tbl.relname, con.contype, con.conname;

-- 4. RLS enabled/forced state and table owner.
select
  ns.nspname as schema_name,
  cls.relname as table_name,
  pg_get_userbyid(cls.relowner) as table_owner,
  cls.relrowsecurity as row_level_security_enabled,
  cls.relforcerowsecurity as row_level_security_forced
from pg_class cls
join pg_namespace ns on ns.oid = cls.relnamespace
where cls.relkind in ('r', 'p')
  and ns.nspname in ('public', 'storage')
  and (
    cls.relname ilike '%org%'
    or cls.relname ilike '%member%'
    or cls.relname ilike '%portfolio%'
    or cls.relname ilike '%project%'
    or cls.relname ilike '%place%'
    or cls.relname ilike '%evidence%'
    or cls.relname ilike '%decision%'
    or cls.relname ilike '%action%'
    or cls.relname ilike '%outcome%'
    or cls.relname ilike '%field%'
    or cls.relname ilike '%water%'
  )
order by ns.nspname, cls.relname;

-- 5. Every relevant policy, including USING and WITH CHECK expressions.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- 6. Effective table-level grants for application roles.
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('anon', 'authenticated', 'service_role', 'postgres')
order by table_schema, table_name, grantee, privilege_type;

-- 7. Indexes on likely tenant and relationship keys.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and (
    tablename ilike '%org%'
    or tablename ilike '%member%'
    or tablename ilike '%portfolio%'
    or tablename ilike '%project%'
    or tablename ilike '%place%'
    or tablename ilike '%evidence%'
    or tablename ilike '%decision%'
    or tablename ilike '%action%'
    or tablename ilike '%outcome%'
    or tablename ilike '%field%'
    or tablename ilike '%water%'
  )
order by tablename, indexname;

-- 8. Membership/authorization helper functions and their security settings.
select
  ns.nspname as schema_name,
  proc.proname as function_name,
  pg_get_function_identity_arguments(proc.oid) as arguments,
  pg_get_function_result(proc.oid) as return_type,
  proc.prosecdef as security_definer,
  proc.proconfig as function_settings,
  pg_get_functiondef(proc.oid) as definition
from pg_proc proc
join pg_namespace ns on ns.oid = proc.pronamespace
where ns.nspname in ('public', 'auth')
  and (
    proc.proname ilike '%member%'
    or proc.proname ilike '%organization%'
    or proc.proname ilike '%project%'
    or proc.proname ilike '%role%'
    or proc.proname ilike '%permission%'
    or proc.proname ilike '%access%'
  )
order by ns.nspname, proc.proname;

-- 9. Trigger definitions on relevant public tables.
select
  ns.nspname as schema_name,
  tbl.relname as table_name,
  trg.tgname as trigger_name,
  pg_get_triggerdef(trg.oid, true) as definition,
  trg.tgenabled as enabled_state
from pg_trigger trg
join pg_class tbl on tbl.oid = trg.tgrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where not trg.tgisinternal
  and ns.nspname = 'public'
  and (
    tbl.relname ilike '%org%'
    or tbl.relname ilike '%member%'
    or tbl.relname ilike '%portfolio%'
    or tbl.relname ilike '%project%'
    or tbl.relname ilike '%evidence%'
    or tbl.relname ilike '%decision%'
    or tbl.relname ilike '%action%'
    or tbl.relname ilike '%outcome%'
    or tbl.relname ilike '%field%'
    or tbl.relname ilike '%water%'
  )
order by tbl.relname, trg.tgname;

-- 10. Migration history, only if the standard Supabase history table exists.
-- Run this statement separately after confirming section 0 reports the relation.
-- select version, name from supabase_migrations.schema_migrations order by version;
