import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Timer, RefreshCw, AlertCircle, CheckCircle2, Zap, Gamepad2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MahjongGameProps {
  userId: string;
  onClose: () => void;
  onBalanceUpdate: () => void;
}

interface Tile {
  id: number;
  symbol: string;
  isMatched: boolean;
  isVisible: boolean;
}

const SYMBOLS = ['GLD', 'PI', 'BTC', 'ETH', 'SOL', 'TON', 'BNB', 'DOGE', 'SHIB', 'USDT'];

export default function MahjongGame({ userId, onClose, onBalanceUpdate }: MahjongGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [cooldownTime, setCooldownTime] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);

  const AD_LINK = 'https://data527.click/917ef86e2376286488e0/38da61938e/?placementName=defaultkkk';
  const COOLDOWN_HOURS = 3;

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted]);

  useEffect(() => {
    const checkCooldown = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('last_mahjong_game_at')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (profile?.last_mahjong_game_at) {
          const lastPlay = new Date(profile.last_mahjong_game_at).getTime();
          const now = new Date().getTime();
          const diff = now - lastPlay;
          const cooldown = COOLDOWN_HOURS * 60 * 60 * 1000;

          if (diff < cooldown) {
            setCooldownTime(new Date(lastPlay + cooldown).toISOString());
            return;
          }
        }
        
        // Fallback to localStorage if Supabase is older or not set
        const savedCooldown = localStorage.getItem(`mahjong_cooldown_${userId}`);
        if (savedCooldown) {
          const nextAvailable = new Date(savedCooldown);
          if (nextAvailable > new Date()) {
            setCooldownTime(savedCooldown);
          }
        }
      } catch (err) {
        console.error('Error checking Mahjong cooldown:', err);
      }
    };

    if (userId) {
      checkCooldown();
    }
  }, [userId]);

  useEffect(() => {
    let interval: any;
    if (cooldownTime) {
      interval = setInterval(() => {
        const nextAvailable = new Date(cooldownTime).getTime();
        const now = new Date().getTime();
        const diff = nextAvailable - now;

        if (diff <= 0) {
          setCooldownRemaining(null);
          setCooldownTime(null);
          localStorage.removeItem(`mahjong_cooldown_${userId}`);
          clearInterval(interval);
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setCooldownRemaining(`${h}h ${m}m ${s}s`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownTime, userId]);

  const handleStartGame = () => {
    if (cooldownRemaining) return;
    window.open(AD_LINK, '_blank');
    setGameStarted(true);
  };

  const initializeGame = () => {
    if (cooldownRemaining) {
      setGameStarted(false);
      return;
    }
    // Create 20 tiles (10 pairs)
    const gameSymbols = [...SYMBOLS, ...SYMBOLS];
    const shuffled = gameSymbols
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        isMatched: false,
        isVisible: true
      }));
    
    setTiles(shuffled);
    setSelectedIds([]);
    setMoves(0);
    setIsWon(false);
    setMessage(null);
  };

  const handleTileClick = (id: number) => {
    if (isProcessing || isWon || selectedIds.length === 2 || tiles[id].isMatched) return;

    // If clicking same tile, ignore
    if (selectedIds.includes(id)) return;

    const newSelected = [...selectedIds, id];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [id1, id2] = newSelected;
      
      if (tiles[id1].symbol === tiles[id2].symbol) {
        // Match!
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === id1 || t.id === id2) ? { ...t, isMatched: true } : t
          ));
          setSelectedIds([]);
          
          // Check win condition
          const allMatched = tiles.every(t => (t.id === id1 || t.id === id2) ? true : t.isMatched);
          if (allMatched) {
            handleWin();
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedIds([]);
        }, 1000);
      }
    }
  };

  const handleWin = async () => {
    setIsWon(true);
    // Reward is claimed via button now or automatically if they don't want the boost
  };

  const claimReward = async (isBoosted: boolean = false) => {
    setIsProcessing(true);
    try {
      if (isBoosted) {
        window.open('https://data527.click/917ef86e2376286488e0/38da61938e/?placementName=defaultkkk', '_blank');
      }

      const { data, error } = await supabase.rpc('claim_mahjong_reward', { p_user_id: userId });
      
      if (error) throw error;
            if (data.success) {
        setMessage({ 
          type: 'success', 
          text: isBoosted 
            ? `Victory! Boosted reward of ${data.reward} GLD claimed!` 
            : `Victory! You earned ${data.reward} GLD!` 
        });
        onBalanceUpdate();

        // Enforce 3-hour cooldown after successful claim
        const nextAvailable = new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
        setCooldownTime(nextAvailable);
        localStorage.setItem(`mahjong_cooldown_${userId}`, nextAvailable);
      } else {
        if (data.error && data.error.includes('Wait 3 hours')) {
          setMessage({ type: 'error', text: 'Mahjong is resting. Wait 3 hours between rewards.' });
          
          if (data.next_available_at) {
            setCooldownTime(data.next_available_at);
            localStorage.setItem(`mahjong_cooldown_${userId}`, data.next_available_at);
          }
        } else if (data.error === 'Wait 2 hours between rewards') {
          // Compatibility for older RPC if it hasn't migrated yet
          setMessage({ type: 'error', text: 'Mahjong is resting. Wait 3 hours between rewards.' });
          if (data.next_available_at) {
            setCooldownTime(data.next_available_at);
            localStorage.setItem(`mahjong_cooldown_${userId}`, data.next_available_at);
          }
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to claim reward.' });
        }
      }
    } catch (err: any) {
      console.error('Mahjong reward error:', err);
      setMessage({ type: 'error', text: 'Connection error. Try again later.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const matchedCount = tiles.filter(t => t.isMatched).length;
  const progress = (matchedCount / tiles.length) * 100;

  return (
    <div className="bg-[#0b0e14] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-[600px] w-full max-w-md shadow-2xl relative">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm uppercase tracking-widest">Athena Mahjong</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black">Match Assets & Earn</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-white/2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Moves: {moves}</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Progress: {Math.round(progress)}%</span>
          </div>
        </div>
        {!isWon && (
          <button 
            onClick={initializeGame}
            disabled={!!cooldownRemaining}
            className={`text-[10px] font-bold uppercase tracking-tighter ${
              cooldownRemaining ? 'text-gray-600 cursor-not-allowed' : 'text-gold hover:underline'
            }`}
          >
            {cooldownRemaining ? 'Locked' : 'Restart'}
          </button>
        )}
      </div>

      {/* Game Board or Entry Gate */}
      <div className="flex-1 p-4 overflow-y-auto no-scrollbar flex items-center justify-center bg-black/40 relative">
        {!gameStarted ? (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-3xl bg-gold/10 border-2 border-gold/20 flex items-center justify-center relative overflow-hidden group">
              <Zap className="w-12 h-12 text-gold animate-pulse" />
              <div className="absolute inset-0 bg-gold/5 blur-xl group-hover:bg-gold/10 transition-all" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Enter The Arena</h3>
              <p className="text-xs text-gray-500 font-medium max-w-[200px]">
                Watch a short ad to unlock your session and earn GLD rewards!
              </p>
            </div>

            <button 
              onClick={handleStartGame}
              disabled={!!cooldownRemaining}
              className={`px-10 py-4 rounded-2xl font-black text-sm transition-all uppercase tracking-widest flex items-center gap-2 ${
                cooldownRemaining
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-gold text-black hover:scale-105 gold-glow'
              }`}
            >
              {cooldownRemaining ? (
                <>
                  <Timer className="w-5 h-5" />
                  RESTING ({cooldownRemaining.split(' ')[0]})
                </>
              ) : (
                <>
                  <Gamepad2 className="w-5 h-5" />
                  ENTER GAME
                </>
              )}
            </button>
            
            <p className="text-[8px] text-gray-600 uppercase tracking-widest">Powered by Athena Ad Engine</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 w-full">
            {tiles.map((tile) => {
              const isSelected = selectedIds.includes(tile.id);
              const isMatched = tile.isMatched;
              
              return (
                <motion.button
                  key={tile.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTileClick(tile.id)}
                  disabled={isMatched}
                  className={`aspect-square rounded-xl border-2 transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                    isMatched 
                      ? 'bg-green-500/10 border-green-500/30 opacity-40 grayscale pointer-events-none' 
                      : isSelected 
                        ? 'bg-gold/20 border-gold shadow-lg shadow-gold/20' 
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  {(isSelected || isMatched) ? (
                    <span className={`font-black text-xs ${isMatched ? 'text-green-500' : 'text-gold'}`}>
                      {tile.symbol}
                    </span>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white/20 rounded-full" />
                    </div>
                  )}
                  
                  {isMatched && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-500/20" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Victory / Message Overlay */}
      <AnimatePresence>
        {(isWon || message) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-x-6 bottom-6 z-20"
          >
            <div className={`glass p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 text-center ${
              message?.type === 'success' ? 'border-green-500/30 bg-green-900/20' : 'border-gold/30 bg-gold/5'
            }`}>
              <div className="flex flex-col items-center gap-2">
                {message?.type === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-gold" />
                )}
                <h3 className="text-xl font-bold text-white">
                  {message?.type === 'success' ? 'Victory!' : 'Game Over'}
                </h3>
                <p className="text-sm text-gray-400 font-medium">{message?.text}</p>
                {cooldownTime && (
                  <div className="mt-2 text-[10px] text-gold font-bold uppercase tracking-widest bg-gold/10 px-3 py-1 rounded-full">
                    Next reward available after cooldown
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {!message && (
                  <>
                    <button 
                      onClick={() => claimReward(true)}
                      disabled={isProcessing}
                      className="w-full py-4 rounded-xl bg-gold text-black font-black text-sm hover:brightness-110 transition-all gold-glow flex items-center justify-center gap-2 "
                    >
                      <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      WATCH AD & CLAIM REWARD
                    </button>
                    <button 
                      onClick={() => claimReward(false)}
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/5"
                    >
                      CLAIM NORMAL REWARD
                    </button>
                  </>
                )}
                {message && (
                  <div className="flex gap-3">
                    <button 
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/5"
                    >
                      Close
                    </button>
                    <button 
                      onClick={initializeGame}
                      disabled={!!cooldownRemaining}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                        cooldownRemaining 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5' 
                        : 'bg-gold text-black hover:brightness-110 gold-glow'
                      }`}
                    >
                      {cooldownRemaining ? `Resting (${cooldownRemaining})` : 'Play Again'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Footer */}
      <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] text-gray-500 font-medium">ATHENA GAMING NETWORK v1.2</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Verified</span>
        </div>
      </div>
    </div>
  );
}
