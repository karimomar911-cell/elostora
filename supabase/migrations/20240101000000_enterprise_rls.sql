-- =================================================================================
-- Enterprise Grade Row Level Security (RLS) Policies
-- Enforces: Row ownership, Center isolation, Role-based restrictions
-- Naming Convention: snake_case
-- =================================================================================

-- 1. Enable RLS on all relevant tables
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public Profile Access" ON profiles;
DROP POLICY IF EXISTS "Developer All Access" ON profiles;
-- (Add more drop policy statements if needed based on existing setup)

-- =================================================================================
-- Helper Functions for Role/Center Checks
-- =================================================================================
CREATE OR REPLACE FUNCTION auth.get_user_role() RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.get_user_center() RETURNS UUID AS $$
  SELECT service_center_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =================================================================================
-- PROFILES (users)
-- =================================================================================
-- Developers can do everything
CREATE POLICY "Developer Full Access on Profiles" ON profiles
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'developer')
  WITH CHECK (auth.get_user_role() = 'developer');

-- Admins can view/edit users in their OWN center
CREATE POLICY "Admin Center Access on Profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    auth.get_user_role() = 'admin' AND 
    service_center_id = auth.get_user_center()
  )
  WITH CHECK (
    auth.get_user_role() = 'admin' AND 
    service_center_id = auth.get_user_center()
  );

-- Users can view and update their own profile
CREATE POLICY "User Self Access on Profiles" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
  
CREATE POLICY "User Self Update on Profiles" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- =================================================================================
-- SERVICE CENTERS
-- =================================================================================
-- Developers have full access
CREATE POLICY "Developer Full Access on Centers" ON service_centers
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'developer')
  WITH CHECK (auth.get_user_role() = 'developer');

-- Everyone else can view their own center details
CREATE POLICY "User View Own Center" ON service_centers
  FOR SELECT TO authenticated
  USING (id = auth.get_user_center());

-- =================================================================================
-- INVENTORY
-- =================================================================================
CREATE POLICY "Developer Full Access on Inventory" ON inventory
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'developer');

-- Admins and Employees can manage inventory in their own center
CREATE POLICY "Admin/Employee Manage Center Inventory" ON inventory
  FOR ALL TO authenticated
  USING (
    (auth.get_user_role() IN ('admin', 'employee', 'inventory_manager')) AND
    service_center_id = auth.get_user_center()
  )
  WITH CHECK (
    (auth.get_user_role() IN ('admin', 'employee', 'inventory_manager')) AND
    service_center_id = auth.get_user_center()
  );

-- Clients can only view inventory if needed, or deny entirely (Deny by default)

-- =================================================================================
-- INVOICES
-- =================================================================================
CREATE POLICY "Developer Full Access on Invoices" ON invoices
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'developer');

-- Admins and Employees can manage invoices in their center
CREATE POLICY "Admin/Employee Manage Center Invoices" ON invoices
  FOR ALL TO authenticated
  USING (
    (auth.get_user_role() IN ('admin', 'employee')) AND
    service_center_id = auth.get_user_center()
  )
  WITH CHECK (
    (auth.get_user_role() IN ('admin', 'employee')) AND
    service_center_id = auth.get_user_center()
  );

-- Clients can view their own invoices
CREATE POLICY "Client View Own Invoices" ON invoices
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'client' AND
    client_id = auth.uid()
  );

-- =================================================================================
-- LOGS (audit)
-- =================================================================================
-- Only system/developers can delete logs
CREATE POLICY "Developer Manage Logs" ON logs
  FOR ALL TO authenticated
  USING (auth.get_user_role() = 'developer');

-- Admins can view logs for their center
CREATE POLICY "Admin View Center Logs" ON logs
  FOR SELECT TO authenticated
  USING (
    auth.get_user_role() = 'admin' AND
    service_center_id = auth.get_user_center()
  );

-- Insert logs is allowed for all authenticated users if it matches their center
CREATE POLICY "User Insert Own Action Logs" ON logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    service_center_id = auth.get_user_center()
  );
