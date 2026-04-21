/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
  User as UserIcon,
  Settings,
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
  PlayCircle,
  GraduationCap,
  History,
  CheckCircle2,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Gem,
  Flame,
  Star,
  Heart,
  Moon,
  Mountain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { legacyAuth, legacyDb } from './lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import SpinWheel from './components/SpinWheel';
import SlotsGame from './components/SlotsGame';
import SnakeGame from './components/SnakeGame';

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
    'video': Video,
    'gem': Gem,
    'flame': Flame,
    'star': Star,
    'heart': Heart,
    'moon': Moon,
    'mountain': Mountain
  };

  const LucideIcon = iconMap[name];
  if (LucideIcon) {
    return <LucideIcon className={className} />;
  }

  // Fallback for CDN version
  return <i data-lucide={name} className={className}></i>;
};

// --- Types ---
type Tab = 'dashboard' | 'wallet' | 'tasks' | 'mainnet' | 'more' | 'profile' | 'academy' | 'settings' | 'referral';

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
    link: 'https://vt.tiktok.com/ZS9er85gm/',
    frequency: 'Every 5 days',
    requiredCode: 'golden dream'
  },
  { 
    id: 6, 
    title: 'Watch YouTube Short', 
    reward: 0.1, 
    icon: <Icon name="youtube" className="w-5 h-5" />, 
    link: 'https://youtube.com/shorts/Vl9HvxA7QlE?si=BVbNkmid43ShhqbN',
    frequency: 'Every 5 days',
    requiredCode: 'enter the system'
  },
  { 
    id: 7, 
    title: 'Watch Instagram Reel', 
    reward: 0.1, 
    icon: <Icon name="instagram" className="w-5 h-5" />, 
    link: 'https://www.instagram.com/reel/DXY-BF_jWrD/?igsh=MXhqZGZydHB4aGsxYw==',
    frequency: 'Every 5 days',
    requiredCode: 'feel the sun'
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
  miningMessage,
  onProfileClick,
  activeReferralsCount
}: { 
  onViewAll: () => void, 
  onClaim: (amount: number) => void,
  lastMiningTime: string | null,
  onStartMining: () => void,
  deferredPrompt: any,
  onInstall: () => void,
  miningMessage: { type: 'success' | 'error', text: string } | null,
  onProfileClick: () => void,
  activeReferralsCount: number
}) => {
  const { t } = useTranslation();
  const [minedAmount, setMinedAmount] = useState(0);
  const [marketData, setMarketData] = useState<MarketCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const BASE_MINING_RATE = 0.02 / 3600;
  const referralBonusMultiplier = 1 + (activeReferralsCount * 0.05);
  const MINING_RATE_PER_SECOND = BASE_MINING_RATE * referralBonusMultiplier;
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
          <div className="flex items-center gap-3">
            <div 
              onClick={onProfileClick}
              className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gold/20 transition-all shadow-lg shadow-gold/5"
            >
              <Icon name="users" className="w-5 h-5 text-gold" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gold-gradient">{t('common.athenaChain')}</h1>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest">{t('dashboard.pioneerNode') || 'Pioneer Node'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
            <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gold uppercase">Live</span>
          </div>
        </div>
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
              <p className="text-sm font-bold text-white">{t('dashboard.installApp') || 'Install Athena App'}</p>
              <p className="text-[10px] text-gray-400">{t('dashboard.installDesc') || 'Add to home screen for quick access'}</p>
            </div>
          </div>
          <button 
            onClick={onInstall}
            className="bg-gold text-black font-bold text-xs px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all"
          >
            {t('dashboard.install') || 'Install'}
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
            {isFinished ? (t('dashboard.sessionComplete') || 'Session Complete') : (t('dashboard.currentSession') || 'Current Session Earnings')}
          </p>
          <h2 className="text-4xl font-mono font-bold text-gold">{minedAmount.toFixed(6)} GLD</h2>
          {isMining && timeLeft !== null && (
            <p className="text-gray-500 text-[10px] mt-1 font-mono uppercase tracking-tighter">
              {t('dashboard.timeRemaining') || 'Time Remaining'}: {formatTime(timeLeft)}
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
              if (isFinished) handleClaim();
              else if (!isMining) onStartMining();
            }}
            disabled={isMining}
            className={`w-44 h-44 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all duration-500 ripple ${
              isMining 
              ? 'border-gold bg-gold/10 gold-glow' 
              : isFinished
              ? 'border-green-500 bg-green-500/10 gold-glow'
              : 'border-gray-700 bg-gray-800/50 hover:border-gold/50'
            }`}
          >
            <Zap className={`w-14 h-14 ${isMining ? 'text-gold fill-gold animate-pulse' : isFinished ? 'text-green-500 fill-green-500 gold-glow' : 'text-gray-500'}`} />
            <span className={`font-bold text-sm tracking-widest ${isMining ? 'text-gold' : isFinished ? 'text-green-500' : 'text-gray-500'}`}>
              {isMining ? (t('dashboard.mining_active') || 'MINING...') : isFinished ? (t('dashboard.finished') || 'FINISHED') : (t('dashboard.startMining') || 'START MINING')}
            </span>
          </motion.button>

          {(minedAmount > 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleClaim}
              className="bg-gold-gradient text-black font-extrabold px-8 py-2 rounded-full gold-glow hover:brightness-110 active:scale-95 transition-all text-sm"
            >
              {t('dashboard.claimReward') || 'CLAIM REWARD'}
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
  const { t } = useTranslation();
  // Use marketPrices if available, otherwise fallback to MOCK_COINS or 0
  const totalBalance = Object.entries(userAssets).reduce((acc, [symbol, balance]) => {
    const upperSymbol = symbol.toUpperCase();
    const price = marketPrices[upperSymbol] || MOCK_COINS.find(c => c.symbol === upperSymbol)?.price || 0;
    return acc + (balance * price);
  }, 0);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gold-gradient">{t('wallet.portfolio') || 'Portfolio'}</h1>
          <p className="text-gray-400 text-sm">{t('wallet.portfolioDesc') || 'Manage your global assets'}</p>
        </div>
        <button 
          onClick={onExtraSync}
          className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/20 transition-all shadow-lg shadow-gold/5"
          title="Extra Sync"
        >
          <Icon name="refresh-cw" className="w-5 h-5" />
        </button>
      </header>

      {/* Migration Card */}
      <div className={`glass rounded-3xl p-5 border-gold/40 bg-gradient-to-r from-gold/10 to-transparent relative overflow-hidden transition-all duration-500 ${migrationStatus ? 'gold-glow' : 'opacity-80'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${migrationStatus ? 'bg-gold/20 text-gold' : 'bg-green-500/20 text-green-400'}`}>
            {migrationStatus ? <Icon name="refresh-cw" className="w-6 h-6 animate-spin-slow" /> : <Icon name="check-square" className="w-6 h-6" />}
          </div>
          <div>
            <h4 className={`font-bold ${migrationStatus ? 'text-gold' : 'text-green-400'}`}>
              {migrationStatus ? (t('wallet.migrationDetected') || 'Migration detected') : (t('wallet.walletVerified') || 'Wallet Verified')}
            </h4>
            <p className="text-gray-400 text-xs">
              {migrationStatus ? (t('wallet.migrationFound') || 'Digital Gold V1 assets found') : (t('wallet.legacySynced') || 'Legacy assets successfully synced')}
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
          {migrationStatus ? <><Icon name="refresh-cw" className="w-5 h-5" /> {t('wallet.syncLegacy') || 'Sync Legacy Assets'}</> : (t('wallet.walletVerified') || 'Wallet Verified')}
        </button>
      </div>

      {/* Portfolio Card */}
      <div className="glass rounded-3xl p-6 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col gap-1 mb-1">
          <p className="text-gray-400 text-xs uppercase tracking-widest">{t('dashboard.balance') || 'Total Estimated Balance'}</p>
          <p className="text-[10px] text-gold/60 font-medium italic">* {t('wallet.realTimeDisclaimer') || 'Real-time market prices (GLD fixed until listing)'}</p>
        </div>
        <h2 className="text-3xl font-bold mb-6">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
        
        <div className="flex gap-3">
          <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/5">
            <Icon name="arrow-up-right" className="w-4 h-4" /> {t('wallet.send')}
          </button>
          <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/5">
            <Icon name="arrow-down-left" className="w-4 h-4" /> {t('wallet.receive')}
          </button>
        </div>
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
                      <span className="font-mono font-bold text-sm">
                        {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {(() => {
                          const upperSymbol = symbol.toUpperCase();
                          if (upperSymbol === 'PI') return 'Soon';
                          const price = marketPrices[upperSymbol] || MOCK_COINS.find(c => c.symbol === upperSymbol)?.price || 0;
                          return `$${(balance * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const { t } = useTranslation();
  const [taskCodes, setTaskCodes] = useState<Record<number, string>>({});
  const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});
  const [visitedTasks, setVisitedTasks] = useState<number[]>([]);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  const handleVerify = async (task: any) => {
    const inputCode = taskCodes[task.id]?.trim().toLowerCase();
    const requiredCode = task.requiredCode?.trim().toLowerCase();

    if (inputCode === requiredCode) {
      setCompletingTaskId(task.id);
      await onCompleteTask(task.id, task.reward);
      setCompletingTaskId(null);
      setErrorMessages(prev => ({ ...prev, [task.id]: '' }));
    } else {
      setErrorMessages(prev => ({ ...prev, [task.id]: 'Invalid code. Please try again.' }));
    }
  };

  const handleGo = (task: any) => {
    window.open(task.link, '_blank');
    if (!visitedTasks.includes(task.id)) {
      setVisitedTasks(prev => [...prev, task.id]);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">{t('tasks.title') || 'Tasks & Rewards'}</h1>
        <p className="text-gray-400 text-sm">{t('tasks.description') || 'Earn GLD by supporting the network'}</p>
      </header>

      <div className="flex flex-col gap-3">
        {TASKS.map((task) => {
          const isCompleted = completedTasks.includes(task.id);
          const needsCode = !!task.requiredCode;
          const isVisited = visitedTasks.includes(task.id);

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
                  <div className="flex gap-2">
                    {!needsCode && isVisited && (
                      <button 
                        onClick={async () => {
                          setCompletingTaskId(task.id);
                          await onCompleteTask(task.id, task.reward);
                          setCompletingTaskId(null);
                        }}
                        disabled={completingTaskId === task.id}
                        className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {completingTaskId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Check'}
                      </button>
                    )}
                    <button 
                      onClick={() => handleGo(task)}
                      className={`${!needsCode && isVisited ? 'bg-white/5 text-gray-400' : 'bg-gold/10 text-gold group-hover:bg-gold group-hover:text-black'} px-4 py-2 rounded-lg text-sm font-bold transition-all`}
                    >
                      {needsCode ? 'Go' : (isVisited ? 'Re-visit' : 'Go')}
                    </button>
                  </div>
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
                      disabled={completingTaskId === task.id}
                      className="bg-gold-gradient text-black font-bold px-6 py-2 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {completingTaskId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
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
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gold-gradient">{t('mainnet.title') || 'Mainnet Roadmap'}</h1>
        <p className="text-gray-400 text-sm">{t('mainnet.description') || 'Track the Athena Chain launch phases'}</p>
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

const SettingsPage = ({ 
  user,
  onBack,
  onLogout
}: { 
  user: User;
  onBack: () => void;
  onLogout: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const [showLanguage, setShowLanguage] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ru', name: 'Русский' },
    { code: 'es', name: 'Español' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' },
    { code: 'ja', name: '日本語' },
    { code: 'th', name: 'ไทย' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'fa', name: 'فارسی' },
    { code: 'ar', name: 'العربية' }
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setShowLanguage(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setProcessing(true);
    try {
      // 1. Re-authenticate in background
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: oldPassword,
      });

      if (loginError) throw new Error('Incorrect old password');

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    
    setProcessing(true);
    try {
      // Soft delete: Mark profile as deleted and logout
      const { error } = await supabase
        .from('profiles')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      
      onLogout();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const triggerForgotPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Reset link sent to your email' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400">
          <Icon name="chevron-left" className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gold-gradient">{t('settings.title')}</h1>
          <p className="text-gray-400 text-sm">App preferences & security</p>
        </div>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-bold text-center ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
        {/* Language Selection */}
        <div className="glass rounded-3xl overflow-hidden border-white/5">
          <button 
            onClick={() => setShowLanguage(!showLanguage)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <Icon name="search" className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white">{t('settings.language')}</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {languages.find(l => l.code === i18n.language.split('-')[0])?.name || 'English'}
                </p>
              </div>
            </div>
            <Icon name="chevron-right" className={`w-5 h-5 text-gray-500 transition-transform ${showLanguage ? 'rotate-90' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showLanguage && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden bg-white/5"
              >
                <div className="grid grid-cols-2 p-4 gap-2 border-t border-white/5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all ${
                        i18n.language.startsWith(lang.code) 
                          ? 'bg-gold text-black' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Change Password */}
        <div className="glass rounded-3xl overflow-hidden border-white/5">
          <button 
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                <Icon name="lock" className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white">{t('settings.changePassword')}</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Update your login security</p>
              </div>
            </div>
            <Icon name="chevron-right" className={`w-5 h-5 text-gray-500 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden bg-white/5"
              >
                <form onSubmit={handleUpdatePassword} className="p-6 flex flex-col gap-4 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{t('settings.oldPassword')}</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{t('settings.newPassword')}</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{t('settings.confirmPassword')}</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <button 
                      type="button"
                      onClick={triggerForgotPassword}
                      className="text-gold text-xs font-bold hover:underline"
                    >
                      {t('settings.forgotPassword')}
                    </button>
                    <button 
                      type="submit"
                      disabled={processing}
                      className="bg-gold text-black px-6 py-2.5 rounded-xl font-bold text-xs gold-glow disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin font-bold" /> : t('common.confirm')}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete Account */}
        <div className="glass rounded-3xl overflow-hidden border-red-500/10 bg-red-500/5">
          <button 
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            className="w-full p-6 flex items-center justify-between hover:bg-red-500/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                <Icon name="x" className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-red-500">{t('settings.deleteAccount')}</h3>
                <p className="text-[10px] text-red-500/50 uppercase tracking-widest">Remove all data permanently</p>
              </div>
            </div>
            <Icon name="chevron-right" className={`w-5 h-5 text-red-500/30 transition-transform ${showDeleteConfirm ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 flex flex-col gap-4 border-t border-red-500/20">
                  <p className="text-xs text-red-400 font-medium leading-relaxed">
                    {t('settings.deleteWarning')} All your coins, balances, and history will be lost forever.
                  </p>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-bold text-red-500/50">{t('settings.deleteConfirmText')}</label>
                    <input 
                      type="text" 
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value.toUpperCase())}
                      placeholder="DELETE"
                      className="bg-red-500/10 border border-red-500/30 rounded-xl py-3 px-4 text-sm text-red-500 placeholder:text-red-500/30 focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={deleteText !== 'DELETE' || processing}
                    className="w-full bg-red-500 text-white font-black py-4 rounded-xl text-xs hover:bg-red-600 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : t('settings.deleteButton')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = ({ 
  user,
  username,
  kycData,
  streakCount,
  lastStreakDate,
  lastMiningTime,
  onUpdateUsername,
  onUpdateProfileInfo,
  onClaimStrike,
  onBack
}: { 
  user: User;
  username: string | null;
  kycData: { status: string; realName: string | null; phone: string | null; date: string | null } | null;
  streakCount: number;
  lastStreakDate: string | null;
  lastMiningTime: string | null;
  onUpdateUsername: (newUsername: string) => Promise<{ success: boolean; message: string }>;
  onUpdateProfileInfo: (realName: string, phone: string) => Promise<{ success: boolean; message: string }>;
  onClaimStrike: () => Promise<{ success: boolean; message: string; reward?: number; streakDay?: number }>;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username || '');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [strikeProcessing, setStrikeProcessing] = useState(false);

  const handleSave = async () => {
    if (!newUsername.match(/^[a-zA-Z0-9]+$/)) {
      setMessage({ type: 'error', text: 'Username must contain only letters and numbers' });
      return;
    }
    setProcessing(true);
    const result = await onUpdateUsername(newUsername);
    setProcessing(false);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) setEditing(false);
  };

  const handleSaveManualInfo = async () => {
    if (!manualName.trim() || !manualPhone.trim()) {
      setMessage({ type: 'error', text: 'Please enter both your name and phone number' });
      return;
    }
    setProfileSaving(true);
    const result = await onUpdateProfileInfo(manualName.trim(), manualPhone.trim());
    setProfileSaving(false);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
  };

  const handleStrike = async () => {
    setStrikeProcessing(true);
    const result = await onClaimStrike();
    setStrikeProcessing(false);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
  };

  const isMinedToday = () => {
    if (!lastMiningTime) return false;
    const miningDate = new Date(lastMiningTime).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return miningDate === today;
  };

  const hasClaimedToday = () => {
    if (!lastStreakDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return lastStreakDate === today;
  };

  const nextReward = (day: number) => {
    const rewards = [0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 1.00];
    return rewards[day] || 0.01;
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400">
          <Icon name="chevron-left" className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gold-gradient">{t('common.profile')}</h1>
          <p className="text-gray-400 text-sm">{t('profile.subtitle') || 'Personal details & Security'}</p>
        </div>
      </header>

      <div className="glass rounded-3xl p-6 flex flex-col gap-6 border-white/5">
        {/* Username Section */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">{t('profile.username') || 'Username'}</label>
          {editing ? (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                placeholder="e.g. Vladimir22"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                autoFocus
              />
              <button 
                onClick={handleSave}
                disabled={processing}
                className="bg-gold text-black px-4 rounded-xl font-bold text-xs disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl py-3 px-4">
              <span className="text-sm font-medium text-white">{username || (t('profile.notSet') || 'Not set')}</span>
              {!username && (
                <button 
                  onClick={() => setEditing(true)}
                  className="text-gold text-xs font-bold hover:underline"
                >
                  {t('profile.setUsername') || 'Set Unique Username'}
                </button>
              )}
            </div>
          )}
          {message && (
            <p className={`text-[10px] font-medium ml-1 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* User Stats Card */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">{t('profile.email') || 'Email Address'}</span>
            <span className="text-sm font-medium text-white truncate">{user.email}</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">{t('kyc.realName')}</span>
            {kycData?.realName ? (
              <span className="text-sm font-medium text-white">{kycData.realName}</span>
            ) : (
              <input 
                type="text"
                placeholder="Full Name (for KYC)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-white focus:outline-none placeholder:text-gray-600"
              />
            )}
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">{t('kyc.phone')}</span>
            {kycData?.phone ? (
              <span className="text-sm font-medium text-white">{kycData.phone}</span>
            ) : (
              <input 
                type="tel"
                placeholder="+249... or email"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-white focus:outline-none placeholder:text-gray-600"
              />
            )}
          </div>

          {/* Save Profile Info Button (if missing) */}
          {(!kycData?.realName || !kycData?.phone) && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[9px] text-red-400 font-medium leading-relaxed">
                  <span className="font-bold">⚠️ IMPORTANT:</span> This information cannot be changed once saved. Ensure it exactly matches your official identification document. Your next KYC must match these details to pass.
                </p>
              </div>
              <button
                onClick={handleSaveManualInfo}
                disabled={profileSaving || !manualName.trim() || !manualPhone.trim()}
                className="w-full py-3 rounded-xl bg-gold text-black font-bold text-xs gold-glow transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'SAVE & LOCK INFORMATION'}
              </button>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">{t('kyc.status') || 'KYC Status'}</span>
              <span className={`text-sm font-bold uppercase ${kycData?.status === 'verified' ? 'text-green-500' : 'text-gold'}`}>
                {kycData?.status ? t(`kyc.${kycData.status}`) : t('kyc.pending')}
              </span>
            </div>
            {kycData?.status === 'verified' && <Icon name="shield-check" className="w-6 h-6 text-green-500" />}
          </div>
        </div>

        {/* Weekly Strike Section */}
        <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gold uppercase font-bold tracking-wider">Weekly Strike</span>
              <span className="text-xs font-bold text-white">Day {streakCount} of 7</span>
            </div>
            <div className="px-3 py-1 bg-gold/20 rounded-lg border border-gold/30">
              <span className="text-[10px] font-bold text-gold uppercase">Streak: {streakCount}</span>
            </div>
          </div>

          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div 
                key={day}
                className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                  day <= streakCount 
                    ? 'bg-gold/20 border-gold/40 text-gold' 
                    : 'bg-white/5 border-white/10 text-gray-500'
                }`}
              >
                <span className="text-[8px] font-black uppercase">D{day}</span>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${day <= streakCount ? 'bg-gold text-black' : 'bg-white/10'}`}>
                  {day <= streakCount ? <Icon name="check" className="w-3 h-3 stroke-[4]" /> : <Icon name="zap" className="w-3 h-3" />}
                </div>
                <span className="text-[8px] font-bold">+{nextReward(day - 1)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleStrike}
            disabled={strikeProcessing || hasClaimedToday() || !isMinedToday()}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              hasClaimedToday()
                ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                : !isMinedToday()
                ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                : 'bg-gold text-black gold-glow active:scale-[0.98]'
            }`}
          >
            {strikeProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasClaimedToday() ? (
              <><Icon name="check-circle" className="w-4 h-4" /> Claimed Today</>
            ) : !isMinedToday() ? (
              'Start Mining First'
            ) : (
              `Claim Day ${streakCount + 1 === 8 ? 1 : streakCount + 1} Strike`
            )}
          </button>
          
          {!isMinedToday() && !hasClaimedToday() && (
            <p className="text-[8px] text-gray-500 text-center italic">
              * Strike only activates if you have started mining today.
            </p>
          )}
        </div>
      </div>

      {/* Account Integrity Section */}
      <div className="glass rounded-3xl p-6 border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Icon name="shield-check" className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('profile.accountIntegrity') || 'Account Integrity'}</h3>
              <p className="text-[10px] text-gray-400">{t('profile.securityAnalysis') || 'Security & Trust Analysis'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-[10px] font-bold text-blue-400 uppercase">{t('profile.checking') || 'Checking'}</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[10px] text-gray-400 leading-relaxed italic text-center">
            {t('profile.integrityDesc') || '"We are currently verifying your account history to ensure compliance with our security protocols. This process is automatic."'}
          </p>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-3 group opacity-80">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-gold transition-colors">
            <Icon name="video" className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">{t('common.liveVideo') || 'Live Video'}</h4>
            <span className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 uppercase font-bold tracking-tighter">{t('common.comingSoon')}</span>
          </div>
        </div>
        
        <div className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-3 group opacity-80">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-gold transition-colors">
            <Icon name="users" className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">{t('common.referrals') || 'Referrals'}</h4>
            <span className="text-[8px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 uppercase font-bold tracking-tighter">{t('common.comingSoon')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReferralPage = ({ 
  stats, 
  onBack,
  onGoToProfile,
  username
}: { 
  stats: any; 
  onBack: () => void;
  onGoToProfile: () => void;
  username: string | null;
}) => {
  const { t } = useTranslation();
  const [copyingCode, setCopyingCode] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [sharing, setSharing] = useState(false);

  const effectiveCode = stats?.referral_code || username;
  const hasUsername = effectiveCode && effectiveCode !== '';
  const referralLink = hasUsername ? `${window.location.origin}?ref=${effectiveCode}` : '';

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(effectiveCode || '');
    setCopyingCode(true);
    setTimeout(() => setCopyingCode(false), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(referralLink);
    setCopyingLink(true);
    setTimeout(() => setCopyingLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({
          title: 'Join Athena Chain',
          text: 'Join me on Athena Chain and get a welcome bonus!',
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
      setSharing(false);
    } else {
      handleCopyLink({ stopPropagation: () => {} } as any);
    }
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const calculateUserShare = (currentActive: number, globalActive: number, reward: number) => {
    if (globalActive === 0) return 0;
    return (currentActive / globalActive) * reward;
  };

  return (
    <div className="flex flex-col gap-6 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90">
          <Icon name="chevron-left" className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gold-gradient tracking-tight">{t('referral.title')}</h1>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-widest opacity-60">Invite friends • Earn together</p>
        </div>
      </header>

      {/* Primary Referral Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-gold/50 via-gold-dark/30 to-gold/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition-opacity duration-1000" />
        <div className="relative glass rounded-[2rem] p-8 border-white/10 flex flex-col gap-8 bg-[#0a0a0a]">
          {!hasUsername ? (
            <div className="py-6 flex flex-col gap-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gold/10 flex items-center justify-center text-gold mx-auto ring-1 ring-gold/20 shadow-2xl shadow-gold/20">
                <Icon name="user-check" className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-2 px-4">
                <h3 className="text-xl font-black text-white">{t('referral.setupRequired') || 'Referral Identity Required'}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                  {t('referral.setupDesc') || 'Please set a unique username in your Profile to activate your Referral Link and start earning.'}
                </p>
              </div>
              <button 
                onClick={onGoToProfile}
                className="w-full bg-gold text-black font-black py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-gold/30 flex items-center justify-center gap-3 text-sm uppercase tracking-wider"
              >
                <Icon name="user" className="w-5 h-5" />
                {t('referral.goToProfile') || 'Set Username Now'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Identity Section */}
              <div className="flex flex-col items-center gap-4 text-center">
                <span className="text-[10px] uppercase font-black text-gold/60 tracking-[0.2em]">{t('referral.referralCode')}</span>
                <div 
                  onClick={handleCopyCode}
                  className="flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-gold/5 hover:border-gold/30 transition-all active:scale-95 group/code shadow-inner"
                >
                  <div className="flex flex-col items-start gap-1 truncate">
                    <span className="text-3xl font-black text-white tracking-tight truncate">{effectiveCode}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover/code:text-gold transition-colors">
                      {copyingCode ? "Copied!" : (t('referral.copyCode') || 'Tap to copy code')}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl ml-auto transition-transform ${copyingCode ? 'bg-green-500/20 text-green-500' : 'bg-gold/10 text-gold group-hover/code:scale-110'}`}>
                    <Icon name={copyingCode ? "check" : "copy"} className="w-6 h-6" />
                  </div>
                </div>
                {copyingCode && (
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-black text-green-500 uppercase"
                  >
                    Code Copied!
                  </motion.span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleShare}
                  className="w-full bg-gradient-to-r from-gold via-gold-dark to-gold bg-[length:200%_auto] hover:bg-right text-black font-black py-5 rounded-2xl transition-all active:scale-[0.98] shadow-2xl shadow-gold/20 flex items-center justify-center gap-3 text-sm uppercase tracking-wider group/share"
                >
                  <Icon name="share-2" className="w-5 h-5 group-hover/share:rotate-12 transition-transform" />
                  {t('referral.inviteFriends') || 'Invite Friends Now'}
                </button>

                <div 
                  onClick={handleCopyLink}
                  className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group/link shadow-sm"
                >
                  <div className="flex flex-col gap-1 truncate">
                    <div className="flex items-center gap-2">
                       <Icon name="link" className="w-4 h-4 text-gold shrink-0" />
                       <span className="text-xs font-black text-white tracking-widest uppercase truncate">{t('referral.copyLink') || 'Copy Invitation Link'}</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 truncate tracking-tight">{referralLink}</span>
                  </div>
                  <div className={`p-2 rounded-lg shrink-0 transition-colors ${copyingLink ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-500 group-hover/link:text-white'}`}>
                    <Icon name={copyingLink ? "check" : "copy"} className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-[1.5rem] border-white/5 flex flex-col items-center gap-2 text-center bg-white/2">
                  <span className="text-3xl font-black text-white">{stats?.referrals?.length || 0}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{t('referral.totalReferrals')}</span>
                </div>
                <div className="glass p-5 rounded-[1.5rem] border-white/5 flex flex-col items-center gap-2 text-center bg-white/2">
                  <span className="text-3xl font-black text-green-500">{stats?.user_active_count || 0}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{t('referral.activeReferrals')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attention Section */}
      <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest">
          <Icon name="alert-triangle" className="w-4 h-4" />
          {t('referral.attention')}
        </div>
        <ul className="flex flex-col gap-2">
          <li className="flex items-start gap-2 text-[11px] text-red-400/80 leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            {t('referral.rule1')}
          </li>
          <li className="flex items-start gap-2 text-[11px] text-red-400/80 leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            {t('referral.rule2')}
          </li>
          <li className="flex items-start gap-2 text-[11px] text-red-400/80 leading-relaxed">
            <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            {t('referral.rule3')}
          </li>
        </ul>
        <div className="h-px bg-red-500/20 w-full" />
        <p className="text-[10px] font-bold text-red-500 italic">
          {t('referral.rewardsDesc')}
        </p>
      </div>

      {/* Gift Boxes */}
      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] uppercase font-bold text-gray-500 ml-1">{t('referral.giftBoxes')}</h3>
        
        {/* Box 1 - ETH */}
        <div className="glass rounded-3xl p-5 border-indigo-500/10 bg-gradient-to-br from-indigo-500/5 to-transparent relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 gold-glow">
                  <Icon name="gift" className="w-6 h-6 animate-bounce" />
                </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-black text-white text-sm">{t('referral.box1Title')}</h4>
              <p className="text-[10px] text-indigo-400 font-bold italic h-4">{t('referral.loadingProgress')}</p>
            </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-white">{getProgress(stats?.total_active_global || 0, 2000)}%</span>
                <p className="text-[8px] text-gray-500 uppercase">{t('referral.systemCurrentShare')}</p>
              </div>
            </div>

            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${getProgress(stats?.total_active_global || 0, 2000)}%` }}
                className="h-full bg-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-gray-500 uppercase font-black">{t('referral.yourShare')}</span>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {calculateUserShare(stats?.user_active_count || 0, stats?.total_active_global || 0, 1).toFixed(6)} ETH
                </span>
              </div>
              <Icon name="loader-2" className="w-4 h-4 text-indigo-500/30 animate-spin" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Box 2 - BTC */}
        <div className="glass rounded-3xl p-5 border-gold/10 bg-gradient-to-br from-gold/5 to-transparent relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center text-gold shadow-[0_0_20px_rgba(255,184,0,0.1)]">
                  <Icon name="gift" className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm">{t('referral.box2Title')}</h4>
                  <p className="text-[10px] text-gold font-bold italic">{t('referral.loadingProgress')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-white">{getProgress(stats?.total_active_global || 0, 10000)}%</span>
                <p className="text-[8px] text-gray-500 uppercase">{t('referral.systemCurrentShare')}</p>
              </div>
            </div>

            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${getProgress(stats?.total_active_global || 0, 10000)}%` }}
                className="h-full bg-gold"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[8px] text-gray-500 uppercase font-black">{t('referral.yourShare')}</span>
                <span className="text-xs font-mono font-bold text-gold">
                  {calculateUserShare(stats?.user_active_count || 0, stats?.total_active_global || 0, 0.1).toFixed(6)} BTC
                </span>
              </div>
              <Icon name="loader-2" className="w-4 h-4 text-gold/30 animate-spin" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 blur-[60px] -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>

      {/* Referral List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] uppercase font-bold text-gray-500 ml-1">{t('referral.activeStatusTitle')}</h3>
        <div className="glass rounded-3xl overflow-hidden border-white/5">
          <div className="grid grid-cols-2 p-4 bg-white/5 border-b border-white/10">
            <span className="text-[10px] font-black uppercase text-gray-500">{t('referral.email')}</span>
            <span className="text-[10px] font-black uppercase text-gray-500 text-right">{t('referral.status')}</span>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {stats?.referrals?.length > 0 ? (
              stats.referrals.map((ref: any, i: number) => (
                <div key={i} className="grid grid-cols-2 p-4 items-center">
                  <span className="text-xs text-white truncate font-medium">{ref.email}</span>
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      ref.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {ref.is_active ? t('referral.active') : t('referral.pending')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-500 italic">No referrals found yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KYCPage = ({ data, onSync, onBack, hasLegacyUid }: { 
  data: { status: string; realName: string | null; phone: string | null; date: string | null } | null,
  onSync: () => Promise<void>,
  onBack: () => void,
  hasLegacyUid: boolean
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initSync = async () => {
      if (hasLegacyUid && (!data || data.status === 'pending')) {
        setLoading(true);
        await onSync();
        setLoading(false);
      }
    };
    initSync();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400">
          <Icon name="arrow-left" className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gold-gradient">KYC Verification</h1>
          <p className="text-gray-400 text-sm">Identity & Eligibility Status</p>
        </div>
      </header>

      {!hasLegacyUid ? (
        <div className="glass rounded-3xl p-8 flex flex-col items-center text-center gap-4 border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Icon name="lock" className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Wallet Not Synced</h3>
            <p className="text-gray-400 text-sm mt-2">You must sync your legacy wallet first to access KYC verification.</p>
          </div>
          <button 
            onClick={onBack}
            className="mt-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold"
          >
            Go Back
          </button>
        </div>
      ) : loading ? (
        <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center gap-4 border-gold/20">
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
          <p className="text-gold font-medium animate-pulse">Verifying Identity...</p>
        </div>
      ) : data?.status === 'verified' ? (
        <div className="flex flex-col gap-4">
          <div className="glass rounded-3xl p-6 border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <Icon name="shield-check" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">KYC Verified</h3>
                <p className="text-green-500/70 text-xs font-medium uppercase tracking-wider">Mainnet Eligible</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Real Name</span>
                <span className="text-sm font-medium text-white">{data.realName}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Phone Number</span>
                <span className="text-sm font-medium text-white">{data.phone}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Verification Date</span>
                <span className="text-sm font-medium text-white">{data.date}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10">
            <p className="text-[10px] text-gold/70 leading-relaxed text-center italic">
              Your identity has been successfully bridged from the legacy system. You are now eligible for the upcoming Mainnet migration.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 flex flex-col items-center text-center gap-6 border-red-500/20">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Icon name="x" className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Verification Failed</h3>
            <p className="text-red-400 text-sm mt-2 font-medium">Failed. Wait for KYC Stage 3.</p>
            <p className="text-gray-500 text-xs mt-4 leading-relaxed">
              We couldn't retrieve your complete KYC Stage 2 data from the legacy system. Please wait for the Stage 3 manual verification process.
            </p>
          </div>
          <button 
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
          >
            Return to Profile
          </button>
        </div>
      )}
    </div>
  );
};

const AcademyPage = ({ 
  user,
  progress,
  onUpdateProgress,
  onBack
}: { 
  user: User, 
  progress: { completed_question_ids: number[], total_score: number, is_eligible: boolean },
  onUpdateProgress: (questionId: number, isCorrect: boolean) => void,
  onBack: () => void 
}) => {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  
  const COURSES = [
    {
      id: 1,
      title: "Introduction to Athena Chain",
      description: "Foundations of the high-performance decentralized infrastructure",
      videoUrl: "https://www.youtube.com/embed/-hQ9WR81s7c",
      questions: [
        { id: 1, text: "What is the primary goal of Athena Chain?", options: ["High-performance decentralized infrastructure", "A simple social media platform", "A centralized cloud storage", "A gaming-only console"], correctIndex: 0 },
        { id: 2, text: "What consensus mechanism does Athena use?", options: ["Proof of Work", "Proof of Stake (PoS)", "Proof of History", "Proof of Authority"], correctIndex: 1 },
        { id: 3, text: "How many transactions per second (TPS) can Athena handle?", options: ["100 TPS", "1,000 TPS", "10,000 TPS", "100,000+ TPS"], correctIndex: 3 },
        { id: 4, text: "What is the name of the native token?", options: ["GEM", "ATH", "PI", "BTC"], correctIndex: 1 },
        { id: 5, text: "Is Athena compatible with EVM (Ethereum Virtual Machine)?", options: ["Yes", "No", "Only for NFTs", "Only for Staking"], correctIndex: 0 }
      ]
    },
    {
      id: 2,
      title: "Mining & Rewards (ATH/GEM)",
      description: "Learn how to maximize your earnings in the ecosystem",
      videoUrl: "https://www.youtube.com/embed/Tr5HT6CE434",
      questions: [
        { id: 6, text: "How often can you claim mining rewards?", options: ["Every hour", "Every 12 hours", "Every 24 hours", "Once a week"], correctIndex: 2 },
        { id: 7, text: "What is the secondary token earned during mining?", options: ["ATH", "GEM", "GLD", "USDT"], correctIndex: 1 },
        { id: 8, text: "Can you boost your mining speed?", options: ["No, it's fixed", "Yes, via referrals and staking", "Only by paying monthly", "Only on weekends"], correctIndex: 1 },
        { id: 9, text: "What happens to GEM tokens?", options: ["They are deleted", "They are converted to ATH monthly", "They are used for gas fees", "They are sold on exchanges"], correctIndex: 1 },
        { id: 10, text: "Is mining battery-intensive on mobile?", options: ["Yes, very much", "No, it's cloud-based", "Only if the app is open", "Only on Android"], correctIndex: 1 }
      ]
    },
    {
      id: 3,
      title: "KYC & Security",
      description: "Ensuring compliance and protecting your assets",
      videoUrl: "https://www.youtube.com/embed/2nsOyXE1r8w",
      questions: [
        { id: 11, text: "Why is KYC required for Mainnet?", options: ["To collect user data for ads", "To prevent sybil attacks and ensure compliance", "To charge users fees", "It is not actually required"], correctIndex: 1 },
        { id: 12, text: "What are the stages of KYC in Athena?", options: ["Stage 1 only", "Stage 1 and 2", "Stage 1, 2, and 3", "Stage A and B"], correctIndex: 2 },
        { id: 13, text: "What document is typically required for Stage 2?", options: ["Library card", "Government ID", "Utility bill", "Social media profile"], correctIndex: 1 },
        { id: 14, text: "Can you trade tokens without KYC?", options: ["Yes, fully", "No, it's impossible", "Limited functionality", "Only on Tuesdays"], correctIndex: 2 },
        { id: 15, text: "Is your data encrypted on Athena?", options: ["Yes", "No", "Only for VIPs", "Only on Mainnet"], correctIndex: 0 }
      ]
    },
    {
      id: 4,
      title: "Tokenomics & Governance",
      description: "Understanding the ATH supply and voting system",
      videoUrl: "https://www.youtube.com/embed/MK-5WmMZ2v0",
      questions: [
        { id: 16, text: "What is the total supply of ATH?", options: ["100 Million", "560 Million", "1 Billion", "Infinite"], correctIndex: 1 },
        { id: 17, text: "What percentage of tokens are allocated to the community?", options: ["10%", "30%", "50%", "70%"], correctIndex: 3 },
        { id: 18, text: "How can you participate in governance?", options: ["By mining only", "By staking ATH", "By watching videos", "By inviting friends"], correctIndex: 1 },
        { id: 19, text: "What is the 'Burn' mechanism?", options: ["Deleting inactive accounts", "A portion of fees is permanently removed from supply", "Selling tokens to users", "Increasing the total supply"], correctIndex: 1 },
        { id: 20, text: "What is the utility of the GLD token?", options: ["Mining only", "Governance and ecosystem rewards", "Paying for gas fees", "Trading on Binance"], correctIndex: 1 }
      ]
    },
    {
      id: 5,
      title: "Ecosystem & Partners",
      description: "Exploring the wider network and utility",
      videoUrl: "https://www.youtube.com/embed/A7FKSs6A-0g",
      questions: [
        { id: 21, text: "What is the Athena Launchpad?", options: ["A rocket launch site", "A platform for new projects to raise capital", "A place to buy ATH", "A news website"], correctIndex: 1 },
        { id: 22, text: "Can you use ATH in the NFT Market?", options: ["Yes", "No", "Only for special NFTs", "Only on OpenSea"], correctIndex: 0 },
        { id: 23, text: "Who are the primary partners of Athena?", options: ["Local banks", "Major crypto exchanges and tech firms", "Fast food chains", "Clothing brands"], correctIndex: 1 },
        { id: 24, text: "What is the Athena Academy?", options: ["A physical school", "An educational platform for users", "A recruitment agency", "A library"], correctIndex: 1 },
        { id: 25, text: "How do you join the Athena P2P market?", options: ["Just download the app", "Complete KYC and link a wallet", "Pay a subscription", "Invite 10 friends"], correctIndex: 1 }
      ]
    },
    {
      id: 6,
      title: "Staking & Passive Income",
      description: "How to lock your ATH and earn high-yield rewards",
      videoUrl: "https://www.youtube.com/embed/_-8WvSPAMdk",
      questions: [
        { id: 26, text: "What is staking in Athena?", options: ["Selling your tokens", "Locking tokens to support the network and earn interest", "Sending tokens to friends", "Deleting your account"], correctIndex: 1 },
        { id: 27, text: "What is the typical range for Staking APY?", options: ["1-2%", "10-20%+", "50-100%", "Zero"], correctIndex: 1 },
        { id: 28, text: "What is the minimum staking period?", options: ["1 day", "7 days", "30 days", "Depends on the pool selected"], correctIndex: 3 },
        { id: 29, text: "What happens if you unstake early?", options: ["You lose all tokens", "You may pay a small penalty fee", "Nothing happens", "You win a bonus"], correctIndex: 1 },
        { id: 30, text: "Which token can be staked to earn more ATH?", options: ["Only BTC", "Only DOGE", "ATH tokens", "Only ETH"], correctIndex: 2 }
      ]
    },
    {
      id: 7,
      title: "P2P Trading Safety",
      description: "Secure peer-to-peer exchanges without a middleman",
      videoUrl: "https://www.youtube.com/embed/RUQ2eCqqy9M",
      questions: [
        { id: 31, text: "What is P2P trading?", options: ["Professional to Professional", "Peer to Peer (Direct exchange between users)", "Protocol to Protocol", "Price to Price"], correctIndex: 1 },
        { id: 32, text: "How does Athena protect P2P trades?", options: ["Via phone calls", "Using an Escrow system", "By watching the trade in person", "It doesn't protect them"], correctIndex: 1 },
        { id: 33, text: "When should you release the crypto in a P2P trade?", options: ["As soon as the buyer says they paid", "After you receive and verify the payment in your bank/app", "Before the trade starts", "Never"], correctIndex: 1 },
        { id: 34, text: "What should you do if a buyer asks to trade outside the app?", options: ["Do it for a discount", "Report them and stay within the Athena platform for safety", "Say yes immediately", "Ask for their phone number"], correctIndex: 1 },
        { id: 35, text: "Is there a rating system for P2P traders?", options: ["Yes, to show trust and successful history", "No, it's anonymous", "Only for VIPs", "Only on Android"], correctIndex: 0 }
      ]
    },
    {
      id: 8,
      title: "Athena Gaming Ecosystem",
      description: "Play-to-Earn mechanics in the Athena metaverse",
      videoUrl: "https://www.youtube.com/embed/_naISNlfCTU",
      questions: [
        { id: 36, text: "What is 'Play-to-Earn' (P2E)?", options: ["Paying to play games", "Earning real crypto rewards by playing games", "Watching others play", "Designing your own game"], correctIndex: 1 },
        { id: 37, text: "Which tokens can be used for in-game purchases?", options: ["V-Bucks only", "ATH and GEM", "Only USD", "Only Credits"], correctIndex: 1 },
        { id: 38, text: "Are in-game items stored as NFTs?", options: ["Yes, for true ownership", "No, they are centralized", "Only for the top 10 players", "Only on the website"], correctIndex: 0 },
        { id: 39, text: "What is the Wheel of Fortune?", options: ["A math game", "A daily luck-based game to win ATH/GEM", "A steering wheel for a car", "A governance proposal"], correctIndex: 1 },
        { id: 40, text: "Can you win real GLD from Athena Slots?", options: ["No, it's just for fun", "Yes, it is hooked to the ecosystem rewards", "Only if you win 100 times", "Only if you refer 5 people"], correctIndex: 1 }
      ]
    },
    {
      id: 9,
      title: "AI Trading Bot Mechanics",
      description: "Leverage artificial intelligence for smarter trades",
      videoUrl: "https://www.youtube.com/embed/wPzXiHUOLyU",
      questions: [
        { id: 41, text: "What does the Athena AI Trading Bot do?", options: ["It buys pizza for you", "It analyzes market trends and executes automated trades", "It mines Bitcoin on your phone", "It deletes your bad trades"], correctIndex: 1 },
        { id: 42, text: "Does the AI Bot guarantee 100% profit?", options: ["Yes, always", "No, trading always involves risk despite smart analysis", "Only for the first week", "Only on ETH"], correctIndex: 1 },
        { id: 43, text: "Which data does the AI Bot use?", options: ["Yesterday's newspaper", "Real-time market data, volume, and sentiment", "Your browser history", "Random numbers"], correctIndex: 1 },
        { id: 44, text: "Can you set your own 'Risk Level' on the bot?", options: ["No, it's automatic", "Yes, choose between Conservative, Balanced, or Aggressive", "Only if you pay a fee", "Only on weekends"], correctIndex: 1 },
        { id: 45, text: "Is the AI Bot accessible to all KYC verified users?", options: ["Yes", "No, only for whales", "Only for the dev team", "Only for those with 1,000 referrals"], correctIndex: 0 }
      ]
    },
    {
      id: 10,
      title: "Future Roadmap & Mainnet",
      description: "The path to decentralization and ATH listing",
      videoUrl: "https://www.youtube.com/embed/NNd_2ZlJ8EQ",
      questions: [
        { id: 46, text: "When is the scheduled ATH Listing?", options: ["It already happened", "Check the official Roadmap in the app for current Q3/Q4 dates", "Never", "In 10 years"], correctIndex: 1 },
        { id: 47, text: "What is the 'Mainnet Launch'?", options: ["Launching a website", "The release of the independent, live Athena blockchain", "A new game launch", "A marketing event"], correctIndex: 1 },
        { id: 48, text: "What will happen to your Testnet tokens during Mainnet?", options: ["They are deleted", "They are migrated/converted based on eligibility", "They become worth $1,000 each", "Nothing, they stay as Testnet"], correctIndex: 1 },
        { id: 49, text: "What is the Mainnet Checklist?", options: ["A shopping list", "A set of requirements (KYC, Academy, etc.) to prepare for migration", "A list of developers", "A list of games"], correctIndex: 1 },
        { id: 50, text: "Does Athena plan to expand to other countries?", options: ["No, it's local", "Yes, the goal is global financial inclusion", "Only in the US", "Only in Europe"], correctIndex: 1 }
      ]
    },
    {
      id: 11,
      title: "P2P Trading Mastery",
      description: "How to buy and sell safely using local payment methods",
      videoUrl: "https://www.youtube.com/embed/aEEPHAexmMo",
      questions: [
        { id: 51, text: "What is the main benefit of Athena P2P?", options: ["Directly exchange crypto for local currency", "It's a way to play games", "A storage for photos", "A mining tool"], correctIndex: 0 },
        { id: 52, text: "What is the purpose of the 'Merchant' role?", options: ["To delete accounts", "To provide liquidity and build trust", "To change the app theme", "To watch ads"], correctIndex: 1 },
        { id: 53, text: "How do you choose a safe P2P seller?", options: ["By their username", "Look for high completion rates and positive feedback", "Random choice", "The one with the lowest balance"], correctIndex: 1 },
        { id: 54, text: "Is it safe to trade before the crypto is in escrow?", options: ["Yes, always", "No, the platform ensures crypto is held until payment is confirmed", "Only with friends", "Only on Android"], correctIndex: 1 },
        { id: 55, text: "What should you include in the payment description?", options: ["A long story", "Only what the seller specifies, usually a reference code", "Your password", "Nothing"], correctIndex: 1 }
      ]
    },
    {
      id: 12,
      title: "Advanced KYC Verification",
      description: "Navigating Stage 2 and biometric identity security",
      videoUrl: "https://www.youtube.com/embed/tDthibUPQ8c",
      questions: [
        { id: 56, text: "What distinguishes KYC Stage 2 from Stage 1?", options: ["Stage 2 requires document and biometric verification", "Stage 1 is harder", "There is no difference", "Stage 2 is for robots"], correctIndex: 0 },
        { id: 57, text: "Why is Stage 2 critical?", options: ["For changing your profile picture", "It is required for Mainnet withdrawal eligibility", "For playing games", "For mining faster"], correctIndex: 1 },
        { id: 58, text: "What documents are generally accepted for Stage 2?", options: ["Library card", "Passport, National ID, or Driving License", "School ID", "Rent receipt"], correctIndex: 1 },
        { id: 59, text: "How long does Stage 2 verification usually take?", options: ["1 second", "Usually 24-48 hours depending on volume", "1 month", "1 year"], correctIndex: 1 },
        { id: 60, text: "What should you do if your KYC is rejected?", options: ["Delete the app", "Re-apply with clearer photos or contact support", "Give up", "Create a new account"], correctIndex: 1 }
      ]
    },
    {
      id: 13,
      title: "Maximizing Mining Speed",
      description: "Techniques to scale your daily GEM/ATH production",
      videoUrl: "https://www.youtube.com/embed/Rm3HWTNrgp8",
      questions: [
        { id: 61, text: "What is the standard mining session duration?", options: ["1 hour", "12 hours", "24 hours", "48 hours"], correctIndex: 2 },
        { id: 62, text: "How can you increase your GEM production effectively?", options: ["By closing the app", "By building a team and completing daily tasks", "By doing nothing", "By changing your email"], correctIndex: 1 },
        { id: 63, text: "Does the Athena Premium Package affect mining?", options: ["No", "Yes, it provides a permanent speed multiplier", "Only for 1 day", "It slows it down"], correctIndex: 1 },
        { id: 64, text: "What is the 'Boost Index'?", options: ["A weather report", "A score calculating your total contribution to network speed", "A game level", "Your battery percentage"], correctIndex: 1 },
        { id: 65, text: "Can you lose your mining 'streak' bonus?", options: ["No", "Yes, if you don't claim within the specified grace period", "Only on iOS", "Only if you logout"], correctIndex: 1 }
      ]
    },
    {
      id: 14,
      title: "Secure Wallet Configuration",
      description: "Setting up your non-custodial Athena wallet",
      videoUrl: "https://www.youtube.com/embed/RM9dbKFGPBQ",
      questions: [
        { id: 66, text: "What is the Athena Wallet?", options: ["A physical leather wallet", "A secure non-custodial digital wallet for ATH and GEM", "A bank account", "A marketplace"], correctIndex: 1 },
        { id: 67, text: "What is the 'Secret Recovery Phrase'?", options: ["Your email address", "A set of 12-24 words used to recover your wallet assets", "Your phone number", "The app name"], correctIndex: 1 },
        { id: 68, text: "Who should you share your secret phrase with?", options: ["Athena Support", "Your best friend", "Absolutely no one", "The police"], correctIndex: 2 },
        { id: 69, text: "Can the Athena app recover your phrase if lost?", options: ["Yes, through email", "No, for security, only you hold the keys", "Only if you pay", "Only for admins"], correctIndex: 1 },
        { id: 70, text: "What is the 'Receive' address used for?", options: ["Sending crypto", "Receiving tokens from other users or exchanges", "Logging in", "Buying NFTs"], correctIndex: 1 }
      ]
    },
    {
      id: 15,
      title: "Mainnet Readiness & Migration",
      description: "The final steps to bridge your assets to the live chain",
      videoUrl: "https://www.youtube.com/embed/Fx7nluyaUR0",
      questions: [
        { id: 71, text: "What is the first step of the migration process?", options: ["Ensuring all Mainnet Checklist items are green/verified", "Buying a new phone", "Deleting the app", "Sending 1,000 referrals"], correctIndex: 0 },
        { id: 72, text: "What happens to your mining status after Mainnet?", options: ["It stops forever", "You continue mining on the live, independent blockchain", "It becomes harder", "It's replaced by a quiz"], correctIndex: 1 },
        { id: 73, text: "Are there any fees for the migration?", options: ["No, it's free", "Small network gas fees paid in native crypto", "A $50 flat fee", "It costs half your tokens"], correctIndex: 1 },
        { id: 74, text: "Can you migrate multiple accounts per person?", options: ["Yes", "No, KYC limits only one verified account per person", "Up to 5", "Only if you are a Premium user"], correctIndex: 1 },
        { id: 75, text: "What is the primary benefit of Mainnet ATH?", options: ["It's a different color", "Real market value and the ability to trade on exchanges", "Better graphics", "It lasts longer"], correctIndex: 1 }
      ]
    },
    {
      id: 16,
      title: "Decentralized Node Hosting",
      description: "Supporting the network infrastructure for rewards",
      videoUrl: "https://www.youtube.com/embed/lq4Y0JXtIpY",
      questions: [
        { id: 76, text: "What is an Athena Node?", options: ["A physical computer that processes network transactions", "A type of crypto token", "A mobile phone battery", "A social media follower"], correctIndex: 0 },
        { id: 77, text: "What is the benefit of running a node?", options: ["It makes your phone faster", "You earn a share of network fees and block rewards", "It gives you free premium", "Nothing, it's voluntary"], correctIndex: 1 },
        { id: 78, text: "Do you need 24/7 uptime for a node?", options: ["No, just an hour a day", "Yes, high availability ensures network stability", "Only on weekends", "Only when you are awake"], correctIndex: 1 },
        { id: 79, text: "What is 'Slashing'?", options: ["A discount on tokens", "A penalty for nodes that act maliciously or go offline", "Increasing user balance", "A marketing strategy"], correctIndex: 1 },
        { id: 80, text: "Can a community pool run a node?", options: ["Yes, allowing many users to share one node's rewards", "No, only individuals", "Only for admins", "Only for the government"], correctIndex: 0 }
      ]
    },
    {
      id: 17,
      title: "Cross-Chain Bridges",
      description: "Moving your assets between Athena and other chains",
      videoUrl: "https://www.youtube.com/embed/BaeCNJMwBKk",
      questions: [
        { id: 81, text: "What is a 'Bridge' in crypto?", options: ["A physical bridge", "A protocol that transfers assets between different blockchains", "A way to hack accounts", "A user chat room"], correctIndex: 1 },
        { id: 82, text: "Which chains are compatible with Athena Bridge?", options: ["None", "Ethereum, BNB Chain, and others", "Only internal chains", "Only legacy systems"], correctIndex: 1 },
        { id: 83, text: "Why would you move assets to Athena?", options: ["To pay more fees", "To access Athena's high speed and low-cost ecosystem", "To lose tokens", "To change your username"], correctIndex: 1 },
        { id: 84, text: "Is bridging instant?", options: ["Yes, always", "It depends on the confirmation speed of the source chain", "It takes 1 year", "Only for premium users"], correctIndex: 1 },
        { id: 85, text: "What is 'Wrapped ATH'?", options: ["ATH in a gift box", "An ATH-backed token on another blockchain (like ERC-20)", "A fake token", "A locked token"], correctIndex: 1 }
      ]
    },
    {
      id: 18,
      title: "Community Staking Pools",
      description: "Collaborative yield farming for higher efficiency",
      videoUrl: "https://www.youtube.com/embed/DTHy9UW5iZU",
      questions: [
        { id: 86, text: "What is a Staking Pool?", options: ["A swimming pool for crypto", "A group of users combining tokens to increase rewards", "A place to buy GEM", "A mining rig"], correctIndex: 1 },
        { id: 87, text: "Who manages a Staking Pool?", options: ["A Pool Operator", "The user with the least tokens", "A random robot", "No one"], correctIndex: 0 },
        { id: 88, text: "What is the advantage of a pool for 'small' users?", options: ["They get less rewards", "They can earn staking yields without meeting high minimums", "They get free gifts", "There is no advantage"], correctIndex: 1 },
        { id: 89, text: "Are rewards distributed automatically?", options: ["No, you must call support", "Yes, smart contracts handle distribution based on share", "Only once a year", "Only if you win a contest"], correctIndex: 1 },
        { id: 90, text: "Can you leave a pool anytime?", options: ["Yes, though some have a short unbonding period", "No, you are locked forever", "Only if the admin says yes", "Only if you pay $100"], correctIndex: 0 }
      ]
    },
    {
      id: 19,
      title: "Athena DEX & Liquidity",
      description: "Swapping tokens and providing liquidity on-chain",
      videoUrl: "https://www.youtube.com/embed/Fk8p8sj6cHA",
      questions: [
        { id: 91, text: "What is a DEX?", options: ["A Decentralized Exchange", "A Digital Expert", "A data storage unit", "A centralized bank"], correctIndex: 0 },
        { id: 92, text: "What is an 'Automated Market Maker' (AMM)?", options: ["A person who trades for you", "An algorithm that provides instant liquidity for swaps", "A sales robot", "A mining machine"], correctIndex: 1 },
        { id: 93, text: "What do you earn for providing liquidity?", options: ["Nothing", "A portion of every trade's swap fee", "Free ads", "Random NFTs"], correctIndex: 1 },
        { id: 94, text: "What is 'Impermanent Loss'?", options: ["Losing your phone", "A potential loss relative to holding when prices diverge", "Fixed monthly fees", "Losing your password"], correctIndex: 1 },
        { id: 95, text: "Is the Athena DEX non-custodial?", options: ["Yes, you keep control of your keys", "No, Athena holds your tokens", "Only on Mainnet", "Only during the day"], correctIndex: 0 }
      ]
    },
    {
      id: 20,
      title: "Becoming an Athena Pioneer",
      description: "Mainnet certification and the future of Athena",
      videoUrl: "https://www.youtube.com/embed/Z8B6DhNlgKU",
      questions: [
        { id: 96, text: "What does completing the Academy signify?", options: ["You are a master of Athena knowledge and eligible for Mainnet benefits", "You are a new user", "You finished a game", "You are an admin"], correctIndex: 0 },
        { id: 97, text: "What is the role of an 'Athena Pioneer'?", options: ["To help build, secure, and evangelize the network", "To watch ads only", "To design graphics", "To just wait for the price increase"], correctIndex: 0 },
        { id: 98, text: "Does the Academy end here?", options: ["Yes, forever", "No, new modules will be added as the ecosystem evolves", "It resets every month", "Only for testnet"], correctIndex: 1 },
        { id: 99, text: "How can you help the community?", options: ["By being rude", "By mentoring new users and sharing accurate knowledge", "By keeping secrets", "By doing nothing"], correctIndex: 1 },
        { id: 100, text: "Are you ready for the Athena Mainnet?", options: ["Yes!", "No", "Maybe", "I'm not sure"], correctIndex: 0 }
      ]
    }
  ];

  const currentCourse = COURSES.find(c => c.id === selectedCourse);

  const totalQuestions = 100;
  const currentProgress = progress.total_score;
  const isEligible = progress.is_eligible;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors">
          <Icon name="chevron-left" className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gold-gradient">Athena Academy</h1>
          <p className="text-gray-400 text-sm">Educational path to Mainnet governance</p>
        </div>
      </header>

      {/* Main Status Card */}
      <div className="glass rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-gold/10 to-transparent">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Eligibility Progress</span>
            <span className={`text-sm font-bold ${isEligible ? 'text-green-500' : 'text-gold'}`}>
              {currentProgress}% / 100%
            </span>
          </div>
          
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full ${isEligible ? 'bg-green-500' : 'bg-gold-gradient'}`}
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="p-3 rounded-xl bg-gold/5 border border-gold/10 flex items-start gap-3">
            <Icon name="help-circle" className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <span className="text-gold font-bold">Requirement:</span> You must answer 75% of the questions correctly; this is a requirement for the Mainnet Checklist.
            </p>
          </div>
        </div>
      </div>

      {!selectedCourse ? (
        <div className="grid grid-cols-1 gap-4">
          {COURSES.map((course) => {
            const courseQuestions = course.questions.map(q => q.id);
            const completedInCourse = courseQuestions.filter(id => progress.completed_question_ids.includes(id)).length;
            const isFullyCompleted = completedInCourse === 5;

            return (
              <div 
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`glass p-5 rounded-2xl flex items-center justify-between group cursor-pointer transition-all hover:border-gold/30 ${isFullyCompleted ? 'border-green-500/30' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isFullyCompleted ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gold group-hover:bg-gold/10'}`}>
                    {isFullyCompleted ? <Icon name="check-mark" className="w-6 h-6" /> : <Icon name="play-circle" className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{course.title}</h3>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">{course.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isFullyCompleted ? 'bg-green-500' : 'bg-gold'}`}
                          style={{ width: `${(completedInCourse / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-gray-500">{completedInCourse}/5 Steps</span>
                    </div>
                  </div>
                </div>
                <Icon name="chevron-right" className="w-5 h-5 text-gray-600 group-hover:text-gold transition-colors" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="chevron-left" className="w-4 h-4" /> Back to Modules
          </button>

          <div className="aspect-video bg-black rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden relative">
             {currentCourse?.videoUrl ? (
               <iframe 
                 src={currentCourse.videoUrl}
                 className="w-full h-full"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 allowFullScreen
               />
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center bg-black/60 z-10">
                  <Icon name="youtube" className="w-12 h-12 text-red-600" />
                  <div>
                     <h4 className="font-bold text-white uppercase tracking-widest text-sm">Course Video</h4>
                     <p className="text-xs text-gray-400 mt-1 italic">YouTube Links Coming Soon</p>
                  </div>
               </div>
             )}
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white px-2">Knowledge Test</h3>
            {currentCourse?.questions.map((q, idx) => {
              const isCorrect = progress.completed_question_ids.includes(q.id);
              
              return (
                <div key={q.id} className={`glass p-5 rounded-2xl flex flex-col gap-4 ${isCorrect ? 'border-green-500/20 bg-green-500/5' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isCorrect ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                      {idx + 1}
                    </div>
                    <p className="text-sm font-medium text-white">{q.text}</p>
                  </div>

                  {isCorrect ? (
                    <div className="flex items-center gap-2 text-green-500 text-[10px] font-bold uppercase ml-10">
                      <Icon name="check-mark" className="w-4 h-4" /> Correct Answered
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 ml-10">
                      {q.options.map((opt, optIdx) => (
                        <button 
                          key={optIdx}
                          onClick={() => {
                            if (optIdx === q.correctIndex) {
                              onUpdateProgress(q.id, true);
                            } else {
                              alert("Incorrect! Watch the video more carefully.");
                            }
                          }}
                          className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-gold/30 hover:bg-gold/5 text-xs text-gray-400 hover:text-white transition-all"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const MoreTab = ({ userId, onBalanceUpdate, onLogout, onKYCClick }: { userId: string; onBalanceUpdate: () => void; onLogout: () => void; onKYCClick: () => void }) => {
  const { t } = useTranslation();
  const [showWheel, setShowWheel] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [showPepeCave, setShowPepeCave] = useState(false);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const sections = [
    {
      title: t('common.account'),
      items: [
        { name: t('common.profile'), internalName: 'Profile', icon: <UserIcon className="w-5 h-5" />, isActive: true },
        { name: t('common.settings'), internalName: 'Settings', icon: <Settings className="w-5 h-5" />, isActive: true },
        { name: t('kyc.title'), internalName: 'KYC', icon: <ShieldCheck className="w-5 h-5" />, isActive: true },
        { name: t('common.referral'), internalName: 'Referral', icon: <Users className="w-5 h-5" />, isActive: true },
      ]
    },
    {
      title: t('common.trading') || 'Trading',
      items: [
        { name: t('common.spotTrading') || 'Spot Trading', internalName: 'Spot Trading', icon: <BarChart2 className="w-5 h-5" /> },
        { name: t('common.futures') || 'Futures', internalName: 'Futures', icon: <TrendingUp className="w-5 h-5" /> },
        { name: t('common.p2p') || 'P2P Trading', internalName: 'P2P Trading', icon: <ArrowRightLeft className="w-5 h-5" /> },
        { name: t('common.convert') || 'Convert', internalName: 'Convert', icon: <RefreshCw className="w-5 h-5" /> },
      ]
    },
    {
      title: t('common.finance') || 'Finance',
      items: [
        { name: t('common.staking') || 'Staking', internalName: 'Staking', icon: <PieChart className="w-5 h-5" /> },
        { name: t('common.earn') || 'Athena Earn', internalName: 'Athena Earn', icon: <Zap className="w-5 h-5" /> },
        { name: t('common.card') || 'Crypto Card', internalName: 'Crypto Card', icon: <CreditCard className="w-5 h-5" /> },
        { name: t('common.loans') || 'Loans', internalName: 'Loans', icon: <ShieldCheck className="w-5 h-5" /> },
      ]
    },
    {
      title: t('common.games') || 'Games',
      items: [
        { name: t('common.wheel') || 'Wheel of Fortune', internalName: 'Wheel of Fortune', icon: <Zap className="w-5 h-5" />, isGame: true, gameType: 'wheel' },
        { name: t('common.slots') || 'Athena Slots', internalName: 'Athena Slots', icon: <Trophy className="w-5 h-5" />, isGame: true, gameType: 'slots' },
        { name: 'SNAKE MINER', internalName: 'Snake Miner', icon: <Gamepad2 className="w-5 h-5 text-green-500" />, isGame: true, gameType: 'snake-game' },
        { name: 'PEPE CAVE', internalName: 'PEPE CAVE', icon: <Gamepad2 className="w-5 h-5 text-green-400" />, isGame: true, gameType: 'pepe-cave' },
        { name: t('common.crash') || 'Crash Game', internalName: 'Crash Game', icon: <TrendingUp className="w-5 h-5" /> },
      ]
    },
    {
      title: "AI & Innovation",
      items: [
        { name: "AI Trading Bot", internalName: 'AI Trading Bot', icon: <Cpu className="w-5 h-5" /> },
        { name: "Launchpad", internalName: 'Launchpad', icon: <Rocket className="w-5 h-5" /> },
        { name: "NFT Market", internalName: 'NFT Market', icon: <Gamepad2 className="w-5 h-5" /> },
        { name: "Academy", internalName: 'Academy', icon: <GraduationCap className="w-5 h-5" />, isActive: true },
        { name: "Academy", internalName: 'Academy', icon: <HelpCircle className="w-5 h-5" /> },
      ]
    },
    {
      title: t('common.support') || 'Support',
      items: [
        { name: t('common.installApp') || 'Install App', internalName: 'Install App', icon: <Download className="w-5 h-5" />, isInstall: true },
        { name: t('common.helpCenter') || 'Help Center', internalName: 'Help Center', icon: <HelpCircle className="w-5 h-5" /> },
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
        <h1 className="text-2xl font-bold text-gold-gradient">{t('more.title') || 'More Services'}</h1>
        <p className="text-gray-400 text-sm">{t('more.description') || 'Explore the Athena ecosystem'}</p>
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
                  if (item.internalName === 'KYC') onKYCClick();
                  if (item.internalName === 'Profile') (onKYCClick as any)('profile');
                  if (item.internalName === 'Settings') (onKYCClick as any)('settings');
                  if (item.internalName === 'Academy') (onKYCClick as any)('academy');
                  if (item.internalName === 'Referral') (onKYCClick as any)('referral');
                  if (item.isGame) {
                    if (item.gameType === 'wheel') setShowWheel(true);
                    if (item.gameType === 'slots') setShowSlots(true);
                    if (item.gameType === 'pepe-cave') setShowPepeCave(true);
                    if (item.gameType === 'snake-game') setShowSnakeGame(true);
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 relative group cursor-pointer ${(item.isInstall || item.isGame || item.isActive) ? '' : 'opacity-60 grayscale'}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${(item.isInstall || item.isGame || item.isActive) ? 'text-gold' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] text-center font-medium leading-tight ${(item.isInstall || item.isGame || item.isActive) ? 'text-white' : 'text-gray-500'}`}>{item.name}</span>
                {(!item.isInstall && !item.isGame && !item.isActive) && (
                  <>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gold/10 rounded-md border border-gold/20">
                      <span className="text-[6px] font-bold text-gold uppercase tracking-tighter">Soon</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-bold text-gold uppercase tracking-tighter">Soon</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="px-2 mt-4">
        <button 
          onClick={onLogout}
          className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold flex items-center justify-center gap-3 hover:bg-red-500/20 transition-all active:scale-[0.98]"
        >
          <Icon name="x" className="w-5 h-5" />
          Logout Account
        </button>
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

      {/* PEPE CAVE Modal */}
      <AnimatePresence>
        {showPepeCave && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg min-h-screen py-8"
            >
              <PepeCaveGame 
                userId={userId} 
                onClose={() => setShowPepeCave(false)} 
                onBalanceUpdate={onBalanceUpdate}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Snake Game Modal */}
      <AnimatePresence>
        {showSnakeGame && (
          <SnakeGame 
            userId={userId} 
            onClose={() => {
              setShowSnakeGame(false);
              onBalanceUpdate(); // Refresh balance after game
            }} 
          />
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
  const { t } = useTranslation();
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
  const [kycData, setKycData] = useState<{
    status: string;
    realName: string | null;
    phone: string | null;
    date: string | null;
  } | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [academyProgress, setAcademyProgress] = useState<{
    completed_question_ids: number[];
    total_score: number;
    is_eligible: boolean;
  }>({ completed_question_ids: [], total_score: 0, is_eligible: false });
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    // Capture referral code from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referral_code', ref);
      // Clean up URL
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isWaitingForAd && adClickTime) {
        const now = Date.now();
        const elapsed = now - adClickTime;
        
        // Use a slightly more lenient check (3s instead of 4s) or just start if they come back
        if (elapsed >= 3000) {
          setIsWaitingForAd(false);
          setAdClickTime(null);
          setMiningMessage(null);
          executeStartMining();
        } else {
          setMiningMessage({ type: 'error', text: 'Please watch the ad for a moment to start mining.' });
          // Still allow them to try again immediately
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
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      }

      if (profile) {
        if (profile.is_deleted) {
          handleLogout();
          return;
        }

        // Set defaults if profile is missing or fields are null
        setMigrationStatus(profile.legacy_uid === null || profile.legacy_uid === undefined);
        setLastMiningTime(profile.last_mining_time || null);
        setLegacyUid(profile.legacy_uid || null);
        setProfileUsername(profile.username || null);
        setStreakCount(profile.streak_count || 0);
        setLastStreakDate(profile.last_streak_date || null);
        setKycData({
          status: profile.kyc_status || 'pending',
          realName: profile.real_name || null,
          phone: profile.full_phone_number || null,
          date: profile.kyc_stage2_date || null
        });
      } else {
        // No profile found, probably a new user
        setMigrationStatus(true);
      }

      // 2. Load Academy Progress
      const { data: academyData, error: academyError } = await supabase
        .from('academy_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (academyError && academyError.code !== 'PGRST116') {
        console.error('Error loading academy progress:', academyError);
      }

      if (academyData) {
        setAcademyProgress({
          completed_question_ids: academyData.completed_question_ids || [],
          total_score: academyData.total_score || 0,
          is_eligible: academyData.is_eligible || false
        });
      }

      // 3. Load Referral Stats
      const { data: refStats, error: refError } = await supabase.rpc('get_referral_stats', { p_user_id: user.id });
      if (!refError) setReferralStats(refStats);

      // 4. Claim Welcome Bonus if applicable
      const { data: bonusData } = await supabase.rpc('claim_referral_welcome_bonus', { p_user_id: user.id });
      if (bonusData?.success) {
        // Balances will be reloaded below
      }

      // --- Daily Tasks Reset Logic ---
      let tasks = profile?.completed_tasks || [];
      try {
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
      } catch (taskResetErr) {
        console.error('Error during daily task reset:', taskResetErr);
        // Continue to load balances even if task reset fails
      }
      setCompletedTasks(tasks);

      // 2. Load balances
      const { data: balances, error: balancesError } = await supabase
        .from('user_balances')
        .select('coin_symbol, amount')
        .eq('user_id', user.id);

      if (balancesError) {
        console.error('Error loading balances:', balancesError);
        // Don't overwrite existing local assets if there's an error
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
      // Don't clear userAssets here to prevent accidental resets on next update
    }
  };

  // Load user data when authenticated
  useEffect(() => {
    if (!user) {
      setUserAssets({});
      setMigrationStatus(true);
      setStreakCount(0);
      setLastStreakDate(null);
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
          // Check for referrer
          const referralCode = localStorage.getItem('referral_code');
          let referredBy = null;
          if (referralCode) {
            const { data: refUserId } = await supabase.rpc('resolve_referral_by_username', { 
              p_username: referralCode 
            });
            referredBy = refUserId;
          }

          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id, 
              email: data.user.email,
              referred_by: referredBy
            });
          
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
      // Safety check: Fetch latest balance from server to prevent overwriting with 0 if local state is stale
      const { data: currentBalanceData, error: fetchError } = await supabase
        .from('user_balances')
        .select('amount')
        .eq('user_id', user.id)
        .eq('coin_symbol', 'GLD')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentGld = currentBalanceData?.amount || 0;
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
    
    // Check if they are already in waiting state to prevent multiple windows
    if (isWaitingForAd) return;

    const adUrl = "https://www.profitablecpmratenetwork.com/iefjy68tq?key=8a88eabcfabfca1a7fadd4a9fb46a455";
    setAdClickTime(Date.now());
    setIsWaitingForAd(true);
    setMiningMessage({ type: 'success', text: 'Opening ad... Please wait 4 seconds to start mining.' });
    
    window.open(adUrl, '_blank');

    // AUTO-START FALLBACK: If they don't leave the tab or visibility event fails
    // We try to start mining automatically after 5 seconds anyway to ensure it "works"
    setTimeout(() => {
      if (isWaitingForAd) {
        setIsWaitingForAd(false);
        setAdClickTime(null);
        setMiningMessage(null);
        executeStartMining();
      }
    }, 6000);
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
      // Safety check: Fetch latest balance from server to prevent overwriting with 0 if local state is stale
      const { data: currentBalanceData, error: fetchError } = await supabase
        .from('user_balances')
        .select('amount')
        .eq('user_id', user.id)
        .eq('coin_symbol', 'GLD')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentGld = currentBalanceData?.amount || 0;
      const newGld = currentGld + reward;
      const newCompletedTasks = [...completedTasks, taskId];

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

  const handleSyncKYC = async () => {
    if (!user || !legacyUid) return;
    if (kycData && kycData.status !== 'pending') return;

    try {
      const userDocRef = doc(legacyDb, "users", legacyUid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const { fullPhoneNumber, realName, kycStage2SubmittedAt } = data;

        // Check if all three are present
        if (fullPhoneNumber && realName && kycStage2SubmittedAt) {
          // Success: Update Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_phone_number: fullPhoneNumber,
              real_name: realName,
              kyc_stage2_date: kycStage2SubmittedAt,
              kyc_status: 'verified'
            })
            .eq('id', user.id);

          if (updateError) throw updateError;

          setKycData({
            status: 'verified',
            realName,
            phone: fullPhoneNumber,
            date: kycStage2SubmittedAt
          });
        } else {
          // Missing data: Mark as failed
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ kyc_status: 'failed' })
            .eq('id', user.id);

          if (updateError) throw updateError;

          setKycData(prev => prev ? { ...prev, status: 'failed' } : { status: 'failed', realName: null, phone: null, date: null });
        }
      } else {
        throw new Error('Legacy user document not found.');
      }
    } catch (err) {
      console.error('KYC Sync Error:', err);
    }
  };

  const handleUpdateAcademyProgress = async (questionId: number, isCorrect: boolean) => {
    if (!user || !isCorrect || academyProgress.completed_question_ids.includes(questionId)) return;

    const newCompletedIds = [...academyProgress.completed_question_ids, questionId];
    const newScore = Math.floor((newCompletedIds.length / 100) * 100); // Each question is 1%
    const newIsEligible = newScore >= 75;

    try {
      const { error } = await supabase
        .from('academy_progress')
        .upsert({
          user_id: user.id,
          completed_question_ids: newCompletedIds,
          total_score: newScore,
          is_eligible: newIsEligible,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setAcademyProgress({
        completed_question_ids: newCompletedIds,
        total_score: newScore,
        is_eligible: newIsEligible
      });
    } catch (err) {
      console.error('Error updating academy progress:', err);
    }
  };

  const handleUpdateUsername = async (newUsername: string) => {
    if (!user) return { success: false, message: 'Not authenticated' };
    
    try {
      // 1. Check if unique
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .maybeSingle();
      
      if (checkError) throw checkError;
      if (existing && existing.id !== user.id) {
        return { success: false, message: 'Username already taken' };
      }

      // 2. Update Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: newUsername, referral_code: newUsername })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileUsername(newUsername);
      await loadUserData(); // Refresh stats including referral_code
      return { success: true, message: 'Username updated successfully' };
    } catch (err: any) {
      console.error('Error updating username:', err);
      return { success: false, message: err.message };
    }
  };

  const handleClaimStrike = async () => {
    if (!user) return { success: false, message: 'Not logged in' };
    try {
      const { data, error } = await supabase.rpc('claim_daily_strike', { p_user_id: user.id });
      if (error) throw error;
      
      if (data.success) {
        await loadUserData(); // Refresh balances and streak info
        return { success: true, message: data.message, reward: data.reward, streakDay: data.streak_day };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      console.error('Error claiming strike:', err);
      // Try to parse error message if it's a Supabase error
      const msg = err.message || 'An unexpected error occurred';
      return { success: false, message: msg };
    }
  };

  const handleUpdateProfileInfo = async (realName: string, phone: string) => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          real_name: realName, 
          full_phone_number: phone,
          kyc_status: 'pending' // Still pending, but now has data
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh local state
      setKycData(prev => ({
        ...prev!,
        realName,
        phone,
        status: 'pending'
      }));
      
      return { success: true, message: 'Information locked successfully' };
    } catch (err: any) {
      console.error('Error updating profile info:', err);
      return { success: false, message: err.message };
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
            onProfileClick={() => setActiveTab('more')}
            activeReferralsCount={referralStats?.user_active_count || 0}
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
      case 'kyc':
        return (
          <KYCPage 
            data={kycData} 
            onSync={handleSyncKYC} 
            onBack={() => setActiveTab('more')} 
            hasLegacyUid={!!legacyUid}
          />
        );
      case 'profile':
        return (
          <ProfilePage 
            user={user!}
            username={profileUsername}
            kycData={kycData}
            streakCount={streakCount}
            lastStreakDate={lastStreakDate}
            lastMiningTime={lastMiningTime}
            onUpdateUsername={handleUpdateUsername}
            onUpdateProfileInfo={handleUpdateProfileInfo}
            onClaimStrike={handleClaimStrike}
            onBack={() => setActiveTab('more')}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            user={user!}
            onBack={() => setActiveTab('more')}
            onLogout={handleLogout}
          />
        );
      case 'academy':
        return (
          <AcademyPage 
            user={user!}
            progress={academyProgress}
            onUpdateProgress={handleUpdateAcademyProgress}
            onBack={() => setActiveTab('more')}
          />
        );
      case 'referral':
        return (
          <ReferralPage 
            stats={referralStats}
            onBack={() => setActiveTab('more')}
            onGoToProfile={() => setActiveTab('profile')}
            username={profileUsername}
          />
        );
      case 'mainnet': return <MainnetTab />;
      case 'more': return <MoreTab userId={user?.id || ''} onBalanceUpdate={loadUserData} onLogout={handleLogout} onKYCClick={(tab?: string) => setActiveTab(tab === 'academy' ? 'academy' : tab === 'profile' ? 'profile' : tab === 'settings' ? 'settings' : tab === 'referral' ? 'referral' : 'kyc')} />;
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
            onProfileClick={() => setActiveTab('more')}
            activeReferralsCount={referralStats?.user_active_count || 0}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white max-w-md mx-auto relative overflow-hidden flex flex-col">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-20%] w-[80%] h-[40%] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-20%] w-[80%] h-[40%] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

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
          label={t('common.dashboard')} 
        />
        <NavButton 
          active={activeTab === 'wallet'} 
          onClick={() => setActiveTab('wallet')} 
          icon={<Icon name="wallet" className="w-6 h-6" />} 
          label={t('common.wallet')} 
        />
        <NavButton 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')} 
          icon={<Icon name="check-square" className="w-6 h-6" />} 
          label={t('common.tasks')} 
        />
        <NavButton 
          active={activeTab === 'mainnet'} 
          onClick={() => setActiveTab('mainnet')} 
          icon={<Icon name="rocket" className="w-6 h-6" />} 
          label={t('common.mainnet')} 
        />
        <NavButton 
          active={activeTab === 'more'} 
          onClick={() => setActiveTab('more')} 
          icon={
            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all ${activeTab === 'more' ? 'bg-gold/20 border-gold' : 'bg-gold/10 border-gold/20'} border`}>
              <Icon name="users" className={`w-4 h-4 ${activeTab === 'more' ? 'text-gold' : 'text-gold/70'}`} />
            </div>
          } 
          label={t('common.profile')} 
        />
      </nav>
    </div>
  );
}

const PepeCaveGame = ({ userId, onClose, onBalanceUpdate }: { userId: string; onClose: () => void; onBalanceUpdate: () => void }) => {
  const { t } = useTranslation();
  const [roundData, setRoundData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<'puzzle' | 'cave'>('puzzle');
  const [isBroken, setIsBroken] = useState(false);
  const [revealedCell, setRevealedCell] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [nextRound, setNextRound] = useState<string>('');

  // Entry Puzzle State
  const [puzzleCards, setPuzzleCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);

  useEffect(() => {
    // Inject Ad Script for PEPE CAVE
    const script = document.createElement('script');
    script.src = "//guidepaparazzisurface.com/in.js";
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-clipid', '2109924');
    document.body.appendChild(script);

    fetchCaveData();
    initPuzzle();

    return () => {
      // Cleanup script on game close
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchCaveData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_pepe_cave');
      if (error) throw error;
      setRoundData(data[0]);
      
      // Calculate next round countdown
      const now = new Date();
      const nextHour = Math.ceil((now.getUTCHours() + 0.1) / 4) * 4;
      const nextDate = new Date();
      nextDate.setUTCHours(nextHour % 24, 0, 0, 0);
      if (nextHour >= 24) nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      
      const updateCountdown = () => {
        const diff = nextDate.getTime() - new Date().getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setNextRound(`${h}h ${m}m ${s}s`);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);

    } catch (err: any) {
      console.error('Cave Fetch Error:', err);
      setMessage({ type: 'error', text: t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  const initPuzzle = () => {
    const icons = ['gem', 'zap', 'flame', 'star', 'heart', 'moon'];
    const pairs = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, id) => ({ id, icon }));
    setPuzzleCards(pairs);
    setFlipped([]);
    setSolved([]);
  };

  const handleCardClick = (id: number) => {
    if (flipped.length === 2 || flipped.includes(id) || solved.includes(id)) return;

    if (flipped.length === 1) {
      const firstId = flipped[0];
      setFlipped([firstId, id]);
      if (puzzleCards[firstId].icon === puzzleCards[id].icon) {
        setSolved(prev => [...prev, firstId, id]);
        setFlipped([]);
        if (solved.length + 2 === puzzleCards.length) {
          setTimeout(() => setGameState('cave'), 1000);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    } else {
      setFlipped([id]);
    }
  };

  const handleCaveClick = async (cellId: number) => {
    if (revealedCell !== null || claiming || roundData.cells[cellId].claimed_by) return;

    // Check if user already claimed this round
    const hasClaimed = roundData.cells.some((c: any) => c.claimed_by === userId);
    if (hasClaimed) {
      setMessage({ type: 'error', text: t('pepe.alreadyExplored') });
      return;
    }

    setClaiming(true);
    try {
      const amount = roundData.cells[cellId].amount;
      
      // Update Supabase via RPC to ensure atomicity
      const { data, error } = await supabase.rpc('claim_pepe_cave_cell', { 
        round_id: roundData.id, 
        cell_idx: cellId 
      });

      if (error) throw error;

      // Local update for UI
      const newCells = [...roundData.cells];
      newCells[cellId].claimed_by = userId;
      setRoundData({ ...roundData, cells: newCells });
      
      setRevealedCell(cellId);
      onBalanceUpdate();
      setMessage({ type: 'success', text: t('pepe.revealSuccess', { amount }) });
    } catch (err: any) {
      console.error('Claim Error:', err);
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-4">
      <Loader2 className="w-12 h-12 text-gold animate-spin" />
      <p className="text-gold font-bold animate-pulse">{t('pepe.entering')}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 relative p-2">
      <header className="flex items-center gap-4 px-2">
        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
          <Icon name="arrow-left" className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-green-500 tracking-tighter flex items-center gap-2">
            <Icon name="gamepad-2" className="w-5 h-5" /> {t('pepe.title')}
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1 text-gold"><Icon name="refresh-cw" className="w-2.5 h-2.5" /> {t('pepe.nextRound')}: {nextRound}</span>
          </div>
        </div>
      </header>

      <div className="glass rounded-[32px] p-4 border-green-500/20 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {gameState === 'puzzle' ? (
            <motion.div 
              key="puzzle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8 py-8"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">{t('pepe.gateLocked')}</h3>
                <p className="text-gray-400 text-xs px-8">{t('pepe.gateDesc')}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {puzzleCards.map((card) => (
                  <button 
                    key={card.id}
                    onClick={() => handleCardClick(card.id)}
                    className="w-20 h-20 rounded-2xl relative preserve-3d transition-all duration-500"
                    style={{ 
                      transform: flipped.includes(card.id) || solved.includes(card.id) ? 'rotateY(180deg)' : 'none'
                    }}
                  >
                    <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backface-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold/30">
                        ?
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gold/20 border border-gold/50 rounded-2xl flex items-center justify-center backface-hidden rotate-y-180">
                      <Icon name={card.icon} className="w-8 h-8 text-gold" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="cave"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between px-2 bg-green-500/5 p-3 rounded-2xl border border-green-500/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">{t('pepe.rewardTitle')}</span>
                  <span className="text-lg font-black text-green-400">10,000 PEPE</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center p-1 border border-green-500/30">
                  <img src="https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg" alt="PEPE" className="w-full h-full rounded-full" />
                </div>
              </div>

              {/* Honeycomb Grid */}
              <div className="relative overflow-x-auto pb-4 custom-scrollbar">
                <div 
                  className="grid grid-cols-10 gap-x-1 gap-y-[10px] min-w-[500px] py-4"
                  style={{ transform: 'translateX(-10px)' }}
                >
                  {roundData.cells.map((cell: any, i: number) => {
                    const row = Math.floor(i / 10);
                    const isEvenRow = row % 2 !== 0;
                    const isClaimed = cell.claimed_by !== null;
                    const isMine = cell.claimed_by === userId;

                    return (
                      <button
                        key={i}
                        disabled={isClaimed || claiming}
                        onClick={() => handleCaveClick(i)}
                        className={`w-12 h-14 relative transition-all duration-300 transform ${isEvenRow ? 'translate-x-6' : ''} ${isRevealedCell(i) ? 'rotate-y-180 scale-110 z-10' : 'hover:scale-105'} flex items-center justify-center`}
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                        }}
                      >
                        <div className={`absolute inset-0 preserve-3d transition-all duration-500 ${revealedCell === i ? 'rotate-y-180' : ''}`}>
                          {/* Face Up (Rock) */}
                          <div className={`absolute inset-0 backface-hidden flex items-center justify-center border transition-all ${isClaimed ? 'bg-black/40 border-white/5 opacity-30' : 'bg-[#2a303c] border-white/10 shadow-lg shadow-black/50'}`}>
                            {isClaimed ? (
                              <Icon name="x" className="w-4 h-4 text-red-500/50" />
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 opacity-50">
                                <Icon name="mountain" className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          {/* Face Down (Reward) */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-green-500/20 border border-green-500 flex flex-col items-center justify-center">
                            <img src="https://coin-images.coingecko.com/coins/images/29850/large/pepe-token.jpeg" alt="P" className="w-5 h-5 rounded-full mb-0.5" />
                            <span className="text-[10px] font-black text-green-400 leading-none">{cell.amount}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl text-[11px] font-bold text-center border ${
                    message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 p-4 glass rounded-3xl border-white/5">
        <h4 className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-2">
          <Icon name="shield-check" className="w-3 h-3" /> {t('pepe.rulesTitle')}
        </h4>
        <ul className="text-[11px] text-gray-400 flex flex-col gap-1.5 list-disc pl-4 leading-relaxed">
          <li>{t('pepe.rule1')}</li>
          <li>{t('pepe.rule2')}</li>
          <li>{t('pepe.rule3')}</li>
          <li>{t('pepe.rule4')}</li>
        </ul>
      </div>

      <button 
        onClick={onClose}
        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-[0.98]"
      >
        <Icon name="arrow-left" className="w-4 h-4" />
        {t('pepe.goBack')}
      </button>
    </div>
  );

  function isRevealedCell(i: number) {
    return revealedCell === i;
  }
};
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
