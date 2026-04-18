-- SUPABASE REFERRAL SYSTEM SETUP
-- Run this in your Supabase SQL Editor

-- 1. Schema Updates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT FALSE;

-- 2. Referral Code Utilities
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign referral code on signup
CREATE OR REPLACE FUNCTION tr_assign_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created_referral ON profiles;
CREATE TRIGGER on_profile_created_referral
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION tr_assign_referral_code();

-- Update existing users
UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- 3. Active Referral Definition
-- Condition:
-- 1. streak_count >= 1
-- 2. wallet balance >= 10 GLD
-- 3. username, real_name, full_phone_number present
CREATE OR REPLACE VIEW active_referrals_view AS
SELECT 
    p.id as user_id,
    p.referred_by as inviter_id,
    p.username,
    p.email,
    p.real_name,
    p.full_phone_number,
    p.streak_count,
    COALESCE(ub.amount, 0) as gld_balance,
    (
        p.streak_count >= 1 AND 
        COALESCE(ub.amount, 0) >= 10 AND 
        p.username IS NOT NULL AND 
        p.real_name IS NOT NULL AND 
        p.full_phone_number IS NOT NULL AND
        p.username != '' AND
        p.real_name != '' AND
        p.full_phone_number != ''
    ) as is_active
FROM profiles p
LEFT JOIN user_balances ub ON ub.user_id = p.id AND (ub.coin_symbol = 'GLD' OR ub.coin_symbol = 'Athena GLD');

-- 4. Global Stats Function
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_active BIGINT;
    v_user_active BIGINT;
    v_referral_code TEXT;
    v_referrals JSONB;
BEGIN
    -- Global active referrals count
    SELECT COUNT(*) INTO v_total_active FROM active_referrals_view WHERE is_active = true;
    
    -- User's active referrals count
    SELECT COUNT(*) INTO v_user_active FROM active_referrals_view WHERE inviter_id = p_user_id AND is_active = true;
    
    -- User's code
    SELECT referral_code INTO v_referral_code FROM profiles WHERE id = p_user_id;

    -- List of referrals
    SELECT json_agg(json_build_object(
        'email', email,
        'is_active', is_active
    )) INTO v_referrals
    FROM active_referrals_view
    WHERE inviter_id = p_user_id;

    RETURN jsonb_build_object(
        'referral_code', v_referral_code,
        'total_active_global', v_total_active,
        'user_active_count', v_user_active,
        'referrals', COALESCE(v_referrals, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Welcome Bonus Logic
-- Award 0.5 GLD to the invited person
CREATE OR REPLACE FUNCTION claim_referral_welcome_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_inviter_id UUID;
    v_claimed BOOLEAN;
BEGIN
    SELECT referred_by, welcome_bonus_claimed INTO v_inviter_id, v_claimed FROM profiles WHERE id = p_user_id;
    
    IF v_inviter_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not a referred user');
    END IF;

    IF v_claimed THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bonus already claimed');
    END IF;

    -- Award 0.5 GLD
    INSERT INTO user_balances (user_id, coin_symbol, amount)
    VALUES (p_user_id, 'GLD', 0.5)
    ON CONFLICT (user_id, coin_symbol)
    DO UPDATE SET amount = user_balances.amount + 0.5;

    UPDATE profiles SET welcome_bonus_claimed = true WHERE id = p_user_id;

    RETURN jsonb_build_object('success', true, 'message', '0.5 GLD welcome bonus added');
END;
$$ LANGUAGE plpgsql;
