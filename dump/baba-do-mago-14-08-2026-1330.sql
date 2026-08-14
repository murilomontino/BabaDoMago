--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.2

-- Started on 2026-08-14 16:30:36 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 33 (class 2615 OID 16498)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- TOC entry 20 (class 2615 OID 16392)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- TOC entry 31 (class 2615 OID 16578)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- TOC entry 30 (class 2615 OID 16567)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- TOC entry 10 (class 2615 OID 16390)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- TOC entry 9 (class 2615 OID 16559)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- TOC entry 34 (class 2615 OID 16546)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- TOC entry 25 (class 2615 OID 17627)
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- TOC entry 28 (class 2615 OID 16607)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- TOC entry 2 (class 3079 OID 16393)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 4 (class 3079 OID 16447)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 5 (class 3079 OID 16608)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- TOC entry 3 (class 3079 OID 16436)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1130 (class 1247 OID 16744)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- TOC entry 1154 (class 1247 OID 16885)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- TOC entry 1127 (class 1247 OID 16738)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1124 (class 1247 OID 16733)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1172 (class 1247 OID 16988)
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- TOC entry 1184 (class 1247 OID 17061)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1166 (class 1247 OID 16966)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1175 (class 1247 OID 16998)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1160 (class 1247 OID 16927)
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- TOC entry 1199 (class 1247 OID 17177)
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_realtime_admin;

--
-- TOC entry 1202 (class 1247 OID 17188)
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_realtime_admin;

--
-- TOC entry 1205 (class 1247 OID 17217)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_realtime_admin;

--
-- TOC entry 1208 (class 1247 OID 17220)
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_realtime_admin;

--
-- TOC entry 1211 (class 1247 OID 17223)
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_realtime_admin;

--
-- TOC entry 1238 (class 1247 OID 17408)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- TOC entry 472 (class 1255 OID 16544)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 472
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- TOC entry 393 (class 1255 OID 16715)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- TOC entry 469 (class 1255 OID 16543)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 469
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- TOC entry 476 (class 1255 OID 16542)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 476
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- TOC entry 466 (class 1255 OID 16551)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- TOC entry 4480 (class 0 OID 0)
-- Dependencies: 466
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- TOC entry 405 (class 1255 OID 16572)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
begin
    if not exists (
        select 1
        from pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- TOC entry 4482 (class 0 OID 0)
-- Dependencies: 405
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- TOC entry 371 (class 1255 OID 16553)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- TOC entry 4484 (class 0 OID 0)
-- Dependencies: 371
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- TOC entry 331 (class 1255 OID 16563)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- TOC entry 343 (class 1255 OID 16564)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- TOC entry 394 (class 1255 OID 16574)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- TOC entry 4513 (class 0 OID 0)
-- Dependencies: 394
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- TOC entry 388 (class 1255 OID 16665)
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- TOC entry 346 (class 1255 OID 16391)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- TOC entry 399 (class 1255 OID 17929)
-- Name: add_championship_event_goal(bigint, bigint, bigint, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	scorer public.championship_event_match_players%rowtype;
	assist public.championship_event_match_players%rowtype;
	goal public.championship_event_goals%rowtype;
	own_goal boolean;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	own_goal := coalesce(add_championship_event_goal.is_own_goal, false);

	select *
	into match
	from public.championship_event_matches m
	where m.id = add_championship_event_goal.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	select *
	into scorer
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.player_id = add_championship_event_goal.scorer_player_id;

	if scorer.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if own_goal then
		assist_player_id := null;
	end if;

	if add_championship_event_goal.assist_player_id is not null then
		select *
		into assist
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = add_championship_event_goal.assist_player_id;

		if assist.id is null then
			raise exception 'player not in match' using errcode = '23514';
		end if;

		if assist.team_id is distinct from scorer.team_id then
			raise exception 'assist not in team' using errcode = '23514';
		end if;
	end if;

	insert into public.championship_event_goals (
		match_id,
		event_id,
		scorer_player_id,
		assist_player_id,
		is_own_goal
	)
	values (
		match.id,
		event.id,
		scorer.player_id,
		add_championship_event_goal.assist_player_id,
		own_goal
	)
	returning * into goal;

	-- gol atualiza só a presença; jogador sobe no fim/exclusão da partida
	perform public.refresh_championship_event_attendance_stats(event.id);

	return jsonb_build_object(
		'id', goal.id,
		'match_id', goal.match_id,
		'event_id', goal.event_id,
		'scorer_player_id', goal.scorer_player_id,
		'assist_player_id', goal.assist_player_id,
		'is_own_goal', goal.is_own_goal,
		'created_at', goal.created_at
	);
end;
$$;


ALTER FUNCTION public.add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean) OWNER TO postgres;

--
-- TOC entry 459 (class 1255 OID 17750)
-- Name: add_championship_event_match(bigint, bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
	return public.start_championship_event_match(
		add_championship_event_match.event_id,
		add_championship_event_match.team_a_id,
		add_championship_event_match.team_b_id
	);
end;
$$;


ALTER FUNCTION public.add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) OWNER TO postgres;

--
-- TOC entry 360 (class 1255 OID 17841)
-- Name: add_championship_event_team(bigint, text, jsonb, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
	event public.championship_events%rowtype;
	normalized_color text;
	ids bigint[];
	current_player_id bigint;
	seen_players bigint[] := '{}';
	player public.championship_players%rowtype;
	new_team public.championship_event_teams%rowtype;
	next_sort smallint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized_color := lower(team_color);
	if normalized_color is not null and normalized_color !~ '^#[0-9a-f]{6}$' then
		raise exception 'invalid team color' using errcode = '23514';
	end if;

	if jsonb_typeof(player_ids) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into ids
	from jsonb_array_elements_text(player_ids) as elem;

	select *
	into event
	from public.championship_events e
	where e.id = add_championship_event_team.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if cardinality(ids) is null
		or cardinality(ids) = 0
		or cardinality(ids) > event.players_per_team then
		raise exception 'invalid team size' using errcode = '23514';
	end if;

	if add_championship_event_team.goalkeeper_id is distinct from 0
		and add_championship_event_team.goalkeeper_id <> all (ids) then
		raise exception 'invalid goalkeeper' using errcode = '23514';
	end if;

	if normalized_color is not null and exists (
		select 1
		from public.championship_event_teams t
		where t.event_id = event.id
			and t.color = normalized_color
	) then
		raise exception 'duplicate team color' using errcode = '23505';
	end if;

	foreach current_player_id in array ids loop
		if current_player_id = any (seen_players) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		seen_players := seen_players || current_player_id;

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = current_player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.player_id = current_player_id
		) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		select *
		into player
		from public.championship_players p
		where p.id = current_player_id
			and p.championship_id = event.championship_id
			and p.deleted_at is null;

		if player.id is null then
			raise exception 'player not found' using errcode = 'P0002';
		end if;
	end loop;

	select coalesce(max(t.sort_order), -1) + 1
	into next_sort
	from public.championship_event_teams t
	where t.event_id = event.id;

	insert into public.championship_event_teams (
		event_id,
		color,
		sort_order
	)
	values (
		event.id,
		normalized_color,
		next_sort
	)
	returning * into new_team;

	foreach current_player_id in array ids loop
		select *
		into player
		from public.championship_players p
		where p.id = current_player_id;

		insert into public.championship_event_team_players (
			event_id,
			team_id,
			player_id,
			display_name,
			is_goalkeeper
		)
		values (
			event.id,
			new_team.id,
			player.id,
			coalesce(nullif(btrim(player.nickname), ''), player.display_name),
			current_player_id = add_championship_event_team.goalkeeper_id
				and add_championship_event_team.goalkeeper_id is distinct from 0
		);
	end loop;

	return jsonb_build_object(
		'id', new_team.id,
		'event_id', new_team.event_id,
		'color', new_team.color,
		'sort_order', new_team.sort_order
	);
end;
$_$;


ALTER FUNCTION public.add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) OWNER TO postgres;

