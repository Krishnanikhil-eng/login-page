-- ==============================================================================
-- NexusAuth Phase 2: Profiles Schema, Triggers, and Row Level Security (RLS)
-- Migration: 20261022000000_create_profiles.sql (Production Hardened)
-- ==============================================================================

-- 1. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE,
    country_code TEXT,
    phone_number TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT pg_catalog.now() NOT NULL,

    -- Security constraints: enforce lowercase email storage & minimum name length
    CONSTRAINT profiles_email_lowercase CHECK (email = pg_catalog.lower(email)),
    CONSTRAINT profiles_full_name_length CHECK (pg_catalog.char_length(pg_catalog.btrim(full_name)) >= 2)
);

-- Fast lookup index by email and primary key id
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Trigger Function: updated_at timestamp auto-refresh
-- Uses empty search_path to prevent schema shadowing attacks.
-- Assigns pg_catalog.now() directly to TIMESTAMPTZ.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$;

-- Restrict execution privilege on handle_updated_at trigger function
-- Revoke default public execution, permit execution by database roles performing updates
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO postgres, service_role, authenticated;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Deny unauthenticated / anon access to the profiles table
REVOKE ALL ON TABLE public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated, service_role;

-- Policy 1: Users can read only their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = id);

-- Policy 2: Users can insert their own profile matching their verified auth.uid()
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

-- Policy 3: Users can update only their own profile and cannot reassign ownership
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- 4. Auth Hook: Automatically provision a profile on auth.users INSERT
-- Security & Hardening Guarantees:
-- a) Immutable search_path: SET search_path = '' with fully qualified pg_catalog/public objects.
-- b) Authoritative identity: id and email are strictly derived from auth.users (NEW.id and NEW.email),
--    NEVER from user-supplied metadata, preventing identity spoofing.
-- c) Robust full_name fallback: Trims whitespace via pg_catalog.btrim and guarantees minimum 2-char constraint is never violated.
-- d) Resilient date_of_birth validation: Validates YYYY-MM-DD pattern and human calendar boundaries (1900-01-01 to today);
--    only catches specific datetime_field_overflow and invalid_datetime_format to safely set NULL without silencing unexpected errors.
-- e) Deliberate failure behavior: Does not use broad WHEN OTHERS exception swallowing; real system errors abort cleanly.
-- f) Field preservation on conflict: Preserves existing user-edited profile values; only backfills unset NULL fields.
-- g) Direct TIMESTAMPTZ: Assigns pg_catalog.now() directly without lossy intermediate casting.
-- h) Standard SQL forms: Uses COALESCE and NULLIF without illegal schema prefixing.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    raw_meta jsonb;
    candidate_name text;
    sanitized_full_name text;
    parsed_dob date;
    dob_raw text;
BEGIN
    raw_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- 1. Extract and sanitize full_name to guarantee minimum 2-character constraint
    candidate_name := COALESCE(
        pg_catalog.btrim(raw_meta->>'full_name'),
        pg_catalog.btrim(raw_meta->>'name'),
        pg_catalog.btrim(pg_catalog.split_part(NEW.email, '@', 1)),
        'Nexus User'
    );
    
    IF pg_catalog.char_length(candidate_name) < 2 THEN
        candidate_name := COALESCE(
            NULLIF(pg_catalog.btrim(pg_catalog.split_part(NEW.email, '@', 1)), ''),
            'Nexus User'
        );
        IF pg_catalog.char_length(candidate_name) < 2 THEN
            candidate_name := 'Nexus User';
        END IF;
    END IF;
    sanitized_full_name := candidate_name;

    -- 2. Safe date_of_birth validation (targeted exception handling: invalid format & overflow only)
    dob_raw := pg_catalog.btrim(COALESCE(raw_meta->>'date_of_birth', ''));
    parsed_dob := NULL;
    
    IF dob_raw ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
        BEGIN
            parsed_dob := dob_raw::date;
            -- Boundary check: realistic human lifespan
            IF parsed_dob < '1900-01-01'::date OR parsed_dob > CURRENT_DATE THEN
                parsed_dob := NULL;
            END IF;
        EXCEPTION
            WHEN datetime_field_overflow OR invalid_datetime_format THEN
                parsed_dob := NULL;
        END;
    END IF;

    -- 3. Atomic insert into public.profiles with safe conflict resolution
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        date_of_birth,
        country_code,
        phone_number,
        street_address,
        city,
        state,
        postal_code,
        country,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        sanitized_full_name,
        pg_catalog.lower(COALESCE(NEW.email, '')),
        parsed_dob,
        NULLIF(pg_catalog.btrim(raw_meta->>'country_code'), ''),
        NULLIF(pg_catalog.btrim(raw_meta->>'phone_number'), ''),
        NULLIF(pg_catalog.btrim(raw_meta->>'street_address'), ''),
        NULLIF(pg_catalog.btrim(raw_meta->>'city'), ''),
        NULLIF(pg_catalog.btrim(raw_meta->>'state'), ''),
        NULLIF(pg_catalog.btrim(raw_meta->>'postal_code'), ''),
        NULLIF(pg_catalog.btrim(raw_meta->>'country'), ''),
        pg_catalog.now(),
        pg_catalog.now()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = CASE 
            WHEN public.profiles.full_name IS NOT NULL AND public.profiles.full_name != 'Nexus User' 
            THEN public.profiles.full_name 
            ELSE EXCLUDED.full_name 
        END,
        email = EXCLUDED.email,
        date_of_birth = COALESCE(public.profiles.date_of_birth, EXCLUDED.date_of_birth),
        country_code = COALESCE(public.profiles.country_code, EXCLUDED.country_code),
        phone_number = COALESCE(public.profiles.phone_number, EXCLUDED.phone_number),
        street_address = COALESCE(public.profiles.street_address, EXCLUDED.street_address),
        city = COALESCE(public.profiles.city, EXCLUDED.city),
        state = COALESCE(public.profiles.state, EXCLUDED.state),
        postal_code = COALESCE(public.profiles.postal_code, EXCLUDED.postal_code),
        country = COALESCE(public.profiles.country, EXCLUDED.country),
        updated_at = pg_catalog.now();

    RETURN NEW;
END;
$$;

-- Restrict execution privilege on handle_new_user trigger function
-- Revoke public execution; allow execution by auth admin and postgres roles handling signups
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Comments on table and security guarantees
COMMENT ON TABLE public.profiles IS 'NexusAuth user profiles isolated via Row Level Security (RLS). No passwords or OTPs stored here.';
