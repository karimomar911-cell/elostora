-- =================================================================================
-- REPAIR MIGRATION: 20240102000003_repair_schema.sql
-- Goal: Ensure absolute synchronization between application code and database schema.
-- Description: Adds soft-delete columns, creates audit log table, and fixes RLS.
-- =================================================================================

-- 1. Ensure Profiles Table has Soft Delete Columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_deleted') THEN
        ALTER TABLE public.profiles ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='deleted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='deleted_by') THEN
        ALTER TABLE public.profiles ADD COLUMN deleted_by UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- 2. Create Performance Index for Soft Delete
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted) WHERE is_deleted = false;

-- 3. Ensure Deletion Audit Logs Table Exists
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

-- 4. Enable RLS on Audit Logs
ALTER TABLE public.deletion_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Fix RLS Policies for Profiles (Hardened)
-- Ensure developers can see everything
DROP POLICY IF EXISTS "Developer Full Access on Profiles" ON public.profiles;
CREATE POLICY "Developer Full Access on Profiles"
  ON profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

-- Ensure admins only see non-deleted users in their center
DROP POLICY IF EXISTS "Admin Center Access on Profiles" ON public.profiles;
CREATE POLICY "Admin Center Access on Profiles"
  ON profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    AND is_deleted = false
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Ensure users can only read their own profile if not deleted
DROP POLICY IF EXISTS "User Self Read on Profiles" ON public.profiles;
CREATE POLICY "User Self Read on Profiles"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() AND is_deleted = false);

-- 6. Fix RLS Policies for Audit Logs
DROP POLICY IF EXISTS "Developer Read Audit Logs" ON public.deletion_audit_logs;
CREATE POLICY "Developer Read Audit Logs"
  ON public.deletion_audit_logs FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

DROP POLICY IF EXISTS "Developer Insert Audit Logs" ON public.deletion_audit_logs;
CREATE POLICY "Developer Insert Audit Logs"
  ON public.deletion_audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );
