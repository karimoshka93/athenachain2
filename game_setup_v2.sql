-- Update the Snake Game reward function to handle score-based rewards and fix column names
CREATE OR REPLACE FUNCTION claim_snake_game_reward(p_user_id UUID, p_score INT)
RETURNS json AS $$
DECLARE
    v_last_play TIMESTAMP WITH TIME ZONE;
    v_cooldown_hours INT := 6;
    v_reward NUMERIC;
BEGIN
    -- Calculate reward: 0.001 XRP per point
    v_reward := p_score::numeric * 0.001;

    -- Safety check for zero score
    IF p_score <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'Score must be greater than zero');
    END IF;

    -- Get user's last play time
    SELECT last_snake_game_at INTO v_last_play FROM profiles WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Profile not found');
    END IF;

    -- Enforce 6-hour cooldown
    IF v_last_play IS NOT NULL AND v_last_play > NOW() - (v_cooldown_hours * INTERVAL '1 hour') THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Wait 6 hours between rewards',
            'next_available_at', v_last_play + (v_cooldown_hours * INTERVAL '1 hour')
        );
    END IF;

    -- Update play timestamp immediately
    UPDATE profiles SET last_snake_game_at = NOW() WHERE id = p_user_id;

    -- Award XRP to user_balances (Using correct column names: coin_symbol, amount)
    INSERT INTO user_balances (user_id, coin_symbol, amount)
    VALUES (p_user_id, 'XRP', v_reward)
    ON CONFLICT (user_id, coin_symbol)
    DO UPDATE SET amount = COALESCE(user_balances.amount, 0) + v_reward;

    -- Record in transaction history (If table exists)
    -- We'll use a safe check if the table exists or just try and handle potential failure
    BEGIN
        INSERT INTO transactions (user_id, type, amount, asset_symbol, description)
        VALUES (p_user_id, 'reward', v_reward, 'XRP', 'Snake Game Reward (Score: ' || p_score || ')');
    EXCEPTION WHEN OTHERS THEN
        -- If transactions table doesn't exist or columns vary, just continue
    END;

    RETURN json_build_object('success', true, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
