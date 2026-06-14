-- Create a trigger to automatically assign 'staff' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Also add staff role to any existing users who don't have one
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'staff'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);