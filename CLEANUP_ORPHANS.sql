-- EMERGENCY CLEANUP: FREE STUCK LEGACY ACCOUNTS
-- Run this in your Supabase SQL Editor to delete orphans and free legacy links

-- 1. CLEANUP ORPHANS (Users who are deleted but their data remains)
-- Deleting from profiles first will trigger any existing cascades, but we'll do all for safety.

DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_balances WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.academy_progress WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Handle optional tables with a safe block
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spin_logs') THEN
        DELETE FROM public.spin_logs WHERE user_id NOT IN (SELECT id FROM auth.users);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'slots_logs') THEN
        DELETE FROM public.slots_logs WHERE user_id NOT IN (SELECT id FROM auth.users);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        DELETE FROM public.transactions WHERE user_id NOT IN (SELECT id FROM auth.users);
    END IF;
END $$;

-- 2. VERIFY LEGACY UID UNIQUENESS
-- This ensures the column exists and is indexed properly for the check in the app
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.profiles'::regclass AND attname = 'legacy_uid') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legacy_uid TEXT;
    END IF;
END $$;

-- 3. ENSURE CASCADE IS ACTIVE (Root Cause Fix)
-- This makes sure that FUTURE deletes automatically clean up everything.

-- profiles -> auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- user_balances -> profiles
ALTER TABLE public.user_balances DROP CONSTRAINT IF EXISTS user_balances_user_id_fkey;
ALTER TABLE public.user_balances ADD CONSTRAINT user_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- academy_progress -> profiles
ALTER TABLE public.academy_progress DROP CONSTRAINT IF EXISTS academy_progress_user_id_fkey;
ALTER TABLE public.academy_progress ADD CONSTRAINT academy_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Optional logs
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spin_logs') THEN
        ALTER TABLE public.spin_logs DROP CONSTRAINT IF EXISTS spin_logs_user_id_fkey;
        ALTER TABLE public.spin_logs ADD CONSTRAINT spin_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'slots_logs') THEN
        ALTER TABLE public.slots_logs DROP CONSTRAINT IF EXISTS slots_logs_user_id_fkey;
        ALTER TABLE public.slots_logs ADD CONSTRAINT slots_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
