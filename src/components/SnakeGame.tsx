import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Gamepad2, 
  Timer, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SnakeGameProps {
  onClose: () => void;
  userId: string;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };

/**
 * SnakeGame Component
 * Features:
 * - High-speed snake logic
 * - Ad wall before playing
 * - 6-hour reward cooldown (0.01 XRP)
 * - On-screen controls for mobile players
 */
const SnakeGame: React.FC<SnakeGameProps> = ({ onClose, userId }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [snake, setSnake] = useState<{ x: number; y: number }[]>(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'IDLE' | 'AD_WALL' | 'PLAYING' | 'COOLING_DOWN'>('IDLE');
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Constants
  const COOLDOWN_HOURS = 6;
  const REWARD_AMOUNT = 0.01;

  const generateFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food spawned on snake
      const onSnake = currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const checkCooldown = useCallback(async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('last_snake_game_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile?.last_snake_game_at) {
        const lastPlay = new Date(profile.last_snake_game_at).getTime();
        const now = new Date().getTime();
        const diff = now - lastPlay;
        const cooldown = COOLDOWN_HOURS * 60 * 60 * 1000;

        if (diff < cooldown) {
          const remaining = cooldown - diff;
          const h = Math.floor(remaining / (1000 * 60 * 60));
          const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          setCooldownRemaining(`${h}h ${m}m`);
          setGameState('COOLING_DOWN');
          return;
        }
      }
      setGameState('AD_WALL');
    } catch (err) {
      console.error('Error checking cooldown:', err);
      // Fallback to allowing game if check fails, but reward will fail server-side
      setGameState('AD_WALL');
    }
  }, [userId]);

  useEffect(() => {
    checkCooldown();
  }, [checkCooldown]);

  const handleStartGame = () => {
    // Open Ad in new tab (same as mining button logic)
    const adUrl = "https://www.profitablecpmratenetwork.com/iefjy68tq?key=8a88eabcfabfca1a7fadd4a9fb46a455";
    window.open(adUrl, '_blank');
    setGameState('PLAYING');
    setIsGameOver(false);
    setScore(0);
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const endGame = useCallback(async (currentScore: number) => {
    setIsGameOver(true);
    if (currentScore > 0) {
      setIsClaiming(true);
      try {
        const { data, error } = await supabase.rpc('claim_snake_game_reward', {
          p_user_id: userId,
          p_score: currentScore
        });
        
        if (error) throw error;
        
        if (data.success) {
          setClaimSuccess(true);
        } else {
          console.error('Claim failed:', data.error);
        }
      } catch (err) {
        console.error('Error claiming reward:', err);
      } finally {
        setIsClaiming(false);
      }
    }
  }, [userId]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || isGameOver) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const newHead = {
          x: (prevSnake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (prevSnake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check Collision with self
        if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          endGame(score);
          clearInterval(interval);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Eating
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 1);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 150); // Speed: 150ms

    return () => clearInterval(interval);
  }, [gameState, isGameOver, direction, food, score, generateFood, endGame]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    // Clear background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for(let i=0; i<GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0); ctx.lineTo(i * size, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * size); ctx.lineTo(canvas.width, i * size);
      ctx.stroke();
    }

    // Draw Snake
    ctx.fillStyle = '#4ADE80'; // Green
    snake.forEach((seg, i) => {
      // Body shape - slightly rounded
      ctx.beginPath();
      ctx.roundRect(seg.x * size + 1, seg.y * size + 1, size - 2, size - 2, 4);
      ctx.fill();
      
      // Eyes for head
      if (i === 0) {
        ctx.fillStyle = 'black';
        const eyeSize = size / 5;
        // Directional eyes
        if (direction.y === -1) { // Up
          ctx.fillRect(seg.x * size + size/4, seg.y * size + size/4, eyeSize, eyeSize);
          ctx.fillRect(seg.x * size + size*3/4 - eyeSize, seg.y * size + size/4, eyeSize, eyeSize);
        } else if (direction.y === 1) { // Down
          ctx.fillRect(seg.x * size + size/4, seg.y * size + size*3/4 - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(seg.x * size + size*3/4 - eyeSize, seg.y * size + size*3/4 - eyeSize, eyeSize, eyeSize);
        } else if (direction.x === -1) { // Left
          ctx.fillRect(seg.x * size + size/4, seg.y * size + size/4, eyeSize, eyeSize);
          ctx.fillRect(seg.x * size + size/4, seg.y * size + size*3/4 - eyeSize, eyeSize, eyeSize);
        } else { // Right
          ctx.fillRect(seg.x * size + size*3/4 - eyeSize, seg.y * size + size/4, eyeSize, eyeSize);
          ctx.fillRect(seg.x * size + size*3/4 - eyeSize, seg.y * size + size*3/4 - eyeSize, eyeSize, eyeSize);
        }
        ctx.fillStyle = '#4ADE80';
      }
    });

    // Draw Food
    ctx.fillStyle = '#F87171'; // Red
    ctx.beginPath();
    ctx.arc(food.x * size + size/2, food.y * size + size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Leaf
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(food.x * size + size/2 - 1, food.y * size + 2, 2, 4);

  }, [snake, food, direction]);

  const changeDirection = (newDir: { x: number; y: number }) => {
    // Prevent 180 degree turns
    if (newDir.x === -direction.x && newDir.y === -direction.y) return;
    setDirection(newDir);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6 relative">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <header className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 rounded-3xl bg-green-500/20 flex items-center justify-center text-green-500 animate-pulse">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Snake Miner</h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gold">
            <Trophy className="w-3 h-3" />
            Reward: {REWARD_AMOUNT} XRP
          </div>
        </header>

        {/* Game Area */}
        <div className="relative aspect-square bg-black border-2 border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-green-500/10">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={400} 
            className="w-full h-full"
          />

          {/* Overlays */}
          <AnimatePresence mode="wait">
            {gameState === 'COOLING_DOWN' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center gap-4"
              >
                <div className="p-4 rounded-full bg-blue-500/20 text-blue-400">
                  <Timer className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">RECHARGING</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    The snake is resting. You can play again in:
                  </p>
                  <p className="text-3xl font-black text-blue-400 mt-2">{cooldownRemaining || 'Loading...'}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
                >
                  Back Later
                </button>
              </motion.div>
            )}

            {gameState === 'AD_WALL' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 text-center gap-6"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Watch Ad to Play</h3>
                  <p className="text-xs text-gray-400">Supporting the system allows us to keep rewards active</p>
                </div>
                <button 
                  onClick={handleStartGame}
                  className="w-full py-4 rounded-2xl bg-green-500 text-black font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  START GAME
                </button>
              </motion.div>
            )}

            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-red-500/20 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center gap-6"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-red-500 uppercase">Collision Detected</span>
                  <h3 className="text-4xl font-black text-white">GAME OVER</h3>
                  <p className="text-sm font-bold text-gray-300 mt-2">Score: {score}</p>
                </div>
                
                {score > 0 ? (
                  <div className="w-full flex flex-col gap-3">
                    {isClaiming ? (
                      <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-black text-gold">CLAIMING XRP...</span>
                      </div>
                    ) : claimSuccess ? (
                      <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-2xl flex flex-col gap-1 animate-bounce">
                        <span className="text-xs font-black text-green-500">REWARD EARNED!</span>
                        <span className="text-xl font-black text-white">+{(score * 0.001).toFixed(3)} XRP</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-red-400 justify-center">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-[10px] font-bold">Reward check failed</span>
                        </div>
                        <p className="text-[9px] text-gray-500">Wait 6h between plays</p>
                      </div>
                    )}
                    <button 
                      onClick={onClose}
                      className="w-full py-4 rounded-2xl bg-white text-black font-black"
                    >
                      COLLECT & EXIT
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 text-white font-black"
                  >
                    TRY AGAIN LATER
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <button 
              onClick={() => changeDirection({ x: 0, y: -1 })}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/20 active:scale-90 transition-all"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => changeDirection({ x: -1, y: 0 })}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/20 active:scale-90 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => changeDirection({ x: 0, y: 1 })}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/20 active:scale-90 transition-all"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <button 
              onClick={() => changeDirection({ x: 1, y: 0 })}
              className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:bg-white/20 active:scale-90 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <footer className="text-center">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-relaxed">
            Avoid hitting walls or yourself!<br/>
            Earn 0.001 XRP per point collected.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SnakeGame;
