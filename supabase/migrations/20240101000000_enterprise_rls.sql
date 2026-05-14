-- =================================================================================
-- Enterprise Grade Row Level Security (RLS) Policies
-- FIXED: Uses inline subquery instead of auth.get_user_role() which requires
--        a separate DB function that may not exist.
-- =================================================================================

-- 1. Enable RLS on all relevant tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for a clean slate
DROP POLICY IF EXISTS "Developer Full Access on Profiles" ON profiles;
DROP POLICY IF EXISTS "Admin Center Access on Profiles" ON profiles;
DROP POLICY IF EXISTS "User Self Access on Profiles" ON profiles;
DROP POLICY IF EXISTS "User Self Read on Profiles" ON profiles;
DROP POLICY IF EXISTS "User Self Update on Profiles" ON profiles;
DROP POLICY IF EXISTS "Developer Full Access on Centers" ON service_centers;
DROP POLICY IF EXISTS "User View Own Center" ON service_centers;
DROP POLICY IF EXISTS "Developer Full Access on Inventory" ON inventory;
DROP POLICY IF EXISTS "Admin/Employee Manage Center Inventory" ON inventory;
DROP POLICY IF EXISTS "Developer Full Access on Invoices" ON invoices;
DROP POLICY IF EXISTS "Admin/Employee Manage Center Invoices" ON invoices;
DROP POLICY IF EXISTS "Client View Own Invoices" ON invoices;

-- =================================================================================
-- PROFILES
-- =================================================================================

-- Developer: full access to all profiles
CREATE POLICY "Developer Full Access on Profiles"
  ON profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

-- Admin: all operations restricted to their own service center
CREATE POLICY "Admin Center Access on Profiles"
  ON profiles FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Users can read their own profile
CREATE POLICY "User Self Read on Profiles"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "User Self Update on Profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =================================================================================
-- SERVICE CENTERS
-- =================================================================================

CREATE POLICY "Developer Full Access on Centers"
  ON service_centers FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

CREATE POLICY "Admin Full Access on Centers"
  ON service_centers FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "User View Own Center"
  ON service_centers FOR SELECT TO authenticated
  USING (
    id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- =================================================================================
-- INVENTORY
-- =================================================================================

CREATE POLICY "Developer Full Access on Inventory"
  ON inventory FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

CREATE POLICY "Admin/Employee Manage Center Inventory"
  ON inventory FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'employee', 'inventory_manager')
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'employee', 'inventory_manager')
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- =================================================================================
-- INVOICES
-- =================================================================================

CREATE POLICY "Developer Full Access on Invoices"
  ON invoices FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'developer'
  );

CREATE POLICY "Admin/Employee Manage Center Invoices"
  ON invoices FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'employee')
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'employee')
    AND service_center_id = (SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Client View Own Invoices"
  ON invoices FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'client'
    AND client_id = auth.uid()
  );
