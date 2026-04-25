-- Setup for Mahjong Game rewards and cooldown
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_mahjong_game_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION claim_mahjong_reward(p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_last_play TIMESTAMP WITH TIME ZONE;
    v_cooldown_hours INT := 3;
    v_reward NUMERIC := 0.05; -- Fixed reward for Mahjong
BEGIN
    -- Check if user exists and get last play time
    SELECT last_mahjong_game_at INTO v_last_play FROM profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- Check cooldown (3 hours)
    IF v_last_play IS NOT NULL AND v_last_play > NOW() - (v_cooldown_hours * INTERVAL '1 hour') THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Wait 3 hours between rewards',
            'next_available_at', v_last_play + (v_cooldown_hours * INTERVAL '1 hour')
        );
    END IF;

    -- Update last play time
    UPDATE profiles SET last_mahjong_game_at = NOW() WHERE id = p_user_id;

    -- Award GLD to balances (Using coin_symbol and amount as per v2 pattern)
    INSERT INTO user_balances (user_id, coin_symbol, amount)
    VALUES (p_user_id, 'GLD', v_reward)
    ON CONFLICT (user_id, coin_symbol)
    DO UPDATE SET amount = COALESCE(user_balances.amount, 0) + v_reward;

    -- Log transaction
    BEGIN
        INSERT INTO transactions (user_id, type, amount, asset_symbol, description)
        VALUES (p_user_id, 'reward', v_reward, 'GLD', 'Mahjong Victory Reward');
    EXCEPTION WHEN OTHERS THEN
        -- Handle potential failures if tables vary
    END;

    RETURN json_build_object('success', true, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
