import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Loader2, Trophy, Zap, AlertCircle, Play, X } from 'lucide-react';

interface SpinWheelProps {
  userId: string;
  onBalanceUpdate: () => void;
  onClose?: () => void;
}

const PRIZES = [
  { name: 'GLD', color: '#FFD700', icon: '💰' },
  { name: 'Try Again', color: '#333', icon: '❌' },
  { name: 'PiNetwork', color: '#6B21A8', icon: 'π' },
  { name: 'Try Again', color: '#222', icon: '❌' },
  { name: 'USDT', color: '#26A17B', icon: '💵' },
  { name: 'Try Again', color: '#333', icon: '❌' },
  { name: 'XRP', color: '#23292F', icon: '✖️' },
  { name: 'Try Again', color: '#222', icon: '❌' },
];

const SpinWheel: React.FC<SpinWheelProps> = ({ userId, onBalanceUpdate, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWaitingForAd, setIsWaitingForAd] = useState(false);
  const [adClickTime, setAdClickTime] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);

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
    if (isSpinning || isWaitingForAd) return;
    
    const adUrl = "https://acquaintjokinglyscoring.com/2106669";
    setAdClickTime(Date.now());
    setIsWaitingForAd(true);
    setMessage({ type: 'info', text: 'Opening ad... Watch for 4 seconds to spin!' });
    window.open(adUrl, '_blank');
  };

  const startSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    try {
      const { data, error } = await supabase.rpc('play_spin_wheel', { player_id: userId });

      if (error) throw error;

      if (data.status === 'error') {
        setMessage({ type: 'error', text: data.message || 'Please wait 2 hours' });
        setIsSpinning(false);
        return;
      }

      // Determine target slice
      let targetIndex = 0;
      if (data.win) {
        targetIndex = PRIZES.findIndex(p => p.name === data.reward);
        if (targetIndex === -1) targetIndex = 0;
      } else {
        // Pick a random "Try Again" slice (odd indices)
        const tryAgainIndices = [1, 3, 5, 7];
        targetIndex = tryAgainIndices[Math.floor(Math.random() * tryAgainIndices.length)];
      }

      // Calculate rotation
      // Each slice is 360 / 8 = 45 degrees
      // We want the slice to be at the top (270 degrees in standard coordinate system if 0 is right)
      // But let's say 0 is top.
      const sliceAngle = 360 / PRIZES.length;
      const extraSpins = 5 + Math.floor(Math.random() * 5); // 5-10 full spins
      const targetAngle = (extraSpins * 360) + (360 - (targetIndex * sliceAngle));
      
      setRotation(targetAngle);

      await controls.start({
        rotate: targetAngle,
        transition: { duration: 5, ease: [0.15, 0, 0.15, 1] }
      });

      // Animation finished
      if (data.win) {
        setMessage({ type: 'success', text: `Congratulations! You won ${data.amount} ${data.reward}!` });
      } else {
        setMessage({ type: 'info', text: 'Better luck next time!' });
      }

      onBalanceUpdate();
    } catch (err: any) {
      console.error('Spin error:', err);
      setMessage({ type: 'error', text: 'Failed to spin. Please try again later.' });
    } finally {
      setIsSpinning(false);
    }
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
          <Zap className="w-6 h-6 fill-gold" />
          Wheel of Fortune
        </h2>
        <p className="text-gray-400 text-xs uppercase tracking-widest">Spin to win GLD, Pi, USDT & XRP</p>
      </div>

      {/* The Wheel */}
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-gold filter drop-shadow-lg" />
        </div>

        <motion.div
          animate={controls}
          className="w-full h-full rounded-full border-8 border-white/10 shadow-2xl relative overflow-hidden"
          style={{ rotate: rotation }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {PRIZES.map((prize, i) => {
              const angle = 360 / PRIZES.length;
              const startAngle = i * angle;
              const endAngle = (i + 1) * angle;
              
              // SVG arc path
              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
              
              return (
                <g key={i}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                    fill={prize.color}
                    className="stroke-white/5 stroke-1"
                  />
                  <text
                    x="75"
                    y="50"
                    transform={`rotate(${startAngle + angle / 2}, 50, 50)`}
                    fill="white"
                    fontSize="4"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                  >
                    {prize.name}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Center Hub */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#1a1d23] border-4 border-gold shadow-lg flex items-center justify-center z-10">
              <Trophy className="w-6 h-6 text-gold" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 w-full">
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
          disabled={isSpinning || isWaitingForAd}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${
            isSpinning || isWaitingForAd 
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
          ) : (
            <>
              <Play className="w-6 h-6 fill-black" />
              Watch Ad & Spin
            </>
          )}
        </button>
        
        <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">
          1 Spin every 2 hours • 1 in 100 Jackpot Chance
        </p>
      </div>
    </div>
  );
};

export default SpinWheel;
