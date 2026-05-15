-- ==========================================
-- PHASE 3: Activity Logs & Realtime Triggers
-- ==========================================

-- 1. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type    TEXT NOT NULL, -- 'profile', 'invoice', 'service_center'
  entity_id      UUID NOT NULL,
  action         TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  performed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_data       JSONB,
  new_data       JSONB,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS to activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Developers and Admins can view activity logs
CREATE POLICY "Developers and Admins can view activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('developer', 'admin')
    )
  );

-- System can insert logs (bypass RLS via SECURITY DEFINER trigger)

-- 3. Create generic trigger function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the user ID from the Supabase auth context
  current_user_id := auth.uid();
  
  -- If not available in auth context, we might rely on a 'updated_by' column if it exists
  -- For now, we will log auth.uid()
  
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.activity_logs (entity_type, entity_id, action, performed_by, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, current_user_id, row_to_json(OLD)::JSONB);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.activity_logs (entity_type, entity_id, action, performed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, current_user_id, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.activity_logs (entity_type, entity_id, action, performed_by, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, current_user_id, row_to_json(NEW)::JSONB);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Attach triggers to key tables
DROP TRIGGER IF EXISTS trg_profiles_activity ON public.profiles;
CREATE TRIGGER trg_profiles_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_invoices_activity ON public.invoices;
CREATE TRIGGER trg_invoices_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

DROP TRIGGER IF EXISTS trg_service_centers_activity ON public.service_centers;
CREATE TRIGGER trg_service_centers_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.service_centers
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- 5. Enable Realtime on activity_logs
-- Requires publication 'supabase_realtime' to include 'activity_logs'
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
