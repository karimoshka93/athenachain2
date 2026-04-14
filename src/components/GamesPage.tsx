import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, Gamepad2, Lock } from 'lucide-react';
import SpinWheel from './SpinWheel';

interface GamesPageProps {
  userId: string;
  onBalanceUpdate: () => void;
}

const GamesPage: React.FC<GamesPageProps> = ({ userId, onBalanceUpdate }) => {
  const [showWheel, setShowWheel] = useState(false);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">Mini-Games</h1>
        <p className="text-gray-400 text-sm">Play to win GLD jackpots</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {/* Game 1: Wheel of Fortune */}
        <div 
          onClick={() => setShowWheel(true)}
          className="aspect-square glass rounded-3xl p-4 flex flex-col items-center justify-center gap-3 relative group overflow-hidden cursor-pointer border-gold/20 hover:border-gold/50 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
            <Zap className="w-8 h-8 fill-gold" />
          </div>
          <span className="text-white text-xs font-bold uppercase tracking-tighter">Wheel of Fortune</span>
          <div className="absolute top-3 right-3">
            <Trophy className="w-4 h-4 text-gold" />
          </div>
          <div className="absolute bottom-4">
            <span className="text-gold text-[10px] font-bold uppercase animate-pulse">Play Now</span>
          </div>
        </div>

        {/* Other Games: Coming Soon */}
        {[2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square glass rounded-3xl p-4 flex flex-col items-center justify-center gap-3 relative group overflow-hidden opacity-60">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-gold transition-colors">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <span className="text-gray-500 text-xs font-bold uppercase tracking-tighter">Game {i}</span>
            <div className="absolute top-3 right-3">
              <Lock className="w-4 h-4 text-gold/40" />
            </div>
            <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
              <span className="text-gold text-[10px] font-bold uppercase">Coming Soon</span>
            </div>
          </div>
        ))}
      </div>

      {/* Wheel Modal */}
      <AnimatePresence>
        {showWheel && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <SpinWheel 
                userId={userId} 
                onBalanceUpdate={onBalanceUpdate} 
                onClose={() => setShowWheel(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamesPage;
