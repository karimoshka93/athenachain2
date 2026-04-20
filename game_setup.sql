ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_snake_game_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION claim_snake_game_reward(p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_last_play TIMESTAMP WITH TIME ZONE;
    v_cooldown_hours INT := 6;
    v_reward NUMERIC := 0.01;
BEGIN
    -- Check if user exists and get last play time
    SELECT last_snake_game_at INTO v_last_play FROM profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- Check cooldown (handle null as allowed to play)
    IF v_last_play IS NOT NULL AND v_last_play > NOW() - (v_cooldown_hours * INTERVAL '1 hour') THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Wait 6 hours between plays',
            'next_available_at', v_last_play + (v_cooldown_hours * INTERVAL '1 hour')
        );
    END IF;

    -- Update last play time
    UPDATE profiles SET last_snake_game_at = NOW() WHERE id = p_user_id;

    -- Award XRP to balances
    INSERT INTO user_balances (user_id, asset_symbol, balance)
    VALUES (p_user_id, 'XRP', v_reward)
    ON CONFLICT (user_id, asset_symbol)
    DO UPDATE SET balance = user_balances.balance + v_reward;

    -- Log transaction
    INSERT INTO transactions (user_id, type, amount, asset_symbol, description)
    VALUES (p_user_id, 'reward', v_reward, 'XRP', 'Snake Game Reward');

    RETURN json_build_object('success', true, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
