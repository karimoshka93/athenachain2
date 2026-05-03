-- REFINED SUPABASE SETUP FOR HARD DELETE 
-- This script fixes foreign key constraints to allow full account deletion
-- Run this in your Supabase SQL Editor

-- 1. CLEANUP ORPHANED ROWS (Crucial to prevent ALTER TABLE failure)
-- These are rows that refer to profiles that no longer exist
DELETE FROM public.user_balances WHERE user_id NOT IN (SELECT id FROM public.profiles);
DELETE FROM public.academy_progress WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Use DO blocks for tables that might not exist in every environment
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spin_logs') THEN
        DELETE FROM public.spin_logs WHERE user_id NOT IN (SELECT id FROM public.profiles);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'slots_logs') THEN
        DELETE FROM public.slots_logs WHERE user_id NOT IN (SELECT id FROM public.profiles);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        DELETE FROM public.transactions WHERE user_id NOT IN (SELECT id FROM public.profiles);
    END IF;
END $$;

-- 2. SETUP CASCADE ON PROFILES (Master Table)
-- This ensures that when a user is deleted from auth.users, their public.profile is also deleted.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. SETUP CASCADE ON DEPENDENT TABLES
-- These tables will now automatically delete their rows when the corresponding profile is deleted.

-- user_balances
ALTER TABLE public.user_balances
DROP CONSTRAINT IF EXISTS user_balances_user_id_fkey;

ALTER TABLE public.user_balances
ADD CONSTRAINT user_balances_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- academy_progress
ALTER TABLE public.academy_progress
DROP CONSTRAINT IF EXISTS academy_progress_user_id_fkey;

ALTER TABLE public.academy_progress
ADD CONSTRAINT academy_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Dynamic check for spin logs and other manual tables
DO $$ 
BEGIN
    -- spin_logs
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spin_logs') THEN
        ALTER TABLE public.spin_logs DROP CONSTRAINT IF EXISTS spin_logs_user_id_fkey;
        ALTER TABLE public.spin_logs ADD CONSTRAINT spin_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- slots_logs
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'slots_logs') THEN
        ALTER TABLE public.slots_logs DROP CONSTRAINT IF EXISTS slots_logs_user_id_fkey;
        ALTER TABLE public.slots_logs ADD CONSTRAINT slots_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- transactions (if it exists)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
        ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. CREATE THE HARD DELETE FUNCTION
-- This allows the user to trigger their own deletion safely from the client app.
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void AS $$
BEGIN
    -- Deleting from auth.users triggers the CASCADE delete on public.profiles, 
    -- which then cascades to balances, logs, and progress automatically.
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. EMERGENCY CLEANUP (Run once to fix existing orphans)
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_balances WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.academy_progress WHERE user_id NOT IN (SELECT id FROM auth.users);
