-- Provision the financial profile atomically with Auth signup, without granting client INSERT on users.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.users(id,email,name,created_at,updated_at)
 VALUES(NEW.id::text,NEW.email,coalesce(NEW.raw_user_meta_data->>'name',split_part(NEW.email,'@',1)),now(),now())
 ON CONFLICT(id) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

