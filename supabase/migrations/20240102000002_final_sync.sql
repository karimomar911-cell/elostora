-- =================================================================================
-- PRODUCTION-READY MASTER DATABASE SYNCHRONIZATION
-- Task: Final repair and validation of the user deletion architecture.
-- Strategy: Idempotent migration with full audit logging and soft-delete support.
-- =================================================================================

-- ── 1. SCHEMA UPDATES (PROFILES) ───────────────────────────────────────────────

-- Add soft-delete columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

-- Optimized index for active users (used in almost every frontend query)
CREATE INDEX IF NOT EXISTS idx_profiles_active_users 
ON public.profiles(id) 
WHERE is_deleted = false;

-- Index for soft-deleted lookup
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_users 
ON public.profiles(deleted_at) 
WHERE is_deleted = true;


-- ── 2. AUDIT INFRASTRUCTURE ────────────────────────────────────────────────────

-- Create audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deletion_audit_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id     UUID        NOT NULL,
  deleted_user_name   TEXT        NOT NULL,
  deleted_user_email  TEXT,
  deleted_user_role   TEXT        NOT NULL,
  deleted_by_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_by_name     TEXT        NOT NULL,
  reason              TEXT,
  deleted_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_deletion_audit_logs_timestamp 
ON public.deletion_audit_logs(deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deletion_audit_logs_user 
ON public.deletion_audit_logs(deleted_user_id);


-- ── 3. RLS POLICIES (PROFILES) ────────────────────────────────────────────────

-- Reset RLS on profiles to ensure clean synchronization
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES (Safety first)
DROP POLICY IF EXISTS "Developer Full Access on Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Center Access on Profiles" ON public.profiles;
DROP POLICY IF EXISTS "User Self Read on Profiles" ON public.profiles;
DROP POLICY IF EXISTS "User Self Update on Profiles" ON public.profiles;

-- [FIXED] Developer: full access to all profiles (including deleted ones for audit/restore)
CREATE POLICY "Developer Full Access on Profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

-- [FIXED] Admin: access only to active users in their own center
CREATE POLICY "Admin Center Access on Profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    AND is_deleted = false
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    AND is_deleted = false
  );

-- [FIXED] Any user can read their own (active) profile
CREATE POLICY "User Self Read on Profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() AND is_deleted = false);

-- [FIXED] Any user can update their own (active) profile
CREATE POLICY "User Self Update on Profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() AND is_deleted = false)
  WITH CHECK (id = auth.uid() AND is_deleted = false);


-- ── 4. RLS POLICIES (AUDIT LOGS) ─────────────────────────────────────────────

ALTER TABLE public.deletion_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developer Read Audit Logs" ON public.deletion_audit_logs;
DROP POLICY IF EXISTS "Developer Insert Audit Logs" ON public.deletion_audit_logs;

CREATE POLICY "Developer Read Audit Logs"
  ON public.deletion_audit_logs FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

CREATE POLICY "Developer Insert Audit Logs"
  ON public.deletion_audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );


-- ── 5. VALIDATION QUERY ──────────────────────────────────────────────────────
-- Run this to confirm state
SELECT 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_deleted') as has_soft_delete,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'deletion_audit_logs') as has_audit_table,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'profiles') as profile_policy_count;
