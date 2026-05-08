-- =================================================================================
-- Auth Triggers: Automatically create a profile when a new user signs up
-- =================================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client') -- Default to client for safety
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function on every signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================================
-- Manual Fix for Existing Users
-- =================================================================================
-- If you already created a user in Auth but have no profile, run this manually:
-- INSERT INTO public.profiles (id, full_name, role)
-- SELECT id, 'Developer', 'developer' FROM auth.users WHERE email = 'your-email@example.com'
-- ON CONFLICT (id) DO NOTHING;
