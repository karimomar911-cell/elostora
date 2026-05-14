-- =================================================================================
-- Deletion Audit Logs
-- NOTE: Uses inline subquery for role check because auth.get_user_role() may
--       not exist if the enterprise_rls migration was never applied to this DB.
-- =================================================================================

CREATE TABLE IF NOT EXISTS public.deletion_audit_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who was deleted
  deleted_user_id     UUID        NOT NULL,
  deleted_user_name   TEXT        NOT NULL,
  deleted_user_email  TEXT,
  deleted_user_role   TEXT        NOT NULL,

  -- Who performed the deletion
  deleted_by_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_by_name     TEXT        NOT NULL,

  -- Optional context
  reason              TEXT,

  -- Timestamp (immutable)
  deleted_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast history queries
CREATE INDEX IF NOT EXISTS idx_deletion_audit_logs_deleted_at
  ON public.deletion_audit_logs(deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_deletion_audit_logs_deleted_by
  ON public.deletion_audit_logs(deleted_by_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.deletion_audit_logs ENABLE ROW LEVEL SECURITY;

-- Developers can read all audit logs
-- Uses direct subquery instead of auth.get_user_role() which may not exist
CREATE POLICY "Developer Read Audit Logs"
  ON public.deletion_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

-- Any authenticated developer can INSERT an audit log entry
CREATE POLICY "Developer Insert Audit Logs"
  ON public.deletion_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

-- NO DELETE policy intentionally — audit logs are permanent
