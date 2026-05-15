-- ==========================================
-- PHASE 4: Scalability Architecture
-- Database Indexing & Query Optimization
-- ==========================================

-- 1. Index for Profiles (Filtering by Role & Soft Deletes)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles USING btree (is_deleted);

-- 2. Index for Invoices (Filtering by Service Center, Client, and Service Date)
CREATE INDEX IF NOT EXISTS idx_invoices_service_center_id ON public.invoices USING btree (service_center_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_service_date ON public.invoices USING btree (service_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices USING btree (created_by);

-- 3. Index for Cars (Filtering by Client ID and Chassis Number)
CREATE INDEX IF NOT EXISTS idx_cars_client_id ON public.cars USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_cars_chassis_number ON public.cars USING btree (chassis_number);

-- 4. Index for Inventory (Filtering by Service Center)
CREATE INDEX IF NOT EXISTS idx_inventory_service_center_id ON public.inventory USING btree (service_center_id);

-- 5. Index for Activity Logs (Filtering by Entity and sorting by Date)
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type_id ON public.activity_logs USING btree (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);
