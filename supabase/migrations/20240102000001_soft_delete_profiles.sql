-- =================================================================================
-- Soft Delete Implementation for Profiles
-- Requirements: deleted_at, deleted_by, is_deleted
-- =================================================================================

-- 1. Add soft delete columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted) WHERE is_deleted = false;

-- 3. Update existing policies to respect soft delete
-- SELECT policies: only show non-deleted users (except for developers)
DROP POLICY IF EXISTS "Developer Full Access on Profiles" ON public.profiles;
CREATE POLICY "Developer Full Access on Profiles"
  ON profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

-- For others, filter by is_deleted = false
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

DROP POLICY IF EXISTS "User Self Read on Profiles" ON public.profiles;
CREATE POLICY "User Self Read on Profiles"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() AND is_deleted = false);
