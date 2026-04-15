/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  CheckSquare, 
  Rocket, 
  Gamepad2,
  Video, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Lock, 
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Trophy,
  Users,
  Send,
  Search,
  X,
  Loader2,
  MoreHorizontal,
  BarChart2,
  PieChart,
  Cpu,
  CreditCard,
  ArrowRightLeft,
  ShieldCheck,
  HelpCircle,
  Download,
  Instagram,
  Youtube,
  Twitter,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { legacyAuth, legacyDb } from './lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import SpinWheel from './components/SpinWheel';
import SlotsGame from './components/SlotsGame';

// --- Icon Helper Component ---
const CoinIcon = ({ image, symbol, className = "w-10 h-10" }: { image?: string; symbol: string; className?: string }) => {
  const isGld = symbol.toLowerCase() === 'gld' || symbol.toLowerCase() === 'athena-gld';
  const isPi = symbol.toLowerCase() === 'pi' || symbol.toLowerCase() === 'pi-network';
  
  if (isGld) {
    return (
      <div className={`${className} rounded-full overflow-hidden bg-gold-gradient flex items-center justify-center border border-white/20 shadow-lg shadow-gold/20 flex-shrink-0`}>
        <img 
          src="https://ik.imagekit.io/7e0zp2ext/GLD.png?updatedAt=1772483693392" 
          alt="GLD" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  
  if (isPi) {
    return (
      <div className={`${className} rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-black text-[10px] border border-white/20 shadow-lg shadow-purple-500/20 flex-shrink-0`}>
        PI
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full overflow-hidden bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0`}>
      <img 
        src={image} 
        alt={symbol} 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};

const Icon = ({ name, className }: { name: string; className?: string }) => {
  useEffect(() => {
    // This is for the single-file deployment version where lucide is loaded via CDN
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [name]);
  
  // For standard React builds, we can map the name to the component
  const iconMap: Record<string, any> = {
    'layout-dashboard': LayoutDashboard,
    'wallet': Wallet,
    'check-square': CheckSquare,
    'rocket': Rocket,
    'gamepad-2': Gamepad2,
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'chevron-right': ChevronRight,
    'lock': Lock,
    'zap': Zap,
    'arrow-up-right': ArrowUpRight,
    'arrow-down-left': ArrowDownLeft,
    'refresh-cw': RefreshCw,
    'trophy': Trophy,
    'users': Users,
    'send': Send,
    'search': Search,
    'x': X,
    'loader-2': Loader2,
    'more-horizontal': MoreHorizontal,
    'bar-chart-2': BarChart2,
    'pie-chart': PieChart,
    'cpu': Cpu,
    'credit-card': CreditCard,
    'arrow-right-left': ArrowRightLeft,
    'shield-check': ShieldCheck,
    'help-circle': HelpCircle,
    'instagram': Instagram,
    'youtube': Youtube,
    'twitter': Twitter,
    'video': Video
  };

  const LucideIcon = iconMap[name];
  if (LucideIcon) {
    return <LucideIcon className={className} />;
  }

  // Fallback for CDN version
  return <i data-lucide={name} className={className}></i>;
};

// --- Types ---
type Tab = 'dashboard' | 'wallet' | 'tasks' | 'mainnet' | 'more';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  price: number;
  change: number;
  icon: string;
}

interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | string;
  price_change_percentage_24h: number;
}

// --- Mock Data ---
const MOCK_COINS: Coin[] = [
  { id: 'gld', name: 'Athena GLD', symbol: 'GLD', balance: 1250.50, price: 3.00, change: 5.4, icon: 'https://ik.imagekit.io/7e0zp2ext/GLD.png?updatedAt=1772483693392' },
  { id: 'pi', name: 'Pi Network', symbol: 'PI', balance: 450.00, price: 32.40, change: 2.1, icon: 'https://github.com/karimoshka93/athenachain2/blob/main/public/pi.png?raw=true' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', balance: 0.05, price: 65000, change: 1.2, icon: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: 1.5, price: 3500, change: -0.8, icon: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'xrp', name: 'XRP', symbol: 'XRP', balance: 1000, price: 0.62, change: 2.5, icon: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', balance: 12.5, price: 145.20, change: 3.8, icon: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'ton', name: 'TON', symbol: 'TON', balance: 85.00, price: 5.12, change: 12.5, icon: 'https://coin-images.coingecko.com/coins/images/17980/large/ton_symbol.png' },
  { id: 'usdt', name: 'USDT', symbol: 'USDT', balance: 250.00, price: 1.00, change: 0.01, icon: 'https://coin-images.coingecko.com/coins/images/325/large/tether.png' },
  { id: 'bnb', name: 'BNB', symbol: 'BNB', balance: 1.2, price: 580.00, change: -0.5, icon: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', balance: 5000000, price: 0.000025, change: -2.1, icon: 'https://coin-images.coingecko.com/coins/images/11903/large/shiba.png' },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', balance: 1500, price: 0.15, change: 1.8, icon: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png' },
  { id: 'pepe', name: 'Pepe', symbol: 'PEPE', balance: 10000000, price: 0.000008, change: 15.2, icon: 'https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg' },
  { id: 'wif', name: 'Dogwifhat', symbol: 'WIF', balance: 500, price: 2.50, change: -5.4, icon: 'https://coin-images.coingecko.com/coins/images/33566/large/dogwifhat.jpg' },
];

const MARKET_DATA = [
  { name: 'Athena GLD', symbol: 'GLD', price: 0.12, change: 5.4 },
  { name: 'Pi Network', symbol: 'PI', price: 32.40, change: -1.2 },
  { name: 'Solana', symbol: 'SOL', price: 145.20, change: 3.8 },
  { name: 'TON', symbol: 'TON', price: 5.12, change: 12.5 },
  { name: 'BNB', symbol: 'BNB', price: 580.00, change: -0.5 },
];

const TASKS = [
  { 
    id: 1, 
    title: 'Repost last X post', 
    reward: 0.01, 
    icon: <Icon name="twitter" className="w-5 h-5" />, 
    link: 'https://x.com/DigitalGold2025',
    frequency: 'Daily',
    isDaily: true
  },
  { 
    id: 2, 
    title: 'Repost last Instagram post', 
    reward: 0.01, 
    icon: <Icon name="instagram" className="w-5 h-5" />, 
    link: 'https://instagram.com/digitalgold11',
    frequency: 'Daily',
    isDaily: true
  },
  { 
    id: 3, 
    title: 'React on last Telegram post', 
    reward: 0.01, 
    icon: <Icon name="send" className="w-5 h-5" />, 
    link: 'https://t.me/digitalgold2025',
    frequency: 'Daily',
    isDaily: true
  },
  { 
    id: 4, 
    title: 'Check for news in Youtube', 
    reward: 0.05, 
    icon: <Icon name="youtube" className="w-5 h-5" />, 
    link: 'https://www.youtube.com/@DigitalGold25',
    frequency: 'Daily',
    isDaily: true
  },
  { 
    id: 5, 
    title: 'Watch TikTok Video', 
    reward: 0.1, 
    icon: <Icon name="video" className="w-5 h-5" />, 
    link: 'https://vt.tiktok.com/ZSHHX81St/',
    frequency: 'Every 5 days',
    requiredCode: 'sunset glow'
  },
  { 
    id: 6, 
    title: 'Watch YouTube Short', 
    reward: 0.1, 
    icon: <Icon name="youtube" className="w-5 h-5" />, 
    link: 'https://youtube.com/shorts/PYy0371wafc?si=1SNQ_v5601lGRCbL',
    frequency: 'Every 5 days',
    requiredCode: 'move in gold'
  },
  { 
    id: 7, 
    title: 'Watch Instagram Reel', 
    reward: 0.1, 
    icon: <Icon name="instagram" className="w-5 h-5" />, 
    link: 'https://www.instagram.com/reel/DW6MAnIjZGb/?igsh=ZmkwNm03dTZ2djYz',
    frequency: 'Every 5 days',
    requiredCode: 'Rise beyond'
  },
];

const MAINNET_STEPS = [
  { id: 1, title: 'Project Alpha Launch', status: 'completed', description: 'Initial release and core infrastructure setup.' },
  { id: 2, title: 'User Migration Phase', status: 'active', description: 'Syncing legacy Digital Gold V1 assets to Athena Chain.' },
  { id: 3, title: 'Athena Chain Testnet Deployment', status: 'pending', description: 'Public testnet for network stress testing.' },
  { id: 4, title: 'KYC & Wallet Verification', status: 'locked', description: 'Identity verification for mainnet eligibility.' },
  { id: 5, title: 'Mainnet Official Launch & Exchange Listing', status: 'locked', description: 'Full network launch and trading on global exchanges.' },
];

// --- Components ---

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded ${className}`} />
);

const MarketView = ({ onClose }: { onClose: () => void }) => {
  const [marketData, setMarketData] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
  }, []);

  const filteredData = marketData.filter(coin => 
    coin.name.toLowerCase().includes(search.toLowerCase()) || 
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#0b0e14] flex flex-col"
    >
      <header className="px-5 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-xl font-bold text-gold-gradient">Global Market</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <Icon name="x" className="w-6 h-6 text-gray-400" />
        </button>
      </header>

      <div className="px-5 py-4">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search coins..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
        <div className="flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-12 h-3" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-12 h-3" />
                </div>
              </div>
            ))
          ) : (
            filteredData.map((coin) => (
              <div 
                key={coin.id} 
                className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-white/5"
              >
                <div className="flex items-center gap-4">
                  <CoinIcon image={coin.image} symbol={coin.symbol} className="w-10 h-10" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{coin.name}</span>
                    <span className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider">{coin.symbol}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="font-mono font-bold text-sm">
                      {typeof coin.current_price === 'number'
                        ? `$${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                        : <span className="text-gold uppercase text-[10px] font-bold">{coin.current_price}</span>
                      }
                    </span>
                    <span className={`text-[10px] font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                      {coin.price_change_percentage_24h != null ? coin.price_change_percentage_24h.toFixed(2) : '0.00'}%
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('Athena DEX: Coming Soon');
                    }}
                    className="bg-gold/10 text-gold hover:bg-gold hover:text-black px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-gold/20"
                  >
                    Trade
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = ({ 
  onViewAll, 
  onClaim, 
  lastMiningTime, 
  onStartMining,
  deferredPrompt,
  onInstall,
  miningMessage
}: { 
  onViewAll: () => void, 
  onClaim: (amount: number) => void,
  lastMiningTime: string | null,
  onStartMining: () => void,
  deferredPrompt: any,
  onInstall: () => void,
  miningMessage: { type: 'success' | 'error', text: string } | null
}) => {
  const [minedAmount, setMinedAmount] = useState(0);
  const [marketData, setMarketData] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const MINING_RATE_PER_SECOND = 0.02 / 3600;
  const SESSION_DURATION_SECONDS = 2 * 3600;

  useEffect(() => {
    const fetchDashboardMarket = async () => {
      // Small delay to avoid hitting rate limits too quickly on page load
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        // Fetching top 50 coins instead of specific IDs to be more robust against API errors with specific IDs
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const gldCoin: MarketCoin = { 
          id: 'athena-gld', 
          symbol: 'gld', 
          name: 'Athena GLD', 
          image: '', 
          current_price: 'Listing Soon', 
          price_change_percentage_24h: 0 
        };

        // We want to show specific coins on the dashboard
        const targetSymbols = ['btc', 'eth', 'sol', 'ton', 'bnb', 'doge', 'shib', 'usdt'];
        const filteredData = Array.isArray(data) 
          ? data.filter((c: any) => targetSymbols.includes(c.symbol.toLowerCase()))
          : [];

        const piCoin: MarketCoin = (Array.isArray(data) && data.find((c: any) => c.symbol.toLowerCase() === 'pi')) || { 
          id: 'pi-network', 
          symbol: 'pi', 
          name: 'Pi Network', 
          image: '', 
          current_price: 'Coming Soon', 
          price_change_percentage_24h: 0 
        };

        // Ensure Pi has the correct image and price status
        piCoin.image = '';
        piCoin.current_price = 'Coming Soon';

        setMarketData([gldCoin, piCoin, ...filteredData]);
      } catch (error) {
        console.warn('Dashboard market data fetch failed, using fallback:', error);
        
        // Provide fallback data if fetch fails
        const gldCoin: MarketCoin = { 
          id: 'athena-gld', 
          symbol: 'gld', 
          name: 'Athena GLD', 
          image: '', 
          current_price: 'Listing Soon', 
          price_change_percentage_24h: 0 
        };

        // In fallback, we use MOCK_COINS but skip the first one (GLD) to avoid duplication
        const fallbackCoins: MarketCoin[] = MOCK_COINS.slice(1, 8).map(coin => ({
          id: coin.id,
          symbol: coin.symbol.toLowerCase(),
          name: coin.name,
          image: coin.icon,
          current_price: coin.price,
          price_change_percentage_24h: coin.change
        }));

        setMarketData([gldCoin, ...fallbackCoins]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardMarket();
  }, []);

  useEffect(() => {
    let interval: any;
    if (lastMiningTime) {
      interval = setInterval(() => {
        const startTime = new Date(lastMiningTime).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = (now - startTime) / 1000;
        
        if (elapsedSeconds >= SESSION_DURATION_SECONDS) {
          setMinedAmount(SESSION_DURATION_SECONDS * MINING_RATE_PER_SECOND);
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setMinedAmount(elapsedSeconds * MINING_RATE_PER_SECOND);
          setTimeLeft(SESSION_DURATION_SECONDS - elapsedSeconds);
        }
      }, 100);
    } else {
      setMinedAmount(0);
      setTimeLeft(null);
    }
    return () => clearInterval(interval);
  }, [lastMiningTime]);

  const handleClaim = () => {
    if (minedAmount > 0) {
      onClaim(minedAmount);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isMining = lastMiningTime !== null && timeLeft !== null && timeLeft > 0;
  const isFinished = lastMiningTime !== null && timeLeft === 0;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold-gradient">Athena Chain</h1>
          <div className="flex items-center gap-2 bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gold uppercase">Preparing Migration</span>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Welcome back, Pioneer</p>
      </header>

      {deferredPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gold/10 border border-gold/20 rounded-2xl p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
              <Icon name="rocket" className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Install Athena App</p>
              <p className="text-[10px] text-gray-400">Add to home screen for quick access</p>
            </div>
          </div>
          <button 
            onClick={onInstall}
            className="bg-gold text-black font-bold text-xs px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Install
          </button>
        </motion.div>
      )}

      {/* Mining Section */}
      <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gold/20">
          <motion.div 
            className="h-full bg-gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: isMining ? '100%' : isFinished ? '100%' : '0%' }}
            transition={{ duration: 2, repeat: isMining ? Infinity : 0, ease: "linear" }}
          />
        </div>
        
        <div className="text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
            {isFinished ? 'Session Complete' : 'Current Session Earnings'}
          </p>
          <h2 className="text-4xl font-mono font-bold text-gold">{minedAmount.toFixed(6)} GLD</h2>
          {isMining && timeLeft !== null && (
            <p className="text-gray-500 text-[10px] mt-1 font-mono uppercase tracking-tighter">
              Time Remaining: {formatTime(timeLeft)}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          {miningMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-[10px] font-bold px-4 py-2 rounded-lg text-center ${
                miningMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {miningMessage.text}
            </motion.div>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!isMining && !isFinished) onStartMining();
            }}
            disabled={isMining || isFinished}
            className={`w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all duration-500 ripple ${
              isMining 
              ? 'border-gold bg-gold/10 gold-glow' 
              : isFinished
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-700 bg-gray-800/50 hover:border-gold/50'
            }`}
          >
            <Zap className={`w-14 h-14 ${isMining ? 'text-gold fill-gold animate-pulse' : isFinished ? 'text-green-500' : 'text-gray-500'}`} />
            <span className={`font-bold text-sm tracking-widest ${isMining ? 'text-gold' : isFinished ? 'text-green-500' : 'text-gray-500'}`}>
              {isMining ? 'MINING...' : isFinished ? 'FINISHED' : 'START MINING'}
            </span>
          </motion.button>

          {(minedAmount > 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleClaim}
              className="bg-gold-gradient text-black font-extrabold px-8 py-2 rounded-full gold-glow hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              CLAIM REWARD
            </motion.button>
          )}
        </div>

        <p className="text-gray-500 text-[10px] text-center max-w-[220px]">
          Current rate: 0.02 GLD/hr • 2 hour sessions • Session resets on claim
        </p>
      </div>

      {/* Market Ticker */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-semibold text-lg">Global Market</h3>
          <button 
            onClick={onViewAll}
            className="text-gold text-xs font-medium flex items-center gap-1 hover:brightness-110 transition-all"
          >
            View All <Icon name="chevron-right" className="w-3 h-3" />
          </button>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">24h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="w-24 h-4" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="w-16 h-4 ml-auto" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="w-12 h-4 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                marketData.map((item) => (
                  <tr key={item.symbol} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <CoinIcon image={item.image} symbol={item.symbol} className="w-5 h-5" />
                        <div className="flex flex-col">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-gray-500 text-[10px] uppercase">{item.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">
                      {typeof item.current_price === 'number' 
                        ? `$${item.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : <span className="text-gold font-bold text-[10px] uppercase whitespace-nowrap">{item.current_price}</span>
                      }
                    </td>
                    <td className={`px-4 py-4 text-right font-medium ${item.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {item.price_change_percentage_24h >= 0 ? <Icon name="trending-up" className="w-3 h-3" /> : <Icon name="trending-down" className="w-3 h-3" />}
                        {item.price_change_percentage_24h != null ? Math.abs(item.price_change_percentage_24h).toFixed(2) : '0.00'}%
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const WalletTab = ({ 
  migrationStatus, 
  onMainSync,
  onExtraSync, 
  userAssets,
  marketPrices
}: { 
  migrationStatus: boolean, 
  onMainSync: () => void,
  onExtraSync: () => void,
  userAssets: Record<string, number>,
  marketPrices: Record<string, number>
}) => {
  // Use marketPrices if available, otherwise fallback to MOCK_COINS or 0
  const totalBalance = Object.entries(userAssets).reduce((acc, [symbol, balance]) => {
    const upperSymbol = symbol.toUpperCase();
    const price = marketPrices[upperSymbol] || MOCK_COINS.find(c => c.symbol === upperSymbol)?.price || 0;
    return acc + (balance * price);
  }, 0);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">Portfolio</h1>
        <p className="text-gray-400 text-sm">Manage your global assets</p>
      </header>

      {/* Migration Card */}
      <div className={`glass rounded-3xl p-5 border-gold/40 bg-gradient-to-r from-gold/10 to-transparent relative overflow-hidden transition-all duration-500 ${migrationStatus ? 'gold-glow' : 'opacity-80'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${migrationStatus ? 'bg-gold/20 text-gold' : 'bg-green-500/20 text-green-400'}`}>
            {migrationStatus ? <Icon name="refresh-cw" className="w-6 h-6 animate-spin-slow" /> : <Icon name="check-square" className="w-6 h-6" />}
          </div>
          <div>
            <h4 className={`font-bold ${migrationStatus ? 'text-gold' : 'text-green-400'}`}>
              {migrationStatus ? 'Migration detected' : 'Wallet Verified'}
            </h4>
            <p className="text-gray-400 text-xs">
              {migrationStatus ? 'Digital Gold V1 assets found' : 'Legacy assets successfully synced'}
            </p>
          </div>
        </div>
        <button 
          onClick={onMainSync}
          disabled={!migrationStatus}
          className={`w-full font-extrabold py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-lg ${
            migrationStatus 
            ? 'bg-gold-gradient text-black gold-glow hover:brightness-110 active:scale-[0.98]' 
            : 'bg-white/5 text-gray-500 cursor-default'
          }`}
        >
          {migrationStatus ? <><Icon name="refresh-cw" className="w-5 h-5" /> Sync Legacy Assets</> : 'Wallet Verified'}
        </button>
      </div>

      {/* Portfolio Card */}
      <div className="glass rounded-3xl p-6 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
        
        {/* Extra Sync Button - Only visible if already synced */}
        {!migrationStatus && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <button 
              onClick={onExtraSync}
              className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/30 transition-all gold-glow active:scale-90 group"
              title="Extra Sync (Available Today Only)"
            >
              <Icon name="refresh-cw" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <span className="text-[7px] font-bold text-gold uppercase tracking-tighter bg-gold/10 px-1.5 py-0.5 rounded-md border border-gold/20">
              Extra Sync
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1 mb-1">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Total Estimated Balance</p>
          <p className="text-[10px] text-gold/60 font-medium italic">* Real-time market prices (GLD fixed until listing)</p>
        </div>
        <h2 className="text-3xl font-bold mb-6">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        
        <div className="flex gap-3">
          <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/5">
            <Icon name="arrow-up-right" className="w-4 h-4" /> Send
          </button>
          <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/5">
            <Icon name="arrow-down-left" className="w-4 h-4" /> Receive
          </button>
        </div>
      </div>

      {/* Temporary Notice */}
      <div className="bg-gold/5 border border-gold/10 rounded-2xl p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0">
          <Icon name="zap" className="w-4 h-4" />
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          <span className="text-gold font-bold">Notice:</span> The <span className="text-white font-bold">Extra Sync</span> feature is available <span className="text-white font-bold">today only</span> to help users migrate missing XRP balances. This button will be removed tomorrow.
        </p>
      </div>

      {/* Assets List */}
      <section className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg px-2">Asset List</h3>
        <div className="flex flex-col gap-3">
          {Object.keys(userAssets).length === 0 ? (
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center border-dashed border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-3">
                <Wallet className="w-6 h-6 opacity-20" />
              </div>
              <p className="text-gray-500 text-sm">No assets found.</p>
              <p className="text-gold text-xs font-bold mt-1">Click Sync to migrate</p>
            </div>
          ) : (
            Object.entries(userAssets).map(([symbol, balance]) => {
              const coinInfo = MOCK_COINS.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
              const name = coinInfo?.name || symbol;
              const icon = coinInfo?.icon || 'https://github.com/karimoshka93/athenachain2/blob/main/public/pi.png?raw=true';
              
              return (
                <div key={symbol} className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer border-white/5">
                  <div className="flex items-center gap-4">
                    <CoinIcon image={coinInfo?.icon} symbol={symbol} className="w-10 h-10" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{name}</span>
                      <span className="text-gray-500 text-[10px] uppercase font-semibold tracking-wider">{symbol}</span>
                    </div>
                  </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-sm">{balance.toLocaleString()}</span>
                      <span className="text-gray-500 text-[10px]">
                        {(() => {
                          const upperSymbol = symbol.toUpperCase();
                          if (upperSymbol === 'PI') return 'Soon';
                          const price = marketPrices[upperSymbol] || MOCK_COINS.find(c => c.symbol === upperSymbol)?.price || 0;
                          return `$${(balance * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        })()}
                      </span>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

const TasksTab = ({ 
  completedTasks, 
  onCompleteTask 
}: { 
  completedTasks: number[], 
  onCompleteTask: (taskId: number, reward: number) => void 
}) => {
  const [taskCodes, setTaskCodes] = useState<Record<number, string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});

  const handleVerify = (task: any) => {
    const inputCode = taskCodes[task.id]?.trim().toLowerCase();
    const requiredCode = task.requiredCode?.trim().toLowerCase();

    if (inputCode === requiredCode) {
      onCompleteTask(task.id, task.reward);
      setErrorMessages(prev => ({ ...prev, [task.id]: '' }));
    } else {
      setErrorMessages(prev => ({ ...prev, [task.id]: 'Invalid code. Please try again.' }));
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">Tasks & Rewards</h1>
        <p className="text-gray-400 text-sm">Earn GLD by supporting the network</p>
      </header>

      <div className="flex flex-col gap-3">
        {TASKS.map((task) => {
          const isCompleted = completedTasks.includes(task.id);
          const needsCode = !!task.requiredCode;

          return (
            <div 
              key={task.id} 
              className={`glass rounded-2xl p-5 flex flex-col gap-4 group transition-all ${
                isCompleted ? 'opacity-50 border-green-500/30' : 'hover:border-gold/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gold group-hover:bg-gold/10'
                  }`}>
                    {isCompleted ? <ShieldCheck className="w-5 h-5" /> : task.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isCompleted ? 'text-gray-400 line-through' : ''}`}>{task.title}</span>
                    <div className="flex items-center gap-2">
                      <span className={`${isCompleted ? 'text-green-500' : 'text-gold'} text-xs font-bold`}>
                        {isCompleted ? 'Rewarded' : `+${task.reward} GLD`}
                      </span>
                      <span className="text-gray-500 text-[10px] uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded">{task.frequency}</span>
                    </div>
                  </div>
                </div>
                
                {isCompleted ? (
                  <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg text-sm font-bold">
                    Done
                  </div>
                ) : (
                  <button 
                    onClick={() => window.open(task.link, '_blank')}
                    className="bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Go
                  </button>
                )}
              </div>

              {!isCompleted && needsCode && (
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Enter Verification Code</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={taskCodes[task.id] || ''}
                      onChange={(e) => setTaskCodes(prev => ({ ...prev, [task.id]: e.target.value }))}
                      placeholder="Enter code from video..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                    />
                    <button 
                      onClick={() => handleVerify(task)}
                      className="bg-gold-gradient text-black font-bold px-6 py-2 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all"
                    >
                      Verify
                    </button>
                  </div>
                  {errorMessages[task.id] && (
                    <p className="text-red-400 text-[10px] font-medium">{errorMessages[task.id]}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MainnetTab = () => {
  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">Mainnet Roadmap</h1>
        <p className="text-gray-400 text-sm">Track the Athena Chain launch phases</p>
      </header>

      <div className="relative pl-8 flex flex-col gap-8 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
        {MAINNET_STEPS.map((step) => (
          <div key={step.id} className="relative">
            {/* Step Indicator */}
            <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 z-10 ${
              step.status === 'completed' ? 'bg-green-500 border-green-500' : 
              step.status === 'active' ? 'bg-gold border-gold shadow-[0_0_10px_#FFD700]' : 
              step.status === 'locked' ? 'bg-gray-800 border-gray-700' :
              'bg-gray-700 border-gray-600'
            }`} />
            
            <div className={`glass rounded-2xl p-5 transition-all ${step.status === 'active' ? 'border-gold/50 gold-glow' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {step.status === 'locked' && <Lock className="w-3 h-3 text-gray-600" />}
                  <h4 className={`font-bold text-sm ${step.status === 'locked' ? 'text-gray-600' : 'text-white'}`}>{step.title}</h4>
                </div>
                <span className={`text-[8px] uppercase font-bold px-2 py-1 rounded ${
                  step.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                  step.status === 'active' ? 'bg-gold/20 text-gold animate-pulse' : 
                  'bg-white/5 text-gray-500'
                }`}>
                  {step.status}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${step.status === 'locked' ? 'text-gray-700' : 'text-gray-400'}`}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



// --- Main App ---

// --- Main App ---

const MoreTab = ({ userId, onBalanceUpdate }: { userId: string; onBalanceUpdate: () => void }) => {
  const [showWheel, setShowWheel] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const sections = [
    {
      title: "Trading",
      items: [
        { name: "Spot Trading", icon: <BarChart2 className="w-5 h-5" /> },
        { name: "Futures", icon: <TrendingUp className="w-5 h-5" /> },
        { name: "P2P Trading", icon: <ArrowRightLeft className="w-5 h-5" /> },
        { name: "Convert", icon: <RefreshCw className="w-5 h-5" /> },
      ]
    },
    {
      title: "Finance",
      items: [
        { name: "Staking", icon: <PieChart className="w-5 h-5" /> },
        { name: "Athena Earn", icon: <Zap className="w-5 h-5" /> },
        { name: "Crypto Card", icon: <CreditCard className="w-5 h-5" /> },
        { name: "Loans", icon: <ShieldCheck className="w-5 h-5" /> },
      ]
    },
    {
      title: "Games",
      items: [
        { name: "Wheel of Fortune", icon: <Zap className="w-5 h-5" />, isGame: true, gameType: 'wheel' },
        { name: "Athena Slots", icon: <Trophy className="w-5 h-5" />, isGame: true, gameType: 'slots' },
        { name: "Crash Game", icon: <TrendingUp className="w-5 h-5" /> },
        { name: "Dice", icon: <Gamepad2 className="w-5 h-5" /> },
      ]
    },
    {
      title: "AI & Innovation",
      items: [
        { name: "AI Trading Bot", icon: <Cpu className="w-5 h-5" /> },
        { name: "Launchpad", icon: <Rocket className="w-5 h-5" /> },
        { name: "NFT Market", icon: <Gamepad2 className="w-5 h-5" /> },
        { name: "Academy", icon: <HelpCircle className="w-5 h-5" /> },
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Install App", icon: <Download className="w-5 h-5" />, isInstall: true },
        { name: "Help Center", icon: <HelpCircle className="w-5 h-5" /> },
      ]
    }
  ];

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ isIOS: false, isAndroid: false, isChrome: false });

  useEffect(() => {
    const ua = navigator.userAgent;
    setBrowserInfo({
      isIOS: /iPad|iPhone|iPod/.test(ua),
      isAndroid: /Android/.test(ua),
      isChrome: /Chrome/.test(ua) && !/Edge/.test(ua)
    });
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">More Services</h1>
        <p className="text-gray-400 text-sm">Explore the Athena ecosystem</p>
      </header>

      {sections.map((section, idx) => (
        <div key={idx} className="flex flex-col gap-4">
          <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest ml-2">{section.title}</h3>
          <div className="grid grid-cols-4 gap-3">
            {section.items.map((item, itemIdx) => (
              <div 
                key={itemIdx} 
                onClick={() => {
                  if (item.isInstall) setShowInstallGuide(true);
                  if (item.isGame) {
                    if (item.gameType === 'wheel') setShowWheel(true);
                    if (item.gameType === 'slots') setShowSlots(true);
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 relative group cursor-pointer ${(!item.isInstall && !item.isGame) ? 'opacity-60 grayscale' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${(item.isInstall || item.isGame) ? 'text-gold' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] text-center font-medium leading-tight ${(item.isInstall || item.isGame) ? 'text-white' : 'text-gray-500'}`}>{item.name}</span>
                {(!item.isInstall && !item.isGame) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-bold text-gold uppercase tracking-tighter">Soon</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

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

      {/* Slots Modal */}
      <AnimatePresence>
        {showSlots && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <SlotsGame 
                userId={userId} 
                onBalanceUpdate={onBalanceUpdate} 
                onClose={() => setShowSlots(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1d23] border border-white/10 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Install Athena App</h2>
              <button onClick={() => setShowInstallGuide(false)} className="text-gray-400 hover:text-white">
                <Icon name="x" className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {browserInfo.isAndroid && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="text-sm font-bold text-white">Android (Chrome)</p>
                    <p className="text-xs text-gray-400">Tap the three dots (⋮) in the top right and select "Install app".</p>
                  </div>
                </div>
              )}

              {browserInfo.isIOS && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="text-sm font-bold text-white">iOS (Safari)</p>
                    <p className="text-xs text-gray-400">Tap the Share button (square with arrow) and select "Add to Home Screen".</p>
                  </div>
                </div>
              )}

              {!browserInfo.isIOS && !browserInfo.isAndroid && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="text-sm font-bold text-white">Desktop</p>
                    <p className="text-xs text-gray-400">Click the install icon in the address bar next to the bookmark star.</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-500 leading-relaxed italic">
                  Athena Chain is a Progressive Web App (PWA). This means you can install it directly from your browser without using an App Store.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowInstallGuide(false)}
              className="w-full bg-gold text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
            >
              Got it!
            </button>
          </motion.div>
        </div>
      )}
      
      <a 
        href="mailto:digitalgold390@gmail.com"
        className="mt-4 p-5 glass rounded-3xl border-gold/20 flex items-center justify-between hover:bg-gold/5 transition-all active:scale-[0.98] group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold/20 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Support Center</h4>
            <p className="text-[10px] text-gray-500">Need help? We're here 24/7</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gold transition-colors" />
      </a>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot-password' | 'update-password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showMarketView, setShowMarketView] = useState(false);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({ 'GLD': 3.00 });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [migrationStatus, setMigrationStatus] = useState(true);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [userAssets, setUserAssets] = useState<Record<string, number>>({});
  const [lastMiningTime, setLastMiningTime] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [legacyUid, setLegacyUid] = useState<string | null>(null);
  const [isExtraSync, setIsExtraSync] = useState(false);
  const [legacyEmail, setLegacyEmail] = useState('');
  const [legacyPassword, setLegacyPassword] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isWaitingForAd, setIsWaitingForAd] = useState(false);
  const [adClickTime, setAdClickTime] = useState<number | null>(null);
  const [miningMessage, setMiningMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWaitingForAd && adClickTime) {
        const now = Date.now();
        const elapsed = now - adClickTime;
        
        if (elapsed >= 4000) {
          // Success, start mining
          setIsWaitingForAd(false);
          setAdClickTime(null);
          setMiningMessage(null);
          executeStartMining();
        } else {
          // Too fast
          setMiningMessage({ type: 'error', text: 'Please watch the ad for at least 4 seconds to start mining.' });
          setIsWaitingForAd(false);
          setAdClickTime(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isWaitingForAd, adClickTime]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error && error.message.includes('Refresh Token Not Found')) {
        supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setIsAuthLoading(false);
    }).catch(() => {
      setIsAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('update-password');
      } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
      } else if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    try {
      // 1. Load profile to check sync status, mining time, and tasks
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('last_mining_time, completed_tasks, legacy_uid')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      // Set defaults if profile is missing or fields are null
      setMigrationStatus(profile?.legacy_uid === null || profile?.legacy_uid === undefined);
      setLastMiningTime(profile?.last_mining_time || null);
      setLegacyUid(profile?.legacy_uid || null);

      // --- Daily Tasks Reset Logic ---
      let tasks = profile?.completed_tasks || [];
      const today = parseInt(new Date().toISOString().split('T')[0].replace(/-/g, ''));
      const lastResetEntry = tasks.find((id: number) => id > 1000000); // Use > 1M for date storage
      const lastResetDate = lastResetEntry ? lastResetEntry - 1000000 : 0;

      if (lastResetDate !== today) {
        // It's a new day! Filter out daily tasks
        const dailyTaskIds = TASKS.filter(t => (t as any).isDaily).map(t => t.id);
        tasks = tasks.filter((id: number) => !dailyTaskIds.includes(id) && id <= 1000000);
        // Add new reset marker
        tasks.push(today + 1000000);
        
        // Update Supabase immediately
        await supabase
          .from('profiles')
          .update({ completed_tasks: tasks })
          .eq('id', user.id);
      }
      setCompletedTasks(tasks);

      // 2. Load balances
      const { data: balances, error: balancesError } = await supabase
        .from('user_balances')
        .select('coin_symbol, amount')
        .eq('user_id', user.id);

      if (balancesError) {
        console.error('Error loading balances:', balancesError);
        setUserAssets({}); // Default to empty
      } else {
        const assets: Record<string, number> = {};
        if (balances && balances.length > 0) {
          balances.forEach(b => {
            assets[b.coin_symbol] = b.amount;
          });
        }
        setUserAssets(assets);
      }
    } catch (err) {
      console.error('Unexpected error loading user data:', err);
      // Ensure defaults on error
      setMigrationStatus(true);
      setLastMiningTime(null);
      setCompletedTasks([]);
      setUserAssets({});
    }
  };

  // Load user data when authenticated
  useEffect(() => {
    if (!user) {
      setUserAssets({});
      setMigrationStatus(true);
      return;
    }

    loadUserData();
  }, [user]);

  // Fetch market prices for wallet
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = 'bitcoin,ethereum,solana,the-open-network,binancecoin,dogecoin,shiba-inu,pinetwork,tether';
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const newPrices: Record<string, number> = { 'GLD': 3.00 };
        if (data['bitcoin']) newPrices['BTC'] = data['bitcoin'].usd;
        if (data['ethereum']) newPrices['ETH'] = data['ethereum'].usd;
        if (data['solana']) newPrices['SOL'] = data['solana'].usd;
        if (data['the-open-network']) newPrices['TON'] = data['the-open-network'].usd;
        if (data['binancecoin']) newPrices['BNB'] = data['binancecoin'].usd;
        if (data['dogecoin']) newPrices['DOGE'] = data['dogecoin'].usd;
        if (data['shiba-inu']) newPrices['SHIB'] = data['shiba-inu'].usd;
        if (data['pinetwork']) newPrices['PI'] = data['pinetwork'].usd;
        if (data['tether']) newPrices['USDT'] = data['tether'].usd;

        setMarketPrices(newPrices);
      } catch (error) {
        console.warn('Market price fetch failed, using fallback prices:', error);
        // Fallback to MOCK_COINS prices if fetch fails
        const fallbackPrices: Record<string, number> = { 'GLD': 3.00 };
        MOCK_COINS.forEach(coin => {
          fallbackPrices[coin.symbol.toUpperCase()] = coin.price;
        });
        setMarketPrices(prev => ({ ...fallbackPrices, ...prev }));
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setAuthMessage(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ id: data.user.id, email: data.user.email });
          
          if (profileError) console.error('Error creating profile:', profileError);
          
          setAuthMessage({ 
            type: 'success', 
            text: 'Registration successful! Please check your email for verification.' 
          });
        }
      } else if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setAuthMessage({ 
          type: 'success', 
          text: 'Password reset link sent! Please check your email.' 
        });
      } else if (authMode === 'update-password') {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
        setAuthMessage({ 
          type: 'success', 
          text: 'Password updated successfully! You can now login.' 
        });
        setTimeout(() => {
          setAuthMode('login');
          setAuthMessage(null);
        }, 2000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      setAuthMessage({ type: 'error', text: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMainSync = () => {
    setIsExtraSync(false);
    setLegacyEmail('');
    setLegacyPassword('');
    setMigrationMessage(null);
    setShowMigrationModal(true);
  };

  const handleExtraSync = () => {
    setIsExtraSync(true);
    if (user?.email) {
      setLegacyEmail(user.email);
    }
    setLegacyPassword('');
    setMigrationMessage(null);
    setShowMigrationModal(true);
  };

  const confirmMigration = async () => {
    if (!user) return;
    setIsMigrating(true);
    setMigrationMessage(null);

    // 10-second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Data fetch timeout. Please check console for path error.')), 10000)
    );

    const migrationPromise = (async () => {
      // Demo Bypass for testing
      if (legacyEmail.trim() === 'demo@athena.chain' && legacyPassword === 'demo123') {
        const demoBalances = { "GLD": 5000, "Pi": 1000, "USDT": 100 };
        setUserAssets(demoBalances);
        setMigrationStatus(false);
        setMigrationMessage({ type: 'success', text: 'Success! Demo assets migrated to Athena Chain' });
        setTimeout(() => {
          setShowMigrationModal(false);
          setMigrationMessage(null);
        }, 2000);
        return;
      }

      // 1. Verify legacy Firebase account
      const emailToUse = isExtraSync ? user.email : legacyEmail.trim().toLowerCase();
      if (!emailToUse) throw new Error('Email is required for synchronization.');
      
      const legacyUserCredential = await signInWithEmailAndPassword(legacyAuth, emailToUse, legacyPassword);
      const currentLegacyUid = legacyUserCredential.user.uid;
      if (!currentLegacyUid) throw new Error('Could not retrieve legacy account ID.');
      console.log('Legacy Firebase UID:', currentLegacyUid);

      // --- ANTI-FARMING CHECK ---
      // 1. GLOBAL CHECK: Check if this legacy UID has already been migrated by ANYONE else
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('legacy_uid', currentLegacyUid)
        .maybeSingle();

      if (checkError) {
        console.error('Anti-farming check error:', checkError);
        throw new Error('Security check failed. Please try again.');
      }

      if (existingProfile && existingProfile.id !== user.id) {
        throw new Error('This legacy account is already linked to another Athena wallet. One legacy account can only be synced to one Athena account.');
      }

      // 2. USER CHECK: Check if the CURRENT user has already migrated a DIFFERENT legacy account
      if (legacyUid && legacyUid !== currentLegacyUid) {
        throw new Error('Security Alert: This Athena wallet is already linked to a different legacy account. You must use the same legacy account you previously registered.');
      }
      // ---------------------------

      // 2. Fetch balances from Firebase Cloud Firestore
      console.log('Fetching from Firestore collections: users and wallets for UID:', currentLegacyUid);
      
      const userDocRef = doc(legacyDb, "users", currentLegacyUid);
      const walletDocRef = doc(legacyDb, "wallets", currentLegacyUid);

      const [userSnap, walletSnap] = await Promise.all([
        getDoc(userDocRef),
        getDoc(walletDocRef)
      ]);

      const userData = userSnap.exists() ? userSnap.data() : {};
      const walletData = walletSnap.exists() ? walletSnap.data() : {};

      // --- LEGACY LOCK (FIREBASE SIDE) ---
      // This prevents the same legacy account from being used by multiple Athena accounts
      // even if Supabase RLS prevents us from checking other profiles.
      if (userData.athena_uid && userData.athena_uid !== user.id) {
        throw new Error('This legacy account is already linked to another Athena wallet. One legacy account can only be synced to one Athena account.');
      }

      // Mark this legacy account as linked to this Athena user
      try {
        await updateDoc(userDocRef, { athena_uid: user.id });
      } catch (err) {
        console.warn('Could not write lock to legacy DB, but proceeding if user owns it:', err);
      }
      // -----------------------------------

      console.log('Users collection data:', userData);
      console.log('Wallets collection data:', walletData);

      // Combine balances from both documents
      // Map Firestore field names to symbols
      const legacyBalances: Record<string, number> = {};

      // From users collection: ONLY gldBalance
      if (userData.gldBalance !== undefined) legacyBalances['GLD'] = Number(userData.gldBalance);

      // From wallets collection: ALL OTHER BALANCES
      if (walletData.piBalance !== undefined) legacyBalances['Pi'] = Number(walletData.piBalance);
      if (walletData.usdtBalance !== undefined) legacyBalances['USDT'] = Number(walletData.usdtBalance);
      if (walletData.bnbBalance !== undefined) legacyBalances['BNB'] = Number(walletData.bnbBalance);
      if (walletData.btcBalance !== undefined) legacyBalances['BTC'] = Number(walletData.btcBalance);
      if (walletData.dogeBalance !== undefined) legacyBalances['DOGE'] = Number(walletData.dogeBalance);
      if (walletData.ethBalance !== undefined) legacyBalances['ETH'] = Number(walletData.ethBalance);
      if (walletData.pepeBalance !== undefined) legacyBalances['PEPE'] = Number(walletData.pepeBalance);
      if (walletData.shibBalance !== undefined) legacyBalances['SHIB'] = Number(walletData.shibBalance);
      if (walletData.solBalance !== undefined) legacyBalances['SOL'] = Number(walletData.solBalance);
      if (walletData.tonBalance !== undefined) legacyBalances['TON'] = Number(walletData.tonBalance);
      if (walletData.wifBalance !== undefined) legacyBalances['WIF'] = Number(walletData.wifBalance);
      if (walletData.xrpBalance !== undefined) legacyBalances['XRP'] = Number(walletData.xrpBalance);

      if (Object.keys(legacyBalances).length === 0) {
        throw new Error('No legacy assets found for this account in Firestore.');
      }

      console.log('Final Legacy Balances to migrate:');
      console.table(legacyBalances);

      // 3. Migrate data to Supabase
      const balanceEntries = Object.entries(legacyBalances)
        .filter(([_, balance]) => !isNaN(balance))
        .map(([symbol, balance]) => ({
          user_id: user.id,
          coin_symbol: symbol,
          amount: balance
        }));

      if (balanceEntries.length === 0) {
        throw new Error('No valid numeric balances found to migrate.');
      }

      const { error: balanceError } = await supabase
        .from('user_balances')
        .upsert(balanceEntries, { onConflict: 'user_id,coin_symbol' });

      if (balanceError) throw balanceError;

      // 4. Update profile status and lock legacy_uid
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          legacy_uid: currentLegacyUid
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Critical Profile Update Error:', profileError);
        throw new Error(`Failed to link legacy account: ${profileError.message}`);
      }

      // 5. Success!
      setUserAssets(legacyBalances as Record<string, number>);
      setMigrationStatus(false);
      setLegacyUid(currentLegacyUid);
      setMigrationMessage({ type: 'success', text: 'Success! All assets migrated to Athena Chain' });
      
      // Close modal
      setTimeout(() => {
        setShowMigrationModal(false);
        setMigrationMessage(null);
      }, 1500);
    })();

    try {
      await Promise.race([migrationPromise, timeoutPromise]);
    } catch (error: any) {
      console.error('Migration error details:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      
      let errorMessage = error.message;
      
      // Handle Firebase Auth errors more robustly
      const isAuthError = 
        error.code?.includes('auth/') || 
        error.message?.includes('auth/') ||
        error.message?.toLowerCase().includes('credential') ||
        error.message?.toLowerCase().includes('password') ||
        error.message?.toLowerCase().includes('user-not-found') ||
        error.message?.toLowerCase().includes('invalid-email');

      if (isAuthError) {
        errorMessage = 'Invalid V1 credentials. Please double-check your legacy email and password. Ensure you are using the exact account from the previous app.';
      } else if (errorMessage.includes('unique constraint') || errorMessage.includes('23505') || errorMessage.includes('already linked')) {
        errorMessage = 'This legacy account is already linked to another Athena wallet. One legacy account can only be synced to one Athena account.';
      }
      
      setMigrationMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  if (!user || authMode === 'update-password') {
    return (
      <div className="min-h-screen bg-[#0b0e14] text-white max-w-md mx-auto relative overflow-hidden flex flex-col items-center justify-center px-8">
        <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[40%] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center gap-8"
        >
          <div className="flex flex-col items-center gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full border-2 border-gold/20 flex items-center justify-center relative"
            >
              <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
              <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center text-black shadow-2xl shadow-gold/40 overflow-hidden">
                <img 
                  src="https://ik.imagekit.io/7e0zp2ext/GLD.png?updatedAt=1772483693392" 
                  alt="Athena Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gold-gradient">Athena Chain</h1>
              <p className="text-gray-400 text-sm mt-2">The Future of Digital Gold</p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="w-full glass rounded-3xl p-6 flex flex-col gap-4 border-white/5">
            <h2 className="text-xl font-bold text-center mb-2">
              {authMode === 'login' ? 'Welcome Back' : 
               authMode === 'signup' ? 'Create Account' : 
               authMode === 'forgot-password' ? 'Reset Password' : 'New Password'}
            </h2>
            
            {authMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium text-center ${
                authMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {authMessage.text}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {authMode !== 'update-password' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              )}
              {authMode === 'update-password' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              )}
              {authMode !== 'forgot-password' && authMode !== 'update-password' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              )}
              {authMode === 'signup' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Referral Code (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="ATH-XXXX"
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              )}
              {authMode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => {
                    console.log('Forgot password clicked');
                    setAuthMode('forgot-password');
                    setAuthMessage(null);
                  }}
                  className="text-gold text-xs font-medium self-end hover:brightness-110 transition-all py-1 px-2 -mr-2 relative z-20 cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gold-gradient text-black font-extrabold py-4 rounded-xl gold-glow hover:brightness-110 active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                authMode === 'login' ? 'SIGN IN' : 
                authMode === 'signup' ? 'CREATE ACCOUNT' : 
                authMode === 'forgot-password' ? 'SEND RESET LINK' : 'UPDATE PASSWORD'
              )}
            </button>

            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span className="text-[10px] text-gray-500 font-bold uppercase">OR</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            <button type="button" className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale brightness-200" alt="Google" />
              Continue with Google
            </button>

            <p className="text-center text-xs text-gray-500 mt-2">
              {(authMode === 'forgot-password' || authMode === 'update-password') ? (
                <button 
                  type="button"
                  onClick={() => {
                    if (authMode === 'update-password') {
                      supabase.auth.signOut();
                    }
                    setAuthMode('login');
                    setAuthMessage(null);
                  }}
                  className="text-gold font-bold hover:underline py-2 px-4 cursor-pointer relative z-20"
                >
                  Back to Login
                </button>
              ) : (
                <>
                  {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthMessage(null);
                    }}
                    className="text-gold font-bold hover:underline py-2 px-4 cursor-pointer relative z-20"
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Login'}
                  </button>
                </>
              )}
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  const handleClaimMining = async (amount: number) => {
    if (!user) return;

    try {
      // 1. Get current GLD balance
      const currentGld = userAssets['GLD'] || 0;
      const newGld = currentGld + amount;

      // 2. Update Supabase: Balance and Reset Mining Time
      const [balanceRes, profileRes] = await Promise.all([
        supabase
          .from('user_balances')
          .upsert({ 
            user_id: user.id, 
            coin_symbol: 'GLD', 
            amount: newGld 
          }, { onConflict: 'user_id,coin_symbol' }),
        supabase
          .from('profiles')
          .update({ last_mining_time: null })
          .eq('id', user.id)
      ]);

      if (balanceRes.error) throw balanceRes.error;
      if (profileRes.error) throw profileRes.error;

      // 3. Update local state
      setUserAssets(prev => ({
        ...prev,
        'GLD': newGld
      }));
      setLastMiningTime(null);
    } catch (err) {
      console.error('Error claiming mining reward:', err);
    }
  };

  const handleStartMining = () => {
    if (!user) return;
    
    const adUrl = "https://www.profitablecpmratenetwork.com/iefjy68tq?key=8a88eabcfabfca1a7fadd4a9fb46a455";
    setAdClickTime(Date.now());
    setIsWaitingForAd(true);
    setMiningMessage({ type: 'success', text: 'Opening ad... Please watch for 4 seconds to start mining.' });
    
    window.open(adUrl, '_blank');
  };

  const executeStartMining = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ last_mining_time: now })
        .eq('id', user.id);
      
      if (error) throw error;
      setLastMiningTime(now);
    } catch (err) {
      console.error('Error starting mining:', err);
    }
  };

  const handleCompleteTask = async (taskId: number, reward: number) => {
    if (!user || completedTasks.includes(taskId)) return;

    try {
      const newCompletedTasks = [...completedTasks, taskId];
      const currentGld = userAssets['GLD'] || 0;
      const newGld = currentGld + reward;

      // Update Supabase: Tasks, Balance
      const [profileRes, balanceRes] = await Promise.all([
        supabase
          .from('profiles')
          .update({ completed_tasks: newCompletedTasks })
          .eq('id', user.id),
        supabase
          .from('user_balances')
          .upsert({ 
            user_id: user.id, 
            coin_symbol: 'GLD', 
            amount: newGld 
          }, { onConflict: 'user_id,coin_symbol' })
      ]);

      if (profileRes.error) throw profileRes.error;
      if (balanceRes.error) throw balanceRes.error;

      // Update local state
      setCompletedTasks(newCompletedTasks);
      setUserAssets(prev => ({
        ...prev,
        'GLD': newGld
      }));
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': 
        return (
          <Dashboard 
            onViewAll={() => setShowMarketView(true)} 
            onClaim={handleClaimMining} 
            lastMiningTime={lastMiningTime}
            onStartMining={handleStartMining}
            deferredPrompt={deferredPrompt}
            onInstall={handleInstall}
            miningMessage={miningMessage}
          />
        );
      case 'wallet': 
        return (
          <WalletTab 
            migrationStatus={migrationStatus} 
            onMainSync={handleMainSync}
            onExtraSync={handleExtraSync} 
            userAssets={userAssets} 
            marketPrices={marketPrices} 
          />
        );
      case 'tasks': 
        return (
          <TasksTab 
            completedTasks={completedTasks} 
            onCompleteTask={handleCompleteTask} 
          />
        );
      case 'mainnet': return <MainnetTab />;
      case 'more': return <MoreTab userId={user?.id || ''} onBalanceUpdate={loadUserData} />;
      default: 
        return (
          <Dashboard 
            onViewAll={() => setShowMarketView(true)} 
            onClaim={handleClaimMining} 
            lastMiningTime={lastMiningTime}
            onStartMining={handleStartMining}
            deferredPrompt={deferredPrompt}
            onInstall={handleInstall}
            miningMessage={miningMessage}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white max-w-md mx-auto relative overflow-hidden flex flex-col">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[40%] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Profile Circle (Top Left) */}
      <div className="absolute top-8 left-5 z-50">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden relative group">
          <div className="absolute inset-0 bg-gold/5 animate-pulse" />
          <Icon name="users" className="w-5 h-5 text-gold/70" />
        </div>
      </div>

      {/* Logout Button (Top Right) */}
      <div className="absolute top-8 right-5 z-50">
        <button 
          onClick={handleLogout}
          className="bg-white/5 border border-white/10 p-2 rounded-xl hover:bg-white/10 transition-all group"
        >
          <Icon name="x" className="w-5 h-5 text-gray-500 group-hover:text-gold" />
        </button>
      </div>

      <main className="flex-1 px-5 pt-8 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Market View Modal */}
      <AnimatePresence>
        {showMarketView && (
          <MarketView onClose={() => setShowMarketView(false)} />
        )}
      </AnimatePresence>

      {/* Migration Modal */}
      <AnimatePresence>
        {showMigrationModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMigrationModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass w-full rounded-3xl p-8 flex flex-col gap-6 relative z-10 border-gold/30 gold-glow"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center text-gold">
                  {isMigrating ? <Loader2 className="w-8 h-8 animate-spin" /> : <RefreshCw className="w-8 h-8 animate-spin-slow" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gold">Bridge to Athena</h3>
                  <p className="text-gray-400 text-sm mt-1">Verify your V1 Account to migrate your GLD, Pi, and other assets.</p>
                </div>
              </div>

              {migrationMessage && (
                <div className={`p-4 rounded-xl text-sm font-medium text-center ${
                  migrationMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {migrationMessage.text}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {isExtraSync ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Legacy ID</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-gold/70 font-mono truncate">
                      {legacyUid}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">V1 Email</label>
                    <input 
                      type="email" 
                      value={legacyEmail}
                      onChange={(e) => setLegacyEmail(e.target.value)}
                      placeholder="V1 Email Address"
                      disabled={isMigrating}
                      className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">V1 Password</label>
                  <input 
                    type="password" 
                    value={legacyPassword}
                    onChange={(e) => setLegacyPassword(e.target.value)}
                    placeholder="V1 Password"
                    disabled={isMigrating}
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowMigrationModal(false)}
                  disabled={isMigrating}
                  className="flex-1 bg-white/5 text-gray-400 font-bold py-3 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmMigration}
                  disabled={isMigrating}
                  className="flex-2 bg-gold-gradient text-black font-extrabold py-3 rounded-xl gold-glow hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {isMigrating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> SYNCING...</>
                  ) : (
                    'VERIFY & SYNC'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass border-t border-white/5 px-4 py-3 flex items-center justify-between z-50">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<Icon name="layout-dashboard" className="w-6 h-6" />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'wallet'} 
          onClick={() => setActiveTab('wallet')} 
          icon={<Icon name="wallet" className="w-6 h-6" />} 
          label="Wallet" 
        />
        <NavButton 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')} 
          icon={<Icon name="check-square" className="w-6 h-6" />} 
          label="Tasks" 
        />
        <NavButton 
          active={activeTab === 'mainnet'} 
          onClick={() => setActiveTab('mainnet')} 
          icon={<Icon name="rocket" className="w-6 h-6" />} 
          label="Mainnet" 
        />
        <NavButton 
          active={activeTab === 'more'} 
          onClick={() => setActiveTab('more')} 
          icon={<Icon name="more-horizontal" className="w-6 h-6" />} 
          label="More" 
        />
      </nav>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

const NavButton = ({ active, onClick, icon, label }: NavButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-gold' : 'text-gray-500'}`}
  >
    <div className={`p-1 rounded-xl transition-all ${active ? 'bg-gold/10' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="w-1 h-1 bg-gold rounded-full"
      />
    )}
  </button>
);