--
-- TOC entry 381 (class 1255 OID 17994)
-- Name: adjust_championship_player_ratings_for_event(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.adjust_championship_player_ratings_for_event(event_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	ceiling numeric;
begin
	select e.*
	into event
	from public.championship_events e
	where e.id = adjust_championship_player_ratings_for_event.event_id
		and e.deleted_at is null;

	if event.id is null then
		return;
	end if;

	select least(100, greatest(coalesce(max(p.rating), 0), 5))
	into ceiling
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null;

	with deltas as (
		select
			a.id as attendance_id,
			a.player_id,
			a.rating_delta as old_delta,
			public.championship_event_rating_delta(
				a.wins,
				a.matches,
				roster.rating,
				ceiling
			) as new_delta
		from public.championship_event_attendance a
		join public.championship_players roster
			on roster.id = a.player_id
		where a.event_id = adjust_championship_player_ratings_for_event.event_id
	),
	updated_players as (
		update public.championship_players p
		set rating = least(
			100,
			greatest(
				0,
				round((p.rating - d.old_delta + d.new_delta)::numeric, 1)
			)
		)
		from deltas d
		where p.id = d.player_id
			and d.new_delta <> d.old_delta
		returning p.id
	)
	update public.championship_event_attendance a
	set rating_delta = d.new_delta
	from deltas d
	where a.id = d.attendance_id
		and a.rating_delta <> d.new_delta;
end;
$$;


ALTER FUNCTION public.adjust_championship_player_ratings_for_event(event_id bigint) OWNER TO postgres;

--
-- TOC entry 423 (class 1255 OID 17926)
-- Name: apply_championship_event_match_stats(bigint, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_championship_event_match_stats(match_id bigint, delta integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	match public.championship_event_matches%rowtype;
	player_ids bigint[];
begin
	-- ponytail: delta kept for callers; stats recomputed via attendance
	if apply_championship_event_match_stats.delta not in (-1, 1) then
		raise exception 'invalid stats delta' using errcode = '23514';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = apply_championship_event_match_stats.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select coalesce(array_agg(mp.player_id), '{}')
	into player_ids
	from public.championship_event_match_players mp
	where mp.match_id = match.id;

	perform public.refresh_championship_event_attendance_stats(match.event_id);
	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;


ALTER FUNCTION public.apply_championship_event_match_stats(match_id bigint, delta integer) OWNER TO postgres;

--
-- TOC entry 461 (class 1255 OID 17594)
-- Name: championship_actor_role(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_actor_role(championship_id bigint) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
	select case
		when exists (
			select 1
			from public.championships c
			where c.id = championship_actor_role.championship_id
				and c.deleted_at is null
				and c.created_by = (select auth.uid())
		) then 'owner'
		else (
			select p.role
			from public.championship_players p
			join public.championships c on c.id = p.championship_id
			where p.championship_id = championship_actor_role.championship_id
				and c.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
		)
	end;
$$;


ALTER FUNCTION public.championship_actor_role(championship_id bigint) OWNER TO postgres;

--
-- TOC entry 403 (class 1255 OID 17976)
-- Name: championship_event_attendance_set_event_date(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_event_attendance_set_event_date() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
	if new.event_date is null then
		select (e.starts_at at time zone 'America/Sao_Paulo')::date
		into new.event_date
		from public.championship_events e
		where e.id = new.event_id;
	end if;

	return new;
end;
$$;


ALTER FUNCTION public.championship_event_attendance_set_event_date() OWNER TO postgres;

--
-- TOC entry 401 (class 1255 OID 17987)
-- Name: championship_event_attendance_set_rating(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_event_attendance_set_rating() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
	select p.rating
	into new.rating
	from public.championship_players p
	where p.id = new.player_id;

	if new.rating is null then
		new.rating := 0;
	end if;

	return new;
end;
$$;


ALTER FUNCTION public.championship_event_attendance_set_rating() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 310 (class 1259 OID 17719)
-- Name: championship_event_matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_event_matches (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    team_a_id bigint NOT NULL,
    team_b_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    winner_team_id bigint,
    CONSTRAINT championship_event_matches_distinct_teams_check CHECK ((team_a_id <> team_b_id)),
    CONSTRAINT championship_event_matches_open_winner_check CHECK (((ended_at IS NOT NULL) OR (winner_team_id IS NULL))),
    CONSTRAINT championship_event_matches_winner_team_check CHECK (((winner_team_id IS NULL) OR (winner_team_id = team_a_id) OR (winner_team_id = team_b_id)))
);


ALTER TABLE public.championship_event_matches OWNER TO postgres;

--
-- TOC entry 436 (class 1255 OID 17924)
-- Name: championship_event_match_json(public.championship_event_matches); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_event_match_json(match public.championship_event_matches) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
	select jsonb_build_object(
		'id', match.id,
		'event_id', match.event_id,
		'team_a_id', match.team_a_id,
		'team_b_id', match.team_b_id,
		'created_at', match.created_at,
		'ended_at', match.ended_at,
		'winner_team_id', match.winner_team_id
	);
$$;


ALTER FUNCTION public.championship_event_match_json(match public.championship_event_matches) OWNER TO postgres;

--
-- TOC entry 373 (class 1255 OID 17925)
-- Name: championship_event_match_score(public.championship_event_matches, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_event_match_score(match public.championship_event_matches, for_team_id bigint) RETURNS integer
    LANGUAGE sql STABLE
    AS $$
	select count(*)::integer
	from public.championship_event_goals g
	join public.championship_event_match_players mp
		on mp.match_id = g.match_id
		and mp.player_id = g.scorer_player_id
	where g.match_id = match.id
		and (
			(mp.team_id = for_team_id and not g.is_own_goal)
			or (mp.team_id is distinct from for_team_id and g.is_own_goal)
		);
$$;


ALTER FUNCTION public.championship_event_match_score(match public.championship_event_matches, for_team_id bigint) OWNER TO postgres;

--
-- TOC entry 392 (class 1255 OID 17997)
-- Name: championship_event_rating_delta(integer, integer, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
	select case
		when rating = 0 then 0
		when matches < 3 then 0
		when 20 * wins <= 11 * matches
			and 20 * wins >= 9 * matches then 0
		else round(
			((2 * wins - matches)::numeric * least(100, greatest(0, ceiling)))
				/ (4 * matches),
			1
		)
	end;
$$;


ALTER FUNCTION public.championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric) OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 17520)
-- Name: championship_players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_players (
    id bigint NOT NULL,
    championship_id bigint NOT NULL,
    user_id uuid,
    display_name text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    rating numeric(4,1) DEFAULT 0 NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    deleted_at timestamp with time zone,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    matches integer DEFAULT 0 NOT NULL,
    nickname text,
    own_goals integer DEFAULT 0 NOT NULL,
    CONSTRAINT championship_players_nickname_check CHECK (((nickname IS NULL) OR ((char_length(btrim(nickname)) >= 1) AND (char_length(btrim(nickname)) <= 40)))),
    CONSTRAINT championship_players_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (100)::numeric))),
    CONSTRAINT championship_players_role_check CHECK ((role = ANY (ARRAY['captain'::text, 'admin'::text, 'member'::text]))),
    CONSTRAINT championship_players_stats_check CHECK (((goals >= 0) AND (assists >= 0) AND (own_goals >= 0) AND (wins >= 0) AND (matches >= 0) AND (wins <= matches)))
);


ALTER TABLE public.championship_players OWNER TO postgres;

--
-- TOC entry 421 (class 1255 OID 17650)
-- Name: championship_player_json(public.championship_players); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.championship_player_json(player public.championship_players) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
	select jsonb_build_object(
		'id', player.id,
		'championship_id', player.championship_id,
		'user_id', player.user_id,
		'display_name', player.display_name,
		'nickname', player.nickname,
		'avatar_url', player.avatar_url,
		'rating', player.rating,
		'role', player.role,
		'deleted_at', player.deleted_at,
		'goals', player.goals,
		'assists', player.assists,
		'own_goals', player.own_goals,
		'wins', player.wins,
		'matches', player.matches
	);
$$;


ALTER FUNCTION public.championship_player_json(player public.championship_players) OWNER TO postgres;

--
-- TOC entry 457 (class 1255 OID 17553)
-- Name: claim_player(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.claim_player(player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = claim_player.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if not championship.is_visible then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is not null then
		raise exception 'player already claimed' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_players p
		where p.championship_id = player.championship_id
			and p.user_id = viewer
	) then
		raise exception 'already in championship' using errcode = '23505';
	end if;

	update public.championship_players
	set
		user_id = viewer,
		avatar_url = public.current_user_avatar_url()
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.claim_player(player_id bigint) OWNER TO postgres;

--
-- TOC entry 413 (class 1255 OID 18019)
-- Name: create_championship_event(bigint, date, time without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_championship_event(championship_id bigint, event_date date, event_time time without time zone DEFAULT NULL::time without time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	championship public.championships%rowtype;
	new_event public.championship_events%rowtype;
	resolved_time time;
	starts_at timestamptz;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if event_date is null then
		raise exception 'invalid event date' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = create_championship_event.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_events e
		where e.championship_id = championship.id
			and e.deleted_at is null
			and (e.starts_at at time zone 'America/Sao_Paulo')::date = event_date
	) then
		raise exception 'event already exists' using errcode = '23505';
	end if;

	resolved_time := coalesce(
		create_championship_event.event_time,
		championship.event_time
	);

	if resolved_time is null then
		raise exception 'invalid event time' using errcode = '23514';
	end if;

	starts_at :=
		(event_date::timestamp + resolved_time)
		at time zone 'America/Sao_Paulo';

	insert into public.championship_events (
		championship_id,
		starts_at,
		players_per_team,
		skip_guest_goalkeeper_matches,
		created_by
	)
	values (
		championship.id,
		starts_at,
		championship.players_per_team,
		championship.skip_guest_goalkeeper_matches,
		viewer
	)
	returning * into new_event;

	return jsonb_build_object(
		'id', new_event.id,
		'championship_id', new_event.championship_id,
		'starts_at', new_event.starts_at,
		'players_per_team', new_event.players_per_team,
		'ended_at', new_event.ended_at
	);
end;
$$;


ALTER FUNCTION public.create_championship_event(championship_id bigint, event_date date, event_time time without time zone) OWNER TO postgres;

--
-- TOC entry 347 (class 1255 OID 17544)
-- Name: current_user_avatar_url(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_avatar_url() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
	select coalesce(
		nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
		nullif(u.raw_user_meta_data ->> 'picture', '')
	)
	from auth.users u
	where u.id = (select auth.uid());
$$;


ALTER FUNCTION public.current_user_avatar_url() OWNER TO postgres;

--
-- TOC entry 379 (class 1255 OID 17543)
-- Name: current_user_display_name(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.current_user_display_name() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
	select coalesce(
		nullif(u.raw_user_meta_data ->> 'full_name', ''),
		nullif(u.raw_user_meta_data ->> 'name', ''),
		nullif(u.email, ''),
		'Jogador'
	)
	from auth.users u
	where u.id = (select auth.uid());
$$;


ALTER FUNCTION public.current_user_display_name() OWNER TO postgres;

--
-- TOC entry 342 (class 1255 OID 17639)
-- Name: deactivate_player(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deactivate_player(player_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = deactivate_player.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is not distinct from championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set deleted_at = now()
	where id = player.id
		and deleted_at is null;

	if not found then
		raise exception 'player not found' using errcode = 'P0002';
	end if;
end;
$$;


ALTER FUNCTION public.deactivate_player(player_id bigint) OWNER TO postgres;

--
-- TOC entry 333 (class 1255 OID 17837)
-- Name: delete_championship_event_match(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_championship_event_match(match_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = delete_championship_event_match.match_id;

	if match.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select coalesce(array_agg(mp.player_id), '{}')
	into player_ids
	from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_goals g
	where g.match_id = match.id;

	delete from public.championship_event_match_players mp
	where mp.match_id = match.id;

	delete from public.championship_event_matches
	where id = match.id;

	perform public.refresh_championship_event_attendance_stats(event.id);
	perform public.sync_championship_players_from_attendance(player_ids);

	return public.championship_event_match_json(match);
end;
$$;


ALTER FUNCTION public.delete_championship_event_match(match_id bigint) OWNER TO postgres;

--
-- TOC entry 356 (class 1255 OID 17843)
-- Name: delete_championship_event_team(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_championship_event_team(team_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	target_team public.championship_event_teams%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into target_team
	from public.championship_event_teams t
	where t.id = delete_championship_event_team.team_id;

	if target_team.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = target_team.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.team_a_id = target_team.id
			or m.team_b_id = target_team.id
	) then
		raise exception 'team has matches' using errcode = '23514';
	end if;

	delete from public.championship_event_team_players tp
	where tp.team_id = target_team.id;

	delete from public.championship_event_teams t
	where t.id = target_team.id;

	return jsonb_build_object(
		'id', target_team.id,
		'event_id', target_team.event_id,
		'color', target_team.color,
		'sort_order', target_team.sort_order
	);
end;
$$;


ALTER FUNCTION public.delete_championship_event_team(team_id bigint) OWNER TO postgres;

--
-- TOC entry 432 (class 1255 OID 17835)
-- Name: end_championship_event(bigint, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.end_championship_event(event_id bigint, present_player_ids jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	present_ids bigint[];
	player_id bigint;
	seen_present bigint[] := '{}';
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = end_championship_event.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null then
		return jsonb_build_object(
			'id', event.id,
			'championship_id', event.championship_id,
			'starts_at', event.starts_at,
			'players_per_team', event.players_per_team,
			'ended_at', event.ended_at
		);
	end if;

	if present_player_ids is not null then
		if jsonb_typeof(present_player_ids) is distinct from 'array' then
			raise exception 'invalid attendance' using errcode = '23514';
		end if;

		if exists (
			select 1
			from jsonb_array_elements(present_player_ids) elem
			where jsonb_typeof(elem) is distinct from 'number'
		) then
			raise exception 'invalid attendance' using errcode = '23514';
		end if;

		select coalesce(array_agg(elem::bigint), '{}')
		into present_ids
		from jsonb_array_elements_text(present_player_ids) as elem;

		if cardinality(present_ids) is null or cardinality(present_ids) < 2 then
			raise exception 'invalid attendance' using errcode = '23514';
		end if;

		foreach player_id in array present_ids loop
			if player_id = any (seen_present) then
				raise exception 'duplicate attendance' using errcode = '23505';
			end if;

			seen_present := seen_present || player_id;

			select *
			into player
			from public.championship_players p
			where p.id = player_id
				and p.championship_id = event.championship_id
				and p.deleted_at is null;

			if player.id is null then
				raise exception 'player not found' using errcode = 'P0002';
			end if;
		end loop;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.player_id <> all (present_ids)
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		delete from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id <> all (present_ids);

		insert into public.championship_event_attendance (
			event_id,
			player_id,
			display_name
		)
		select
			event.id,
			p.id,
			coalesce(nullif(btrim(p.nickname), ''), p.display_name)
		from unnest(present_ids) as u(pid)
		join public.championship_players p on p.id = u.pid
		where not exists (
			select 1
			from public.championship_event_attendance existing
			where existing.event_id = event.id
				and existing.player_id = p.id
		);
	end if;

	update public.championship_events
	set ended_at = now()
	where id = event.id
	returning * into event;

	perform public.adjust_championship_player_ratings_for_event(event.id);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;


ALTER FUNCTION public.end_championship_event(event_id bigint, present_player_ids jsonb) OWNER TO postgres;

--
-- TOC entry 348 (class 1255 OID 17930)
-- Name: end_championship_event_match(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.end_championship_event_match(match_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	score_a integer;
	score_b integer;
	winner_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = end_championship_event_match.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		return public.championship_event_match_json(match);
	end if;

	score_a := public.championship_event_match_score(match, match.team_a_id);
	score_b := public.championship_event_match_score(match, match.team_b_id);

	if score_a > score_b then
		winner_id := match.team_a_id;
	elsif score_b > score_a then
		winner_id := match.team_b_id;
	else
		winner_id := null;
	end if;

	update public.championship_event_matches
	set
		ended_at = now(),
		winner_team_id = winner_id
	where id = match.id
	returning * into match;

	perform public.apply_championship_event_match_stats(match.id, 1);

	return public.championship_event_match_json(match);
end;
$$;


ALTER FUNCTION public.end_championship_event_match(match_id bigint) OWNER TO postgres;

--
-- TOC entry 359 (class 1255 OID 17636)
-- Name: enforce_championship_owner_quota(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.enforce_championship_owner_quota() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	owned integer;
begin
	if tg_op = 'UPDATE' and new.created_by is not distinct from old.created_by then
		return new;
	end if;

	perform pg_advisory_xact_lock(hashtextextended(new.created_by::text, 0));

	select count(*)::integer
	into owned
	from public.championships
	where created_by = new.created_by
		and deleted_at is null;

	if owned >= 3 then
		raise exception 'championship quota exceeded' using errcode = '23514';
	end if;

	return new;
end;
$$;


ALTER FUNCTION public.enforce_championship_owner_quota() OWNER TO postgres;

--
-- TOC entry 404 (class 1255 OID 17551)
-- Name: get_championship_by_invite(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_championship_by_invite(invite_code text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	result jsonb;
begin
	select jsonb_build_object(
		'id', c.id,
		'name', c.name,
		'invite_code', c.invite_code,
		'created_by', c.created_by,
		'logo_path', c.logo_path,
		'players', coalesce((
			select jsonb_agg(
				public.championship_player_json(p)
				order by p.id
			)
			from public.championship_players p
			where p.championship_id = c.id
				and p.deleted_at is null
		), '[]'::jsonb)
	)
	into result
	from public.championships c
	where c.invite_code = get_championship_by_invite.invite_code
		and c.deleted_at is null
		and c.is_visible;

	if result is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	return result;
end;
$$;


ALTER FUNCTION public.get_championship_by_invite(invite_code text) OWNER TO postgres;

--
-- TOC entry 441 (class 1255 OID 17542)
-- Name: is_championship_member(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_championship_member(championship_id bigint) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
	select
		exists (
			select 1
			from public.championships c
			where c.id = championship_id
				and c.deleted_at is null
				and c.created_by = (select auth.uid())
		)
		or exists (
			select 1
			from public.championship_players p
			join public.championships c on c.id = p.championship_id
			where p.championship_id = championship_id
				and c.deleted_at is null
				and p.deleted_at is null
				and p.user_id = (select auth.uid())
		);
$$;


ALTER FUNCTION public.is_championship_member(championship_id bigint) OWNER TO postgres;

--
-- TOC entry 465 (class 1255 OID 17552)
-- Name: join_championship(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.join_championship(invite_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	championship public.championships%rowtype;
	player public.championship_players%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into championship
	from public.championships c
	where c.invite_code = join_championship.invite_code
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	select *
	into player
	from public.championship_players p
	where p.championship_id = championship.id
		and p.user_id = viewer
		and p.deleted_at is null;

	if player.id is not null then
		return public.championship_player_json(player);
	end if;

	if not championship.is_visible then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_players p
		where p.championship_id = championship.id
			and p.user_id = viewer
			and p.deleted_at is not null
	) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	insert into public.championship_players (
		championship_id,
		user_id,
		display_name,
		avatar_url
	)
	values (
		championship.id,
		viewer,
		public.current_user_display_name(),
		public.current_user_avatar_url()
	)
	returning * into player;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.join_championship(invite_code text) OWNER TO postgres;

--
-- TOC entry 402 (class 1255 OID 18018)
-- Name: merge_championship_players(bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.merge_championship_players(keep_player_id bigint, absorb_player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	keep public.championship_players%rowtype;
	absorb public.championship_players%rowtype;
	championship public.championships%rowtype;
	absorb_user_id uuid;
	absorb_avatar text;
	absorb_role text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if keep_player_id = absorb_player_id then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	perform 1
	from public.championship_players p
	where p.id in (
		merge_championship_players.keep_player_id,
		merge_championship_players.absorb_player_id
	)
	order by p.id
	for update;

	select *
	into keep
	from public.championship_players p
	where p.id = merge_championship_players.keep_player_id;

	select *
	into absorb
	from public.championship_players p
	where p.id = merge_championship_players.absorb_player_id;

	if keep.id is null
		or absorb.id is null
		or keep.deleted_at is not null
		or absorb.deleted_at is not null
	then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if keep.championship_id is distinct from absorb.championship_id then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if keep.user_id is not null then
		raise exception 'player already claimed' using errcode = '23514';
	end if;

	if absorb.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = keep.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if absorb.user_id = championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	set constraints
		championship_event_team_players_attendance_fk,
		championship_event_match_players_event_id_player_id_fkey,
		championship_event_goals_match_id_scorer_player_id_fkey,
		championship_event_goals_match_id_assist_player_id_fkey
	deferred;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date,
		goals,
		assists,
		own_goals,
		wins,
		matches,
		rating,
		rating_delta
	)
	select
		a.event_id,
		keep.id,
		keep.display_name,
		a.is_goalkeeper,
		a.event_date,
		a.goals,
		a.assists,
		a.own_goals,
		a.wins,
		a.matches,
		a.rating,
		a.rating_delta
	from public.championship_event_attendance a
	where a.player_id = absorb.id
		and not exists (
			select 1
			from public.championship_event_attendance k
			where k.event_id = a.event_id
				and k.player_id = keep.id
		);

	delete from public.championship_event_team_players tp
	where tp.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_team_players k
			where k.event_id = tp.event_id
				and k.player_id = keep.id
		);

	update public.championship_event_team_players
	set player_id = keep.id
	where player_id = absorb.id;

	delete from public.championship_event_match_players mp
	where mp.player_id = absorb.id
		and exists (
			select 1
			from public.championship_event_match_players k
			where k.match_id = mp.match_id
				and k.player_id = keep.id
		);

	update public.championship_event_match_players
	set player_id = keep.id
	where player_id = absorb.id;

	update public.championship_event_goals
	set assist_player_id = null
	where assist_player_id = absorb.id
		and scorer_player_id = keep.id;

	update public.championship_event_goals
	set assist_player_id = null
	where scorer_player_id = absorb.id
		and assist_player_id = keep.id;

	update public.championship_event_goals
	set scorer_player_id = keep.id
	where scorer_player_id = absorb.id;

	update public.championship_event_goals
	set assist_player_id = keep.id
	where assist_player_id = absorb.id;

	delete from public.championship_event_attendance
	where player_id = absorb.id;

	absorb_user_id := absorb.user_id;
	absorb_avatar := absorb.avatar_url;
	absorb_role := absorb.role;

	update public.championship_players
	set
		user_id = null,
		avatar_url = null,
		role = 'member'
	where id = absorb.id;

	update public.championship_players
	set
		user_id = absorb_user_id,
		avatar_url = absorb_avatar,
		role = absorb_role
	where id = keep.id;

	update public.championship_players
	set deleted_at = now()
	where id = absorb.id
		and deleted_at is null;

	perform public.sync_championship_players_from_attendance(array[keep.id]);

	select *
	into keep
	from public.championship_players p
	where p.id = keep.id;

	return public.championship_player_json(keep);
end;
$$;


ALTER FUNCTION public.merge_championship_players(keep_player_id bigint, absorb_player_id bigint) OWNER TO postgres;

--
-- TOC entry 398 (class 1255 OID 17603)
-- Name: owns_championship_logo_object(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owns_championship_logo_object(object_name text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
	select exists (
		select 1
		from public.championships c
		where c.id::text = split_part(owns_championship_logo_object.object_name, '/', 1)
			and c.deleted_at is null
			and c.created_by = (select auth.uid())
	);
$$;


ALTER FUNCTION public.owns_championship_logo_object(object_name text) OWNER TO postgres;

--
-- TOC entry 351 (class 1255 OID 17640)
-- Name: reactivate_player(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reactivate_player(player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = reactivate_player.player_id
	for update;

	if player.id is null or player.deleted_at is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set deleted_at = null
	where id = player.id
		and deleted_at is not null
	returning * into player;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.reactivate_player(player_id bigint) OWNER TO postgres;

--
-- TOC entry 358 (class 1255 OID 17978)
-- Name: refresh_championship_event_attendance_stats(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_championship_event_attendance_stats(event_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
	update public.championship_event_attendance a
	set
		event_date = s.event_date,
		matches = s.matches,
		wins = s.wins,
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals
	from (
		select
			a2.id,
			(e.starts_at at time zone 'America/Sao_Paulo')::date as event_date,
			coalesce(played.matches, 0) as matches,
			coalesce(played.wins, 0) as wins,
			coalesce(scored.goals, 0) as goals,
			coalesce(assisted.assists, 0) as assists,
			coalesce(own_scored.own_goals, 0) as own_goals
		from public.championship_event_attendance a2
		join public.championship_events e
			on e.id = a2.event_id
		left join lateral (
			select
				count(*)::integer as matches,
				count(*) filter (
					where m.winner_team_id is not distinct from mp.team_id
				)::integer as wins
			from public.championship_event_match_players mp
			join public.championship_event_matches m
				on m.id = mp.match_id
			left join public.championship_event_team_players tp
				on tp.event_id = mp.event_id
				and tp.player_id = mp.player_id
			where mp.event_id = a2.event_id
				and mp.player_id = a2.player_id
				and m.ended_at is not null
				and (
					not e.skip_guest_goalkeeper_matches
					or not mp.is_goalkeeper
					or tp.team_id is not distinct from mp.team_id
					or m.winner_team_id is not distinct from mp.team_id
				)
		) played on true
		left join lateral (
			select count(*)::integer as goals
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and not g.is_own_goal
		) scored on true
		left join lateral (
			select count(*)::integer as assists
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.assist_player_id = a2.player_id
		) assisted on true
		left join lateral (
			select count(*)::integer as own_goals
			from public.championship_event_goals g
			where g.event_id = a2.event_id
				and g.scorer_player_id = a2.player_id
				and g.is_own_goal
		) own_scored on true
		where a2.event_id = refresh_championship_event_attendance_stats.event_id
	) s
	where a.id = s.id;
end;
$$;


ALTER FUNCTION public.refresh_championship_event_attendance_stats(event_id bigint) OWNER TO postgres;

--
-- TOC entry 427 (class 1255 OID 17478)
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

--
-- TOC entry 344 (class 1255 OID 17942)
-- Name: save_championship_event_attendance(bigint, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	present_ids bigint[];
	goalkeeper_ids bigint[];
	player_id bigint;
	seen_present bigint[] := '{}';
	seen_goalkeepers bigint[] := '{}';
	player public.championship_players%rowtype;
	removed_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(present_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(present_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into present_ids
	from jsonb_array_elements_text(present_player_ids) as elem;

	if cardinality(present_ids) is null or cardinality(present_ids) < 2 then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if jsonb_typeof(goalkeeper_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(goalkeeper_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into goalkeeper_ids
	from jsonb_array_elements_text(goalkeeper_player_ids) as elem;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	foreach player_id in array present_ids loop
		if player_id = any (seen_present) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_present := seen_present || player_id;

		select *
		into player
		from public.championship_players p
		where p.id = player_id
			and p.championship_id = event.championship_id
			and p.deleted_at is null;

		if player.id is null then
			raise exception 'player not found' using errcode = 'P0002';
		end if;
	end loop;

	foreach player_id in array goalkeeper_ids loop
		if player_id = any (seen_goalkeepers) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_goalkeepers := seen_goalkeepers || player_id;

		if player_id <> all (present_ids) then
			raise exception 'player not present' using errcode = '23514';
		end if;
	end loop;

	if exists (
		select 1
		from public.championship_event_team_players tp
		where tp.event_id = event.id
			and tp.player_id <> all (present_ids)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	select coalesce(array_agg(a.player_id), '{}')
	into removed_ids
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	delete from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id <> all (present_ids);

	update public.championship_event_attendance a
	set
		is_goalkeeper = (a.player_id = any (goalkeeper_ids)),
		event_date = (event.starts_at at time zone 'America/Sao_Paulo')::date
	where a.event_id = event.id
		and a.player_id = any (present_ids);

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper,
		event_date
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name),
		p.id = any (goalkeeper_ids),
		(event.starts_at at time zone 'America/Sao_Paulo')::date
	from unnest(present_ids) as u(pid)
	join public.championship_players p on p.id = u.pid
	where not exists (
		select 1
		from public.championship_event_attendance existing
		where existing.event_id = event.id
			and existing.player_id = p.id
	);

	perform public.sync_championship_players_from_attendance(
		coalesce(removed_ids, '{}')
	);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;


ALTER FUNCTION public.save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb) OWNER TO postgres;

--
-- TOC entry 454 (class 1255 OID 17989)
-- Name: save_championship_event_attendance_stats(bigint, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_championship_event_attendance_stats(event_id bigint, stats jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(stats) is distinct from 'array' then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where jsonb_typeof(elem) is distinct from 'object'
			or jsonb_typeof(elem -> 'player_id') is distinct from 'number'
			or jsonb_typeof(elem -> 'goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'assists') is distinct from 'number'
			or jsonb_typeof(elem -> 'own_goals') is distinct from 'number'
			or jsonb_typeof(elem -> 'wins') is distinct from 'number'
			or jsonb_typeof(elem -> 'matches') is distinct from 'number'
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'player_id')::numeric <> trunc((elem ->> 'player_id')::numeric)
			or (elem ->> 'goals')::numeric <> trunc((elem ->> 'goals')::numeric)
			or (elem ->> 'assists')::numeric <> trunc((elem ->> 'assists')::numeric)
			or (elem ->> 'own_goals')::numeric <> trunc((elem ->> 'own_goals')::numeric)
			or (elem ->> 'wins')::numeric <> trunc((elem ->> 'wins')::numeric)
			or (elem ->> 'matches')::numeric <> trunc((elem ->> 'matches')::numeric)
			or (elem ->> 'player_id')::bigint <= 0
			or (elem ->> 'goals')::integer < 0
			or (elem ->> 'assists')::integer < 0
			or (elem ->> 'own_goals')::integer < 0
			or (elem ->> 'wins')::integer < 0
			or (elem ->> 'matches')::integer < 0
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(stats) elem
		where (elem ->> 'wins')::integer > (elem ->> 'matches')::integer
	) then
		raise exception 'wins exceed matches' using errcode = '23514';
	end if;

	select coalesce(array_agg((elem ->> 'player_id')::bigint), '{}')
	into player_ids
	from jsonb_array_elements(stats) elem;

	if (
		select count(*) <> count(distinct (elem ->> 'player_id')::bigint)
		from jsonb_array_elements(stats) elem
	) then
		raise exception 'duplicate attendance' using errcode = '23505';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_attendance_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id <> all (player_ids)
	) then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if exists (
		select 1
		from unnest(player_ids) as u(player_id)
		where not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = u.player_id
		)
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	update public.championship_event_attendance a
	set
		goals = s.goals,
		assists = s.assists,
		own_goals = s.own_goals,
		wins = s.wins,
		matches = s.matches
	from (
		select
			(elem ->> 'player_id')::bigint as player_id,
			(elem ->> 'goals')::integer as goals,
			(elem ->> 'assists')::integer as assists,
			(elem ->> 'own_goals')::integer as own_goals,
			(elem ->> 'wins')::integer as wins,
			(elem ->> 'matches')::integer as matches
		from jsonb_array_elements(stats) elem
	) s
	where a.event_id = event.id
		and a.player_id = s.player_id;

	perform public.sync_championship_players_from_attendance(player_ids);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;


ALTER FUNCTION public.save_championship_event_attendance_stats(event_id bigint, stats jsonb) OWNER TO postgres;

--
-- TOC entry 340 (class 1255 OID 17943)
-- Name: save_championship_event_teams(bigint, jsonb, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
	viewer uuid := (select auth.uid());
	event public.championship_events%rowtype;
	team_item jsonb;
	team_color text;
	player_ids bigint[];
	present_ids bigint[];
	goalkeeper_ids bigint[];
	player_id bigint;
	goalkeeper_id bigint;
	seen_colors text[] := '{}';
	seen_players bigint[] := '{}';
	seen_present bigint[] := '{}';
	seen_goalkeepers bigint[] := '{}';
	team_count integer;
	i integer;
	new_team public.championship_event_teams%rowtype;
	player public.championship_players%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if jsonb_typeof(present_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(present_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into present_ids
	from jsonb_array_elements_text(present_player_ids) as elem;

	if cardinality(present_ids) is null or cardinality(present_ids) < 2 then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if jsonb_typeof(goalkeeper_player_ids) is distinct from 'array' then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(goalkeeper_player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid attendance' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into goalkeeper_ids
	from jsonb_array_elements_text(goalkeeper_player_ids) as elem;

	if jsonb_typeof(teams) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	team_count := jsonb_array_length(teams);
	if team_count < 2 then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_event_teams.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if not exists (
		select 1
		from public.championships c
		where c.id = event.championship_id
			and c.deleted_at is null
	) then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if event.ended_at is not null
		and public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.event_id = event.id
	) then
		raise exception 'event has matches' using errcode = '23514';
	end if;

	foreach player_id in array present_ids loop
		if player_id = any (seen_present) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_present := seen_present || player_id;

		select *
		into player
		from public.championship_players p
		where p.id = player_id
			and p.championship_id = event.championship_id
			and p.deleted_at is null;

		if player.id is null then
			raise exception 'player not found' using errcode = 'P0002';
		end if;
	end loop;

	foreach player_id in array goalkeeper_ids loop
		if player_id = any (seen_goalkeepers) then
			raise exception 'duplicate attendance' using errcode = '23505';
		end if;

		seen_goalkeepers := seen_goalkeepers || player_id;

		if player_id <> all (present_ids) then
			raise exception 'player not present' using errcode = '23514';
		end if;
	end loop;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		if jsonb_typeof(team_item) is distinct from 'object' then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		team_color := lower(team_item ->> 'color');
		if team_color is not null and team_color !~ '^#[0-9a-f]{6}$' then
			raise exception 'invalid team color' using errcode = '23514';
		end if;

		if team_color is not null then
			if team_color = any (seen_colors) then
				raise exception 'duplicate team color' using errcode = '23505';
			end if;

			seen_colors := seen_colors || team_color;
		end if;

		if jsonb_typeof(team_item -> 'player_ids') is distinct from 'array' then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		if exists (
			select 1
			from jsonb_array_elements(team_item -> 'player_ids') elem
			where jsonb_typeof(elem) is distinct from 'number'
		) then
			raise exception 'invalid teams' using errcode = '23514';
		end if;

		select coalesce(array_agg(elem::bigint), '{}')
		into player_ids
		from jsonb_array_elements_text(team_item -> 'player_ids') as elem;

		if cardinality(player_ids) is null
			or cardinality(player_ids) = 0
			or cardinality(player_ids) > event.players_per_team then
			raise exception 'invalid team size' using errcode = '23514';
		end if;

		if jsonb_typeof(team_item -> 'goalkeeper_id') is distinct from 'number' then
			raise exception 'invalid goalkeeper' using errcode = '23514';
		end if;

		goalkeeper_id := (team_item ->> 'goalkeeper_id')::bigint;
		if goalkeeper_id is distinct from 0 and goalkeeper_id <> all (player_ids) then
			raise exception 'invalid goalkeeper' using errcode = '23514';
		end if;

		foreach player_id in array player_ids loop
			if player_id = any (seen_players) then
				raise exception 'duplicate player' using errcode = '23505';
			end if;

			if player_id <> all (present_ids) then
				raise exception 'player not present' using errcode = '23514';
			end if;

			seen_players := seen_players || player_id;
		end loop;
	end loop;

	delete from public.championship_event_team_players
	where championship_event_team_players.event_id = event.id;

	delete from public.championship_event_teams
	where championship_event_teams.event_id = event.id;

	delete from public.championship_event_attendance
	where championship_event_attendance.event_id = event.id;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		is_goalkeeper
	)
	select
		event.id,
		p.id,
		coalesce(nullif(btrim(p.nickname), ''), p.display_name),
		p.id = any (goalkeeper_ids)
	from unnest(present_ids) as pid
	join public.championship_players p on p.id = pid;

	for i in 0 .. team_count - 1 loop
		team_item := teams -> i;
		team_color := lower(team_item ->> 'color');
		goalkeeper_id := (team_item ->> 'goalkeeper_id')::bigint;

		select coalesce(array_agg(elem::bigint), '{}')
		into player_ids
		from jsonb_array_elements_text(team_item -> 'player_ids') as elem;

		insert into public.championship_event_teams (
			event_id,
			color,
			sort_order
		)
		values (
			event.id,
			team_color,
			i::smallint
		)
		returning * into new_team;

		foreach player_id in array player_ids loop
			select *
			into player
			from public.championship_players p
			where p.id = player_id;

			insert into public.championship_event_team_players (
				event_id,
				team_id,
				player_id,
				display_name,
				is_goalkeeper
			)
			values (
				event.id,
				new_team.id,
				player.id,
				coalesce(nullif(btrim(player.nickname), ''), player.display_name),
				player_id = goalkeeper_id and goalkeeper_id is distinct from 0
			);
		end loop;
	end loop;

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$_$;


ALTER FUNCTION public.save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb) OWNER TO postgres;

--
-- TOC entry 332 (class 1255 OID 17998)
-- Name: save_championship_player_event_stats(bigint, bigint, integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	player public.championship_players%rowtype;
	old_delta numeric;
	old_wins integer;
	old_matches integer;
	implied_old numeric;
	new_delta numeric;
	stored_delta numeric;
	ceiling numeric;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if goals < 0
		or assists < 0
		or wins < 0
		or matches < 0
	then
		raise exception 'invalid attendance stats' using errcode = '23514';
	end if;

	if wins > matches then
		raise exception 'wins exceed matches' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = save_championship_player_event_stats.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if event.ended_at is null then
		raise exception 'event still open' using errcode = '23514';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = save_championship_player_event_stats.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null
	for update;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select a.rating_delta, a.wins, a.matches
	into old_delta, old_wins, old_matches
	from public.championship_event_attendance a
	where a.event_id = event.id
		and a.player_id = player.id;

	old_delta := coalesce(old_delta, 0);
	old_wins := coalesce(old_wins, 0);
	old_matches := coalesce(old_matches, 0);

	select least(100, greatest(coalesce(max(p.rating), 0), 5))
	into ceiling
	from public.championship_players p
	where p.championship_id = event.championship_id
		and p.deleted_at is null;

	implied_old := public.championship_event_rating_delta(
		old_wins,
		old_matches,
		player.rating,
		ceiling
	);
	new_delta := public.championship_event_rating_delta(
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.matches,
		player.rating,
		ceiling
	);

	-- já ranqueado no encerrar (delta não gravado): stats ok, rate intacto
	if old_delta = 0 and implied_old <> 0 then
		stored_delta := 0;
		new_delta := 0;
		old_delta := 0;
	else
		stored_delta := new_delta;
	end if;

	insert into public.championship_event_attendance (
		event_id,
		player_id,
		display_name,
		goals,
		assists,
		wins,
		matches,
		rating_delta
	)
	values (
		event.id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		save_championship_player_event_stats.goals,
		save_championship_player_event_stats.assists,
		save_championship_player_event_stats.wins,
		save_championship_player_event_stats.matches,
		stored_delta
	)
	on conflict (event_id, player_id) do update
	set
		goals = excluded.goals,
		assists = excluded.assists,
		wins = excluded.wins,
		matches = excluded.matches,
		rating_delta = excluded.rating_delta;

	update public.championship_players p
	set rating = least(
		100,
		greatest(
			0,
			round((p.rating - old_delta + new_delta)::numeric, 1)
		)
	)
	where p.id = player.id
		and new_delta <> old_delta;

	perform public.sync_championship_players_from_attendance(array[player.id]);

	return jsonb_build_object(
		'id', event.id,
		'championship_id', event.championship_id,
		'starts_at', event.starts_at,
		'players_per_team', event.players_per_team,
		'ended_at', event.ended_at
	);
end;
$$;


ALTER FUNCTION public.save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer) OWNER TO postgres;

--
-- TOC entry 365 (class 1255 OID 17937)
-- Name: set_championship_event_match_goalkeeper(bigint, bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	promoted public.championship_event_match_players%rowtype;
	keeper public.championship_event_match_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_goalkeeper.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	if set_championship_event_match_goalkeeper.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	select *
	into promoted
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_goalkeeper.team_id
		and mp.player_id = set_championship_event_match_goalkeeper.player_id;

	if promoted.id is null then
		raise exception 'player not in match' using errcode = '23514';
	end if;

	if promoted.slot = 0 then
		return public.championship_event_match_json(match);
	end if;

	select *
	into keeper
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_goalkeeper.team_id
		and mp.slot = 0;

	if keeper.id is null then
		update public.championship_event_match_players mp
		set
			slot = 0,
			is_goalkeeper = true
		where mp.id = promoted.id;

		return public.championship_event_match_json(match);
	end if;

	set constraints championship_event_match_players_match_id_team_id_slot_key deferred;

	update public.championship_event_match_players mp
	set
		slot = case
			when mp.id = promoted.id then 0
			else promoted.slot
		end,
		is_goalkeeper = (mp.id = promoted.id)
	where mp.id in (promoted.id, keeper.id);

	return public.championship_event_match_json(match);
end;
$$;


ALTER FUNCTION public.set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint) OWNER TO postgres;

--
-- TOC entry 317 (class 1255 OID 17928)
-- Name: set_championship_event_match_player(bigint, bigint, smallint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	player public.championship_players%rowtype;
	outgoing_player_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = set_championship_event_match_player.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	if set_championship_event_match_player.team_id not in (match.team_a_id, match.team_b_id) then
		raise exception 'team not in match' using errcode = '23514';
	end if;

	if set_championship_event_match_player.slot < 0
		or set_championship_event_match_player.slot >= event.players_per_team then
		raise exception 'invalid slot' using errcode = '23514';
	end if;

	select mp.player_id
	into outgoing_player_id
	from public.championship_event_match_players mp
	where mp.match_id = match.id
		and mp.team_id = set_championship_event_match_player.team_id
		and mp.slot = set_championship_event_match_player.slot;

	if set_championship_event_match_player.player_id is null then
		if outgoing_player_id is not null
			and exists (
				select 1
				from public.championship_event_goals g
				where g.match_id = match.id
					and (
						g.scorer_player_id = outgoing_player_id
						or g.assist_player_id = outgoing_player_id
					)
			) then
			raise exception 'player has goals' using errcode = '23514';
		end if;

		delete from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.team_id = set_championship_event_match_player.team_id
			and mp.slot = set_championship_event_match_player.slot;

		return public.championship_event_match_json(match);
	end if;

	if not exists (
		select 1
		from public.championship_event_attendance a
		where a.event_id = event.id
			and a.player_id = set_championship_event_match_player.player_id
	) then
		raise exception 'player not present' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_match_players mp
		where mp.match_id = match.id
			and mp.player_id = set_championship_event_match_player.player_id
			and (
				mp.team_id is distinct from set_championship_event_match_player.team_id
				or mp.slot is distinct from set_championship_event_match_player.slot
			)
	) then
		raise exception 'duplicate player' using errcode = '23505';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = set_championship_event_match_player.player_id
		and p.championship_id = event.championship_id
		and p.deleted_at is null;

	if player.id is null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if outgoing_player_id is not null
		and outgoing_player_id is distinct from set_championship_event_match_player.player_id
		and exists (
			select 1
			from public.championship_event_goals g
			where g.match_id = match.id
				and (
					g.scorer_player_id = outgoing_player_id
					or g.assist_player_id = outgoing_player_id
				)
		) then
		raise exception 'player has goals' using errcode = '23514';
	end if;

	if outgoing_player_id is not null then
		update public.championship_event_match_players mp
		set
			player_id = player.id,
			display_name = coalesce(nullif(btrim(player.nickname), ''), player.display_name),
			is_goalkeeper = set_championship_event_match_player.slot = 0
		where mp.match_id = match.id
			and mp.team_id = set_championship_event_match_player.team_id
			and mp.slot = set_championship_event_match_player.slot;

		return public.championship_event_match_json(match);
	end if;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot
	)
	values (
		match.id,
		event.id,
		set_championship_event_match_player.team_id,
		player.id,
		coalesce(nullif(btrim(player.nickname), ''), player.display_name),
		set_championship_event_match_player.slot = 0,
		set_championship_event_match_player.slot
	);

	return public.championship_event_match_json(match);
end;
$$;


ALTER FUNCTION public.set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint) OWNER TO postgres;

--
-- TOC entry 321 (class 1255 OID 17597)
-- Name: set_player_role(bigint, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_player_role(player_id bigint, role text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if set_player_role.role not in ('captain', 'admin', 'member') then
		raise exception 'invalid role' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = set_player_role.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id;

	if championship.created_by = player.user_id then
		raise exception 'cannot change owner role' using errcode = '42501';
	end if;

	update public.championship_players
	set role = set_player_role.role
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.set_player_role(player_id bigint, role text) OWNER TO postgres;

--
-- TOC entry 409 (class 1255 OID 17610)
-- Name: soft_delete_championship(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.soft_delete_championship(championship_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if public.championship_actor_role(soft_delete_championship.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships
	set deleted_at = now()
	where id = soft_delete_championship.championship_id
		and deleted_at is null;

	if not found then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;
end;
$$;


ALTER FUNCTION public.soft_delete_championship(championship_id bigint) OWNER TO postgres;

--
-- TOC entry 464 (class 1255 OID 17819)
-- Name: soft_delete_championship_event(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.soft_delete_championship_event(event_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	player_ids bigint[];
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = soft_delete_championship_event.event_id
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	select coalesce(array_agg(a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = event.id;

	update public.championship_events
	set deleted_at = now()
	where id = event.id
		and deleted_at is null;

	if not found then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	perform public.sync_championship_players_from_attendance(player_ids);
end;
$$;


ALTER FUNCTION public.soft_delete_championship_event(event_id bigint) OWNER TO postgres;

--
-- TOC entry 445 (class 1255 OID 17927)
-- Name: start_championship_event_match(bigint, bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	team_a public.championship_event_teams%rowtype;
	team_b public.championship_event_teams%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if start_championship_event_match.team_a_id = start_championship_event_match.team_b_id then
		raise exception 'same team' using errcode = '23514';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = start_championship_event_match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if event.ended_at is not null then
		raise exception 'event already ended' using errcode = '23514';
	end if;

	if exists (
		select 1
		from public.championship_event_matches m
		where m.event_id = event.id
			and m.ended_at is null
	) then
		raise exception 'match already open' using errcode = '23505';
	end if;

	select *
	into team_a
	from public.championship_event_teams t
	where t.id = start_championship_event_match.team_a_id
		and t.event_id = event.id;

	select *
	into team_b
	from public.championship_event_teams t
	where t.id = start_championship_event_match.team_b_id
		and t.event_id = event.id;

	if team_a.id is null or team_b.id is null then
		raise exception 'team not in event' using errcode = '23514';
	end if;

	insert into public.championship_event_matches (
		event_id,
		team_a_id,
		team_b_id
	)
	values (
		event.id,
		team_a.id,
		team_b.id
	)
	returning * into match;

	insert into public.championship_event_match_players (
		match_id,
		event_id,
		team_id,
		player_id,
		display_name,
		is_goalkeeper,
		slot
	)
	select
		match.id,
		event.id,
		tp.team_id,
		tp.player_id,
		tp.display_name,
		tp.is_goalkeeper,
		case
			when tp.is_goalkeeper then 0
			else row_number() over (
				partition by tp.team_id, tp.is_goalkeeper
				order by tp.id
			)
		end
	from public.championship_event_team_players tp
	where tp.team_id in (team_a.id, team_b.id);

	return public.championship_event_match_json(match);
end;
$$;


ALTER FUNCTION public.start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) OWNER TO postgres;

--
-- TOC entry 355 (class 1255 OID 17979)
-- Name: sync_championship_players_from_attendance(bigint[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_championship_players_from_attendance(player_ids bigint[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
	if player_ids is null or cardinality(player_ids) is null then
		return;
	end if;

	update public.championship_players p
	set
		goals = coalesce(totals.goals, 0),
		assists = coalesce(totals.assists, 0),
		own_goals = coalesce(totals.own_goals, 0),
		wins = coalesce(totals.wins, 0),
		matches = coalesce(totals.matches, 0)
	from unnest(player_ids) as u(player_id)
	left join (
		select
			a.player_id,
			sum(
				case
					when open_match.event_id is null then a.goals
					else coalesce(ended_goals.n, 0)
				end
			)::integer as goals,
			sum(
				case
					when open_match.event_id is null then a.assists
					else coalesce(ended_assists.n, 0)
				end
			)::integer as assists,
			sum(
				case
					when open_match.event_id is null then a.own_goals
					else coalesce(ended_own_goals.n, 0)
				end
			)::integer as own_goals,
			sum(a.wins)::integer as wins,
			sum(a.matches)::integer as matches
		from public.championship_event_attendance a
		join public.championship_events e
			on e.id = a.event_id
		left join lateral (
			select m.event_id
			from public.championship_event_matches m
			where m.event_id = a.event_id
				and m.ended_at is null
			limit 1
		) open_match on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.scorer_player_id = a.player_id
				and not g.is_own_goal
				and m.ended_at is not null
		) ended_goals on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.assist_player_id = a.player_id
				and m.ended_at is not null
		) ended_assists on true
		left join lateral (
			select count(*)::integer as n
			from public.championship_event_goals g
			join public.championship_event_matches m
				on m.id = g.match_id
			where g.event_id = a.event_id
				and g.scorer_player_id = a.player_id
				and g.is_own_goal
				and m.ended_at is not null
		) ended_own_goals on true
		where a.player_id = any (player_ids)
			and e.deleted_at is null
		group by a.player_id
	) totals on totals.player_id = u.player_id
	where p.id = u.player_id;
end;
$$;


ALTER FUNCTION public.sync_championship_players_from_attendance(player_ids bigint[]) OWNER TO postgres;

--
-- TOC entry 438 (class 1255 OID 17578)
-- Name: sync_platform_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_platform_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
	insert into public.users (id, email, display_name, avatar_url)
	values (
		new.id,
		new.email,
		coalesce(
			nullif(new.raw_user_meta_data ->> 'full_name', ''),
			nullif(new.raw_user_meta_data ->> 'name', ''),
			nullif(new.email, ''),
			'Jogador'
		),
		coalesce(
			nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
			nullif(new.raw_user_meta_data ->> 'picture', '')
		)
	)
	on conflict (id) do update
	set
		email = excluded.email,
		display_name = excluded.display_name,
		avatar_url = excluded.avatar_url,
		updated_at = now();

	return new;
end;
$$;


ALTER FUNCTION public.sync_platform_user() OWNER TO postgres;

--
-- TOC entry 362 (class 1255 OID 17608)
-- Name: transfer_championship_owner(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.transfer_championship_owner(player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
	previous_owner uuid;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = transfer_championship_owner.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	if player.user_id = championship.created_by then
		raise exception 'cannot transfer to self' using errcode = '23514';
	end if;

	previous_owner := championship.created_by;

	update public.championships
	set created_by = player.user_id
	where id = championship.id
	returning * into championship;

	update public.championship_players
	set role = 'member'
	where championship_id = championship.id
		and user_id = previous_owner
		and deleted_at is null;

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by
	);
end;
$$;


ALTER FUNCTION public.transfer_championship_owner(player_id bigint) OWNER TO postgres;

--
-- TOC entry 327 (class 1255 OID 18043)
-- Name: undo_championship_event_goal(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.undo_championship_event_goal(match_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	event public.championship_events%rowtype;
	match public.championship_event_matches%rowtype;
	goal public.championship_event_goals%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into match
	from public.championship_event_matches m
	where m.id = undo_championship_event_goal.match_id;

	if match.id is null then
		raise exception 'match not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = match.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if not public.is_championship_member(event.championship_id) then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if match.ended_at is not null then
		raise exception 'match already ended' using errcode = '23514';
	end if;

	select *
	into goal
	from public.championship_event_goals g
	where g.match_id = match.id
	order by g.created_at desc, g.id desc
	limit 1;

	if goal.id is null then
		raise exception 'no goal to undo' using errcode = 'P0002';
	end if;

	delete from public.championship_event_goals
	where id = goal.id;

	perform public.refresh_championship_event_attendance_stats(event.id);

	return jsonb_build_object(
		'id', goal.id,
		'match_id', goal.match_id,
		'event_id', goal.event_id,
		'scorer_player_id', goal.scorer_player_id,
		'assist_player_id', goal.assist_player_id,
		'is_own_goal', goal.is_own_goal,
		'created_at', goal.created_at
	);
end;
$$;


ALTER FUNCTION public.undo_championship_event_goal(match_id bigint) OWNER TO postgres;

--
-- TOC entry 339 (class 1255 OID 17638)
-- Name: unlink_player(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.unlink_player(player_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	championship public.championships%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = unlink_player.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = player.championship_id
		and c.deleted_at is null;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if player.user_id is null then
		raise exception 'player has no account' using errcode = '23514';
	end if;

	if player.user_id = championship.created_by then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set
		user_id = null,
		avatar_url = null,
		role = 'member'
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.unlink_player(player_id bigint) OWNER TO postgres;

--
-- TOC entry 330 (class 1255 OID 18042)
-- Name: update_championship_event_config(bigint, time without time zone, smallint, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	championship public.championships%rowtype;
	open_event_ids bigint[];
	player_ids bigint[];
	open_event_id bigint;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_championship_event_config.players_per_team < 3
		or update_championship_event_config.players_per_team > 11 then
		raise exception 'invalid players per team' using errcode = '23514';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_event_config.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships
	set
		event_time = update_championship_event_config.event_time,
		players_per_team = update_championship_event_config.players_per_team,
		skip_guest_goalkeeper_matches = coalesce(
			update_championship_event_config.skip_guest_goalkeeper_matches,
			false
		)
	where id = championship.id
	returning * into championship;

	select coalesce(array_agg(e.id), '{}')
	into open_event_ids
	from public.championship_events e
	where e.championship_id = championship.id
		and e.ended_at is null
		and e.deleted_at is null;

	update public.championship_events
	set skip_guest_goalkeeper_matches = championship.skip_guest_goalkeeper_matches
	where id = any (open_event_ids);

	foreach open_event_id in array open_event_ids loop
		perform public.refresh_championship_event_attendance_stats(open_event_id);
	end loop;

	select coalesce(array_agg(distinct a.player_id), '{}')
	into player_ids
	from public.championship_event_attendance a
	where a.event_id = any (open_event_ids);

	perform public.sync_championship_players_from_attendance(player_ids);

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'skip_guest_goalkeeper_matches', championship.skip_guest_goalkeeper_matches
	);
end;
$$;


ALTER FUNCTION public.update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean) OWNER TO postgres;

--
-- TOC entry 319 (class 1255 OID 17842)
-- Name: update_championship_event_team(bigint, text, jsonb, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
	event public.championship_events%rowtype;
	target_team public.championship_event_teams%rowtype;
	normalized_color text;
	ids bigint[];
	current_player_id bigint;
	seen_players bigint[] := '{}';
	player public.championship_players%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized_color := lower(team_color);
	if normalized_color is not null and normalized_color !~ '^#[0-9a-f]{6}$' then
		raise exception 'invalid team color' using errcode = '23514';
	end if;

	if jsonb_typeof(player_ids) is distinct from 'array' then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	if exists (
		select 1
		from jsonb_array_elements(player_ids) elem
		where jsonb_typeof(elem) is distinct from 'number'
	) then
		raise exception 'invalid teams' using errcode = '23514';
	end if;

	select coalesce(array_agg(elem::bigint), '{}')
	into ids
	from jsonb_array_elements_text(player_ids) as elem;

	select *
	into target_team
	from public.championship_event_teams t
	where t.id = update_championship_event_team.team_id;

	if target_team.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	select *
	into event
	from public.championship_events e
	where e.id = target_team.event_id
		and e.deleted_at is null
	for update;

	if event.id is null then
		raise exception 'event not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(event.championship_id) is distinct from 'owner' then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	if cardinality(ids) is null
		or cardinality(ids) = 0
		or cardinality(ids) > event.players_per_team then
		raise exception 'invalid team size' using errcode = '23514';
	end if;

	if update_championship_event_team.goalkeeper_id is distinct from 0
		and update_championship_event_team.goalkeeper_id <> all (ids) then
		raise exception 'invalid goalkeeper' using errcode = '23514';
	end if;

	if normalized_color is not null and exists (
		select 1
		from public.championship_event_teams t
		where t.event_id = event.id
			and t.id is distinct from target_team.id
			and t.color = normalized_color
	) then
		raise exception 'duplicate team color' using errcode = '23505';
	end if;

	foreach current_player_id in array ids loop
		if current_player_id = any (seen_players) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		seen_players := seen_players || current_player_id;

		if not exists (
			select 1
			from public.championship_event_attendance a
			where a.event_id = event.id
				and a.player_id = current_player_id
		) then
			raise exception 'player not present' using errcode = '23514';
		end if;

		if exists (
			select 1
			from public.championship_event_team_players tp
			where tp.event_id = event.id
				and tp.team_id is distinct from target_team.id
				and tp.player_id = current_player_id
		) then
			raise exception 'duplicate player' using errcode = '23505';
		end if;

		select *
		into player
		from public.championship_players p
		where p.id = current_player_id
			and p.championship_id = event.championship_id
			and p.deleted_at is null;

		if player.id is null then
			raise exception 'player not found' using errcode = 'P0002';
		end if;
	end loop;

	update public.championship_event_teams
	set color = normalized_color
	where id = target_team.id
	returning * into target_team;

	delete from public.championship_event_team_players tp
	where tp.team_id = target_team.id;

	foreach current_player_id in array ids loop
		select *
		into player
		from public.championship_players p
		where p.id = current_player_id;

		insert into public.championship_event_team_players (
			event_id,
			team_id,
			player_id,
			display_name,
			is_goalkeeper
		)
		values (
			event.id,
			target_team.id,
			player.id,
			coalesce(nullif(btrim(player.nickname), ''), player.display_name),
			current_player_id = update_championship_event_team.goalkeeper_id
				and update_championship_event_team.goalkeeper_id is distinct from 0
		);
	end loop;

	return jsonb_build_object(
		'id', target_team.id,
		'event_id', target_team.event_id,
		'color', target_team.color,
		'sort_order', target_team.sort_order
	);
end;
$_$;


ALTER FUNCTION public.update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) OWNER TO postgres;

--
-- TOC entry 458 (class 1255 OID 17596)
-- Name: update_championship_name(bigint, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_championship_name(championship_id bigint, name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	championship public.championships%rowtype;
	trimmed text := btrim(update_championship_name.name);
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if trimmed is null or trimmed = '' then
		raise exception 'invalid name' using errcode = '23514';
	end if;

	if public.championship_actor_role(update_championship_name.championship_id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships c
	set name = trimmed
	where c.id = update_championship_name.championship_id
	returning * into championship;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path
	);
end;
$$;


ALTER FUNCTION public.update_championship_name(championship_id bigint, name text) OWNER TO postgres;

--
-- TOC entry 352 (class 1255 OID 17824)
-- Name: update_championship_visibility(bigint, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_championship_visibility(championship_id bigint, is_visible boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	championship public.championships%rowtype;
begin
	if (select auth.uid()) is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	select *
	into championship
	from public.championships c
	where c.id = update_championship_visibility.championship_id
		and c.deleted_at is null
	for update;

	if championship.id is null then
		raise exception 'championship not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(championship.id) not in ('owner', 'captain') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championships
	set is_visible = update_championship_visibility.is_visible
	where id = championship.id
	returning * into championship;

	return jsonb_build_object(
		'id', championship.id,
		'name', championship.name,
		'invite_code', championship.invite_code,
		'created_by', championship.created_by,
		'logo_path', championship.logo_path,
		'event_time', championship.event_time,
		'players_per_team', championship.players_per_team,
		'is_visible', championship.is_visible
	);
end;
$$;


ALTER FUNCTION public.update_championship_visibility(championship_id bigint, is_visible boolean) OWNER TO postgres;

--
-- TOC entry 475 (class 1255 OID 17821)
-- Name: update_player_nickname(bigint, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_player_nickname(player_id bigint, nickname text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
	normalized text;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	normalized := nullif(btrim(coalesce(update_player_nickname.nickname, '')), '');
	if normalized is not null and char_length(normalized) > 40 then
		raise exception 'invalid nickname' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_nickname.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in ('owner', 'captain', 'admin')
		and player.user_id is distinct from viewer then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set nickname = normalized
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.update_player_nickname(player_id bigint, nickname text) OWNER TO postgres;

--
-- TOC entry 386 (class 1255 OID 17626)
-- Name: update_player_rating(bigint, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_player_rating(player_id bigint, rating numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
	viewer uuid := (select auth.uid());
	player public.championship_players%rowtype;
begin
	if viewer is null then
		raise exception 'not authenticated' using errcode = '42501';
	end if;

	if update_player_rating.rating < 0 or update_player_rating.rating > 100 then
		raise exception 'invalid rating' using errcode = '23514';
	end if;

	select *
	into player
	from public.championship_players p
	where p.id = update_player_rating.player_id
	for update;

	if player.id is null or player.deleted_at is not null then
		raise exception 'player not found' using errcode = 'P0002';
	end if;

	if public.championship_actor_role(player.championship_id) not in ('owner', 'captain', 'admin') then
		raise exception 'not allowed' using errcode = '42501';
	end if;

	update public.championship_players
	set rating = update_player_rating.rating
	where id = player.id
	returning * into player;

	return public.championship_player_json(player);
end;
$$;


ALTER FUNCTION public.update_player_rating(player_id bigint, rating numeric) OWNER TO postgres;

--
-- TOC entry 453 (class 1255 OID 17224)
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- TOC entry 353 (class 1255 OID 17227)
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 418 (class 1255 OID 17228)
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_realtime_admin;

--
-- TOC entry 430 (class 1255 OID 17229)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_realtime_admin;

--
-- TOC entry 335 (class 1255 OID 17230)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 389 (class 1255 OID 17231)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_realtime_admin;

--
-- TOC entry 470 (class 1255 OID 17232)
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_realtime_admin;

--
-- TOC entry 372 (class 1255 OID 17233)
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- TOC entry 442 (class 1255 OID 17234)
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_realtime_admin;

--
-- TOC entry 420 (class 1255 OID 17235)
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- TOC entry 440 (class 1255 OID 17236)
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- TOC entry 410 (class 1255 OID 17237)
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_realtime_admin;

--
-- TOC entry 416 (class 1255 OID 17240)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 363 (class 1255 OID 17241)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- TOC entry 463 (class 1255 OID 17242)
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_realtime_admin;

--
-- TOC entry 334 (class 1255 OID 17474)
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- TOC entry 468 (class 1255 OID 17473)
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- TOC entry 412 (class 1255 OID 17349)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- TOC entry 377 (class 1255 OID 17405)
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- TOC entry 435 (class 1255 OID 17324)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 462 (class 1255 OID 17323)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 354 (class 1255 OID 17322)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- TOC entry 323 (class 1255 OID 17462)
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- TOC entry 397 (class 1255 OID 17336)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- TOC entry 326 (class 1255 OID 17388)
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- TOC entry 328 (class 1255 OID 17463)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text) OWNER TO supabase_storage_admin;

--
-- TOC entry 324 (class 1255 OID 17404)
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- TOC entry 417 (class 1255 OID 17469)
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- TOC entry 390 (class 1255 OID 17338)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- TOC entry 380 (class 1255 OID 17467)
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) OWNER TO supabase_storage_admin;

--
-- TOC entry 415 (class 1255 OID 17466)
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- TOC entry 471 (class 1255 OID 17339)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- TOC entry 260 (class 1259 OID 16529)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- TOC entry 4599 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- TOC entry 279 (class 1259 OID 17084)
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 273 (class 1259 OID 16889)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- TOC entry 4602 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- TOC entry 264 (class 1259 OID 16687)
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- TOC entry 4604 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- TOC entry 4605 (class 0 OID 0)
-- Dependencies: 264
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- TOC entry 259 (class 1259 OID 16522)
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- TOC entry 4607 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- TOC entry 268 (class 1259 OID 16776)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- TOC entry 4609 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- TOC entry 267 (class 1259 OID 16764)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- TOC entry 4611 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- TOC entry 266 (class 1259 OID 16751)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- TOC entry 4613 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- TOC entry 4614 (class 0 OID 0)
-- Dependencies: 266
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- TOC entry 276 (class 1259 OID 17001)
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- TOC entry 278 (class 1259 OID 17074)
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- TOC entry 4617 (class 0 OID 0)
-- Dependencies: 278
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- TOC entry 275 (class 1259 OID 16971)
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- TOC entry 277 (class 1259 OID 17034)
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- TOC entry 274 (class 1259 OID 16939)
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 258 (class 1259 OID 16511)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- TOC entry 4622 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- TOC entry 257 (class 1259 OID 16510)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- TOC entry 4624 (class 0 OID 0)
-- Dependencies: 257
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 271 (class 1259 OID 16818)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 4626 (class 0 OID 0)
-- Dependencies: 271
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- TOC entry 272 (class 1259 OID 16836)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- TOC entry 4628 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- TOC entry 261 (class 1259 OID 16537)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- TOC entry 4630 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- TOC entry 265 (class 1259 OID 16717)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- TOC entry 4632 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- TOC entry 4633 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- TOC entry 4634 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- TOC entry 4635 (class 0 OID 0)
-- Dependencies: 265
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- TOC entry 270 (class 1259 OID 16803)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- TOC entry 4637 (class 0 OID 0)
-- Dependencies: 270
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- TOC entry 269 (class 1259 OID 16794)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- TOC entry 4639 (class 0 OID 0)
-- Dependencies: 269
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- TOC entry 4640 (class 0 OID 0)
-- Dependencies: 269
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- TOC entry 256 (class 1259 OID 16499)
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- TOC entry 4642 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- TOC entry 4643 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- TOC entry 281 (class 1259 OID 17149)
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- TOC entry 280 (class 1259 OID 17126)
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- TOC entry 312 (class 1259 OID 17780)
-- Name: championship_event_attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_event_attendance (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    player_id bigint NOT NULL,
    display_name text NOT NULL,
    is_goalkeeper boolean DEFAULT false NOT NULL,
    event_date date NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    own_goals integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    matches integer DEFAULT 0 NOT NULL,
    rating numeric(4,1) DEFAULT 0 NOT NULL,
    rating_delta numeric(4,1) DEFAULT 0 NOT NULL,
    CONSTRAINT championship_event_attendance_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (100)::numeric))),
    CONSTRAINT championship_event_attendance_stats_check CHECK (((goals >= 0) AND (assists >= 0) AND (own_goals >= 0) AND (wins >= 0) AND (matches >= 0) AND (wins <= matches)))
);


ALTER TABLE public.championship_event_attendance OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 17779)
-- Name: championship_event_attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_attendance ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_event_attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 316 (class 1259 OID 17894)
-- Name: championship_event_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_event_goals (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    event_id bigint NOT NULL,
    scorer_player_id bigint NOT NULL,
    assist_player_id bigint,
    is_own_goal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT championship_event_goals_own_goal_assist_check CHECK (((NOT is_own_goal) OR (assist_player_id IS NULL))),
    CONSTRAINT championship_event_goals_scorer_assist_check CHECK ((scorer_player_id IS DISTINCT FROM assist_player_id))
);


ALTER TABLE public.championship_event_goals OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 17893)
-- Name: championship_event_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_goals ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_event_goals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 314 (class 1259 OID 17856)
-- Name: championship_event_match_players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_event_match_players (
    id bigint NOT NULL,
    match_id bigint NOT NULL,
    event_id bigint NOT NULL,
    team_id bigint NOT NULL,
    player_id bigint NOT NULL,
    display_name text NOT NULL,
    is_goalkeeper boolean DEFAULT false NOT NULL,
    slot smallint NOT NULL,
    CONSTRAINT championship_event_match_players_slot_check CHECK (((slot >= 0) AND (slot < 11)))
);


ALTER TABLE public.championship_event_match_players OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 17855)
-- Name: championship_event_match_players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_match_players ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_event_match_players_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 309 (class 1259 OID 17718)
-- Name: championship_event_matches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_matches ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_event_matches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 308 (class 1259 OID 17696)
-- Name: championship_event_team_players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_event_team_players (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    team_id bigint NOT NULL,
    player_id bigint NOT NULL,
    display_name text NOT NULL,
    is_goalkeeper boolean DEFAULT false NOT NULL
);


ALTER TABLE public.championship_event_team_players OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 17695)
-- Name: championship_event_team_players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_team_players ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_event_team_players_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 306 (class 1259 OID 17677)
-- Name: championship_event_teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_event_teams (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    color text,
    sort_order smallint NOT NULL,
    CONSTRAINT championship_event_teams_color_check CHECK (((color IS NULL) OR (color ~ '^#[0-9a-f]{6}$'::text)))
);


ALTER TABLE public.championship_event_teams OWNER TO postgres;

--
-- TOC entry 305 (class 1259 OID 17676)
-- Name: championship_event_teams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_teams ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_event_teams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 304 (class 1259 OID 17656)
-- Name: championship_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championship_events (
    id bigint NOT NULL,
    championship_id bigint NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    players_per_team smallint NOT NULL,
    ended_at timestamp with time zone,
    created_by uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    skip_guest_goalkeeper_matches boolean DEFAULT false NOT NULL,
    CONSTRAINT championship_events_players_per_team_check CHECK (((players_per_team >= 3) AND (players_per_team <= 11)))
);


ALTER TABLE public.championship_events OWNER TO postgres;

--
-- TOC entry 303 (class 1259 OID 17655)
-- Name: championship_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 299 (class 1259 OID 17519)
-- Name: championship_players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_players ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championship_players_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 298 (class 1259 OID 17502)
-- Name: championships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.championships (
    id bigint NOT NULL,
    name text NOT NULL,
    invite_code text DEFAULT substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 16) NOT NULL,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    logo_path text,
    deleted_at timestamp with time zone,
    event_time time without time zone DEFAULT '19:00:00'::time without time zone NOT NULL,
    players_per_team smallint DEFAULT 5 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    skip_guest_goalkeeper_matches boolean DEFAULT false NOT NULL,
    CONSTRAINT championships_players_per_team_check CHECK (((players_per_team >= 3) AND (players_per_team <= 11)))
);


ALTER TABLE public.championships OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 17501)
-- Name: championships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.championships ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.championships_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 301 (class 1259 OID 17561)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text,
    display_name text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 17243)
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- TOC entry 286 (class 1259 OID 17250)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone DEFAULT now()
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- TOC entry 287 (class 1259 OID 17253)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_realtime_admin;

--
-- TOC entry 288 (class 1259 OID 17263)
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 290 (class 1259 OID 17294)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- TOC entry 4670 (class 0 OID 0)
-- Dependencies: 290
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 294 (class 1259 OID 17414)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- TOC entry 295 (class 1259 OID 17427)
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- TOC entry 289 (class 1259 OID 17286)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- TOC entry 291 (class 1259 OID 17304)
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- TOC entry 4674 (class 0 OID 0)
-- Dependencies: 291
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- TOC entry 292 (class 1259 OID 17353)
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- TOC entry 293 (class 1259 OID 17367)
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- TOC entry 296 (class 1259 OID 17437)
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- TOC entry 302 (class 1259 OID 17628)
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
-- TOC entry 3730 (class 2604 OID 16514)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 4393 (class 0 OID 16529)
-- Dependencies: 260
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- TOC entry 4410 (class 0 OID 17084)
-- Dependencies: 279
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- TOC entry 4404 (class 0 OID 16889)
-- Dependencies: 273
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
a01c9760-f519-424b-9fd3-7ecc9ce963b8	\N	\N	\N	\N	google			2026-08-13 15:03:19.778459+00	2026-08-13 15:03:19.778459+00	oauth	\N	\N	http://localhost:5173/join/c5e1b780188d45f9?claim=2	\N	\N	f
88067d33-bb8e-4db8-9379-fa75b1d867b2	\N	\N	\N	\N	google			2026-08-13 21:34:57.817405+00	2026-08-13 21:34:57.817405+00	oauth	\N	\N	http://localhost:5173/	\N	\N	f
ce689df7-9165-4365-ba0c-fb80500b7012	\N	\N	\N	\N	google			2026-08-13 21:57:02.487141+00	2026-08-13 21:57:02.487141+00	oauth	\N	\N	https://baba-do-mago.vercel.app/join/153d9312b46143e1?claim=55	\N	\N	f
cb0f77b0-2928-476d-8583-db91dd0aa035	\N	\N	\N	\N	google			2026-08-14 00:19:03.448225+00	2026-08-14 00:19:03.448225+00	oauth	\N	\N	https://baba-do-mago.vercel.app	\N	\N	f
f13338d6-3d8a-4ec9-a5ea-40acc682abdf	\N	\N	\N	\N	google			2026-08-14 11:14:25.645434+00	2026-08-14 11:14:25.645434+00	oauth	\N	\N	https://baba-do-mago.vercel.app/join/153d9312b46143e1?claim=53	\N	\N	f
\.


--
-- TOC entry 4395 (class 0 OID 16687)
-- Dependencies: 264
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
107491523619919867504	269089d0-7e10-41e7-9537-bf70586ec474	{"iss": "https://accounts.google.com", "sub": "107491523619919867504", "name": "Ryller Fonseca", "email": "ryllerfonseca4@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKIrhzxXDbyzfwUuxUR8j0BLN3Q2Cjp87erlWt-Izd9wp3Lwg=s96-c", "full_name": "Ryller Fonseca", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKIrhzxXDbyzfwUuxUR8j0BLN3Q2Cjp87erlWt-Izd9wp3Lwg=s96-c", "provider_id": "107491523619919867504", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:24:13.125757+00	2026-08-13 22:24:13.12581+00	2026-08-13 22:24:13.12581+00	02560fb0-246a-4474-b996-0092dd41e811
112004717354959841723	f3b0d083-2a64-4493-8601-5949b4f7c0b3	{"iss": "https://accounts.google.com", "sub": "112004717354959841723", "name": "João Vitor Dantas Teixeira", "email": "jvteixeira5621@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKJF5WJbjx8aiMCLMIsordlM1LbBHpx6y4a2mS_hd-lajcnzWeB=s96-c", "full_name": "João Vitor Dantas Teixeira", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKJF5WJbjx8aiMCLMIsordlM1LbBHpx6y4a2mS_hd-lajcnzWeB=s96-c", "provider_id": "112004717354959841723", "email_verified": true, "phone_verified": false}	google	2026-08-13 21:56:57.63542+00	2026-08-13 21:56:57.635464+00	2026-08-13 21:56:57.635464+00	c90b793d-3974-41dd-ae5c-e078e6235cca
115394765353504771483	7e9bb73f-b400-432d-a3fd-77ad81ce6a62	{"iss": "https://accounts.google.com", "sub": "115394765353504771483", "name": "Gustavo Dourado", "email": "gustavodouurado@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKx4SOa8fHCmndbB0C4AnU_YPWAlzwyE4fXRJO7HLjCdrnP4yJE=s96-c", "full_name": "Gustavo Dourado", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKx4SOa8fHCmndbB0C4AnU_YPWAlzwyE4fXRJO7HLjCdrnP4yJE=s96-c", "provider_id": "115394765353504771483", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:39:10.561244+00	2026-08-13 22:39:10.561305+00	2026-08-13 22:39:10.561305+00	721ded3c-b840-4a70-977a-299a68ab4ad5
108040976016018736809	65c87b46-dd10-468e-b6c5-74a423df5a4a	{"iss": "https://accounts.google.com", "sub": "108040976016018736809", "name": "Alysson Victor", "email": "vitinhofazendeirotb@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLIMXwUdAJ-rhwopdpfME6X_rU9B51oXveqs_FMAb-_AG2Y6qs=s96-c", "full_name": "Alysson Victor", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLIMXwUdAJ-rhwopdpfME6X_rU9B51oXveqs_FMAb-_AG2Y6qs=s96-c", "provider_id": "108040976016018736809", "email_verified": true, "phone_verified": false}	google	2026-08-13 21:57:55.20766+00	2026-08-13 21:57:55.208396+00	2026-08-13 21:57:55.208396+00	64ea4955-e0eb-4ef3-9261-b592d8830922
115115260936950891361	706d1e98-818e-47bf-b193-daa3adf6b8ed	{"iss": "https://accounts.google.com", "sub": "115115260936950891361", "name": "WILSON MOTA", "email": "wilsonaaju@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKy-fVWbZ4Z_P_YguecEEg2KaCZfd9mfcbetaoBv4aNmzqtow=s96-c", "full_name": "WILSON MOTA", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKy-fVWbZ4Z_P_YguecEEg2KaCZfd9mfcbetaoBv4aNmzqtow=s96-c", "provider_id": "115115260936950891361", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:01:11.435803+00	2026-08-13 22:01:11.435856+00	2026-08-13 22:01:11.435856+00	1a2ffce0-11f1-4584-8070-f0479c76f4fd
113099285733452270754	d8334794-c377-4002-8f01-3f17f916625a	{"iss": "https://accounts.google.com", "sub": "113099285733452270754", "name": "Antonio Vitor", "email": "antonyovitor22@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJY-Dh5nT4EpLbMkNCSM8Q3M44qeEP6Uvd2cOPQ_wnZhvUAJg=s96-c", "full_name": "Antonio Vitor", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJY-Dh5nT4EpLbMkNCSM8Q3M44qeEP6Uvd2cOPQ_wnZhvUAJg=s96-c", "provider_id": "113099285733452270754", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:03:19.527571+00	2026-08-13 22:03:19.527619+00	2026-08-13 22:03:19.527619+00	86710500-ab66-4ee0-b51b-47d636b73f80
112239934268121114193	4e2a21c0-8c51-4076-860a-470e20b42d90	{"iss": "https://accounts.google.com", "sub": "112239934268121114193", "name": "Jean Marx Anjos", "email": "marx10jean.anjos@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKStLjPxR4ygEY4-sMsTirR9bYCM0Fjz3Jm-gYhPG9b6gwvhKAI1g=s96-c", "full_name": "Jean Marx Anjos", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKStLjPxR4ygEY4-sMsTirR9bYCM0Fjz3Jm-gYhPG9b6gwvhKAI1g=s96-c", "provider_id": "112239934268121114193", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:03:52.202128+00	2026-08-13 22:03:52.202173+00	2026-08-13 22:03:52.202173+00	e5fc23c1-99ca-4fd5-ac54-efb8d5046eba
110970026361999020389	b1a54856-c37a-46a8-b171-4f540688c538	{"iss": "https://accounts.google.com", "sub": "110970026361999020389", "name": "Arthur De Jesus Santos", "email": "shawnp138@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKMuc8yel4uIp2bhVzkrLy8-CgBoVUL-r_92YamhaAV1xEg3ojQ=s96-c", "full_name": "Arthur De Jesus Santos", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKMuc8yel4uIp2bhVzkrLy8-CgBoVUL-r_92YamhaAV1xEg3ojQ=s96-c", "provider_id": "110970026361999020389", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:34:31.595002+00	2026-08-13 22:34:31.595051+00	2026-08-13 22:34:31.595051+00	0a9875e1-72e1-4b25-aee5-5c7edfd8127a
114938764319538454275	28c7d012-3395-4b1e-9105-9a52ea533684	{"iss": "https://accounts.google.com", "sub": "114938764319538454275", "name": "Joeliton Souza", "email": "joelitonsouza127@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKyzh9ixV7Fx6kY6RgaFYrQNjVWksJKYXOFSaWoS7SIPKNmbUIphg=s96-c", "full_name": "Joeliton Souza", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKyzh9ixV7Fx6kY6RgaFYrQNjVWksJKYXOFSaWoS7SIPKNmbUIphg=s96-c", "provider_id": "114938764319538454275", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:04:48.019217+00	2026-08-13 22:04:48.019266+00	2026-08-13 22:04:48.019266+00	5cb7e832-c955-422b-bc12-f826356c1f19
116775274652851360237	5656ca85-54d0-4194-afae-c705e22e8063	{"iss": "https://accounts.google.com", "sub": "116775274652851360237", "name": "Ivan Rocha", "email": "ivanrocha977@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLGJfUbiAJp-HiUQ0FlCLWN2952k9diWOdoC6AjypMFo7hT2TvH=s96-c", "full_name": "Ivan Rocha", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLGJfUbiAJp-HiUQ0FlCLWN2952k9diWOdoC6AjypMFo7hT2TvH=s96-c", "provider_id": "116775274652851360237", "email_verified": true, "phone_verified": false}	google	2026-08-13 22:07:56.773929+00	2026-08-13 22:07:56.773974+00	2026-08-13 22:07:56.773974+00	49b1aff9-32c8-48b6-8a3b-682de082a585
116986486010143905003	447fde8b-49d3-4433-a542-cbb69b9f683f	{"iss": "https://accounts.google.com", "sub": "116986486010143905003", "name": "Murilo dos Anjos Montino", "email": "murilo.montino@dcomp.ufs.br", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLwAebmLiQ9wWvdi1kM2c1GE5M1IOSxtDmYWbGSCixZVYMP5w=s96-c", "full_name": "Murilo dos Anjos Montino", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLwAebmLiQ9wWvdi1kM2c1GE5M1IOSxtDmYWbGSCixZVYMP5w=s96-c", "provider_id": "116986486010143905003", "custom_claims": {"hd": "dcomp.ufs.br"}, "email_verified": true, "phone_verified": false}	google	2026-08-13 20:42:44.401146+00	2026-08-13 20:42:44.401198+00	2026-08-13 21:41:39.963117+00	bc87fe07-f322-4905-b9b4-034d12c46b5e
103074034017757340278	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	{"iss": "https://accounts.google.com", "sub": "103074034017757340278", "name": "Murilo Montino", "email": "murilomontino21@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c", "full_name": "Murilo Montino", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c", "provider_id": "103074034017757340278", "email_verified": true, "phone_verified": false}	google	2026-08-13 12:49:00.312072+00	2026-08-13 12:49:00.312116+00	2026-08-13 22:34:56.004452+00	0b3b6a8c-012c-4837-9aea-3ae6379db5d2
104288597169001324725	b68e362f-1116-42c4-94f6-39645662b2d3	{"iss": "https://accounts.google.com", "sub": "104288597169001324725", "name": "Rainer M", "email": "rainerdemoura005@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL_4dXLTJ5ChSi-W4yKX88MCS5ble9Av_-ND5yZ7PvLc6WL3PDZ=s96-c", "full_name": "Rainer M", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL_4dXLTJ5ChSi-W4yKX88MCS5ble9Av_-ND5yZ7PvLc6WL3PDZ=s96-c", "provider_id": "104288597169001324725", "email_verified": true, "phone_verified": false}	google	2026-08-13 23:30:32.863028+00	2026-08-13 23:30:32.863076+00	2026-08-13 23:30:32.863076+00	cc01e2f4-13fb-4200-9754-53e83458b3d4
\.


--
-- TOC entry 4392 (class 0 OID 16522)
-- Dependencies: 259
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4399 (class 0 OID 16776)
-- Dependencies: 268
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
87016112-ea10-4c6c-9ee8-2a7d6b3b8f3d	2026-08-13 21:56:57.65296+00	2026-08-13 21:56:57.65296+00	oauth	0dde5eb1-29c1-4342-923a-45e6658ce5a7
3b38ea0b-e3f6-4755-8309-37491e67e13c	2026-08-13 21:57:03.562454+00	2026-08-13 21:57:03.562454+00	oauth	fb311442-0564-4a98-bb40-fb9733d89db0
a1033166-13ac-4f2d-a87f-f3dc1d8c4c04	2026-08-13 21:57:55.21541+00	2026-08-13 21:57:55.21541+00	oauth	dff5e6a5-6355-4198-812f-b0587f5f4905
bf68f9b8-c0f9-47ce-9dbe-c3a831ba80cd	2026-08-13 22:01:11.452777+00	2026-08-13 22:01:11.452777+00	oauth	c5f54cac-5b2f-4d8c-a036-3fdefa8341d3
0b5ce342-a158-46e1-b3b8-de393a50de27	2026-08-13 22:03:19.538598+00	2026-08-13 22:03:19.538598+00	oauth	d6d920a6-e6ea-4b4c-9093-360a584bd3d1
3225fa85-a138-45ba-8f8e-c6961a8d8acb	2026-08-13 22:03:52.212621+00	2026-08-13 22:03:52.212621+00	oauth	43719d85-725e-4cd0-95ea-56cc836fd794
b08537c1-0d07-4ed5-8fd9-26493bb162ba	2026-08-13 22:04:48.033625+00	2026-08-13 22:04:48.033625+00	oauth	5a9fe068-5eb7-4597-8019-c58fd54ed5ba
fd3d6f8a-00ad-4588-b03e-5d1c8987c126	2026-08-13 22:07:56.789467+00	2026-08-13 22:07:56.789467+00	oauth	07abf361-c92b-4388-9b64-65ff26fa7ec0
155642ea-3255-4142-a651-a613e3a416da	2026-08-13 22:24:13.152352+00	2026-08-13 22:24:13.152352+00	oauth	403af4b5-34c3-4d93-a20f-c5405b8d88b8
fb2eb133-021a-4dc9-8ebe-a4e82548e4b1	2026-08-13 22:34:31.610441+00	2026-08-13 22:34:31.610441+00	oauth	36a83557-f5a9-43e6-aba9-de9c65c6f3f5
44df5607-eac0-4829-8c62-542704b3d1c7	2026-08-13 22:34:56.035047+00	2026-08-13 22:34:56.035047+00	oauth	d29ae538-eec5-462d-8f3b-0d437b42ed3d
923c7f80-58bd-458e-a89b-36bbf553d8e4	2026-08-13 22:39:10.574358+00	2026-08-13 22:39:10.574358+00	oauth	95ac7ce8-f2df-4be1-83cc-bee2b5b6acbe
20d52ddc-b77b-42e0-b223-4d10e72b15ef	2026-08-13 23:30:32.896498+00	2026-08-13 23:30:32.896498+00	oauth	15a2b4dd-5aa3-4f05-96e2-ba830ea5f7b9
\.


--
-- TOC entry 4398 (class 0 OID 16764)
-- Dependencies: 267
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- TOC entry 4397 (class 0 OID 16751)
-- Dependencies: 266
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- TOC entry 4407 (class 0 OID 17001)
-- Dependencies: 276
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- TOC entry 4409 (class 0 OID 17074)
-- Dependencies: 278
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- TOC entry 4406 (class 0 OID 16971)
-- Dependencies: 275
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- TOC entry 4408 (class 0 OID 17034)
-- Dependencies: 277
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- TOC entry 4405 (class 0 OID 16939)
-- Dependencies: 274
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4391 (class 0 OID 16511)
-- Dependencies: 258
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	29	c6u6vu5ce5oc	f3b0d083-2a64-4493-8601-5949b4f7c0b3	f	2026-08-13 21:56:57.649908+00	2026-08-13 21:56:57.649908+00	\N	87016112-ea10-4c6c-9ee8-2a7d6b3b8f3d
00000000-0000-0000-0000-000000000000	31	gfddgjwskg3h	65c87b46-dd10-468e-b6c5-74a423df5a4a	f	2026-08-13 21:57:55.213804+00	2026-08-13 21:57:55.213804+00	\N	a1033166-13ac-4f2d-a87f-f3dc1d8c4c04
00000000-0000-0000-0000-000000000000	32	2c2jwdch7nce	706d1e98-818e-47bf-b193-daa3adf6b8ed	f	2026-08-13 22:01:11.448369+00	2026-08-13 22:01:11.448369+00	\N	bf68f9b8-c0f9-47ce-9dbe-c3a831ba80cd
00000000-0000-0000-0000-000000000000	34	kpb5ir3tzii6	4e2a21c0-8c51-4076-860a-470e20b42d90	f	2026-08-13 22:03:52.211091+00	2026-08-13 22:03:52.211091+00	\N	3225fa85-a138-45ba-8f8e-c6961a8d8acb
00000000-0000-0000-0000-000000000000	36	gzvpinexygfg	5656ca85-54d0-4194-afae-c705e22e8063	f	2026-08-13 22:07:56.785938+00	2026-08-13 22:07:56.785938+00	\N	fd3d6f8a-00ad-4588-b03e-5d1c8987c126
00000000-0000-0000-0000-000000000000	38	p4xbvwuaw6lo	b1a54856-c37a-46a8-b171-4f540688c538	f	2026-08-13 22:34:31.607534+00	2026-08-13 22:34:31.607534+00	\N	fb2eb133-021a-4dc9-8ebe-a4e82548e4b1
00000000-0000-0000-0000-000000000000	41	nazdeh77ifsc	b68e362f-1116-42c4-94f6-39645662b2d3	f	2026-08-13 23:30:32.884579+00	2026-08-13 23:30:32.884579+00	\N	20d52ddc-b77b-42e0-b223-4d10e72b15ef
00000000-0000-0000-0000-000000000000	39	a4l3h53vjgmw	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-13 22:34:56.029405+00	2026-08-13 23:33:08.305814+00	\N	44df5607-eac0-4829-8c62-542704b3d1c7
00000000-0000-0000-0000-000000000000	40	or246t2hb6tp	7e9bb73f-b400-432d-a3fd-77ad81ce6a62	t	2026-08-13 22:39:10.571516+00	2026-08-13 23:57:40.942704+00	\N	923c7f80-58bd-458e-a89b-36bbf553d8e4
00000000-0000-0000-0000-000000000000	43	rpmlbok7ar6i	7e9bb73f-b400-432d-a3fd-77ad81ce6a62	f	2026-08-13 23:57:40.955047+00	2026-08-13 23:57:40.955047+00	or246t2hb6tp	923c7f80-58bd-458e-a89b-36bbf553d8e4
00000000-0000-0000-0000-000000000000	35	t4dj5yuoighe	28c7d012-3395-4b1e-9105-9a52ea533684	t	2026-08-13 22:04:48.030156+00	2026-08-14 00:01:46.289188+00	\N	b08537c1-0d07-4ed5-8fd9-26493bb162ba
00000000-0000-0000-0000-000000000000	37	2aopwjgic77w	269089d0-7e10-41e7-9537-bf70586ec474	t	2026-08-13 22:24:13.143444+00	2026-08-14 00:26:25.261748+00	\N	155642ea-3255-4142-a651-a613e3a416da
00000000-0000-0000-0000-000000000000	45	iplu25mc5lw5	269089d0-7e10-41e7-9537-bf70586ec474	f	2026-08-14 00:26:25.266803+00	2026-08-14 00:26:25.266803+00	2aopwjgic77w	155642ea-3255-4142-a651-a613e3a416da
00000000-0000-0000-0000-000000000000	33	7x3le6rmy3co	d8334794-c377-4002-8f01-3f17f916625a	t	2026-08-13 22:03:19.536786+00	2026-08-14 10:50:03.034902+00	\N	0b5ce342-a158-46e1-b3b8-de393a50de27
00000000-0000-0000-0000-000000000000	46	4d32mxctav2f	d8334794-c377-4002-8f01-3f17f916625a	f	2026-08-14 10:50:03.051842+00	2026-08-14 10:50:03.051842+00	7x3le6rmy3co	0b5ce342-a158-46e1-b3b8-de393a50de27
00000000-0000-0000-0000-000000000000	42	cy2xtu5rurhv	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-13 23:33:08.310427+00	2026-08-14 11:33:40.274684+00	a4l3h53vjgmw	44df5607-eac0-4829-8c62-542704b3d1c7
00000000-0000-0000-0000-000000000000	47	3zage3i5a25r	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-14 11:33:40.288577+00	2026-08-14 12:31:42.192133+00	cy2xtu5rurhv	44df5607-eac0-4829-8c62-542704b3d1c7
00000000-0000-0000-0000-000000000000	30	trba2y4oql77	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-13 21:57:03.561227+00	2026-08-14 13:03:13.696399+00	\N	3b38ea0b-e3f6-4755-8309-37491e67e13c
00000000-0000-0000-0000-000000000000	49	em4d3orpv3ze	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	f	2026-08-14 13:03:13.709176+00	2026-08-14 13:03:13.709176+00	trba2y4oql77	3b38ea0b-e3f6-4755-8309-37491e67e13c
00000000-0000-0000-0000-000000000000	48	fedqqvlyvpiu	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-14 12:31:42.202008+00	2026-08-14 13:29:49.497477+00	3zage3i5a25r	44df5607-eac0-4829-8c62-542704b3d1c7
00000000-0000-0000-0000-000000000000	44	hyyalzmuy53a	28c7d012-3395-4b1e-9105-9a52ea533684	t	2026-08-14 00:01:46.297023+00	2026-08-14 14:10:37.692969+00	t4dj5yuoighe	b08537c1-0d07-4ed5-8fd9-26493bb162ba
00000000-0000-0000-0000-000000000000	51	es32pteu5mr7	28c7d012-3395-4b1e-9105-9a52ea533684	f	2026-08-14 14:10:37.701216+00	2026-08-14 14:10:37.701216+00	hyyalzmuy53a	b08537c1-0d07-4ed5-8fd9-26493bb162ba
00000000-0000-0000-0000-000000000000	50	ws2roy7mtiy5	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-14 13:29:49.507836+00	2026-08-14 14:28:17.093087+00	fedqqvlyvpiu	44df5607-eac0-4829-8c62-542704b3d1c7
00000000-0000-0000-0000-000000000000	52	cxdvq7pjifg6	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	t	2026-08-14 14:28:17.101992+00	2026-08-14 16:29:26.509708+00	ws2roy7mtiy5	44df5607-eac0-4829-8c62-542704b3d1c7
00000000-0000-0000-0000-000000000000	53	frrq3pwarnvq	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	f	2026-08-14 16:29:26.524104+00	2026-08-14 16:29:26.524104+00	cxdvq7pjifg6	44df5607-eac0-4829-8c62-542704b3d1c7
\.


--
-- TOC entry 4402 (class 0 OID 16818)
-- Dependencies: 271
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- TOC entry 4403 (class 0 OID 16836)
-- Dependencies: 272
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- TOC entry 4394 (class 0 OID 16537)
-- Dependencies: 261
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- TOC entry 4396 (class 0 OID 16717)
-- Dependencies: 265
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
20d52ddc-b77b-42e0-b223-4d10e72b15ef	b68e362f-1116-42c4-94f6-39645662b2d3	2026-08-13 23:30:32.876954+00	2026-08-13 23:30:32.876954+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36	189.96.31.138	\N	\N	\N	\N	\N
923c7f80-58bd-458e-a89b-36bbf553d8e4	7e9bb73f-b400-432d-a3fd-77ad81ce6a62	2026-08-13 22:39:10.570366+00	2026-08-13 23:57:40.977648+00	\N	aal1	\N	2026-08-13 23:57:40.977553	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1	177.39.59.26	\N	\N	\N	\N	\N
87016112-ea10-4c6c-9ee8-2a7d6b3b8f3d	f3b0d083-2a64-4493-8601-5949b4f7c0b3	2026-08-13 21:56:57.648202+00	2026-08-13 21:56:57.648202+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36	177.39.58.177	\N	\N	\N	\N	\N
a1033166-13ac-4f2d-a87f-f3dc1d8c4c04	65c87b46-dd10-468e-b6c5-74a423df5a4a	2026-08-13 21:57:55.213067+00	2026-08-13 21:57:55.213067+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	189.96.31.50	\N	\N	\N	\N	\N
bf68f9b8-c0f9-47ce-9dbe-c3a831ba80cd	706d1e98-818e-47bf-b193-daa3adf6b8ed	2026-08-13 22:01:11.446477+00	2026-08-13 22:01:11.446477+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; U; Android 13; pt-br; Redmi Note 11 Build/TKQ1.221114.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.127 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.25.2.2-gn	177.39.59.201	\N	\N	\N	\N	\N
3225fa85-a138-45ba-8f8e-c6961a8d8acb	4e2a21c0-8c51-4076-860a-470e20b42d90	2026-08-13 22:03:52.207231+00	2026-08-13 22:03:52.207231+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6 Mobile/15E148 Safari/604.1	177.39.59.223	\N	\N	\N	\N	\N
fd3d6f8a-00ad-4588-b03e-5d1c8987c126	5656ca85-54d0-4194-afae-c705e22e8063	2026-08-13 22:07:56.784798+00	2026-08-13 22:07:56.784798+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	177.39.59.26	\N	\N	\N	\N	\N
fb2eb133-021a-4dc9-8ebe-a4e82548e4b1	b1a54856-c37a-46a8-b171-4f540688c538	2026-08-13 22:34:31.605962+00	2026-08-13 22:34:31.605962+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 OPR/133.0.0.0	45.185.178.140	\N	\N	\N	\N	\N
155642ea-3255-4142-a651-a613e3a416da	269089d0-7e10-41e7-9537-bf70586ec474	2026-08-13 22:24:13.13839+00	2026-08-14 00:26:25.285772+00	\N	aal1	\N	2026-08-14 00:26:25.285657	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 OPR/134.0.0.0	191.241.132.208	\N	\N	\N	\N	\N
0b5ce342-a158-46e1-b3b8-de393a50de27	d8334794-c377-4002-8f01-3f17f916625a	2026-08-13 22:03:19.535639+00	2026-08-14 10:50:03.079975+00	\N	aal1	\N	2026-08-14 10:50:03.079878	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36	190.15.109.234	\N	\N	\N	\N	\N
3b38ea0b-e3f6-4755-8309-37491e67e13c	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 21:57:03.560132+00	2026-08-14 13:03:13.737764+00	\N	aal1	\N	2026-08-14 13:03:13.737667	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0	45.185.178.239	\N	\N	\N	\N	\N
b08537c1-0d07-4ed5-8fd9-26493bb162ba	28c7d012-3395-4b1e-9105-9a52ea533684	2026-08-13 22:04:48.028865+00	2026-08-14 14:10:37.722623+00	\N	aal1	\N	2026-08-14 14:10:37.722501	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36	45.160.84.140	\N	\N	\N	\N	\N
44df5607-eac0-4829-8c62-542704b3d1c7	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 22:34:56.026323+00	2026-08-14 16:29:26.550395+00	\N	aal1	\N	2026-08-14 16:29:26.550314	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0	45.185.178.239	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4401 (class 0 OID 16803)
-- Dependencies: 270
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4400 (class 0 OID 16794)
-- Dependencies: 269
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- TOC entry 4389 (class 0 OID 16499)
-- Dependencies: 256
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	447fde8b-49d3-4433-a542-cbb69b9f683f	authenticated	authenticated	murilo.montino@dcomp.ufs.br	\N	2026-08-13 20:42:44.408001+00	\N		\N		\N			\N	2026-08-13 21:41:39.970431+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "116986486010143905003", "name": "Murilo dos Anjos Montino", "email": "murilo.montino@dcomp.ufs.br", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLwAebmLiQ9wWvdi1kM2c1GE5M1IOSxtDmYWbGSCixZVYMP5w=s96-c", "full_name": "Murilo dos Anjos Montino", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLwAebmLiQ9wWvdi1kM2c1GE5M1IOSxtDmYWbGSCixZVYMP5w=s96-c", "provider_id": "116986486010143905003", "custom_claims": {"hd": "dcomp.ufs.br"}, "email_verified": true, "phone_verified": false}	\N	2026-08-13 20:42:44.387113+00	2026-08-13 21:41:39.974349+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f3b0d083-2a64-4493-8601-5949b4f7c0b3	authenticated	authenticated	jvteixeira5621@gmail.com	\N	2026-08-13 21:56:57.640798+00	\N		\N		\N			\N	2026-08-13 21:56:57.64708+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "112004717354959841723", "name": "João Vitor Dantas Teixeira", "email": "jvteixeira5621@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKJF5WJbjx8aiMCLMIsordlM1LbBHpx6y4a2mS_hd-lajcnzWeB=s96-c", "full_name": "João Vitor Dantas Teixeira", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKJF5WJbjx8aiMCLMIsordlM1LbBHpx6y4a2mS_hd-lajcnzWeB=s96-c", "provider_id": "112004717354959841723", "email_verified": true, "phone_verified": false}	\N	2026-08-13 21:56:57.628327+00	2026-08-13 21:56:57.651793+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	28c7d012-3395-4b1e-9105-9a52ea533684	authenticated	authenticated	joelitonsouza127@gmail.com	\N	2026-08-13 22:04:48.02423+00	\N		\N		\N			\N	2026-08-13 22:04:48.027723+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "114938764319538454275", "name": "Joeliton Souza", "email": "joelitonsouza127@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKyzh9ixV7Fx6kY6RgaFYrQNjVWksJKYXOFSaWoS7SIPKNmbUIphg=s96-c", "full_name": "Joeliton Souza", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKyzh9ixV7Fx6kY6RgaFYrQNjVWksJKYXOFSaWoS7SIPKNmbUIphg=s96-c", "provider_id": "114938764319538454275", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:04:48.00279+00	2026-08-14 14:10:37.707355+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	authenticated	authenticated	murilomontino21@gmail.com	\N	2026-08-13 12:49:00.316353+00	\N		\N		\N			\N	2026-08-13 22:34:56.023852+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "103074034017757340278", "name": "Murilo Montino", "email": "murilomontino21@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c", "full_name": "Murilo Montino", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c", "provider_id": "103074034017757340278", "email_verified": true, "phone_verified": false}	\N	2026-08-13 12:49:00.303767+00	2026-08-14 16:29:26.534041+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	65c87b46-dd10-468e-b6c5-74a423df5a4a	authenticated	authenticated	vitinhofazendeirotb@gmail.com	\N	2026-08-13 21:57:55.211141+00	\N		\N		\N			\N	2026-08-13 21:57:55.212923+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "108040976016018736809", "name": "Alysson Victor", "email": "vitinhofazendeirotb@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLIMXwUdAJ-rhwopdpfME6X_rU9B51oXveqs_FMAb-_AG2Y6qs=s96-c", "full_name": "Alysson Victor", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLIMXwUdAJ-rhwopdpfME6X_rU9B51oXveqs_FMAb-_AG2Y6qs=s96-c", "provider_id": "108040976016018736809", "email_verified": true, "phone_verified": false}	\N	2026-08-13 21:57:55.205446+00	2026-08-13 21:57:55.214684+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	d8334794-c377-4002-8f01-3f17f916625a	authenticated	authenticated	antonyovitor22@gmail.com	\N	2026-08-13 22:03:19.533317+00	\N		\N		\N			\N	2026-08-13 22:03:19.535541+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "113099285733452270754", "name": "Antonio Vitor", "email": "antonyovitor22@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJY-Dh5nT4EpLbMkNCSM8Q3M44qeEP6Uvd2cOPQ_wnZhvUAJg=s96-c", "full_name": "Antonio Vitor", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJY-Dh5nT4EpLbMkNCSM8Q3M44qeEP6Uvd2cOPQ_wnZhvUAJg=s96-c", "provider_id": "113099285733452270754", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:03:19.523489+00	2026-08-14 10:50:03.063281+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	706d1e98-818e-47bf-b193-daa3adf6b8ed	authenticated	authenticated	wilsonaaju@gmail.com	\N	2026-08-13 22:01:11.440284+00	\N		\N		\N			\N	2026-08-13 22:01:11.444139+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "115115260936950891361", "name": "WILSON MOTA", "email": "wilsonaaju@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKy-fVWbZ4Z_P_YguecEEg2KaCZfd9mfcbetaoBv4aNmzqtow=s96-c", "full_name": "WILSON MOTA", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKy-fVWbZ4Z_P_YguecEEg2KaCZfd9mfcbetaoBv4aNmzqtow=s96-c", "provider_id": "115115260936950891361", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:01:11.427112+00	2026-08-13 22:01:11.451454+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	4e2a21c0-8c51-4076-860a-470e20b42d90	authenticated	authenticated	marx10jean.anjos@gmail.com	\N	2026-08-13 22:03:52.20523+00	\N		\N		\N			\N	2026-08-13 22:03:52.207137+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "112239934268121114193", "name": "Jean Marx Anjos", "email": "marx10jean.anjos@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKStLjPxR4ygEY4-sMsTirR9bYCM0Fjz3Jm-gYhPG9b6gwvhKAI1g=s96-c", "full_name": "Jean Marx Anjos", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKStLjPxR4ygEY4-sMsTirR9bYCM0Fjz3Jm-gYhPG9b6gwvhKAI1g=s96-c", "provider_id": "112239934268121114193", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:03:52.199344+00	2026-08-13 22:03:52.212206+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	5656ca85-54d0-4194-afae-c705e22e8063	authenticated	authenticated	ivanrocha977@gmail.com	\N	2026-08-13 22:07:56.780042+00	\N		\N		\N			\N	2026-08-13 22:07:56.783079+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "116775274652851360237", "name": "Ivan Rocha", "email": "ivanrocha977@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLGJfUbiAJp-HiUQ0FlCLWN2952k9diWOdoC6AjypMFo7hT2TvH=s96-c", "full_name": "Ivan Rocha", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLGJfUbiAJp-HiUQ0FlCLWN2952k9diWOdoC6AjypMFo7hT2TvH=s96-c", "provider_id": "116775274652851360237", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:07:56.768003+00	2026-08-13 22:07:56.787776+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	7e9bb73f-b400-432d-a3fd-77ad81ce6a62	authenticated	authenticated	gustavodouurado@gmail.com	\N	2026-08-13 22:39:10.565708+00	\N		\N		\N			\N	2026-08-13 22:39:10.569193+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "115394765353504771483", "name": "Gustavo Dourado", "email": "gustavodouurado@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKx4SOa8fHCmndbB0C4AnU_YPWAlzwyE4fXRJO7HLjCdrnP4yJE=s96-c", "full_name": "Gustavo Dourado", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKx4SOa8fHCmndbB0C4AnU_YPWAlzwyE4fXRJO7HLjCdrnP4yJE=s96-c", "provider_id": "115394765353504771483", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:39:10.555935+00	2026-08-13 23:57:40.95771+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	269089d0-7e10-41e7-9537-bf70586ec474	authenticated	authenticated	ryllerfonseca4@gmail.com	\N	2026-08-13 22:24:13.132173+00	\N		\N		\N			\N	2026-08-13 22:24:13.137114+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "107491523619919867504", "name": "Ryller Fonseca", "email": "ryllerfonseca4@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKIrhzxXDbyzfwUuxUR8j0BLN3Q2Cjp87erlWt-Izd9wp3Lwg=s96-c", "full_name": "Ryller Fonseca", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKIrhzxXDbyzfwUuxUR8j0BLN3Q2Cjp87erlWt-Izd9wp3Lwg=s96-c", "provider_id": "107491523619919867504", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:24:13.115422+00	2026-08-14 00:26:25.268046+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b1a54856-c37a-46a8-b171-4f540688c538	authenticated	authenticated	shawnp138@gmail.com	\N	2026-08-13 22:34:31.599991+00	\N		\N		\N			\N	2026-08-13 22:34:31.60368+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "110970026361999020389", "name": "Arthur De Jesus Santos", "email": "shawnp138@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKMuc8yel4uIp2bhVzkrLy8-CgBoVUL-r_92YamhaAV1xEg3ojQ=s96-c", "full_name": "Arthur De Jesus Santos", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKMuc8yel4uIp2bhVzkrLy8-CgBoVUL-r_92YamhaAV1xEg3ojQ=s96-c", "provider_id": "110970026361999020389", "email_verified": true, "phone_verified": false}	\N	2026-08-13 22:34:31.586764+00	2026-08-13 22:34:31.609342+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	b68e362f-1116-42c4-94f6-39645662b2d3	authenticated	authenticated	rainerdemoura005@gmail.com	\N	2026-08-13 23:30:32.870157+00	\N		\N		\N			\N	2026-08-13 23:30:32.874732+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "104288597169001324725", "name": "Rainer M", "email": "rainerdemoura005@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL_4dXLTJ5ChSi-W4yKX88MCS5ble9Av_-ND5yZ7PvLc6WL3PDZ=s96-c", "full_name": "Rainer M", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL_4dXLTJ5ChSi-W4yKX88MCS5ble9Av_-ND5yZ7PvLc6WL3PDZ=s96-c", "provider_id": "104288597169001324725", "email_verified": true, "phone_verified": false}	\N	2026-08-13 23:30:32.85391+00	2026-08-13 23:30:32.894804+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- TOC entry 4412 (class 0 OID 17149)
-- Dependencies: 281
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- TOC entry 4411 (class 0 OID 17126)
-- Dependencies: 280
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- TOC entry 4439 (class 0 OID 17780)
-- Dependencies: 312
-- Data for Name: championship_event_attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_event_attendance (id, event_id, player_id, display_name, is_goalkeeper, event_date, goals, assists, own_goals, wins, matches, rating, rating_delta) FROM stdin;
257	9	9	E	f	2026-08-13	0	0	0	1	1	4.5	0.0
258	9	10	F	f	2026-08-13	0	0	0	0	1	4.0	0.0
259	9	11	G	f	2026-08-13	0	0	0	1	1	3.5	0.0
260	9	3	GBA	f	2026-08-13	0	1	0	1	3	5.0	0.0
261	9	12	H	f	2026-08-13	0	1	0	1	3	4.0	0.0
262	9	13	I	f	2026-08-13	0	0	0	1	3	3.5	0.0
263	9	14	J	f	2026-08-13	0	0	0	1	1	4.0	0.0
264	9	15	K	f	2026-08-13	0	0	0	0	1	4.0	0.0
265	9	16	L	f	2026-08-13	0	0	0	1	3	5.0	0.0
266	9	17	M	f	2026-08-13	0	0	0	0	0	3.0	0.0
268	9	1	Murilo Montino	f	2026-08-13	1	0	1	1	3	3.5	0.0
269	9	18	N	f	2026-08-13	0	1	0	1	3	1.5	0.0
270	9	19	O	f	2026-08-13	2	0	0	1	3	0.5	0.0
271	9	20	P	f	2026-08-13	0	0	0	1	1	1.5	0.0
272	9	21	Q	f	2026-08-13	0	0	0	0	0	3.5	0.0
273	9	4	Vitinho	f	2026-08-13	1	0	0	1	2	3.0	0.0
169	7	5	A	f	2026-08-12	0	0	0	0	0	3.0	0.0
170	7	6	B	f	2026-08-12	0	0	0	0	0	4.5	0.0
171	7	7	C	f	2026-08-12	0	0	0	0	0	3.0	0.0
172	7	8	D	f	2026-08-12	0	0	0	0	0	3.5	0.0
173	7	9	E	f	2026-08-12	0	0	0	0	0	4.5	0.0
174	7	10	F	f	2026-08-12	0	0	0	0	0	4.0	0.0
175	7	11	G	f	2026-08-12	0	0	0	0	0	3.5	0.0
176	7	3	GBA	f	2026-08-12	0	0	0	0	0	5.0	0.0
177	7	12	H	f	2026-08-12	0	0	0	0	0	4.0	0.0
178	7	13	I	f	2026-08-12	0	0	0	0	0	3.5	0.0
179	7	14	J	f	2026-08-12	0	0	0	0	0	4.0	0.0
180	7	15	K	f	2026-08-12	0	0	0	0	0	4.0	0.0
181	7	16	L	f	2026-08-12	0	0	0	0	0	5.0	0.0
182	7	17	M	f	2026-08-12	0	0	0	0	0	3.0	0.0
184	7	1	Murilo Montino	f	2026-08-12	0	0	0	0	0	3.5	0.0
185	7	18	N	f	2026-08-12	0	0	0	0	0	1.5	0.0
186	7	19	O	f	2026-08-12	0	0	0	0	0	0.5	0.0
187	7	20	P	f	2026-08-12	0	0	0	0	0	1.5	0.0
188	7	21	Q	f	2026-08-12	0	0	0	0	0	3.5	0.0
189	7	4	Vitinho	f	2026-08-12	0	0	0	0	0	3.0	0.0
326	10	5	A	f	2026-08-13	0	0	0	8	10	3.0	0.0
327	10	30	Antonio Vitor	f	2026-08-13	0	0	0	8	10	0.0	0.0
328	10	25	Alberto	f	2026-08-13	0	0	0	8	10	0.0	0.0
329	10	26	Jadson	f	2026-08-13	0	0	0	8	10	0.0	0.0
330	10	39	Jay	f	2026-08-13	0	0	0	0	0	0.0	0.0
331	10	40	Jean (modo matador)	f	2026-08-13	0	0	0	0	0	0.0	0.0
332	10	35	Joeliton (goleiro)	t	2026-08-13	0	0	0	0	0	0.0	0.0
333	10	1	Murilo Montino	f	2026-08-13	0	0	0	2	11	3.5	0.0
334	10	42	Murilo dos Anjos Montino	f	2026-08-13	0	0	0	0	0	0.0	0.0
335	10	23	Murilo	f	2026-08-13	0	0	0	0	0	0.0	0.0
336	10	29	Arthur	f	2026-08-13	0	0	0	0	0	0.0	0.0
337	10	6	B	f	2026-08-13	0	0	0	0	0	4.5	0.0
338	10	7	C	f	2026-08-13	0	0	0	0	0	3.0	0.0
339	10	8	D	f	2026-08-13	0	0	0	0	0	3.5	0.0
340	10	32	Danrley	f	2026-08-13	0	0	0	0	0	0.0	0.0
341	10	9	E	f	2026-08-13	0	0	0	0	0	4.5	0.0
342	10	38	Eric ( Huston )	f	2026-08-13	0	0	0	0	0	0.0	0.0
343	10	10	F	f	2026-08-13	0	0	0	0	0	4.0	0.0
344	10	11	G	f	2026-08-13	0	0	0	0	0	3.5	0.0
345	10	3	GBA	f	2026-08-13	0	0	0	0	0	5.0	0.0
346	10	27	GBA	f	2026-08-13	0	1	0	0	1	0.0	0.0
347	10	36	Gildeon	f	2026-08-13	1	0	0	0	1	0.0	0.0
348	10	34	Gustavo Dourado	f	2026-08-13	0	0	0	0	0	0.0	0.0
349	10	12	H	f	2026-08-13	0	0	0	0	0	4.0	0.0
350	10	31	Hugo	f	2026-08-13	0	0	0	0	0	0.0	0.0
351	10	37	Huston	f	2026-08-13	0	0	0	0	1	0.0	0.0
390	15	1	Murilo Montino	f	2026-08-14	0	0	0	0	0	2.7	0.0
391	15	3	GBA	f	2026-08-14	0	0	0	0	0	5.0	0.0
392	15	4	Vitinho	f	2026-08-14	0	0	0	0	0	3.0	0.0
393	15	22	Vitinho	f	2026-08-14	0	0	0	0	0	0.0	0.0
394	15	23	Murilo	f	2026-08-14	0	0	0	0	0	0.0	0.0
395	15	24	Ivan	f	2026-08-14	0	0	0	0	0	0.0	0.0
396	15	25	Alberto	f	2026-08-14	0	0	0	0	0	0.0	0.0
397	15	26	Jadson	f	2026-08-14	0	0	0	0	0	0.0	0.0
398	15	27	GBA	f	2026-08-14	0	0	0	0	0	0.0	0.0
399	15	28	Luis Otávio	f	2026-08-14	0	0	0	0	0	0.0	0.0
400	15	29	Arthur	f	2026-08-14	0	0	0	0	0	0.0	0.0
401	15	30	Antonio Vitor	f	2026-08-14	0	0	0	0	0	0.0	0.0
402	15	31	Hugo	f	2026-08-14	0	0	0	0	0	0.0	0.0
403	15	32	Danrley	f	2026-08-14	0	0	0	0	0	0.0	0.0
404	15	33	will	f	2026-08-14	0	0	0	0	0	0.0	0.0
405	15	34	Gustavo Dourado	f	2026-08-14	0	0	0	0	0	0.0	0.0
406	15	35	Joeliton (goleiro)	f	2026-08-14	0	0	0	0	0	0.0	0.0
407	15	36	Gildeon	f	2026-08-14	0	0	0	0	0	0.0	0.0
408	15	37	Huston	f	2026-08-14	0	0	0	0	0	0.0	0.0
409	15	38	Eric ( Huston )	f	2026-08-14	0	0	0	0	0	0.0	0.0
410	15	39	Jay	f	2026-08-14	0	0	0	0	0	0.0	0.0
411	15	40	Jean (modo matador)	f	2026-08-14	0	0	0	0	0	0.0	0.0
412	15	41	Jerferson	f	2026-08-14	0	0	0	0	0	0.0	0.0
413	15	42	Murilo dos Anjos Montino	f	2026-08-14	0	0	0	0	0	0.0	0.0
423	16	22	Vitinho	f	2026-08-14	0	0	0	0	1	0.0	0.0
424	16	23	Murilo	f	2026-08-14	0	0	0	0	1	0.0	0.0
425	16	24	Ivan	f	2026-08-14	0	0	0	0	1	0.0	0.0
426	16	25	Alberto	f	2026-08-14	0	0	0	0	1	0.0	0.0
427	16	26	Jadson	f	2026-08-14	0	0	0	0	1	0.0	0.0
428	16	27	GBA	f	2026-08-14	0	0	0	0	1	0.0	0.0
429	16	28	Luis Otávio	f	2026-08-14	0	0	0	0	1	0.0	0.0
430	16	29	Arthur	f	2026-08-14	0	0	0	0	1	0.0	0.0
431	16	30	Antonio Vitor	f	2026-08-14	0	0	0	0	1	0.0	0.0
432	16	31	Hugo	f	2026-08-14	0	3	0	1	2	0.0	0.0
1	1	1	Murilo Montino	f	2026-08-13	0	0	0	0	0	3.5	0.0
18	6	4	Vitinho	f	2026-08-13	0	0	0	0	0	3.0	0.0
19	6	1	Murilo Montino	f	2026-08-13	0	0	0	0	0	3.5	0.0
24	6	20	P	f	2026-08-13	0	0	0	0	0	1.5	0.0
25	6	11	G	f	2026-08-13	0	0	0	0	0	3.5	0.0
26	6	17	M	f	2026-08-13	0	0	0	0	0	3.0	0.0
27	6	12	H	f	2026-08-13	0	0	0	0	0	4.0	0.0
28	6	10	F	f	2026-08-13	0	0	0	0	0	4.0	0.0
29	6	18	N	f	2026-08-13	0	0	0	0	0	1.5	0.0
31	6	15	K	f	2026-08-13	0	0	0	0	0	4.0	0.0
32	6	13	I	f	2026-08-13	0	0	0	0	0	3.5	0.0
33	6	21	Q	f	2026-08-13	0	0	0	0	0	3.5	0.0
34	6	5	A	f	2026-08-13	0	0	0	0	0	3.0	0.0
35	6	19	O	f	2026-08-13	0	0	0	0	0	0.5	0.0
36	6	8	D	f	2026-08-13	0	0	0	0	0	3.5	0.0
37	6	6	B	f	2026-08-13	0	0	0	0	0	4.5	0.0
38	6	16	L	f	2026-08-13	0	0	0	0	0	5.0	0.0
39	6	3	GBA	f	2026-08-13	0	0	0	0	0	5.0	0.0
40	6	14	J	f	2026-08-13	0	0	0	0	0	4.0	0.0
41	6	9	E	f	2026-08-13	0	0	0	0	0	4.5	0.0
42	6	7	C	f	2026-08-13	0	0	0	0	0	3.0	0.0
253	9	5	A	f	2026-08-13	0	0	0	0	0	3.0	0.0
254	9	6	B	f	2026-08-13	0	0	0	0	0	4.5	0.0
255	9	7	C	f	2026-08-13	0	0	0	0	1	3.0	0.0
256	9	8	D	f	2026-08-13	1	0	0	1	4	3.5	0.0
433	16	32	Danrley	f	2026-08-14	0	0	0	0	1	0.0	0.0
352	10	13	I	f	2026-08-13	0	0	0	0	0	3.5	0.0
353	10	24	Ivan	f	2026-08-13	0	0	0	0	0	0.0	0.0
354	10	14	J	f	2026-08-13	0	0	0	0	1	4.0	0.0
355	10	41	Jerferson	f	2026-08-13	0	0	0	0	1	0.0	0.0
356	10	15	K	f	2026-08-13	0	0	0	0	0	4.0	0.0
357	10	16	L	f	2026-08-13	0	0	0	0	1	5.0	0.0
358	10	28	Luis Otávio	f	2026-08-13	0	0	0	0	0	0.0	0.0
359	10	17	M	f	2026-08-13	0	0	0	0	0	3.0	0.0
361	10	18	N	f	2026-08-13	0	0	0	0	0	1.5	0.0
362	10	19	O	f	2026-08-13	0	0	0	0	0	0.5	0.0
363	10	20	P	f	2026-08-13	0	0	0	0	1	1.5	0.0
364	10	21	Q	f	2026-08-13	0	0	0	0	0	3.5	0.0
365	10	4	Vitinho	f	2026-08-13	1	0	0	0	1	3.0	0.0
366	10	22	Vitinho	f	2026-08-13	0	0	0	0	0	0.0	0.0
367	10	33	will	f	2026-08-13	0	0	0	0	1	0.0	0.0
368	13	49	GBA	f	2026-08-12	2	2	0	2	9	5.0	0.0
369	13	43	Murilo Montino	f	2026-08-12	3	2	0	2	9	4.0	0.0
370	13	65	Alysson Victor	f	2026-08-12	1	0	0	2	9	3.0	0.0
371	13	55	will	f	2026-08-12	2	4	0	2	9	4.0	0.0
372	13	53	Hugo	f	2026-08-12	6	1	0	10	14	5.0	0.0
373	13	47	Alberto	f	2026-08-12	5	4	0	10	14	4.0	0.0
374	13	67	Joeliton Souza	f	2026-08-12	0	1	0	10	14	4.0	0.0
375	13	48	Jadson	f	2026-08-12	5	9	0	10	14	3.0	0.0
376	13	56	Gustavo Dourado	f	2026-08-12	7	4	0	10	14	3.0	0.0
377	13	58	Gildeon	f	2026-08-12	8	2	0	6	10	4.0	0.0
378	13	59	Huston	f	2026-08-12	0	0	0	6	10	4.0	0.0
379	13	63	Jerferson	f	2026-08-12	0	0	0	0	0	4.0	0.0
380	13	52	João Gomes	f	2026-08-12	0	0	0	0	8	3.0	0.0
381	13	60	Eric ( Huston )	f	2026-08-12	1	1	0	0	8	4.0	0.0
382	13	61	Jay	f	2026-08-12	1	1	0	0	8	4.0	0.0
383	13	66	Jean Marx Anjos	f	2026-08-12	3	1	0	0	8	4.0	0.0
414	16	1	Murilo Montino	f	2026-08-14	0	0	0	0	1	2.7	0.0
385	13	50	Luis Otávio	f	2026-08-12	0	0	0	6	10	3.0	0.0
386	13	68	Ivan Rocha	f	2026-08-12	4	1	0	2	9	3.0	0.0
415	16	3	GBA	f	2026-08-14	0	0	0	0	1	5.0	0.0
387	13	70	Arthur De Jesus Santos	f	2026-08-12	2	1	0	0	8	3.0	-1.4
384	13	54	Danrley	f	2026-08-12	0	0	0	6	10	4.0	0.3
416	16	37	Huston	f	2026-08-14	0	0	0	0	1	0.0	0.0
417	16	38	Eric ( Huston )	f	2026-08-14	0	0	0	0	1	0.0	0.0
418	16	39	Jay	f	2026-08-14	0	0	0	1	2	0.0	0.0
419	16	40	Jean (modo matador)	f	2026-08-14	0	0	0	1	2	0.0	0.0
420	16	41	Jerferson	f	2026-08-14	0	0	0	0	1	0.0	0.0
421	16	42	Murilo dos Anjos Montino	f	2026-08-14	1	0	0	0	1	0.0	0.0
422	16	4	Vitinho	f	2026-08-14	2	0	0	1	2	3.0	0.0
434	16	33	will	f	2026-08-14	0	0	0	0	1	0.0	0.0
435	16	34	Gustavo Dourado	f	2026-08-14	0	0	0	0	1	0.0	0.0
436	16	35	Joeliton (goleiro)	f	2026-08-14	1	0	0	1	2	0.0	0.0
437	16	36	Gildeon	f	2026-08-14	0	0	0	0	1	0.0	0.0
438	1	3	GBA	f	2026-08-13	0	0	0	0	0	5.0	0.0
\.


--
-- TOC entry 4443 (class 0 OID 17894)
-- Dependencies: 316
-- Data for Name: championship_event_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_event_goals (id, match_id, event_id, scorer_player_id, assist_player_id, is_own_goal, created_at) FROM stdin;
2	5	9	8	18	f	2026-08-13 20:51:57.15849+00
3	5	9	19	12	f	2026-08-13 20:51:59.790103+00
5	7	9	1	\N	f	2026-08-13 21:01:46.162666+00
6	7	9	4	\N	f	2026-08-13 21:19:07.879139+00
7	8	9	1	\N	t	2026-08-13 21:23:27.120757+00
8	10	10	4	27	f	2026-08-13 22:10:15.870024+00
9	10	10	36	\N	f	2026-08-13 22:10:19.79733+00
10	11	16	42	\N	f	2026-08-14 12:34:18.8985+00
11	11	16	35	31	f	2026-08-14 12:34:23.621156+00
12	12	16	4	31	f	2026-08-14 12:35:24.322353+00
13	12	16	4	31	f	2026-08-14 12:35:25.898934+00
4	7	9	3	\N	f	2026-08-13 21:01:41.974743+00
1	5	9	19	3	f	2026-08-13 20:51:53.381426+00
\.


--
-- TOC entry 4441 (class 0 OID 17856)
-- Dependencies: 314
-- Data for Name: championship_event_match_players; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_event_match_players (id, match_id, event_id, team_id, player_id, display_name, is_goalkeeper, slot) FROM stdin;
11	5	9	56	12	H	f	2
12	5	9	56	13	I	f	3
13	5	9	56	19	O	f	4
14	5	9	56	3	GBA	t	0
15	5	9	57	8	D	f	1
16	5	9	57	1	Murilo Montino	f	2
17	5	9	57	18	N	f	3
18	5	9	57	16	L	t	0
20	6	9	56	12	H	f	2
21	6	9	56	13	I	f	3
22	6	9	56	19	O	f	4
23	6	9	56	3	GBA	t	0
24	6	9	60	10	F	f	1
25	6	9	60	4	Vitinho	f	2
26	6	9	60	7	C	f	3
27	6	9	60	15	K	t	0
28	6	9	60	8	D	f	4
34	7	9	57	8	D	f	1
35	7	9	57	1	Murilo Montino	f	2
36	7	9	57	18	N	f	3
37	7	9	57	16	L	t	0
33	7	9	56	3	GBA	f	4
32	7	9	56	19	O	f	3
31	7	9	56	13	I	f	2
30	7	9	56	12	H	t	0
40	7	9	57	4	Vitinho	f	4
41	8	9	57	8	D	f	1
42	8	9	57	1	Murilo Montino	f	2
43	8	9	57	18	N	f	3
44	8	9	57	16	L	t	0
45	8	9	58	14	J	f	1
46	8	9	58	11	G	f	2
47	8	9	58	20	P	f	3
48	8	9	58	9	E	t	0
49	9	9	57	8	D	f	1
50	9	9	57	1	Murilo Montino	f	2
51	9	9	57	18	N	f	3
52	9	9	57	16	L	t	0
53	9	9	60	10	F	f	1
54	9	9	60	4	Vitinho	f	2
55	9	9	60	7	C	f	3
56	9	9	60	15	K	t	0
57	10	10	72	1	Murilo Montino	f	1
58	10	10	72	37	Huston	f	2
59	10	10	72	36	Gildeon	f	3
60	10	10	72	41	Jerferson	f	4
61	10	10	72	16	L	t	0
62	10	10	76	4	Vitinho	f	1
63	10	10	76	20	P	f	2
64	10	10	76	27	GBA	f	3
65	10	10	76	33	will	f	4
66	10	10	76	14	J	t	0
67	11	16	90	42	Murilo dos Anjos Montino	f	1
68	11	16	90	38	Eric ( Huston )	f	2
69	11	16	90	32	Danrley	f	3
70	11	16	90	37	Huston	f	4
71	11	16	90	3	GBA	t	0
72	11	16	91	35	Joeliton (goleiro)	f	1
73	11	16	91	31	Hugo	f	2
74	11	16	91	39	Jay	f	3
75	11	16	91	40	Jean (modo matador)	f	4
76	11	16	91	4	Vitinho	t	0
77	12	16	91	35	Joeliton (goleiro)	f	1
78	12	16	91	31	Hugo	f	2
79	12	16	91	39	Jay	f	3
80	12	16	91	40	Jean (modo matador)	f	4
81	12	16	91	4	Vitinho	t	0
82	12	16	94	41	Jerferson	f	1
83	12	16	94	27	GBA	f	2
84	12	16	94	24	Ivan	f	3
85	12	16	94	23	Murilo	f	4
86	13	16	92	29	Arthur	f	1
87	13	16	92	34	Gustavo Dourado	f	2
88	13	16	92	22	Vitinho	f	3
89	13	16	92	33	will	f	4
90	13	16	92	1	Murilo Montino	t	0
91	13	16	93	28	Luis Otávio	f	1
92	13	16	93	36	Gildeon	f	2
93	13	16	93	26	Jadson	f	3
94	13	16	93	25	Alberto	f	4
95	13	16	93	30	Antonio Vitor	t	0
96	14	16	90	42	Murilo dos Anjos Montino	f	1
97	14	16	90	38	Eric ( Huston )	f	2
98	14	16	90	32	Danrley	f	3
99	14	16	90	37	Huston	f	4
100	14	16	90	3	GBA	t	0
101	14	16	94	41	Jerferson	f	1
102	14	16	94	27	GBA	f	2
103	14	16	94	24	Ivan	f	3
104	14	16	94	23	Murilo	f	4
105	14	16	94	1	Murilo Montino	t	0
\.


--
-- TOC entry 4437 (class 0 OID 17719)
-- Dependencies: 310
-- Data for Name: championship_event_matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_event_matches (id, event_id, team_a_id, team_b_id, created_at, ended_at, winner_team_id) FROM stdin;
1	1	1	2	2026-08-13 16:33:13.919832+00	2026-08-13 16:33:13.919832+00	\N
2	1	2	1	2026-08-13 16:33:20.974364+00	2026-08-13 16:33:20.974364+00	\N
5	9	56	57	2026-08-13 20:51:45.76263+00	2026-08-13 20:52:10.870307+00	56
6	9	56	60	2026-08-13 20:52:49.03521+00	2026-08-13 20:58:02.765682+00	\N
7	9	56	57	2026-08-13 21:01:36.062813+00	2026-08-13 21:19:28.892054+00	57
8	9	57	58	2026-08-13 21:20:08.814496+00	2026-08-13 21:24:01.556047+00	58
9	9	57	60	2026-08-13 21:24:20.43199+00	\N	\N
10	10	72	76	2026-08-13 22:09:39.568859+00	2026-08-13 22:10:28.683203+00	\N
11	16	90	91	2026-08-14 12:34:08.482804+00	2026-08-14 12:34:36.908566+00	\N
12	16	91	94	2026-08-14 12:35:19.726313+00	2026-08-14 12:35:28.03033+00	91
13	16	92	93	2026-08-14 12:35:31.697407+00	2026-08-14 12:35:39.239505+00	\N
14	16	90	94	2026-08-14 14:19:03.071439+00	\N	\N
\.


--
-- TOC entry 4435 (class 0 OID 17696)
-- Dependencies: 308
-- Data for Name: championship_event_team_players; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_event_team_players (id, event_id, team_id, player_id, display_name, is_goalkeeper) FROM stdin;
1	1	1	1	Murilo Montino	f
3	6	3	4	Vitinho	t
4	6	3	1	Murilo Montino	f
5	6	3	3	GBA	f
6	6	3	19	O	f
7	6	3	14	J	f
18	6	5	18	N	t
19	6	5	20	P	f
20	6	5	17	M	f
21	6	5	9	E	f
22	6	5	16	L	f
173	7	36	16	L	t
175	7	36	15	K	f
176	7	36	11	G	f
177	7	36	19	O	f
178	7	37	3	GBA	t
179	7	37	13	I	f
180	7	37	1	Murilo Montino	f
181	7	37	20	P	f
182	7	38	6	B	t
183	7	38	12	H	f
184	7	38	21	Q	f
185	7	38	18	N	f
186	7	39	9	E	t
187	7	39	8	D	f
188	7	39	5	A	f
189	7	39	17	M	f
190	7	40	10	F	t
191	7	40	14	J	f
192	7	40	4	Vitinho	f
193	7	40	7	C	f
330	10	72	16	L	t
331	10	72	1	Murilo Montino	f
332	10	72	37	Huston	f
333	10	72	36	Gildeon	f
334	10	72	41	Jerferson	f
335	10	73	35	Joeliton (goleiro)	t
336	10	73	3	GBA	f
337	10	73	21	Q	f
338	10	73	39	Jay	f
339	10	73	24	Ivan	f
340	10	74	9	E	t
257	9	56	3	GBA	t
259	9	56	12	H	f
260	9	56	13	I	f
261	9	56	19	O	f
262	9	57	16	L	t
263	9	57	8	D	f
264	9	57	1	Murilo Montino	f
265	9	57	18	N	f
266	9	58	9	E	t
267	9	58	14	J	f
268	9	58	11	G	f
269	9	58	20	P	f
270	9	59	6	B	t
271	9	59	21	Q	f
272	9	59	5	A	f
273	9	59	17	M	f
274	9	60	15	K	t
275	9	60	10	F	f
276	9	60	4	Vitinho	f
277	9	60	7	C	f
341	10	74	15	K	f
342	10	74	23	Murilo	f
343	10	74	30	Antonio Vitor	f
344	10	74	38	Eric ( Huston )	f
345	10	75	6	B	t
346	10	75	13	I	f
347	10	75	19	O	f
2	1	2	3	Riquelme	f
348	10	75	31	Hugo	f
349	10	75	26	Jadson	f
350	10	76	14	J	t
351	10	76	4	Vitinho	f
352	10	76	20	P	f
353	10	76	27	GBA	f
354	10	76	33	will	f
355	10	77	10	F	t
356	10	77	17	M	f
357	10	77	18	N	f
358	10	77	32	Danrley	f
359	10	77	29	Arthur	f
361	10	78	7	C	f
362	10	78	22	Vitinho	f
363	10	78	28	Luis Otávio	f
364	10	79	12	H	f
365	10	79	5	A	f
366	10	79	42	Murilo dos Anjos Montino	f
367	10	79	40	Jean (modo matador)	f
368	10	80	8	D	f
369	10	80	11	G	f
370	10	80	25	Alberto	f
371	10	80	34	Gustavo Dourado	f
372	13	81	55	will	t
373	13	81	43	Murilo Montino	f
374	13	81	49	GBA	f
375	13	81	68	Ivan Rocha	f
376	13	81	65	Alysson Victor	f
377	13	82	53	Hugo	t
378	13	82	56	Gustavo Dourado	f
379	13	82	48	Jadson	f
380	13	82	67	Joeliton Souza	f
381	13	82	47	Alberto	f
382	13	83	60	Eric ( Huston )	t
383	13	83	61	Jay	f
384	13	83	66	Jean Marx Anjos	f
385	13	83	70	Arthur De Jesus Santos	f
386	13	83	52	João Gomes	f
387	13	84	63	Jerferson	t
388	13	84	58	Gildeon	f
389	13	84	50	Luis Otávio	f
390	13	84	54	Danrley	f
391	13	84	59	Huston	f
392	15	85	3	GBA	t
393	15	85	32	Danrley	f
394	15	85	34	Gustavo Dourado	f
395	15	85	28	Luis Otávio	f
396	15	85	30	Antonio Vitor	f
397	15	86	4	Vitinho	t
398	15	86	33	will	f
399	15	86	31	Hugo	f
400	15	86	22	Vitinho	f
401	15	86	39	Jay	f
402	15	87	1	Murilo Montino	t
403	15	87	36	Gildeon	f
404	15	87	26	Jadson	f
405	15	87	40	Jean (modo matador)	f
406	15	87	37	Huston	f
407	15	88	41	Jerferson	t
408	15	88	42	Murilo dos Anjos Montino	f
409	15	88	24	Ivan	f
410	15	88	25	Alberto	f
411	15	88	29	Arthur	f
412	15	89	23	Murilo	f
413	15	89	38	Eric ( Huston )	f
414	15	89	35	Joeliton (goleiro)	f
415	15	89	27	GBA	f
416	16	90	3	GBA	t
417	16	90	42	Murilo dos Anjos Montino	f
418	16	90	38	Eric ( Huston )	f
419	16	90	32	Danrley	f
420	16	90	37	Huston	f
421	16	91	4	Vitinho	t
422	16	91	35	Joeliton (goleiro)	f
423	16	91	31	Hugo	f
424	16	91	39	Jay	f
425	16	91	40	Jean (modo matador)	f
426	16	92	1	Murilo Montino	t
427	16	92	29	Arthur	f
428	16	92	34	Gustavo Dourado	f
429	16	92	22	Vitinho	f
430	16	92	33	will	f
431	16	93	30	Antonio Vitor	t
432	16	93	28	Luis Otávio	f
433	16	93	36	Gildeon	f
434	16	93	26	Jadson	f
435	16	93	25	Alberto	f
436	16	94	41	Jerferson	f
437	16	94	27	GBA	f
438	16	94	24	Ivan	f
439	16	94	23	Murilo	f
\.


--
-- TOC entry 4433 (class 0 OID 17677)
-- Dependencies: 306
-- Data for Name: championship_event_teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_event_teams (id, event_id, color, sort_order) FROM stdin;
1	1	#ffffff	0
2	1	#1c1917	1
3	6	#ffffff	0
5	6	#1c1917	1
72	10	\N	0
73	10	\N	1
74	10	\N	2
75	10	\N	3
76	10	\N	4
77	10	\N	5
78	10	\N	6
79	10	\N	7
80	10	\N	8
81	13	#166534	0
82	13	#f97316	1
83	13	#1c1917	2
84	13	#2563eb	3
85	15	\N	0
86	15	\N	1
87	15	\N	2
88	15	\N	3
89	15	\N	4
90	16	\N	0
91	16	\N	1
92	16	\N	2
93	16	\N	3
94	16	\N	4
36	7	#ffffff	0
37	7	#1c1917	1
38	7	#dc2626	2
39	7	#2563eb	3
40	7	#facc15	4
56	9	\N	0
57	9	\N	1
58	9	\N	2
59	9	\N	3
60	9	\N	4
\.


--
-- TOC entry 4431 (class 0 OID 17656)
-- Dependencies: 304
-- Data for Name: championship_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_events (id, championship_id, starts_at, players_per_team, ended_at, created_by, created_at, deleted_at, skip_guest_goalkeeper_matches) FROM stdin;
1	2	2026-08-13 23:00:00+00	5	2026-08-13 16:33:26.805251+00	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 16:33:07.738726+00	2026-08-13 16:51:28.014481+00	f
2	2	2026-08-13 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 18:25:06.175325+00	2026-08-13 18:29:45.043373+00	f
4	2	2026-08-12 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 18:32:09.429367+00	2026-08-13 18:32:29.991362+00	f
3	2	2026-08-13 23:00:00+00	5	2026-08-13 18:30:51.071424+00	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 18:30:26.662871+00	2026-08-13 18:32:40.728226+00	f
5	2	2026-08-13 23:00:00+00	5	2026-08-13 18:33:37.577535+00	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 18:33:22.674428+00	2026-08-13 18:38:14.537112+00	f
6	2	2026-08-13 23:00:00+00	5	2026-08-13 18:40:11.817091+00	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 18:38:31.260496+00	2026-08-13 19:32:48.810076+00	f
8	2	2026-08-13 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 19:48:16.8557+00	2026-08-13 19:48:33.507807+00	f
7	2	2026-08-12 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 19:13:31.569828+00	2026-08-13 21:00:00.98842+00	f
9	2	2026-08-13 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 20:01:56.66928+00	2026-08-13 21:46:40.847715+00	f
11	3	2026-08-13 22:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 22:29:01.113538+00	2026-08-13 22:29:07.587716+00	f
10	2	2026-08-13 23:00:00+00	5	2026-08-13 23:35:27.991147+00	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 21:46:54.421792+00	\N	f
12	3	2026-08-12 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 23:36:57.923682+00	2026-08-13 23:38:00.931754+00	f
13	3	2026-08-12 23:00:00+00	5	2026-08-13 23:51:04.392772+00	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 23:43:07.941851+00	\N	f
14	3	2026-08-13 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 23:58:33.925592+00	2026-08-13 23:59:07.512084+00	f
15	2	2026-08-14 22:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-14 12:03:47.263162+00	2026-08-14 12:07:52.178636+00	f
16	2	2026-08-14 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-14 12:09:19.817212+00	\N	f
17	2	2026-08-12 04:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-14 12:48:10.864756+00	\N	f
18	2	2026-08-17 23:00:00+00	5	\N	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-14 14:44:40.743865+00	\N	f
\.


--
-- TOC entry 4427 (class 0 OID 17520)
-- Dependencies: 300
-- Data for Name: championship_players; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championship_players (id, championship_id, user_id, display_name, avatar_url, created_at, rating, role, deleted_at, goals, assists, wins, matches, nickname, own_goals) FROM stdin;
5	2	\N	A	\N	2026-08-13 16:40:02.909896+00	3.8	member	\N	0	0	8	10	\N	0
43	3	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	Murilo Montino	https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c	2026-08-13 21:50:55.306317+00	3.3	member	\N	3	2	2	9	\N	0
47	3	\N	Alberto	\N	2026-08-13 21:51:18.213116+00	4.5	member	\N	5	4	10	14	\N	0
48	3	\N	Jadson	\N	2026-08-13 21:51:18.213116+00	3.5	member	\N	5	9	10	14	\N	0
49	3	\N	GBA	\N	2026-08-13 21:51:18.213116+00	4.3	member	\N	2	2	2	9	\N	0
50	3	\N	Luis Otávio	\N	2026-08-13 21:51:18.213116+00	3.3	member	\N	0	0	6	10	\N	0
52	3	d8334794-c377-4002-8f01-3f17f916625a	Antonio Vitor	https://lh3.googleusercontent.com/a/ACg8ocJY-Dh5nT4EpLbMkNCSM8Q3M44qeEP6Uvd2cOPQ_wnZhvUAJg=s96-c	2026-08-13 21:51:18.213116+00	1.7	member	\N	0	0	0	8	João Gomes	0
53	3	\N	Hugo	\N	2026-08-13 21:51:18.213116+00	5.5	member	\N	6	1	10	14	\N	0
55	3	\N	will	\N	2026-08-13 21:51:18.213116+00	3.3	member	\N	2	4	2	9	\N	0
56	3	7e9bb73f-b400-432d-a3fd-77ad81ce6a62	Gustavo Dourado	https://lh3.googleusercontent.com/a/ACg8ocKx4SOa8fHCmndbB0C4AnU_YPWAlzwyE4fXRJO7HLjCdrnP4yJE=s96-c	2026-08-13 21:51:18.213116+00	3.5	member	\N	7	4	10	14	\N	0
58	3	\N	Gildeon	\N	2026-08-13 21:51:18.213116+00	4.3	member	\N	8	2	6	10	\N	0
59	3	\N	Huston	\N	2026-08-13 21:51:18.213116+00	4.3	member	\N	0	0	6	10	\N	0
60	3	\N	Eric ( Huston )	\N	2026-08-13 21:51:18.213116+00	2.7	member	\N	1	1	0	8	\N	0
61	3	\N	Jay	\N	2026-08-13 21:51:18.213116+00	2.7	member	\N	1	1	0	8	\N	0
65	3	65c87b46-dd10-468e-b6c5-74a423df5a4a	Alysson Victor	https://lh3.googleusercontent.com/a/ACg8ocLIMXwUdAJ-rhwopdpfME6X_rU9B51oXveqs_FMAb-_AG2Y6qs=s96-c	2026-08-13 21:58:05.34754+00	2.3	captain	\N	1	0	2	9	\N	0
66	3	4e2a21c0-8c51-4076-860a-470e20b42d90	Jean Marx Anjos	https://lh3.googleusercontent.com/a/ACg8ocKStLjPxR4ygEY4-sMsTirR9bYCM0Fjz3Jm-gYhPG9b6gwvhKAI1g=s96-c	2026-08-13 22:04:55.049734+00	2.7	member	\N	3	1	0	8	\N	0
51	3	\N	Arthur	\N	2026-08-13 21:51:18.213116+00	0.0	member	2026-08-13 22:49:57.618028+00	0	0	0	0	\N	0
67	3	28c7d012-3395-4b1e-9105-9a52ea533684	Joeliton Souza	https://lh3.googleusercontent.com/a/ACg8ocKyzh9ixV7Fx6kY6RgaFYrQNjVWksJKYXOFSaWoS7SIPKNmbUIphg=s96-c	2026-08-13 22:06:52.353178+00	4.5	member	\N	0	1	10	14	\N	0
64	3	f3b0d083-2a64-4493-8601-5949b4f7c0b3	João Vitor Dantas Teixeira	https://lh3.googleusercontent.com/a/ACg8ocKJF5WJbjx8aiMCLMIsordlM1LbBHpx6y4a2mS_hd-lajcnzWeB=s96-c	2026-08-13 21:57:03.276667+00	3.0	member	\N	0	0	0	0	\N	0
2	2	\N	Riquelme	\N	2026-08-13 14:43:57.590902+00	4.0	member	2026-08-14 12:51:58.216605+00	0	0	0	0	Maradona	0
46	3	\N	Ivan	\N	2026-08-13 21:51:18.213116+00	3.0	member	2026-08-13 23:42:02.651129+00	0	0	0	0	\N	0
71	3	b68e362f-1116-42c4-94f6-39645662b2d3	Rainer M	https://lh3.googleusercontent.com/a/ACg8ocL_4dXLTJ5ChSi-W4yKX88MCS5ble9Av_-ND5yZ7PvLc6WL3PDZ=s96-c	2026-08-13 23:30:53.454243+00	4.0	member	\N	0	0	0	0	\N	0
54	3	\N	Danrley	\N	2026-08-13 21:51:18.213116+00	4.3	member	\N	0	0	6	10	\N	0
3	2	447fde8b-49d3-4433-a542-cbb69b9f683f	GBA	https://lh3.googleusercontent.com/a/ACg8ocLwAebmLiQ9wWvdi1kM2c1GE5M1IOSxtDmYWbGSCixZVYMP5w=s96-c	2026-08-13 16:39:51.37706+00	5.0	member	\N	0	0	0	1	\N	0
37	2	\N	Huston	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	2	\N	0
38	2	\N	Eric ( Huston )	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
42	2	\N	Murilo dos Anjos Montino	\N	2026-08-13 21:42:46.42257+00	0.0	member	\N	1	0	0	1	\N	0
63	3	\N	Jerferson	\N	2026-08-13 21:51:18.213116+00	4.0	member	\N	0	0	0	0	\N	0
41	2	\N	Jerferson	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	2	\N	0
39	2	\N	Jay	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	1	2	\N	0
40	2	\N	Jean (modo matador)	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	1	2	\N	0
1	2	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	Murilo Montino	https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c	2026-08-13 13:44:52.479048+00	2.7	member	\N	0	0	2	12	\N	0
44	3	\N	Vitinho	\N	2026-08-13 21:51:18.213116+00	0.0	member	2026-08-13 21:59:13.639068+00	0	0	0	0	\N	0
62	3	\N	Jean (modo matador)	\N	2026-08-13 21:51:18.213116+00	0.0	member	2026-08-13 22:05:51.359311+00	0	0	0	0	\N	0
6	2	\N	B	\N	2026-08-13 16:40:04.722529+00	4.5	member	\N	0	0	0	0	\N	0
7	2	\N	C	\N	2026-08-13 16:40:05.96283+00	3.0	member	\N	0	0	0	0	\N	0
8	2	\N	D	\N	2026-08-13 16:40:07.273345+00	3.5	member	\N	0	0	0	0	\N	0
45	3	\N	Murilo	\N	2026-08-13 21:51:18.213116+00	0.0	member	2026-08-13 22:08:26.298109+00	0	0	0	0	\N	0
57	3	\N	Joeliton (goleiro)	\N	2026-08-13 21:51:18.213116+00	0.0	member	2026-08-13 22:08:33.116929+00	0	0	0	0	\N	0
9	2	\N	E	\N	2026-08-13 16:40:08.480956+00	4.5	member	\N	0	0	0	0	\N	0
10	2	\N	F	\N	2026-08-13 16:40:09.875886+00	4.0	member	\N	0	0	0	0	\N	0
11	2	\N	G	\N	2026-08-13 16:40:11.007898+00	3.5	member	\N	0	0	0	0	\N	0
12	2	\N	H	\N	2026-08-13 16:40:12.70083+00	4.0	member	\N	0	0	0	0	\N	0
13	2	\N	I	\N	2026-08-13 16:40:15.333021+00	3.5	member	\N	0	0	0	0	\N	0
14	2	\N	J	\N	2026-08-13 16:40:17.649264+00	4.0	member	\N	0	0	0	1	\N	0
15	2	\N	K	\N	2026-08-13 16:40:19.512496+00	4.0	member	\N	0	0	0	0	\N	0
16	2	\N	L	\N	2026-08-13 16:40:20.431346+00	5.0	member	\N	0	0	0	1	\N	0
17	2	\N	M	\N	2026-08-13 16:40:21.381956+00	3.0	member	\N	0	0	0	0	\N	0
18	2	\N	N	\N	2026-08-13 16:40:22.502839+00	1.5	member	\N	0	0	0	0	\N	0
19	2	\N	O	\N	2026-08-13 16:40:23.422728+00	0.5	member	\N	0	0	0	0	\N	0
20	2	\N	P	\N	2026-08-13 16:40:24.302886+00	1.5	member	\N	0	0	0	1	\N	0
21	2	\N	Q	\N	2026-08-13 16:40:25.109812+00	3.5	member	\N	0	0	0	0	\N	0
32	2	\N	Danrley	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
4	2	\N	Vitinho	\N	2026-08-13 16:39:56.744272+00	3.0	member	\N	3	0	1	3	\N	0
31	2	\N	Hugo	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	3	1	2	\N	0
35	2	\N	Joeliton (goleiro)	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	1	0	1	2	\N	0
23	2	\N	Murilo	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
24	2	\N	Ivan	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
69	3	269089d0-7e10-41e7-9537-bf70586ec474	Ryller Fonseca	https://lh3.googleusercontent.com/a/ACg8ocKIrhzxXDbyzfwUuxUR8j0BLN3Q2Cjp87erlWt-Izd9wp3Lwg=s96-c	2026-08-13 22:24:39.441734+00	3.0	member	\N	0	0	0	0	\N	0
27	2	\N	GBA	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	1	0	2	\N	0
22	2	\N	Vitinho	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
68	3	5656ca85-54d0-4194-afae-c705e22e8063	Ivan Rocha	https://lh3.googleusercontent.com/a/ACg8ocLGJfUbiAJp-HiUQ0FlCLWN2952k9diWOdoC6AjypMFo7hT2TvH=s96-c	2026-08-13 22:08:08.941408+00	2.3	member	\N	4	1	2	9	\N	0
25	2	\N	Alberto	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	8	11	\N	0
70	3	b1a54856-c37a-46a8-b171-4f540688c538	Arthur De Jesus Santos	https://lh3.googleusercontent.com/a/ACg8ocKMuc8yel4uIp2bhVzkrLy8-CgBoVUL-r_92YamhaAV1xEg3ojQ=s96-c	2026-08-13 22:34:38.745837+00	1.6	captain	\N	2	1	0	8	\N	0
26	2	\N	Jadson	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	8	11	\N	0
28	2	\N	Luis Otávio	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
29	2	\N	Arthur	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
30	2	\N	Antonio Vitor	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	8	11	\N	0
33	2	\N	will	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	2	\N	0
34	2	\N	Gustavo Dourado	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	0	0	0	1	\N	0
36	2	\N	Gildeon	\N	2026-08-13 21:41:00.553659+00	0.0	member	\N	1	0	0	2	\N	0
\.


--
-- TOC entry 4425 (class 0 OID 17502)
-- Dependencies: 298
-- Data for Name: championships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.championships (id, name, invite_code, created_by, created_at, logo_path, deleted_at, event_time, players_per_team, is_visible, skip_guest_goalkeeper_matches) FROM stdin;
2	Desenvolvimento	c5e1b780188d45f9	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 13:44:52.371559+00	2/logo.jpg	\N	20:00:00	5	t	f
3	Baba do Mago	153d9312b46143e1	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 21:50:55.141971+00	\N	\N	20:00:00	5	t	f
\.


--
-- TOC entry 4428 (class 0 OID 17561)
-- Dependencies: 301
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, display_name, avatar_url, created_at, updated_at) FROM stdin;
7e9bb73f-b400-432d-a3fd-77ad81ce6a62	gustavodouurado@gmail.com	Gustavo Dourado	https://lh3.googleusercontent.com/a/ACg8ocKx4SOa8fHCmndbB0C4AnU_YPWAlzwyE4fXRJO7HLjCdrnP4yJE=s96-c	2026-08-13 22:39:10.550284+00	2026-08-13 23:17:38.738+00
b68e362f-1116-42c4-94f6-39645662b2d3	rainerdemoura005@gmail.com	Rainer M	https://lh3.googleusercontent.com/a/ACg8ocL_4dXLTJ5ChSi-W4yKX88MCS5ble9Av_-ND5yZ7PvLc6WL3PDZ=s96-c	2026-08-13 23:30:32.843133+00	2026-08-13 23:30:35.015+00
d8334794-c377-4002-8f01-3f17f916625a	antonyovitor22@gmail.com	Antonio Vitor	https://lh3.googleusercontent.com/a/ACg8ocJY-Dh5nT4EpLbMkNCSM8Q3M44qeEP6Uvd2cOPQ_wnZhvUAJg=s96-c	2026-08-13 22:03:19.518765+00	2026-08-14 11:44:18.948+00
f3b0d083-2a64-4493-8601-5949b4f7c0b3	jvteixeira5621@gmail.com	João Vitor Dantas Teixeira	https://lh3.googleusercontent.com/a/ACg8ocKJF5WJbjx8aiMCLMIsordlM1LbBHpx6y4a2mS_hd-lajcnzWeB=s96-c	2026-08-13 21:56:57.619228+00	2026-08-13 21:56:58.464+00
28c7d012-3395-4b1e-9105-9a52ea533684	joelitonsouza127@gmail.com	Joeliton Souza	https://lh3.googleusercontent.com/a/ACg8ocKyzh9ixV7Fx6kY6RgaFYrQNjVWksJKYXOFSaWoS7SIPKNmbUIphg=s96-c	2026-08-13 22:04:47.990659+00	2026-08-14 14:12:11.067+00
b1a54856-c37a-46a8-b171-4f540688c538	shawnp138@gmail.com	Arthur De Jesus Santos	https://lh3.googleusercontent.com/a/ACg8ocKMuc8yel4uIp2bhVzkrLy8-CgBoVUL-r_92YamhaAV1xEg3ojQ=s96-c	2026-08-13 22:34:31.579107+00	2026-08-13 22:34:37.19+00
4e2a21c0-8c51-4076-860a-470e20b42d90	marx10jean.anjos@gmail.com	Jean Marx Anjos	https://lh3.googleusercontent.com/a/ACg8ocKStLjPxR4ygEY4-sMsTirR9bYCM0Fjz3Jm-gYhPG9b6gwvhKAI1g=s96-c	2026-08-13 22:03:52.194501+00	2026-08-13 22:05:09.826+00
447fde8b-49d3-4433-a542-cbb69b9f683f	murilo.montino@dcomp.ufs.br	Murilo dos Anjos Montino	https://lh3.googleusercontent.com/a/ACg8ocLwAebmLiQ9wWvdi1kM2c1GE5M1IOSxtDmYWbGSCixZVYMP5w=s96-c	2026-08-13 20:42:44.377306+00	2026-08-13 21:45:48.486+00
706d1e98-818e-47bf-b193-daa3adf6b8ed	wilsonaaju@gmail.com	WILSON MOTA	https://lh3.googleusercontent.com/a/ACg8ocKy-fVWbZ4Z_P_YguecEEg2KaCZfd9mfcbetaoBv4aNmzqtow=s96-c	2026-08-13 22:01:11.419003+00	2026-08-13 22:01:12.391+00
65c87b46-dd10-468e-b6c5-74a423df5a4a	vitinhofazendeirotb@gmail.com	Alysson Victor	https://lh3.googleusercontent.com/a/ACg8ocLIMXwUdAJ-rhwopdpfME6X_rU9B51oXveqs_FMAb-_AG2Y6qs=s96-c	2026-08-13 21:57:55.203742+00	2026-08-13 22:19:07.273+00
acdace9d-0c3b-46f1-82b1-7d2667e7a2be	murilomontino21@gmail.com	Murilo Montino	https://lh3.googleusercontent.com/a/ACg8ocI_HowE3kvpu4eM1rwCSKCeWpAvY7sqXCTJnNs8xoHOJeUGpNI=s96-c	2026-08-13 13:38:06.144696+00	2026-08-14 14:59:01.725+00
5656ca85-54d0-4194-afae-c705e22e8063	ivanrocha977@gmail.com	Ivan Rocha	https://lh3.googleusercontent.com/a/ACg8ocLGJfUbiAJp-HiUQ0FlCLWN2952k9diWOdoC6AjypMFo7hT2TvH=s96-c	2026-08-13 22:07:56.760241+00	2026-08-13 22:07:57.571+00
269089d0-7e10-41e7-9537-bf70586ec474	ryllerfonseca4@gmail.com	Ryller Fonseca	https://lh3.googleusercontent.com/a/ACg8ocKIrhzxXDbyzfwUuxUR8j0BLN3Q2Cjp87erlWt-Izd9wp3Lwg=s96-c	2026-08-13 22:24:13.105506+00	2026-08-14 00:27:47.549+00
\.


--
-- TOC entry 4413 (class 0 OID 17250)
-- Dependencies: 286
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-08-13 07:08:18
20211116045059	2026-08-13 07:08:18
20211116050929	2026-08-13 07:08:18
20211116051442	2026-08-13 07:08:18
20211116212300	2026-08-13 07:08:18
20211116213355	2026-08-13 07:08:18
20211116213934	2026-08-13 07:08:18
20211116214523	2026-08-13 07:08:18
20211122062447	2026-08-13 07:08:18
20211124070109	2026-08-13 07:08:18
20211202204204	2026-08-13 07:08:18
20211202204605	2026-08-13 07:08:18
20211210212804	2026-08-13 07:08:18
20211228014915	2026-08-13 07:08:18
20220107221237	2026-08-13 07:08:18
20220228202821	2026-08-13 07:08:18
20220312004840	2026-08-13 07:08:18
20220603231003	2026-08-13 07:08:18
20220603232444	2026-08-13 07:08:18
20220615214548	2026-08-13 07:08:18
20220712093339	2026-08-13 07:08:18
20220908172859	2026-08-13 07:08:18
20220916233421	2026-08-13 07:08:18
20230119133233	2026-08-13 07:08:18
20230128025114	2026-08-13 07:08:18
20230128025212	2026-08-13 07:08:18
20230227211149	2026-08-13 07:08:18
20230228184745	2026-08-13 07:08:18
20230308225145	2026-08-13 07:08:18
20230328144023	2026-08-13 07:08:18
20231018144023	2026-08-13 07:08:18
20231204144023	2026-08-13 07:08:18
20231204144024	2026-08-13 07:08:18
20231204144025	2026-08-13 07:08:18
20240108234812	2026-08-13 07:08:18
20240109165339	2026-08-13 07:08:18
20240227174441	2026-08-13 07:08:18
20240311171622	2026-08-13 07:08:18
20240321100241	2026-08-13 07:08:18
20240401105812	2026-08-13 07:08:18
20240418121054	2026-08-13 07:08:18
20240523004032	2026-08-13 07:08:18
20240618124746	2026-08-13 07:08:18
20240801235015	2026-08-13 07:08:18
20240805133720	2026-08-13 07:08:18
20240827160934	2026-08-13 07:08:18
20240919163303	2026-08-13 07:08:18
20240919163305	2026-08-13 07:08:18
20241019105805	2026-08-13 07:08:18
20241030150047	2026-08-13 07:08:18
20241108114728	2026-08-13 07:08:18
20241121104152	2026-08-13 07:08:18
20241130184212	2026-08-13 07:08:18
20241220035512	2026-08-13 07:08:18
20241220123912	2026-08-13 07:08:18
20241224161212	2026-08-13 07:08:18
20250107150512	2026-08-13 07:08:18
20250110162412	2026-08-13 07:08:18
20250123174212	2026-08-13 07:08:18
20250128220012	2026-08-13 07:08:18
20250506224012	2026-08-13 07:08:18
20250523164012	2026-08-13 07:08:18
20250714121412	2026-08-13 07:08:18
20250905041441	2026-08-13 07:08:18
20251103001201	2026-08-13 07:08:18
20251120212548	2026-08-13 07:08:18
20251120215549	2026-08-13 07:08:18
20260218120000	2026-08-13 07:08:18
20260326120000	2026-08-13 07:08:18
20260514120000	2026-08-13 07:08:18
20260527120000	2026-08-13 07:08:18
20260528120000	2026-08-13 07:08:18
20260603120000	2026-08-13 07:08:18
20260605120000	2026-08-13 07:08:18
20260606110000	2026-08-13 07:08:18
20260616120000	2026-08-13 07:08:18
20260624120000	2026-08-13 07:08:18
20260626120000	2026-08-13 07:08:18
20260706120000	2026-08-13 07:08:18
20260707120000	2026-08-13 07:08:18
20260709120000	2026-08-13 07:08:18
\.


--
-- TOC entry 4414 (class 0 OID 17253)
-- Dependencies: 287
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_realtime_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- TOC entry 4417 (class 0 OID 17294)
-- Dependencies: 290
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
championship-logos	championship-logos	\N	2026-08-13 14:25:13.637394+00	2026-08-13 14:25:13.637394+00	t	f	1048576	{image/png,image/jpeg}	\N	STANDARD
\.


--
-- TOC entry 4421 (class 0 OID 17414)
-- Dependencies: 294
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- TOC entry 4422 (class 0 OID 17427)
-- Dependencies: 295
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4416 (class 0 OID 17286)
-- Dependencies: 289
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-08-13 07:08:22.569707
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-08-13 07:08:22.5928
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-08-13 07:08:22.604724
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-08-13 07:08:22.631494
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-08-13 07:08:22.651309
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-08-13 07:08:22.662412
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-08-13 07:08:22.67465
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-08-13 07:08:22.686346
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-08-13 07:08:22.696769
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-08-13 07:08:22.707672
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-08-13 07:08:22.71845
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-08-13 07:08:22.731595
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-08-13 07:08:22.74305
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-08-13 07:08:22.754061
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-08-13 07:08:22.764762
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-08-13 07:08:22.792235
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-08-13 07:08:22.804369
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-08-13 07:08:22.81516
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-08-13 07:08:22.825514
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-08-13 07:08:22.839083
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-08-13 07:08:22.850152
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-08-13 07:08:22.863709
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-08-13 07:08:22.884056
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-08-13 07:08:22.902172
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-08-13 07:08:22.913402
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-08-13 07:08:22.924272
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-08-13 07:08:22.93521
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-08-13 07:08:22.945553
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-08-13 07:08:22.956038
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-08-13 07:08:22.968565
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-08-13 07:08:22.979164
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-08-13 07:08:22.989429
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-08-13 07:08:22.999827
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-08-13 07:08:23.01122
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-08-13 07:08:23.02192
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-08-13 07:08:23.033749
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-08-13 07:08:23.04433
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-08-13 07:08:23.066941
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-08-13 07:08:23.080861
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-08-13 07:08:23.099922
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-08-13 07:08:23.110226
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-08-13 07:08:23.120469
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-08-13 07:08:23.130651
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-08-13 07:08:23.14107
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-08-13 07:08:23.151405
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-08-13 07:08:23.162872
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-08-13 07:08:23.180503
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-08-13 07:08:23.191476
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-08-13 07:08:23.202041
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-08-13 07:08:23.224872
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-08-13 07:08:23.235945
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-08-13 07:08:23.26058
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-08-13 07:08:23.263932
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-08-13 07:08:23.280132
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-08-13 07:08:23.285771
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-08-13 07:08:23.289088
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-08-13 07:08:23.300016
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-08-13 07:08:23.313621
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-08-13 07:08:23.325577
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-08-13 07:08:23.338579
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-08-13 07:08:23.34976
61	mark-filename-immutable	fe0096517ae9d60aaec1d110172ba9036dc66bb7	2026-08-13 07:08:23.361639
\.


--
-- TOC entry 4418 (class 0 OID 17304)
-- Dependencies: 291
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
155d2718-fabe-4e03-a7bf-9f56f954675e	championship-logos	2/logo.jpg	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	2026-08-13 14:32:12.78943+00	2026-08-13 14:32:12.78943+00	2026-08-13 14:32:12.78943+00	{"eTag": "\\"15bd068b555b31e3df22e9a316843ec9\\"", "size": 11881, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-13T14:32:13.000Z", "contentLength": 11881, "httpStatusCode": 200}	f0a8c7bc-649e-44f5-a1b7-570c4375e176	acdace9d-0c3b-46f1-82b1-7d2667e7a2be	{}
\.


--
-- TOC entry 4419 (class 0 OID 17353)
-- Dependencies: 292
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- TOC entry 4420 (class 0 OID 17367)
-- Dependencies: 293
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- TOC entry 4423 (class 0 OID 17437)
-- Dependencies: 296
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4429 (class 0 OID 17628)
-- Dependencies: 302
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
\.


--
-- TOC entry 3720 (class 0 OID 16612)
-- Dependencies: 262
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4681 (class 0 OID 0)
-- Dependencies: 257
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 53, true);


--
-- TOC entry 4682 (class 0 OID 0)
-- Dependencies: 311
-- Name: championship_event_attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_event_attendance_id_seq', 438, true);


--
-- TOC entry 4683 (class 0 OID 0)
-- Dependencies: 315
-- Name: championship_event_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_event_goals_id_seq', 13, true);


--
-- TOC entry 4684 (class 0 OID 0)
-- Dependencies: 313
-- Name: championship_event_match_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_event_match_players_id_seq', 105, true);


--
-- TOC entry 4685 (class 0 OID 0)
-- Dependencies: 309
-- Name: championship_event_matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_event_matches_id_seq', 14, true);


--
-- TOC entry 4686 (class 0 OID 0)
-- Dependencies: 307
-- Name: championship_event_team_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_event_team_players_id_seq', 439, true);


--
-- TOC entry 4687 (class 0 OID 0)
-- Dependencies: 305
-- Name: championship_event_teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_event_teams_id_seq', 94, true);


--
-- TOC entry 4688 (class 0 OID 0)
-- Dependencies: 303
-- Name: championship_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_events_id_seq', 18, true);


--
-- TOC entry 4689 (class 0 OID 0)
-- Dependencies: 299
-- Name: championship_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championship_players_id_seq', 71, true);


--
-- TOC entry 4690 (class 0 OID 0)
-- Dependencies: 297
-- Name: championships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.championships_id_seq', 3, true);


--
-- TOC entry 4691 (class 0 OID 0)
-- Dependencies: 288
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_realtime_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- TOC entry 3962 (class 2606 OID 16789)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 3931 (class 2606 OID 16535)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4017 (class 2606 OID 17121)
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- TOC entry 4019 (class 2606 OID 17119)
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3985 (class 2606 OID 16895)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 3940 (class 2606 OID 16913)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 3942 (class 2606 OID 16923)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 3929 (class 2606 OID 16528)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 3964 (class 2606 OID 16782)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 3960 (class 2606 OID 16770)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 3952 (class 2606 OID 16963)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 3954 (class 2606 OID 16757)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 3998 (class 2606 OID 17022)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 4000 (class 2606 OID 17020)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4002 (class 2606 OID 17018)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4012 (class 2606 OID 17080)
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- TOC entry 3995 (class 2606 OID 16982)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4006 (class 2606 OID 17044)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4008 (class 2606 OID 17046)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 3989 (class 2606 OID 16948)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3923 (class 2606 OID 16518)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3926 (class 2606 OID 16700)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 3974 (class 2606 OID 16829)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 3976 (class 2606 OID 16827)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3981 (class 2606 OID 16843)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 3934 (class 2606 OID 16541)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 3947 (class 2606 OID 16721)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3971 (class 2606 OID 16810)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 3966 (class 2606 OID 16801)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3916 (class 2606 OID 16883)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3918 (class 2606 OID 16505)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4027 (class 2606 OID 17158)
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4023 (class 2606 OID 17141)
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 4109 (class 2606 OID 17788)
-- Name: championship_event_attendance championship_event_attendance_event_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_attendance
    ADD CONSTRAINT championship_event_attendance_event_id_player_id_key UNIQUE (event_id, player_id);


--
-- TOC entry 4111 (class 2606 OID 17786)
-- Name: championship_event_attendance championship_event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_attendance
    ADD CONSTRAINT championship_event_attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 4127 (class 2606 OID 17902)
-- Name: championship_event_goals championship_event_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_goals
    ADD CONSTRAINT championship_event_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 4116 (class 2606 OID 17866)
-- Name: championship_event_match_players championship_event_match_players_match_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_match_id_player_id_key UNIQUE (match_id, player_id);


--
-- TOC entry 4118 (class 2606 OID 17935)
-- Name: championship_event_match_players championship_event_match_players_match_id_team_id_slot_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_match_id_team_id_slot_key UNIQUE (match_id, team_id, slot) DEFERRABLE;


--
-- TOC entry 4120 (class 2606 OID 17864)
-- Name: championship_event_match_players championship_event_match_players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_pkey PRIMARY KEY (id);


--
-- TOC entry 4100 (class 2606 OID 17845)
-- Name: championship_event_matches championship_event_matches_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_matches
    ADD CONSTRAINT championship_event_matches_id_event_id_key UNIQUE (id, event_id);


--
-- TOC entry 4103 (class 2606 OID 17725)
-- Name: championship_event_matches championship_event_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_matches
    ADD CONSTRAINT championship_event_matches_pkey PRIMARY KEY (id);


--
-- TOC entry 4092 (class 2606 OID 17704)
-- Name: championship_event_team_players championship_event_team_players_event_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_team_players
    ADD CONSTRAINT championship_event_team_players_event_id_player_id_key UNIQUE (event_id, player_id);


--
-- TOC entry 4095 (class 2606 OID 17702)
-- Name: championship_event_team_players championship_event_team_players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_team_players
    ADD CONSTRAINT championship_event_team_players_pkey PRIMARY KEY (id);


--
-- TOC entry 4084 (class 2606 OID 17686)
-- Name: championship_event_teams championship_event_teams_event_id_color_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_teams
    ADD CONSTRAINT championship_event_teams_event_id_color_key UNIQUE (event_id, color);


--
-- TOC entry 4087 (class 2606 OID 17688)
-- Name: championship_event_teams championship_event_teams_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_teams
    ADD CONSTRAINT championship_event_teams_id_event_id_key UNIQUE (id, event_id);


--
-- TOC entry 4089 (class 2606 OID 17684)
-- Name: championship_event_teams championship_event_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_teams
    ADD CONSTRAINT championship_event_teams_pkey PRIMARY KEY (id);


--
-- TOC entry 4082 (class 2606 OID 17663)
-- Name: championship_events championship_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_events
    ADD CONSTRAINT championship_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4071 (class 2606 OID 17529)
-- Name: championship_players championship_players_championship_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_players
    ADD CONSTRAINT championship_players_championship_id_user_id_key UNIQUE (championship_id, user_id);


--
-- TOC entry 4073 (class 2606 OID 17527)
-- Name: championship_players championship_players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_players
    ADD CONSTRAINT championship_players_pkey PRIMARY KEY (id);


--
-- TOC entry 4066 (class 2606 OID 17512)
-- Name: championships championships_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_invite_code_key UNIQUE (invite_code);


--
-- TOC entry 4068 (class 2606 OID 17510)
-- Name: championships championships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_pkey PRIMARY KEY (id);


--
-- TOC entry 4076 (class 2606 OID 17569)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3885 (class 2606 OID 17264)
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- TOC entry 4031 (class 2606 OID 17266)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4036 (class 2606 OID 17268)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4033 (class 2606 OID 17270)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4057 (class 2606 OID 17460)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4044 (class 2606 OID 17302)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 4060 (class 2606 OID 17436)
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- TOC entry 4039 (class 2606 OID 17293)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4041 (class 2606 OID 17291)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4050 (class 2606 OID 17314)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4055 (class 2606 OID 17376)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4053 (class 2606 OID 17361)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4063 (class 2606 OID 17446)
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- TOC entry 4078 (class 2606 OID 17634)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 3932 (class 1259 OID 16536)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 3902 (class 1259 OID 16710)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4013 (class 1259 OID 17125)
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- TOC entry 4014 (class 1259 OID 17124)
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- TOC entry 4015 (class 1259 OID 17122)
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- TOC entry 4020 (class 1259 OID 17123)
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- TOC entry 3903 (class 1259 OID 16712)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3904 (class 1259 OID 16713)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3950 (class 1259 OID 16791)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 3983 (class 1259 OID 16899)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 3938 (class 1259 OID 16879)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 4692 (class 0 OID 0)
-- Dependencies: 3938
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- TOC entry 3943 (class 1259 OID 16707)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 3986 (class 1259 OID 16896)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4010 (class 1259 OID 17081)
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- TOC entry 3987 (class 1259 OID 16897)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 3905 (class 1259 OID 17168)
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- TOC entry 3906 (class 1259 OID 17167)
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- TOC entry 3907 (class 1259 OID 17169)
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- TOC entry 3908 (class 1259 OID 17170)
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- TOC entry 3958 (class 1259 OID 16902)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 3955 (class 1259 OID 16763)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 3956 (class 1259 OID 16908)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 3996 (class 1259 OID 17033)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 3993 (class 1259 OID 16986)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4003 (class 1259 OID 17059)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4004 (class 1259 OID 17057)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4009 (class 1259 OID 17058)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 3990 (class 1259 OID 16955)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 3991 (class 1259 OID 16954)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 3992 (class 1259 OID 16956)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 3909 (class 1259 OID 16714)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3910 (class 1259 OID 16711)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3919 (class 1259 OID 16519)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 3920 (class 1259 OID 16520)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 3921 (class 1259 OID 16706)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 3924 (class 1259 OID 16793)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 3927 (class 1259 OID 16898)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 3977 (class 1259 OID 16835)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 3978 (class 1259 OID 16900)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 3979 (class 1259 OID 16850)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 3982 (class 1259 OID 16849)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 3944 (class 1259 OID 16901)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 3945 (class 1259 OID 17071)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 3948 (class 1259 OID 16792)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 3969 (class 1259 OID 16817)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 3972 (class 1259 OID 16816)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 3967 (class 1259 OID 16802)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 3968 (class 1259 OID 16964)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 3957 (class 1259 OID 16961)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 3949 (class 1259 OID 16790)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 3911 (class 1259 OID 16870)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 4693 (class 0 OID 0)
-- Dependencies: 3911
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- TOC entry 3912 (class 1259 OID 16708)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 3913 (class 1259 OID 16509)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 3914 (class 1259 OID 16925)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4025 (class 1259 OID 17165)
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- TOC entry 4028 (class 1259 OID 17164)
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- TOC entry 4021 (class 1259 OID 17147)
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- TOC entry 4024 (class 1259 OID 17148)
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- TOC entry 4107 (class 1259 OID 17799)
-- Name: championship_event_attendance_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_attendance_event_id_idx ON public.championship_event_attendance USING btree (event_id);


--
-- TOC entry 4112 (class 1259 OID 17800)
-- Name: championship_event_attendance_player_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_attendance_player_id_idx ON public.championship_event_attendance USING btree (player_id);


--
-- TOC entry 4123 (class 1259 OID 17921)
-- Name: championship_event_goals_assist_player_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_goals_assist_player_id_idx ON public.championship_event_goals USING btree (assist_player_id);


--
-- TOC entry 4124 (class 1259 OID 17919)
-- Name: championship_event_goals_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_goals_event_id_idx ON public.championship_event_goals USING btree (event_id);


--
-- TOC entry 4125 (class 1259 OID 17918)
-- Name: championship_event_goals_match_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_goals_match_id_idx ON public.championship_event_goals USING btree (match_id);


--
-- TOC entry 4128 (class 1259 OID 17920)
-- Name: championship_event_goals_scorer_player_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_goals_scorer_player_id_idx ON public.championship_event_goals USING btree (scorer_player_id);


--
-- TOC entry 4113 (class 1259 OID 17890)
-- Name: championship_event_match_players_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_match_players_event_id_idx ON public.championship_event_match_players USING btree (event_id);


--
-- TOC entry 4114 (class 1259 OID 17889)
-- Name: championship_event_match_players_match_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_match_players_match_id_idx ON public.championship_event_match_players USING btree (match_id);


--
-- TOC entry 4121 (class 1259 OID 17892)
-- Name: championship_event_match_players_player_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_match_players_player_id_idx ON public.championship_event_match_players USING btree (player_id);


--
-- TOC entry 4122 (class 1259 OID 17891)
-- Name: championship_event_match_players_team_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_match_players_team_id_idx ON public.championship_event_match_players USING btree (team_id);


--
-- TOC entry 4098 (class 1259 OID 17741)
-- Name: championship_event_matches_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_matches_event_id_idx ON public.championship_event_matches USING btree (event_id);


--
-- TOC entry 4101 (class 1259 OID 17853)
-- Name: championship_event_matches_one_open_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX championship_event_matches_one_open_idx ON public.championship_event_matches USING btree (event_id) WHERE (ended_at IS NULL);


--
-- TOC entry 4104 (class 1259 OID 17742)
-- Name: championship_event_matches_team_a_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_matches_team_a_id_idx ON public.championship_event_matches USING btree (team_a_id);


--
-- TOC entry 4105 (class 1259 OID 17743)
-- Name: championship_event_matches_team_b_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_matches_team_b_id_idx ON public.championship_event_matches USING btree (team_b_id);


--
-- TOC entry 4106 (class 1259 OID 17854)
-- Name: championship_event_matches_winner_team_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_matches_winner_team_id_idx ON public.championship_event_matches USING btree (winner_team_id);


--
-- TOC entry 4090 (class 1259 OID 17715)
-- Name: championship_event_team_players_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_team_players_event_id_idx ON public.championship_event_team_players USING btree (event_id);


--
-- TOC entry 4093 (class 1259 OID 17828)
-- Name: championship_event_team_players_one_gk_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX championship_event_team_players_one_gk_idx ON public.championship_event_team_players USING btree (team_id) WHERE is_goalkeeper;


--
-- TOC entry 4096 (class 1259 OID 17717)
-- Name: championship_event_team_players_player_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_team_players_player_id_idx ON public.championship_event_team_players USING btree (player_id);


--
-- TOC entry 4097 (class 1259 OID 17716)
-- Name: championship_event_team_players_team_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_team_players_team_id_idx ON public.championship_event_team_players USING btree (team_id);


--
-- TOC entry 4085 (class 1259 OID 17694)
-- Name: championship_event_teams_event_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_event_teams_event_id_idx ON public.championship_event_teams USING btree (event_id);


--
-- TOC entry 4079 (class 1259 OID 17812)
-- Name: championship_events_championship_day_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX championship_events_championship_day_idx ON public.championship_events USING btree (championship_id, (((starts_at AT TIME ZONE 'America/Sao_Paulo'::text))::date)) WHERE (deleted_at IS NULL);


--
-- TOC entry 4080 (class 1259 OID 17811)
-- Name: championship_events_championship_id_starts_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_events_championship_id_starts_at_idx ON public.championship_events USING btree (championship_id, starts_at DESC) WHERE (deleted_at IS NULL);


--
-- TOC entry 4069 (class 1259 OID 17540)
-- Name: championship_players_championship_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_players_championship_id_idx ON public.championship_players USING btree (championship_id);


--
-- TOC entry 4074 (class 1259 OID 17541)
-- Name: championship_players_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championship_players_user_id_idx ON public.championship_players USING btree (user_id);


--
-- TOC entry 4064 (class 1259 OID 17609)
-- Name: championships_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX championships_created_by_idx ON public.championships USING btree (created_by) WHERE (deleted_at IS NULL);


--
-- TOC entry 4034 (class 1259 OID 17271)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4029 (class 1259 OID 17272)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4037 (class 1259 OID 17273)
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- TOC entry 4042 (class 1259 OID 17303)
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 4045 (class 1259 OID 17320)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 4058 (class 1259 OID 17461)
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4051 (class 1259 OID 17387)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 4046 (class 1259 OID 17352)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 4047 (class 1259 OID 17468)
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- TOC entry 4048 (class 1259 OID 17321)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4061 (class 1259 OID 17452)
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- TOC entry 4175 (class 2620 OID 17579)
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_platform_user();


--
-- TOC entry 4176 (class 2620 OID 17580)
-- Name: users on_auth_user_updated; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_updated AFTER UPDATE OF email, raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_platform_user();


--
-- TOC entry 4183 (class 2620 OID 17977)
-- Name: championship_event_attendance championship_event_attendance_set_event_date; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER championship_event_attendance_set_event_date BEFORE INSERT ON public.championship_event_attendance FOR EACH ROW EXECUTE FUNCTION public.championship_event_attendance_set_event_date();


--
-- TOC entry 4184 (class 2620 OID 17988)
-- Name: championship_event_attendance championship_event_attendance_set_rating; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER championship_event_attendance_set_rating BEFORE INSERT ON public.championship_event_attendance FOR EACH ROW EXECUTE FUNCTION public.championship_event_attendance_set_rating();


--
-- TOC entry 4182 (class 2620 OID 17637)
-- Name: championships championships_owner_quota; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER championships_owner_quota BEFORE INSERT OR UPDATE OF created_by ON public.championships FOR EACH ROW EXECUTE FUNCTION public.enforce_championship_owner_quota();


--
-- TOC entry 4177 (class 2620 OID 17274)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 4178 (class 2620 OID 17406)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 4179 (class 2620 OID 17470)
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 4180 (class 2620 OID 17471)
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 4181 (class 2620 OID 17340)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 4130 (class 2606 OID 16694)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4135 (class 2606 OID 16783)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4134 (class 2606 OID 16771)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4133 (class 2606 OID 16758)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4141 (class 2606 OID 17023)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4142 (class 2606 OID 17028)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4143 (class 2606 OID 17052)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4144 (class 2606 OID 17047)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4140 (class 2606 OID 16949)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4129 (class 2606 OID 16727)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4137 (class 2606 OID 16830)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4138 (class 2606 OID 16903)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4139 (class 2606 OID 16844)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4131 (class 2606 OID 17066)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4132 (class 2606 OID 16722)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4136 (class 2606 OID 16811)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4146 (class 2606 OID 17159)
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4145 (class 2606 OID 17142)
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4166 (class 2606 OID 17789)
-- Name: championship_event_attendance championship_event_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_attendance
    ADD CONSTRAINT championship_event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.championship_events(id) ON DELETE CASCADE;


--
-- TOC entry 4167 (class 2606 OID 17794)
-- Name: championship_event_attendance championship_event_attendance_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_attendance
    ADD CONSTRAINT championship_event_attendance_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.championship_players(id) ON DELETE RESTRICT;


--
-- TOC entry 4172 (class 2606 OID 18035)
-- Name: championship_event_goals championship_event_goals_match_id_assist_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_goals
    ADD CONSTRAINT championship_event_goals_match_id_assist_player_id_fkey FOREIGN KEY (match_id, assist_player_id) REFERENCES public.championship_event_match_players(match_id, player_id) DEFERRABLE;


--
-- TOC entry 4173 (class 2606 OID 17903)
-- Name: championship_event_goals championship_event_goals_match_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_goals
    ADD CONSTRAINT championship_event_goals_match_id_event_id_fkey FOREIGN KEY (match_id, event_id) REFERENCES public.championship_event_matches(id, event_id) ON DELETE CASCADE;


--
-- TOC entry 4174 (class 2606 OID 18030)
-- Name: championship_event_goals championship_event_goals_match_id_scorer_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_goals
    ADD CONSTRAINT championship_event_goals_match_id_scorer_player_id_fkey FOREIGN KEY (match_id, scorer_player_id) REFERENCES public.championship_event_match_players(match_id, player_id) DEFERRABLE;


--
-- TOC entry 4168 (class 2606 OID 18025)
-- Name: championship_event_match_players championship_event_match_players_event_id_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_event_id_player_id_fkey FOREIGN KEY (event_id, player_id) REFERENCES public.championship_event_attendance(event_id, player_id) DEFERRABLE;


--
-- TOC entry 4169 (class 2606 OID 17874)
-- Name: championship_event_match_players championship_event_match_players_match_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_match_id_event_id_fkey FOREIGN KEY (match_id, event_id) REFERENCES public.championship_event_matches(id, event_id) ON DELETE CASCADE;


--
-- TOC entry 4170 (class 2606 OID 17869)
-- Name: championship_event_match_players championship_event_match_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.championship_players(id) ON DELETE RESTRICT;


--
-- TOC entry 4171 (class 2606 OID 17879)
-- Name: championship_event_match_players championship_event_match_players_team_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_match_players
    ADD CONSTRAINT championship_event_match_players_team_id_event_id_fkey FOREIGN KEY (team_id, event_id) REFERENCES public.championship_event_teams(id, event_id) ON DELETE RESTRICT;


--
-- TOC entry 4162 (class 2606 OID 17726)
-- Name: championship_event_matches championship_event_matches_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_matches
    ADD CONSTRAINT championship_event_matches_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.championship_events(id) ON DELETE CASCADE;


--
-- TOC entry 4163 (class 2606 OID 17731)
-- Name: championship_event_matches championship_event_matches_team_a_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_matches
    ADD CONSTRAINT championship_event_matches_team_a_id_event_id_fkey FOREIGN KEY (team_a_id, event_id) REFERENCES public.championship_event_teams(id, event_id) ON DELETE RESTRICT;


--
-- TOC entry 4164 (class 2606 OID 17736)
-- Name: championship_event_matches championship_event_matches_team_b_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_matches
    ADD CONSTRAINT championship_event_matches_team_b_id_event_id_fkey FOREIGN KEY (team_b_id, event_id) REFERENCES public.championship_event_teams(id, event_id) ON DELETE RESTRICT;


--
-- TOC entry 4165 (class 2606 OID 17848)
-- Name: championship_event_matches championship_event_matches_winner_team_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_matches
    ADD CONSTRAINT championship_event_matches_winner_team_id_event_id_fkey FOREIGN KEY (winner_team_id, event_id) REFERENCES public.championship_event_teams(id, event_id) ON DELETE RESTRICT;


--
-- TOC entry 4159 (class 2606 OID 18020)
-- Name: championship_event_team_players championship_event_team_players_attendance_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_team_players
    ADD CONSTRAINT championship_event_team_players_attendance_fk FOREIGN KEY (event_id, player_id) REFERENCES public.championship_event_attendance(event_id, player_id) DEFERRABLE;


--
-- TOC entry 4160 (class 2606 OID 17705)
-- Name: championship_event_team_players championship_event_team_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_team_players
    ADD CONSTRAINT championship_event_team_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.championship_players(id) ON DELETE RESTRICT;


--
-- TOC entry 4161 (class 2606 OID 17710)
-- Name: championship_event_team_players championship_event_team_players_team_id_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_team_players
    ADD CONSTRAINT championship_event_team_players_team_id_event_id_fkey FOREIGN KEY (team_id, event_id) REFERENCES public.championship_event_teams(id, event_id) ON DELETE CASCADE;


--
-- TOC entry 4158 (class 2606 OID 17689)
-- Name: championship_event_teams championship_event_teams_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_event_teams
    ADD CONSTRAINT championship_event_teams_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.championship_events(id) ON DELETE CASCADE;


--
-- TOC entry 4156 (class 2606 OID 17664)
-- Name: championship_events championship_events_championship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_events
    ADD CONSTRAINT championship_events_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE;


--
-- TOC entry 4157 (class 2606 OID 17669)
-- Name: championship_events championship_events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_events
    ADD CONSTRAINT championship_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4153 (class 2606 OID 17530)
-- Name: championship_players championship_players_championship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_players
    ADD CONSTRAINT championship_players_championship_id_fkey FOREIGN KEY (championship_id) REFERENCES public.championships(id) ON DELETE CASCADE;


--
-- TOC entry 4154 (class 2606 OID 17535)
-- Name: championship_players championship_players_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championship_players
    ADD CONSTRAINT championship_players_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- TOC entry 4152 (class 2606 OID 17513)
-- Name: championships championships_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.championships
    ADD CONSTRAINT championships_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4155 (class 2606 OID 17570)
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4147 (class 2606 OID 17315)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4148 (class 2606 OID 17362)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4149 (class 2606 OID 17382)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4150 (class 2606 OID 17377)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4151 (class 2606 OID 17447)
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- TOC entry 4336 (class 0 OID 16529)
-- Dependencies: 260
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4347 (class 0 OID 16889)
-- Dependencies: 273
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4338 (class 0 OID 16687)
-- Dependencies: 264
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4335 (class 0 OID 16522)
-- Dependencies: 259
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4342 (class 0 OID 16776)
-- Dependencies: 268
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4341 (class 0 OID 16764)
-- Dependencies: 267
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4340 (class 0 OID 16751)
-- Dependencies: 266
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4348 (class 0 OID 16939)
-- Dependencies: 274
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4334 (class 0 OID 16511)
-- Dependencies: 258
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4345 (class 0 OID 16818)
-- Dependencies: 271
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4346 (class 0 OID 16836)
-- Dependencies: 272
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4337 (class 0 OID 16537)
-- Dependencies: 261
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4339 (class 0 OID 16717)
-- Dependencies: 265
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4344 (class 0 OID 16803)
-- Dependencies: 270
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4343 (class 0 OID 16794)
-- Dependencies: 269
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4333 (class 0 OID 16499)
-- Dependencies: 256
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4365 (class 0 OID 17780)
-- Dependencies: 312
-- Name: championship_event_attendance; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_attendance ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4385 (class 3256 OID 17817)
-- Name: championship_event_attendance championship_event_attendance_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_event_attendance_select_member ON public.championship_event_attendance FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championship_events e
  WHERE ((e.id = championship_event_attendance.event_id) AND (e.deleted_at IS NULL) AND public.is_championship_member(e.championship_id)))));


--
-- TOC entry 4367 (class 0 OID 17894)
-- Dependencies: 316
-- Name: championship_event_goals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_goals ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4387 (class 3256 OID 17923)
-- Name: championship_event_goals championship_event_goals_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_event_goals_select_member ON public.championship_event_goals FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championship_events e
  WHERE ((e.id = championship_event_goals.event_id) AND (e.deleted_at IS NULL) AND public.is_championship_member(e.championship_id)))));


--
-- TOC entry 4366 (class 0 OID 17856)
-- Dependencies: 314
-- Name: championship_event_match_players; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_match_players ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4386 (class 3256 OID 17922)
-- Name: championship_event_match_players championship_event_match_players_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_event_match_players_select_member ON public.championship_event_match_players FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championship_events e
  WHERE ((e.id = championship_event_match_players.event_id) AND (e.deleted_at IS NULL) AND public.is_championship_member(e.championship_id)))));


--
-- TOC entry 4364 (class 0 OID 17719)
-- Dependencies: 310
-- Name: championship_event_matches; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_matches ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4384 (class 3256 OID 17816)
-- Name: championship_event_matches championship_event_matches_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_event_matches_select_member ON public.championship_event_matches FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championship_events e
  WHERE ((e.id = championship_event_matches.event_id) AND (e.deleted_at IS NULL) AND public.is_championship_member(e.championship_id)))));


--
-- TOC entry 4363 (class 0 OID 17696)
-- Dependencies: 308
-- Name: championship_event_team_players; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_team_players ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4383 (class 3256 OID 17815)
-- Name: championship_event_team_players championship_event_team_players_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_event_team_players_select_member ON public.championship_event_team_players FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championship_events e
  WHERE ((e.id = championship_event_team_players.event_id) AND (e.deleted_at IS NULL) AND public.is_championship_member(e.championship_id)))));


--
-- TOC entry 4362 (class 0 OID 17677)
-- Dependencies: 306
-- Name: championship_event_teams; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_event_teams ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4382 (class 3256 OID 17814)
-- Name: championship_event_teams championship_event_teams_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_event_teams_select_member ON public.championship_event_teams FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.championship_events e
  WHERE ((e.id = championship_event_teams.event_id) AND (e.deleted_at IS NULL) AND public.is_championship_member(e.championship_id)))));


--
-- TOC entry 4361 (class 0 OID 17656)
-- Dependencies: 304
-- Name: championship_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_events ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4381 (class 3256 OID 17813)
-- Name: championship_events championship_events_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_events_select_member ON public.championship_events FOR SELECT TO authenticated USING (((deleted_at IS NULL) AND public.is_championship_member(championship_id)));


--
-- TOC entry 4359 (class 0 OID 17520)
-- Dependencies: 300
-- Name: championship_players; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championship_players ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4372 (class 3256 OID 17595)
-- Name: championship_players championship_players_insert_staff; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_players_insert_staff ON public.championship_players FOR INSERT TO authenticated WITH CHECK (((public.championship_actor_role(championship_id) = ANY (ARRAY['owner'::text, 'captain'::text, 'admin'::text])) AND ((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))));


--
-- TOC entry 4379 (class 3256 OID 17641)
-- Name: championship_players championship_players_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_players_select_member ON public.championship_players FOR SELECT TO authenticated USING (((deleted_at IS NULL) AND public.is_championship_member(championship_id)));


--
-- TOC entry 4380 (class 3256 OID 17642)
-- Name: championship_players championship_players_select_owner_all; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championship_players_select_owner_all ON public.championship_players FOR SELECT TO authenticated USING ((public.championship_actor_role(championship_id) = 'owner'::text));


--
-- TOC entry 4358 (class 0 OID 17502)
-- Dependencies: 298
-- Name: championships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4368 (class 3256 OID 17546)
-- Name: championships championships_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championships_insert_own ON public.championships FOR INSERT TO authenticated WITH CHECK ((created_by = ( SELECT auth.uid() AS uid)));


--
-- TOC entry 4377 (class 3256 OID 17611)
-- Name: championships championships_select_member; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championships_select_member ON public.championships FOR SELECT TO authenticated USING (((deleted_at IS NULL) AND ((created_by = ( SELECT auth.uid() AS uid)) OR public.is_championship_member(id))));


--
-- TOC entry 4378 (class 3256 OID 17612)
-- Name: championships championships_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY championships_update_own ON public.championships FOR UPDATE TO authenticated USING (((created_by = ( SELECT auth.uid() AS uid)) AND (deleted_at IS NULL))) WITH CHECK (((created_by = ( SELECT auth.uid() AS uid)) AND (deleted_at IS NULL)));


--
-- TOC entry 4360 (class 0 OID 17561)
-- Dependencies: 301
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4370 (class 3256 OID 17576)
-- Name: users users_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_insert_own ON public.users FOR INSERT TO authenticated WITH CHECK ((id = ( SELECT auth.uid() AS uid)));


--
-- TOC entry 4369 (class 3256 OID 17575)
-- Name: users users_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- TOC entry 4371 (class 3256 OID 17577)
-- Name: users users_update_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING ((id = ( SELECT auth.uid() AS uid))) WITH CHECK ((id = ( SELECT auth.uid() AS uid)));


--
-- TOC entry 4349 (class 0 OID 17243)
-- Dependencies: 285
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4351 (class 0 OID 17294)
-- Dependencies: 290
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4355 (class 0 OID 17414)
-- Dependencies: 294
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4356 (class 0 OID 17427)
-- Dependencies: 295
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4376 (class 3256 OID 17607)
-- Name: objects championship_logos_delete; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY championship_logos_delete ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'championship-logos'::text) AND public.owns_championship_logo_object(name)));


--
-- TOC entry 4374 (class 3256 OID 17605)
-- Name: objects championship_logos_insert; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY championship_logos_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'championship-logos'::text) AND public.owns_championship_logo_object(name)));


--
-- TOC entry 4373 (class 3256 OID 17604)
-- Name: objects championship_logos_select; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY championship_logos_select ON storage.objects FOR SELECT TO authenticated, anon USING ((bucket_id = 'championship-logos'::text));


--
-- TOC entry 4375 (class 3256 OID 17606)
-- Name: objects championship_logos_update; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY championship_logos_update ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'championship-logos'::text) AND public.owns_championship_logo_object(name))) WITH CHECK (((bucket_id = 'championship-logos'::text) AND public.owns_championship_logo_object(name)));


--
-- TOC entry 4350 (class 0 OID 17286)
-- Dependencies: 289
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4352 (class 0 OID 17304)
-- Dependencies: 291
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4353 (class 0 OID 17353)
-- Dependencies: 292
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4354 (class 0 OID 17367)
-- Dependencies: 293
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4357 (class 0 OID 17437)
-- Dependencies: 296
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4388 (class 6104 OID 16430)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 33
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 20
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 9
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO authenticated;


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 34
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 28
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 472
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 393
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 469
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 476
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 370
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 329
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 411
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 414
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 336
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 350
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 477
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 419
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 431
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 474
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 396
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 452
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 338
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 374
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- TOC entry 4481 (class 0 OID 0)
-- Dependencies: 466
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- TOC entry 4483 (class 0 OID 0)
-- Dependencies: 405
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4485 (class 0 OID 0)
-- Dependencies: 371
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- TOC entry 4486 (class 0 OID 0)
-- Dependencies: 369
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4487 (class 0 OID 0)
-- Dependencies: 473
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- TOC entry 4488 (class 0 OID 0)
-- Dependencies: 337
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- TOC entry 4489 (class 0 OID 0)
-- Dependencies: 378
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- TOC entry 4490 (class 0 OID 0)
-- Dependencies: 400
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- TOC entry 4491 (class 0 OID 0)
-- Dependencies: 376
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- TOC entry 4492 (class 0 OID 0)
-- Dependencies: 382
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- TOC entry 4493 (class 0 OID 0)
-- Dependencies: 451
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4494 (class 0 OID 0)
-- Dependencies: 375
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4495 (class 0 OID 0)
-- Dependencies: 433
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 4496 (class 0 OID 0)
-- Dependencies: 456
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4497 (class 0 OID 0)
-- Dependencies: 391
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4498 (class 0 OID 0)
-- Dependencies: 407
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- TOC entry 4499 (class 0 OID 0)
-- Dependencies: 449
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- TOC entry 4500 (class 0 OID 0)
-- Dependencies: 325
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- TOC entry 4501 (class 0 OID 0)
-- Dependencies: 345
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- TOC entry 4502 (class 0 OID 0)
-- Dependencies: 460
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- TOC entry 4503 (class 0 OID 0)
-- Dependencies: 385
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- TOC entry 4504 (class 0 OID 0)
-- Dependencies: 383
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4505 (class 0 OID 0)
-- Dependencies: 368
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 4506 (class 0 OID 0)
-- Dependencies: 446
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4507 (class 0 OID 0)
-- Dependencies: 448
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- TOC entry 4508 (class 0 OID 0)
-- Dependencies: 384
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- TOC entry 4509 (class 0 OID 0)
-- Dependencies: 450
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- TOC entry 4510 (class 0 OID 0)
-- Dependencies: 447
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- TOC entry 4511 (class 0 OID 0)
-- Dependencies: 331
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4512 (class 0 OID 0)
-- Dependencies: 343
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4514 (class 0 OID 0)
-- Dependencies: 394
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4515 (class 0 OID 0)
-- Dependencies: 364
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- TOC entry 4516 (class 0 OID 0)
-- Dependencies: 361
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- TOC entry 4517 (class 0 OID 0)
-- Dependencies: 424
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 4518 (class 0 OID 0)
-- Dependencies: 443
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- TOC entry 4519 (class 0 OID 0)
-- Dependencies: 455
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- TOC entry 4520 (class 0 OID 0)
-- Dependencies: 422
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- TOC entry 4521 (class 0 OID 0)
-- Dependencies: 387
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- TOC entry 4522 (class 0 OID 0)
-- Dependencies: 322
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- TOC entry 4523 (class 0 OID 0)
-- Dependencies: 439
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- TOC entry 4524 (class 0 OID 0)
-- Dependencies: 349
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- TOC entry 4525 (class 0 OID 0)
-- Dependencies: 388
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- TOC entry 4526 (class 0 OID 0)
-- Dependencies: 341
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- TOC entry 4527 (class 0 OID 0)
-- Dependencies: 346
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- TOC entry 4528 (class 0 OID 0)
-- Dependencies: 399
-- Name: FUNCTION add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean) TO anon;
GRANT ALL ON FUNCTION public.add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean) TO authenticated;
GRANT ALL ON FUNCTION public.add_championship_event_goal(match_id bigint, scorer_player_id bigint, assist_player_id bigint, is_own_goal boolean) TO service_role;


--
-- TOC entry 4529 (class 0 OID 0)
-- Dependencies: 459
-- Name: FUNCTION add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) TO anon;
GRANT ALL ON FUNCTION public.add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.add_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) TO service_role;


--
-- TOC entry 4530 (class 0 OID 0)
-- Dependencies: 360
-- Name: FUNCTION add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) TO anon;
GRANT ALL ON FUNCTION public.add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.add_championship_event_team(event_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) TO service_role;


--
-- TOC entry 4531 (class 0 OID 0)
-- Dependencies: 381
-- Name: FUNCTION adjust_championship_player_ratings_for_event(event_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.adjust_championship_player_ratings_for_event(event_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.adjust_championship_player_ratings_for_event(event_id bigint) TO anon;
GRANT ALL ON FUNCTION public.adjust_championship_player_ratings_for_event(event_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.adjust_championship_player_ratings_for_event(event_id bigint) TO service_role;


--
-- TOC entry 4532 (class 0 OID 0)
-- Dependencies: 423
-- Name: FUNCTION apply_championship_event_match_stats(match_id bigint, delta integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.apply_championship_event_match_stats(match_id bigint, delta integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.apply_championship_event_match_stats(match_id bigint, delta integer) TO anon;
GRANT ALL ON FUNCTION public.apply_championship_event_match_stats(match_id bigint, delta integer) TO authenticated;
GRANT ALL ON FUNCTION public.apply_championship_event_match_stats(match_id bigint, delta integer) TO service_role;


--
-- TOC entry 4533 (class 0 OID 0)
-- Dependencies: 461
-- Name: FUNCTION championship_actor_role(championship_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_actor_role(championship_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_actor_role(championship_id bigint) TO anon;
GRANT ALL ON FUNCTION public.championship_actor_role(championship_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.championship_actor_role(championship_id bigint) TO service_role;


--
-- TOC entry 4534 (class 0 OID 0)
-- Dependencies: 403
-- Name: FUNCTION championship_event_attendance_set_event_date(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_event_attendance_set_event_date() FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_event_attendance_set_event_date() TO anon;
GRANT ALL ON FUNCTION public.championship_event_attendance_set_event_date() TO authenticated;
GRANT ALL ON FUNCTION public.championship_event_attendance_set_event_date() TO service_role;


--
-- TOC entry 4535 (class 0 OID 0)
-- Dependencies: 401
-- Name: FUNCTION championship_event_attendance_set_rating(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_event_attendance_set_rating() FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_event_attendance_set_rating() TO anon;
GRANT ALL ON FUNCTION public.championship_event_attendance_set_rating() TO authenticated;
GRANT ALL ON FUNCTION public.championship_event_attendance_set_rating() TO service_role;


--
-- TOC entry 4536 (class 0 OID 0)
-- Dependencies: 310
-- Name: TABLE championship_event_matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_event_matches TO anon;
GRANT ALL ON TABLE public.championship_event_matches TO authenticated;
GRANT ALL ON TABLE public.championship_event_matches TO service_role;


--
-- TOC entry 4537 (class 0 OID 0)
-- Dependencies: 436
-- Name: FUNCTION championship_event_match_json(match public.championship_event_matches); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_event_match_json(match public.championship_event_matches) FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_event_match_json(match public.championship_event_matches) TO anon;
GRANT ALL ON FUNCTION public.championship_event_match_json(match public.championship_event_matches) TO authenticated;
GRANT ALL ON FUNCTION public.championship_event_match_json(match public.championship_event_matches) TO service_role;


--
-- TOC entry 4538 (class 0 OID 0)
-- Dependencies: 373
-- Name: FUNCTION championship_event_match_score(match public.championship_event_matches, for_team_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_event_match_score(match public.championship_event_matches, for_team_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_event_match_score(match public.championship_event_matches, for_team_id bigint) TO anon;
GRANT ALL ON FUNCTION public.championship_event_match_score(match public.championship_event_matches, for_team_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.championship_event_match_score(match public.championship_event_matches, for_team_id bigint) TO service_role;


--
-- TOC entry 4539 (class 0 OID 0)
-- Dependencies: 392
-- Name: FUNCTION championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric) TO anon;
GRANT ALL ON FUNCTION public.championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric) TO authenticated;
GRANT ALL ON FUNCTION public.championship_event_rating_delta(wins integer, matches integer, rating numeric, ceiling numeric) TO service_role;


--
-- TOC entry 4540 (class 0 OID 0)
-- Dependencies: 300
-- Name: TABLE championship_players; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_players TO anon;
GRANT ALL ON TABLE public.championship_players TO authenticated;
GRANT ALL ON TABLE public.championship_players TO service_role;


--
-- TOC entry 4541 (class 0 OID 0)
-- Dependencies: 421
-- Name: FUNCTION championship_player_json(player public.championship_players); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.championship_player_json(player public.championship_players) FROM PUBLIC;
GRANT ALL ON FUNCTION public.championship_player_json(player public.championship_players) TO anon;
GRANT ALL ON FUNCTION public.championship_player_json(player public.championship_players) TO authenticated;
GRANT ALL ON FUNCTION public.championship_player_json(player public.championship_players) TO service_role;


--
-- TOC entry 4542 (class 0 OID 0)
-- Dependencies: 457
-- Name: FUNCTION claim_player(player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.claim_player(player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.claim_player(player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.claim_player(player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.claim_player(player_id bigint) TO service_role;


--
-- TOC entry 4543 (class 0 OID 0)
-- Dependencies: 413
-- Name: FUNCTION create_championship_event(championship_id bigint, event_date date, event_time time without time zone); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.create_championship_event(championship_id bigint, event_date date, event_time time without time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_championship_event(championship_id bigint, event_date date, event_time time without time zone) TO anon;
GRANT ALL ON FUNCTION public.create_championship_event(championship_id bigint, event_date date, event_time time without time zone) TO authenticated;
GRANT ALL ON FUNCTION public.create_championship_event(championship_id bigint, event_date date, event_time time without time zone) TO service_role;


--
-- TOC entry 4544 (class 0 OID 0)
-- Dependencies: 347
-- Name: FUNCTION current_user_avatar_url(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.current_user_avatar_url() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_user_avatar_url() TO anon;
GRANT ALL ON FUNCTION public.current_user_avatar_url() TO authenticated;
GRANT ALL ON FUNCTION public.current_user_avatar_url() TO service_role;


--
-- TOC entry 4545 (class 0 OID 0)
-- Dependencies: 379
-- Name: FUNCTION current_user_display_name(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.current_user_display_name() FROM PUBLIC;
GRANT ALL ON FUNCTION public.current_user_display_name() TO anon;
GRANT ALL ON FUNCTION public.current_user_display_name() TO authenticated;
GRANT ALL ON FUNCTION public.current_user_display_name() TO service_role;


--
-- TOC entry 4546 (class 0 OID 0)
-- Dependencies: 342
-- Name: FUNCTION deactivate_player(player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.deactivate_player(player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.deactivate_player(player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.deactivate_player(player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.deactivate_player(player_id bigint) TO service_role;


--
-- TOC entry 4547 (class 0 OID 0)
-- Dependencies: 333
-- Name: FUNCTION delete_championship_event_match(match_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.delete_championship_event_match(match_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_championship_event_match(match_id bigint) TO anon;
GRANT ALL ON FUNCTION public.delete_championship_event_match(match_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.delete_championship_event_match(match_id bigint) TO service_role;


--
-- TOC entry 4548 (class 0 OID 0)
-- Dependencies: 356
-- Name: FUNCTION delete_championship_event_team(team_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.delete_championship_event_team(team_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.delete_championship_event_team(team_id bigint) TO anon;
GRANT ALL ON FUNCTION public.delete_championship_event_team(team_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.delete_championship_event_team(team_id bigint) TO service_role;


--
-- TOC entry 4549 (class 0 OID 0)
-- Dependencies: 432
-- Name: FUNCTION end_championship_event(event_id bigint, present_player_ids jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.end_championship_event(event_id bigint, present_player_ids jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.end_championship_event(event_id bigint, present_player_ids jsonb) TO anon;
GRANT ALL ON FUNCTION public.end_championship_event(event_id bigint, present_player_ids jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.end_championship_event(event_id bigint, present_player_ids jsonb) TO service_role;


--
-- TOC entry 4550 (class 0 OID 0)
-- Dependencies: 348
-- Name: FUNCTION end_championship_event_match(match_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.end_championship_event_match(match_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.end_championship_event_match(match_id bigint) TO anon;
GRANT ALL ON FUNCTION public.end_championship_event_match(match_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.end_championship_event_match(match_id bigint) TO service_role;


--
-- TOC entry 4551 (class 0 OID 0)
-- Dependencies: 359
-- Name: FUNCTION enforce_championship_owner_quota(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.enforce_championship_owner_quota() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_championship_owner_quota() TO anon;
GRANT ALL ON FUNCTION public.enforce_championship_owner_quota() TO authenticated;
GRANT ALL ON FUNCTION public.enforce_championship_owner_quota() TO service_role;


--
-- TOC entry 4552 (class 0 OID 0)
-- Dependencies: 404
-- Name: FUNCTION get_championship_by_invite(invite_code text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.get_championship_by_invite(invite_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_championship_by_invite(invite_code text) TO anon;
GRANT ALL ON FUNCTION public.get_championship_by_invite(invite_code text) TO authenticated;
GRANT ALL ON FUNCTION public.get_championship_by_invite(invite_code text) TO service_role;


--
-- TOC entry 4553 (class 0 OID 0)
-- Dependencies: 441
-- Name: FUNCTION is_championship_member(championship_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.is_championship_member(championship_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_championship_member(championship_id bigint) TO anon;
GRANT ALL ON FUNCTION public.is_championship_member(championship_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.is_championship_member(championship_id bigint) TO service_role;


--
-- TOC entry 4554 (class 0 OID 0)
-- Dependencies: 465
-- Name: FUNCTION join_championship(invite_code text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.join_championship(invite_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.join_championship(invite_code text) TO anon;
GRANT ALL ON FUNCTION public.join_championship(invite_code text) TO authenticated;
GRANT ALL ON FUNCTION public.join_championship(invite_code text) TO service_role;


--
-- TOC entry 4555 (class 0 OID 0)
-- Dependencies: 402
-- Name: FUNCTION merge_championship_players(keep_player_id bigint, absorb_player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.merge_championship_players(keep_player_id bigint, absorb_player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.merge_championship_players(keep_player_id bigint, absorb_player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.merge_championship_players(keep_player_id bigint, absorb_player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.merge_championship_players(keep_player_id bigint, absorb_player_id bigint) TO service_role;


--
-- TOC entry 4556 (class 0 OID 0)
-- Dependencies: 398
-- Name: FUNCTION owns_championship_logo_object(object_name text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owns_championship_logo_object(object_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owns_championship_logo_object(object_name text) TO anon;
GRANT ALL ON FUNCTION public.owns_championship_logo_object(object_name text) TO authenticated;
GRANT ALL ON FUNCTION public.owns_championship_logo_object(object_name text) TO service_role;


--
-- TOC entry 4557 (class 0 OID 0)
-- Dependencies: 351
-- Name: FUNCTION reactivate_player(player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.reactivate_player(player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.reactivate_player(player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.reactivate_player(player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.reactivate_player(player_id bigint) TO service_role;


--
-- TOC entry 4558 (class 0 OID 0)
-- Dependencies: 358
-- Name: FUNCTION refresh_championship_event_attendance_stats(event_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.refresh_championship_event_attendance_stats(event_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.refresh_championship_event_attendance_stats(event_id bigint) TO anon;
GRANT ALL ON FUNCTION public.refresh_championship_event_attendance_stats(event_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.refresh_championship_event_attendance_stats(event_id bigint) TO service_role;


--
-- TOC entry 4559 (class 0 OID 0)
-- Dependencies: 427
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- TOC entry 4560 (class 0 OID 0)
-- Dependencies: 344
-- Name: FUNCTION save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb) TO anon;
GRANT ALL ON FUNCTION public.save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.save_championship_event_attendance(event_id bigint, present_player_ids jsonb, goalkeeper_player_ids jsonb) TO service_role;


--
-- TOC entry 4561 (class 0 OID 0)
-- Dependencies: 454
-- Name: FUNCTION save_championship_event_attendance_stats(event_id bigint, stats jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.save_championship_event_attendance_stats(event_id bigint, stats jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_championship_event_attendance_stats(event_id bigint, stats jsonb) TO anon;
GRANT ALL ON FUNCTION public.save_championship_event_attendance_stats(event_id bigint, stats jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.save_championship_event_attendance_stats(event_id bigint, stats jsonb) TO service_role;


--
-- TOC entry 4562 (class 0 OID 0)
-- Dependencies: 340
-- Name: FUNCTION save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb) TO anon;
GRANT ALL ON FUNCTION public.save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.save_championship_event_teams(event_id bigint, present_player_ids jsonb, teams jsonb, goalkeeper_player_ids jsonb) TO service_role;


--
-- TOC entry 4563 (class 0 OID 0)
-- Dependencies: 332
-- Name: FUNCTION save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer) TO anon;
GRANT ALL ON FUNCTION public.save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer) TO authenticated;
GRANT ALL ON FUNCTION public.save_championship_player_event_stats(player_id bigint, event_id bigint, goals integer, assists integer, wins integer, matches integer) TO service_role;


--
-- TOC entry 4564 (class 0 OID 0)
-- Dependencies: 365
-- Name: FUNCTION set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.set_championship_event_match_goalkeeper(match_id bigint, team_id bigint, player_id bigint) TO service_role;


--
-- TOC entry 4565 (class 0 OID 0)
-- Dependencies: 317
-- Name: FUNCTION set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.set_championship_event_match_player(match_id bigint, team_id bigint, slot smallint, player_id bigint) TO service_role;


--
-- TOC entry 4566 (class 0 OID 0)
-- Dependencies: 321
-- Name: FUNCTION set_player_role(player_id bigint, role text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_player_role(player_id bigint, role text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_player_role(player_id bigint, role text) TO anon;
GRANT ALL ON FUNCTION public.set_player_role(player_id bigint, role text) TO authenticated;
GRANT ALL ON FUNCTION public.set_player_role(player_id bigint, role text) TO service_role;


--
-- TOC entry 4567 (class 0 OID 0)
-- Dependencies: 409
-- Name: FUNCTION soft_delete_championship(championship_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.soft_delete_championship(championship_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.soft_delete_championship(championship_id bigint) TO anon;
GRANT ALL ON FUNCTION public.soft_delete_championship(championship_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.soft_delete_championship(championship_id bigint) TO service_role;


--
-- TOC entry 4568 (class 0 OID 0)
-- Dependencies: 464
-- Name: FUNCTION soft_delete_championship_event(event_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.soft_delete_championship_event(event_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.soft_delete_championship_event(event_id bigint) TO anon;
GRANT ALL ON FUNCTION public.soft_delete_championship_event(event_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.soft_delete_championship_event(event_id bigint) TO service_role;


--
-- TOC entry 4569 (class 0 OID 0)
-- Dependencies: 445
-- Name: FUNCTION start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) TO anon;
GRANT ALL ON FUNCTION public.start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.start_championship_event_match(event_id bigint, team_a_id bigint, team_b_id bigint) TO service_role;


--
-- TOC entry 4570 (class 0 OID 0)
-- Dependencies: 355
-- Name: FUNCTION sync_championship_players_from_attendance(player_ids bigint[]); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.sync_championship_players_from_attendance(player_ids bigint[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_championship_players_from_attendance(player_ids bigint[]) TO anon;
GRANT ALL ON FUNCTION public.sync_championship_players_from_attendance(player_ids bigint[]) TO authenticated;
GRANT ALL ON FUNCTION public.sync_championship_players_from_attendance(player_ids bigint[]) TO service_role;


--
-- TOC entry 4571 (class 0 OID 0)
-- Dependencies: 438
-- Name: FUNCTION sync_platform_user(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.sync_platform_user() FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_platform_user() TO anon;
GRANT ALL ON FUNCTION public.sync_platform_user() TO authenticated;
GRANT ALL ON FUNCTION public.sync_platform_user() TO service_role;


--
-- TOC entry 4572 (class 0 OID 0)
-- Dependencies: 362
-- Name: FUNCTION transfer_championship_owner(player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.transfer_championship_owner(player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.transfer_championship_owner(player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.transfer_championship_owner(player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.transfer_championship_owner(player_id bigint) TO service_role;


--
-- TOC entry 4573 (class 0 OID 0)
-- Dependencies: 327
-- Name: FUNCTION undo_championship_event_goal(match_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.undo_championship_event_goal(match_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.undo_championship_event_goal(match_id bigint) TO anon;
GRANT ALL ON FUNCTION public.undo_championship_event_goal(match_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.undo_championship_event_goal(match_id bigint) TO service_role;


--
-- TOC entry 4574 (class 0 OID 0)
-- Dependencies: 339
-- Name: FUNCTION unlink_player(player_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.unlink_player(player_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.unlink_player(player_id bigint) TO anon;
GRANT ALL ON FUNCTION public.unlink_player(player_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.unlink_player(player_id bigint) TO service_role;


--
-- TOC entry 4575 (class 0 OID 0)
-- Dependencies: 330
-- Name: FUNCTION update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean) TO anon;
GRANT ALL ON FUNCTION public.update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean) TO authenticated;
GRANT ALL ON FUNCTION public.update_championship_event_config(championship_id bigint, event_time time without time zone, players_per_team smallint, skip_guest_goalkeeper_matches boolean) TO service_role;


--
-- TOC entry 4576 (class 0 OID 0)
-- Dependencies: 319
-- Name: FUNCTION update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) TO anon;
GRANT ALL ON FUNCTION public.update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.update_championship_event_team(team_id bigint, team_color text, player_ids jsonb, goalkeeper_id bigint) TO service_role;


--
-- TOC entry 4577 (class 0 OID 0)
-- Dependencies: 458
-- Name: FUNCTION update_championship_name(championship_id bigint, name text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_championship_name(championship_id bigint, name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_championship_name(championship_id bigint, name text) TO anon;
GRANT ALL ON FUNCTION public.update_championship_name(championship_id bigint, name text) TO authenticated;
GRANT ALL ON FUNCTION public.update_championship_name(championship_id bigint, name text) TO service_role;


--
-- TOC entry 4578 (class 0 OID 0)
-- Dependencies: 352
-- Name: FUNCTION update_championship_visibility(championship_id bigint, is_visible boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_championship_visibility(championship_id bigint, is_visible boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_championship_visibility(championship_id bigint, is_visible boolean) TO anon;
GRANT ALL ON FUNCTION public.update_championship_visibility(championship_id bigint, is_visible boolean) TO authenticated;
GRANT ALL ON FUNCTION public.update_championship_visibility(championship_id bigint, is_visible boolean) TO service_role;


--
-- TOC entry 4579 (class 0 OID 0)
-- Dependencies: 475
-- Name: FUNCTION update_player_nickname(player_id bigint, nickname text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_player_nickname(player_id bigint, nickname text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_player_nickname(player_id bigint, nickname text) TO anon;
GRANT ALL ON FUNCTION public.update_player_nickname(player_id bigint, nickname text) TO authenticated;
GRANT ALL ON FUNCTION public.update_player_nickname(player_id bigint, nickname text) TO service_role;


--
-- TOC entry 4580 (class 0 OID 0)
-- Dependencies: 386
-- Name: FUNCTION update_player_rating(player_id bigint, rating numeric); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.update_player_rating(player_id bigint, rating numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_player_rating(player_id bigint, rating numeric) TO anon;
GRANT ALL ON FUNCTION public.update_player_rating(player_id bigint, rating numeric) TO authenticated;
GRANT ALL ON FUNCTION public.update_player_rating(player_id bigint, rating numeric) TO service_role;


--
-- TOC entry 4581 (class 0 OID 0)
-- Dependencies: 453
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;


--
-- TOC entry 4582 (class 0 OID 0)
-- Dependencies: 353
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- TOC entry 4583 (class 0 OID 0)
-- Dependencies: 418
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;


--
-- TOC entry 4584 (class 0 OID 0)
-- Dependencies: 430
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;


--
-- TOC entry 4585 (class 0 OID 0)
-- Dependencies: 335
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;


--
-- TOC entry 4586 (class 0 OID 0)
-- Dependencies: 389
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- TOC entry 4587 (class 0 OID 0)
-- Dependencies: 470
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;


--
-- TOC entry 4588 (class 0 OID 0)
-- Dependencies: 372
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- TOC entry 4589 (class 0 OID 0)
-- Dependencies: 442
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;


--
-- TOC entry 4590 (class 0 OID 0)
-- Dependencies: 420
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- TOC entry 4591 (class 0 OID 0)
-- Dependencies: 440
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- TOC entry 4592 (class 0 OID 0)
-- Dependencies: 410
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;


--
-- TOC entry 4593 (class 0 OID 0)
-- Dependencies: 416
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;


--
-- TOC entry 4594 (class 0 OID 0)
-- Dependencies: 363
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- TOC entry 4595 (class 0 OID 0)
-- Dependencies: 463
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- TOC entry 4596 (class 0 OID 0)
-- Dependencies: 437
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- TOC entry 4597 (class 0 OID 0)
-- Dependencies: 434
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 4598 (class 0 OID 0)
-- Dependencies: 444
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- TOC entry 4600 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- TOC entry 4601 (class 0 OID 0)
-- Dependencies: 279
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- TOC entry 4603 (class 0 OID 0)
-- Dependencies: 273
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- TOC entry 4606 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- TOC entry 4608 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- TOC entry 4610 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- TOC entry 4612 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- TOC entry 4615 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- TOC entry 4616 (class 0 OID 0)
-- Dependencies: 276
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- TOC entry 4618 (class 0 OID 0)
-- Dependencies: 278
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- TOC entry 4619 (class 0 OID 0)
-- Dependencies: 275
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- TOC entry 4620 (class 0 OID 0)
-- Dependencies: 277
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- TOC entry 4621 (class 0 OID 0)
-- Dependencies: 274
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- TOC entry 4623 (class 0 OID 0)
-- Dependencies: 258
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- TOC entry 4625 (class 0 OID 0)
-- Dependencies: 257
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- TOC entry 4627 (class 0 OID 0)
-- Dependencies: 271
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- TOC entry 4629 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- TOC entry 4631 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- TOC entry 4636 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- TOC entry 4638 (class 0 OID 0)
-- Dependencies: 270
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- TOC entry 4641 (class 0 OID 0)
-- Dependencies: 269
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- TOC entry 4644 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- TOC entry 4645 (class 0 OID 0)
-- Dependencies: 281
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- TOC entry 4646 (class 0 OID 0)
-- Dependencies: 280
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- TOC entry 4647 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- TOC entry 4648 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- TOC entry 4649 (class 0 OID 0)
-- Dependencies: 312
-- Name: TABLE championship_event_attendance; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_event_attendance TO anon;
GRANT ALL ON TABLE public.championship_event_attendance TO authenticated;
GRANT ALL ON TABLE public.championship_event_attendance TO service_role;


--
-- TOC entry 4650 (class 0 OID 0)
-- Dependencies: 311
-- Name: SEQUENCE championship_event_attendance_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_event_attendance_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_event_attendance_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_event_attendance_id_seq TO service_role;


--
-- TOC entry 4651 (class 0 OID 0)
-- Dependencies: 316
-- Name: TABLE championship_event_goals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_event_goals TO anon;
GRANT ALL ON TABLE public.championship_event_goals TO authenticated;
GRANT ALL ON TABLE public.championship_event_goals TO service_role;


--
-- TOC entry 4652 (class 0 OID 0)
-- Dependencies: 315
-- Name: SEQUENCE championship_event_goals_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_event_goals_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_event_goals_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_event_goals_id_seq TO service_role;


--
-- TOC entry 4653 (class 0 OID 0)
-- Dependencies: 314
-- Name: TABLE championship_event_match_players; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_event_match_players TO anon;
GRANT ALL ON TABLE public.championship_event_match_players TO authenticated;
GRANT ALL ON TABLE public.championship_event_match_players TO service_role;


--
-- TOC entry 4654 (class 0 OID 0)
-- Dependencies: 313
-- Name: SEQUENCE championship_event_match_players_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_event_match_players_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_event_match_players_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_event_match_players_id_seq TO service_role;


--
-- TOC entry 4655 (class 0 OID 0)
-- Dependencies: 309
-- Name: SEQUENCE championship_event_matches_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_event_matches_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_event_matches_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_event_matches_id_seq TO service_role;


--
-- TOC entry 4656 (class 0 OID 0)
-- Dependencies: 308
-- Name: TABLE championship_event_team_players; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_event_team_players TO anon;
GRANT ALL ON TABLE public.championship_event_team_players TO authenticated;
GRANT ALL ON TABLE public.championship_event_team_players TO service_role;


--
-- TOC entry 4657 (class 0 OID 0)
-- Dependencies: 307
-- Name: SEQUENCE championship_event_team_players_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_event_team_players_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_event_team_players_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_event_team_players_id_seq TO service_role;


--
-- TOC entry 4658 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE championship_event_teams; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_event_teams TO anon;
GRANT ALL ON TABLE public.championship_event_teams TO authenticated;
GRANT ALL ON TABLE public.championship_event_teams TO service_role;


--
-- TOC entry 4659 (class 0 OID 0)
-- Dependencies: 305
-- Name: SEQUENCE championship_event_teams_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_event_teams_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_event_teams_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_event_teams_id_seq TO service_role;


--
-- TOC entry 4660 (class 0 OID 0)
-- Dependencies: 304
-- Name: TABLE championship_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championship_events TO anon;
GRANT ALL ON TABLE public.championship_events TO authenticated;
GRANT ALL ON TABLE public.championship_events TO service_role;


--
-- TOC entry 4661 (class 0 OID 0)
-- Dependencies: 303
-- Name: SEQUENCE championship_events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_events_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_events_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_events_id_seq TO service_role;


--
-- TOC entry 4662 (class 0 OID 0)
-- Dependencies: 299
-- Name: SEQUENCE championship_players_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championship_players_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championship_players_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championship_players_id_seq TO service_role;


--
-- TOC entry 4663 (class 0 OID 0)
-- Dependencies: 298
-- Name: TABLE championships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.championships TO anon;
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.championships TO authenticated;
GRANT ALL ON TABLE public.championships TO service_role;


--
-- TOC entry 4664 (class 0 OID 0)
-- Dependencies: 297
-- Name: SEQUENCE championships_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.championships_id_seq TO anon;
GRANT ALL ON SEQUENCE public.championships_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.championships_id_seq TO service_role;


--
-- TOC entry 4665 (class 0 OID 0)
-- Dependencies: 301
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- TOC entry 4666 (class 0 OID 0)
-- Dependencies: 285
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- TOC entry 4667 (class 0 OID 0)
-- Dependencies: 286
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;


--
-- TOC entry 4668 (class 0 OID 0)
-- Dependencies: 287
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;


--
-- TOC entry 4669 (class 0 OID 0)
-- Dependencies: 288
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;


--
-- TOC entry 4671 (class 0 OID 0)
-- Dependencies: 290
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- TOC entry 4672 (class 0 OID 0)
-- Dependencies: 294
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- TOC entry 4673 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- TOC entry 4675 (class 0 OID 0)
-- Dependencies: 291
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- TOC entry 4676 (class 0 OID 0)
-- Dependencies: 292
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- TOC entry 4677 (class 0 OID 0)
-- Dependencies: 293
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- TOC entry 4678 (class 0 OID 0)
-- Dependencies: 296
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- TOC entry 4679 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- TOC entry 4680 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- TOC entry 2487 (class 826 OID 16557)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2488 (class 826 OID 16558)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2486 (class 826 OID 16556)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2494 (class 826 OID 16636)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2493 (class 826 OID 16635)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- TOC entry 2492 (class 826 OID 16634)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- TOC entry 2497 (class 826 OID 16591)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2496 (class 826 OID 16590)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2495 (class 826 OID 16589)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2489 (class 826 OID 16571)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2491 (class 826 OID 16570)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2490 (class 826 OID 16569)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2479 (class 826 OID 16494)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2480 (class 826 OID 16495)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2478 (class 826 OID 16493)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2482 (class 826 OID 16497)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2477 (class 826 OID 16492)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2481 (class 826 OID 16496)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 2498 (class 826 OID 16561)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- TOC entry 2499 (class 826 OID 16562)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- TOC entry 2500 (class 826 OID 16560)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- TOC entry 2485 (class 826 OID 16550)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- TOC entry 2484 (class 826 OID 16549)
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- TOC entry 2483 (class 826 OID 16548)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- TOC entry 3719 (class 3466 OID 17479)
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


ALTER EVENT TRIGGER ensure_rls OWNER TO postgres;

--
-- TOC entry 3713 (class 3466 OID 16575)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- TOC entry 3716 (class 3466 OID 16654)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- TOC entry 3718 (class 3466 OID 16666)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- TOC entry 3717 (class 3466 OID 16657)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- TOC entry 3714 (class 3466 OID 16576)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- TOC entry 3715 (class 3466 OID 16577)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

-- Completed on 2026-08-14 16:30:59 UTC

--
-- PostgreSQL database dump complete
--

