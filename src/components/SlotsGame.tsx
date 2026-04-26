import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Loader2, Trophy, Zap, AlertCircle, Play, X } from 'lucide-react';

interface SlotsGameProps {
  userId: string;
  onBalanceUpdate: () => void;
  onClose?: () => void;
}

const SYMBOLS = [
  { id: 'GLD', icon: '💰', color: '#FFD700', value: 0.01 },
  { id: 'PiNetwork', icon: 'π', color: '#6B21A8', value: 1 },
  { id: 'USDT', icon: '💵', color: '#26A17B', value: 0 },
  { id: 'XRP', icon: '✖️', color: '#23292F', value: 0 },
  { id: 'Try Again', icon: '❌', color: '#333', value: 0 },
];

const SlotsGame: React.FC<SlotsGameProps> = ({ userId, onBalanceUpdate, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWaitingForAd, setIsWaitingForAd] = useState(false);
  const [adClickTime, setAdClickTime] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [reels, setReels] = useState(['💰', '💰', '💰']);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    checkCooldown();
  }, []);

  // Local timer update to avoid Supabase polling
  useEffect(() => {
    let timerInterval: any;
    if (timeLeft !== null && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : null);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [timeLeft !== null]);

  const checkCooldown = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_slots_spin')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.last_slots_spin) {
        const lastSpin = new Date(data.last_slots_spin).getTime();
        const now = Date.now();
        const diff = now - lastSpin;
        const cooldown = 2 * 60 * 60 * 1000; // 2 hours

        if (diff < cooldown) {
          setTimeLeft(Math.ceil((cooldown - diff) / 1000));
        } else {
          setTimeLeft(null);
        }
      }
    } catch (err) {
      console.error('Cooldown check error:', err);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWaitingForAd && adClickTime) {
        const now = Date.now();
        const elapsed = now - adClickTime;
        
        if (elapsed >= 4000) {
          setIsWaitingForAd(false);
          setAdClickTime(null);
          setMessage({ type: 'success', text: 'Ad completed! Spinning now...' });
          startSpin();
        } else {
          setMessage({ type: 'error', text: 'Please watch the ad for at least 4 seconds.' });
          setIsWaitingForAd(false);
          setAdClickTime(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isWaitingForAd, adClickTime]);

  const handleWatchAd = () => {
    if (isSpinning || isWaitingForAd || timeLeft !== null) return;
    
    const adUrl = "https://acquaintjokinglyscoring.com/2106669";
    setAdClickTime(Date.now());
    setIsWaitingForAd(true);
    setMessage({ type: 'info', text: 'Opening ad... Watch for 4 seconds to spin!' });
    window.open(adUrl, '_blank');
  };

  const startSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setMessage(null);

    // Start animation
    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].icon,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].icon,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].icon,
      ]);
    }, 100);

    try {
      // Logic for win
      const rand = Math.random();
      let winSymbol = SYMBOLS[0]; // Default to GLD
      
      // Odds: 95% GLD (0.01), 5% PI (1)
      if (rand < 0.05) { 
        winSymbol = SYMBOLS[1]; // 5% PI
      } else { 
        winSymbol = SYMBOLS[0]; // 95% GLD
      }
      
      const finalReels = [winSymbol.icon, winSymbol.icon, winSymbol.icon];

      // Call Supabase
      const { error } = await supabase.rpc('handle_slots_win', {
        prize_val: winSymbol.value,
        user_uuid: userId,
        combo: finalReels.join('-'),
        symbol: winSymbol.id === 'PiNetwork' ? 'PI' : winSymbol.id // Map to DB symbol
      });

      if (error) throw error;

      // Wait for animation
      setTimeout(() => {
        clearInterval(spinInterval);
        setReels(finalReels);
        setIsSpinning(false);
        
        setMessage({ type: 'success', text: `JACKPOT! You won ${winSymbol.value} ${winSymbol.id}!` });
        
        onBalanceUpdate();
        checkCooldown();
      }, 2000);

    } catch (err: any) {
      clearInterval(spinInterval);
      setReels(['💰', '💰', '💰']); // Reset to neutral state on error
      console.error('Slots error:', err);
      const errorMsg = err.message || 'Failed to spin. Please try again later.';
      setMessage({ type: 'error', text: errorMsg });
      setIsSpinning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto p-6 glass rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient opacity-50" />
      
      <div className="flex flex-col items-center gap-2 text-center relative w-full">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute right-0 top-0 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-2xl font-bold text-gold-gradient flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gold" />
          Athena Slots
        </h2>
        <p className="text-gray-400 text-xs uppercase tracking-widest">Match 3 symbols to win big</p>
      </div>

      {/* Slot Machine Display */}
      <div className="flex gap-4 p-6 bg-black/40 rounded-3xl border-4 border-gold/20 shadow-2xl relative">
        <div className="absolute -inset-1 bg-gold/5 blur-xl rounded-3xl pointer-events-none" />
        {reels.map((symbol, i) => (
          <motion.div
            key={i}
            animate={isSpinning ? { y: [0, -20, 0] } : {}}
            transition={{ duration: 0.1, repeat: Infinity }}
            className="w-16 h-24 md:w-20 md:h-28 bg-[#1a1d23] rounded-xl border border-white/10 flex items-center justify-center text-4xl md:text-5xl shadow-inner relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
            {symbol}
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 w-full">
        {timeLeft !== null && !isSpinning && (
          <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 text-center">
            <p className="text-gold text-xs font-bold uppercase tracking-widest">Next Spin Available In</p>
            <p className="text-white font-mono text-lg">{formatTime(timeLeft)}</p>
          </div>
        )}

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              'bg-gold/10 text-gold border border-gold/20'
            }`}
          >
            {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}

        <button
          onClick={handleWatchAd}
          disabled={isSpinning || isWaitingForAd || timeLeft !== null}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${
            (isSpinning || isWaitingForAd || timeLeft !== null)
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-gold-gradient text-black shadow-lg shadow-gold/20 hover:brightness-110'
          }`}
        >
          {isSpinning ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Spinning...
            </>
          ) : isWaitingForAd ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Watching Ad...
            </>
          ) : timeLeft !== null ? (
            'Locked'
          ) : (
            <>
              <Play className="w-6 h-6 fill-black" />
              Watch Ad & Spin
            </>
          )}
        </button>
        
        <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">
          1 Spin every 2 hours • Match 3 for Jackpot
        </p>
      </div>
    </div>
  );
};

export default SlotsGame;
