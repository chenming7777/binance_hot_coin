'use client'

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff, MoreHorizontal, Activity } from 'lucide-react';

interface CoinData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  high24h: number;
  low24h: number;
  priceChange: number;
  quoteVolume: number;
  eventType: string;
  eventTime: number;
}

interface TickerData {
  e: string;     // Event type (24hrMiniTicker, 4hTicker, 1hTicker)
  E: number;     // Event time
  s: string;     // Symbol
  c: string;     // Close price (current price)
  o: string;     // Open price
  h: string;     // High price
  l: string;     // Low price  
  v: string;     // Volume
  q: string;     // Quote volume
  P?: string;    // Price change percent
  p?: string;    // Price change
}

const CryptoDashboard: React.FC = () => {
  const [hotCoins, setHotCoins] = useState<CoinData[]>([]);
  const [topGainers, setTopGainers] = useState<CoinData[]>([]);
  const [topLosers, setTopLosers] = useState<CoinData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string>('24hrMiniTicker');
  const [tickerStats, setTickerStats] = useState({ total: 0, usdt: 0, filtered: 0 });

    useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        
        // Fetch the JSON file from public directory
        // Make sure to place Lz2kqpqC.json in your public folder
        const response = await fetch('/Lz2kqpqC.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: TickerData[] = await response.json();
        
        console.log('Successfully loaded', data.length, 'tickers');
        processTickerData(data);
        setLastUpdate(new Date());
        setIsConnected(true);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please ensure Lz2kqpqC.json is in the public folder.');
        setIsConnected(false);
      }
    };

    loadData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [selectedTimeFrame]);

  const processTickerData = (data: TickerData[]) => {
    try {
      // Filter by selected time frame
      const filteredByTimeFrame = data.filter(ticker => 
        ticker.e === selectedTimeFrame
      );

      // Filter USDT pairs and process data
      const usdtPairs: CoinData[] = filteredByTimeFrame
        .filter(ticker => ticker.s && ticker.s.endsWith('USDT') && ticker.c)
        .map(ticker => {
          const price = parseFloat(ticker.c);
          const openPrice = parseFloat(ticker.o);
          
          // Use provided percentage change if available, otherwise calculate
          let change24h = 0;
          if (ticker.P) {
            change24h = parseFloat(ticker.P);
          } else if (openPrice > 0) {
            change24h = ((price - openPrice) / openPrice) * 100;
          }
          
          const volume = parseFloat(ticker.v) || 0;
          const priceChange = ticker.p ? parseFloat(ticker.p) : (price - openPrice);
          
          return {
            symbol: ticker.s.replace('USDT', ''),
            price: price,
            change24h: change24h,
            volume: volume,
            high24h: parseFloat(ticker.h) || price,
            low24h: parseFloat(ticker.l) || price,
            priceChange: priceChange,
            quoteVolume: parseFloat(ticker.q) || 0,
            eventType: ticker.e,
            eventTime: ticker.E
          };
        })
        .filter(coin => 
          coin.price > 0 && 
          !isNaN(coin.change24h) && 
          coin.volume > 0 &&
          // Filter out leveraged tokens and wrapped tokens
          !coin.symbol.includes('UP') &&
          !coin.symbol.includes('DOWN') &&
          !coin.symbol.includes('BULL') &&
          !coin.symbol.includes('BEAR') &&
          !coin.symbol.includes('1000') &&
          !coin.symbol.match(/^\d/) && // No symbols starting with numbers
          coin.symbol.length <= 10
        );

      // Update statistics
      setTickerStats({
        total: data.length,
        usdt: filteredByTimeFrame.filter(t => t.s && t.s.endsWith('USDT')).length,
        filtered: usdtPairs.length
      });

      // Sort by quote volume (USD volume) for hot coins
      const hotCoinsList = [...usdtPairs]
        .sort((a, b) => b.quoteVolume - a.quoteVolume)
        .slice(0, 10);

      // Sort by percentage change for gainers
      const gainersList = [...usdtPairs]
        .filter(coin => coin.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, 10);

      // Sort by percentage change for losers
      const losersList = [...usdtPairs]
        .filter(coin => coin.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h)
        .slice(0, 10);

      setHotCoins(hotCoinsList);
      setTopGainers(gainersList);
      setTopLosers(losersList);
    } catch (error) {
      console.error('Error processing ticker data:', error);
      setError('Error processing ticker data');
    }
  };

  const formatPrice = (price: number): string => {
    if (price < 0.00001) {
      return `$${price.toFixed(8)}`;
    } else if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 100) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const getTimeFrameLabel = (eventType: string): string => {
    switch (eventType) {
      case '24hrMiniTicker': return '24h';
      case '4hTicker': return '4h';
      case '1hTicker': return '1h';
      default: return '24h';
    }
  };

  const getCoinIcon = (symbol: string): string => {
    // Common crypto symbols - return first 3-4 chars
    const iconMap: { [key: string]: string } = {
      'BTC': '₿',
      'ETH': 'Ξ',
      'BNB': 'BNB',
      'XRP': 'XRP',
      'ADA': 'ADA',
      'DOGE': 'DOGE',
      'SOL': 'SOL',
      'DOT': 'DOT',
      'MATIC': 'MATIC',
      'SHIB': 'SHIB',
      'TRX': 'TRX',
      'AVAX': 'AVAX',
      'LINK': 'LINK',
      'ATOM': 'ATOM',
      'LTC': 'LTC',
      'UNI': 'UNI',
      'NEAR': 'NEAR',
      'BCH': 'BCH',
      'XLM': 'XLM',
      'ALGO': 'ALGO',
      'VET': 'VET',
      'HBAR': 'HBAR',
      'FIL': 'FIL',
      'SAND': 'SAND',
      'MANA': 'MANA',
      'AXS': 'AXS',
      'THETA': 'THETA',
      'EGLD': 'EGLD',
      'XTZ': 'XTZ',
      'EOS': 'EOS',
      'AAVE': 'AAVE',
      'MKR': 'MKR',
      'COMP': 'COMP',
      'SNX': 'SNX',
      'RUNE': 'RUNE',
      'YFI': 'YFI',
      'SUSHI': 'SUSHI',
      'ZEC': 'ZEC',
      'WAVES': 'WAVE',
      'DASH': 'DASH',
      'ZIL': 'ZIL',
      'BAT': 'BAT',
      'ENJ': 'ENJ',
      'QTUM': 'QTUM',
      'OMG': 'OMG',
      'IOTA': 'IOTA',
      'NEO': 'NEO'
    };
    
    if (iconMap[symbol]) {
      return iconMap[symbol];
    }
    
    // For other symbols, show first 3-4 characters
    return symbol.length > 4 ? symbol.slice(0, 4) : symbol;
  };

  const CoinRow: React.FC<{ coin: CoinData; rank: number }> = ({ coin, rank }) => (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-800 transition-colors rounded-lg">
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-gray-400 text-sm w-6">{rank}</span>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
          {getCoinIcon(coin.symbol)}
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium">{coin.symbol}</span>
          <span className="text-gray-500 text-xs">Vol: {formatVolume(coin.quoteVolume)}</span>
        </div>
      </div>
      
      <div className="text-right px-4">
        <div className="text-white font-medium">{formatPrice(coin.price)}</div>
        <div className="text-gray-500 text-xs">
          H: {formatPrice(coin.high24h)} L: {formatPrice(coin.low24h)}
        </div>
      </div>
      
      <div className={`text-right min-w-[100px] ${coin.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        <div className="flex items-center justify-end space-x-1">
          {coin.change24h >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-semibold">{formatChange(coin.change24h)}</span>
        </div>
        <div className="text-xs opacity-75">
          {coin.priceChange >= 0 ? '+' : ''}{formatPrice(Math.abs(coin.priceChange))}
        </div>
      </div>
    </div>
  );

  const TableSection: React.FC<{ 
    title: string; 
    coins: CoinData[]; 
    category: string;
    color: string;
  }> = ({ title, coins, category, color }) => (
    <div className="bg-gray-900 rounded-xl shadow-xl border border-gray-800">
      <div className={`flex items-center justify-between p-6 pb-4 border-b border-gray-800 bg-gradient-to-r ${color}`}>
        <h2 className="text-xl font-bold text-white flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          {title}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded-full">
            {coins.length} coins
          </span>
        </div>
      </div>
      
      <div className="p-6 pt-4">
        <div className="space-y-2">
          {error ? (
            <div className="text-center py-8 text-red-400">
              {error}
            </div>
          ) : coins.length > 0 ? (
            coins.map((coin, index) => (
              <CoinRow 
                key={`${coin.symbol}-${category}`} 
                coin={coin} 
                rank={index + 1}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isConnected ? 'No data available' : 'Loading data...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Binance Live Tracker
              </h1>
              <p className="text-gray-400 text-lg">Real-time cryptocurrency market data</p>
            </div>
            <div className="flex items-center space-x-6">
              <select 
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors text-lg font-medium"
              >
                <option value="24hrMiniTicker">24 Hour</option>
                <option value="4hTicker">4 Hour</option>
                <option value="1hTicker">1 Hour</option>
              </select>
              <div className="flex items-center space-x-3 bg-gray-800 px-6 py-3 rounded-lg">
                {isConnected ? (
                  <Wifi className="w-6 h-6 text-green-400 animate-pulse" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-400" />
                )}
                <span className={`text-base font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="mt-6 flex items-center justify-between bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <div className="text-gray-400 text-base">
                Last updated: <span className="text-white font-medium">{lastUpdate.toLocaleString()}</span>
              </div>
              <div className="flex space-x-6 text-base">
                <span className="text-gray-400">
                  Total tickers: <span className="text-white font-semibold">{tickerStats.total}</span>
                </span>
                <span className="text-gray-400">
                  USDT pairs: <span className="text-white font-semibold">{tickerStats.usdt}</span>
                </span>
                <span className="text-gray-400">
                  Displayed: <span className="text-white font-semibold">{tickerStats.filtered}</span>
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          <TableSection 
            title="🔥 Hot Coins" 
            coins={hotCoins} 
            category="hot"
            color="from-orange-900/20 to-red-900/20"
          />
          
          <TableSection 
            title="🚀 Top Gainers" 
            coins={topGainers} 
            category="gainers"
            color="from-green-900/20 to-emerald-900/20"
          />
          
          <TableSection 
            title="📉 Top Losers" 
            coins={topLosers} 
            category="losers"
            color="from-red-900/20 to-pink-900/20"
          />
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700 max-w-4xl mx-auto">
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDashboard;