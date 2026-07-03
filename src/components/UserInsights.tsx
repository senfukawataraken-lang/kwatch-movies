import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BarChart3, PieChart as PieIcon, Clock, Calendar, 
  TrendingUp, RefreshCw, Play, Film, Award, Heart, PlusCircle, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area, CartesianGrid, LineChart, Line
} from 'recharts';
import { UserProfile, Movie } from '../types';

interface UserInsightsProps {
  currentProfile: UserProfile;
  movies: Movie[];
  onClose: () => void;
}

// Color palette matching the premium dark theme
const COLORS_GENRES = [
  '#8b5cf6', // Purple / Violet 500
  '#a78bfa', // Light Purple 400
  '#06b6d4', // Cyan 500
  '#3b82f6', // Blue 500
  '#10b981', // Emerald 500
  '#c084fc', // Bright Purple
  '#ec4899', // Pink 500
  '#ef4444', // Red 500
];

export default function UserInsights({ currentProfile, movies, onClose }: UserInsightsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'genres' | 'timeline' | 'hours'>('overview');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showSimulatedWatchToast, setShowSimulatedWatchToast] = useState<string | null>(null);

  // Deterministic local state for additional simulated logs that can be added to dynamically
  const [simulatedLogs, setSimulatedLogs] = useState<{title: string, genre: string, duration: number, date: string, hour: number}[]>([]);

  // Stable hashing helper based on profile details to make profiles distinct
  const profileHash = useMemo(() => {
    let hash = 0;
    const key = currentProfile.id + currentProfile.name;
    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }
    return hash;
  }, [currentProfile.id, currentProfile.name]);

  // Generate deterministic or profile-custom database stats
  const profileStats = useMemo(() => {
    // Modify stats dynamically based on kids vs mature profiles
    const isKids = currentProfile.isKids;
    
    // Genres weighting
    let baseGenres: { genre: string; count: number }[] = [];
    if (isKids) {
      baseGenres = [
        { genre: 'Animation', count: 18 + (profileHash % 7) },
        { genre: 'Family', count: 14 + (profileHash % 5) },
        { genre: 'Comedy', count: 9 + (profileHash % 4) },
        { genre: 'Fantasy', count: 5 },
      ];
    } else {
      baseGenres = [
        { genre: 'Sci-Fi', count: 14 + (profileHash % 8) },
        { genre: 'Action', count: 12 + (profileHash % 6) },
        { genre: 'Drama', count: 10 + (profileHash % 5) },
        { genre: 'Horror', count: 4 + (profileHash % 3) },
        { genre: 'Documentary', count: 6 + (profileHash % 4) },
        { genre: 'Romance', count: 5 + (profileHash % 5) },
      ];
    }

    // Include dynamically simulated additions
    simulatedLogs.forEach(log => {
      const existing = baseGenres.find(bg => bg.genre.toLowerCase() === log.genre.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        baseGenres.push({ genre: log.genre, count: 1 });
      }
    });

    // Sort genres by views
    baseGenres.sort((a, b) => b.count - a.count);

    // Watch Time Timeline over the course of the past 7 days
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const timelineData = DAYS.map((day, ix) => {
      let multiplier = 45;
      if (day === 'Fri' || day === 'Sat') multiplier = 95; // more active weekends
      if (isKids) multiplier -= 10;
      
      const seedVal = (profileHash + ix * 53) % 40;
      let minutesWatched = multiplier + seedVal;

      // Add any logs matching this date/day of week
      simulatedLogs.forEach(log => {
        if (log.date === day) {
          minutesWatched += log.duration;
        }
      });

      return {
        day,
        'Watch Time (min)': minutesWatched,
        'Average Stream Quality (Mbps)': parseFloat((7.2 + (ix % 3) * 0.9).toFixed(1)),
      };
    });

    // Preferred Hourly distribution (00:00 - 23:00 summarized into 6 key slots)
    const hourlyDistribution = [
      { slot: 'Late Night (12a-4a)', hour: 2, 'Sessions': isKids ? 1 : 12 + (profileHash % 8) },
      { slot: 'Early Morning (4a-8a)', hour: 6, 'Sessions': isKids ? 4 + (profileHash % 3) : 2 + (profileHash % 2) },
      { slot: 'Morning (8a-12p)', hour: 10, 'Sessions': isKids ? 15 + (profileHash % 6) : 6 + (profileHash % 4) },
      { slot: 'Afternoon (12p-4p)', hour: 14, 'Sessions': isKids ? 28 + (profileHash % 10) : 12 + (profileHash % 6) },
      { slot: 'Evening (4p-8p)', hour: 18, 'Sessions': isKids ? 34 + (profileHash % 12) : 25 + (profileHash % 10) },
      { slot: 'Night (8p-12a)', hour: 22, 'Sessions': isKids ? 8 + (profileHash % 4) : 42 + (profileHash % 15) },
    ];

    // Adjust for logs
    simulatedLogs.forEach(log => {
      let slotIdx = 5; // Default Night
      if (log.hour >= 0 && log.hour < 4) slotIdx = 0;
      else if (log.hour >= 4 && log.hour < 8) slotIdx = 1;
      else if (log.hour >= 8 && log.hour < 12) slotIdx = 2;
      else if (log.hour >= 12 && log.hour < 16) slotIdx = 3;
      else if (log.hour >= 16 && log.hour < 20) slotIdx = 4;
      
      hourlyDistribution[slotIdx].Sessions += 1;
    });

    // Compute overview aggregations
    const totalMinutes = timelineData.reduce((sum, item) => sum + item['Watch Time (min)'], 0);
    const avgDailyMinutes = Math.round(totalMinutes / 7);
    const primaryGenre = baseGenres[0]?.genre || 'Unspecified';
    const totalSessions = hourlyDistribution.reduce((sum, item) => sum + item.Sessions, 0);

    return {
      genres: baseGenres,
      timeline: timelineData,
      hours: hourlyDistribution,
      totalMinutes,
      avgDailyMinutes,
      primaryGenre,
      totalSessions,
    };
  }, [profileHash, currentProfile.isKids, simulatedLogs, refreshKey]);

  // Log a dynamic watch event
  const handleSimulateWatch = () => {
    // Pick a random movie
    if (!movies || movies.length === 0) return;
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    const durationMin = Math.floor(Math.random() * 50) + 40; // 40-90 min
    const hours = [2, 6, 10, 14, 18, 22];
    const randomHour = hours[Math.floor(Math.random() * hours.length)];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const randomDay = days[Math.floor(Math.random() * days.length)];

    const newLog = {
      title: randomMovie.title,
      genre: randomMovie.genres[0] || 'Drama',
      duration: durationMin,
      date: randomDay,
      hour: randomHour
    };

    setSimulatedLogs(current => [newLog, ...current]);
    setShowSimulatedWatchToast(`Watched ${durationMin}m of "${randomMovie.title}" simulated logs recalculated!`);
    setTimeout(() => {
      setShowSimulatedWatchToast(null);
    }, 4000);
  };

  const handleClearHistory = () => {
    if (confirm("Reset current profile custom logged insights? System default historical vectors remain.")) {
      setSimulatedLogs([]);
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-neutral-950 border border-neutral-850 rounded-2xl max-w-4xl w-full flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden shadow-2xl relative"
      >
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-neutral-900 flex items-center justify-between bg-neutral-950/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/10 text-purple-400 rounded-xl border border-purple-500/10">
              <BarChart3 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Streaming Statistics & Insights</span>
                <span className="text-[10px] bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded font-mono font-bold border border-purple-500/10">
                  REAL-TIME BETA
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono tracking-wide uppercase">
                Detailed telemetry analytics for <span className="text-white font-bold">{currentProfile.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK INTEGRATION DYNAMIC TOAST */}
        <AnimatePresence>
          {showSimulatedWatchToast && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-green-950/40 border-b border-green-500/20 px-6 py-3 text-xs font-semibold text-green-400 flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0 text-green-500" />
              <span>{showSimulatedWatchToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METRICS ROW CARDS */}
        <div className="p-6 bg-neutral-950/30 border-b border-neutral-900 grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
          
          <div className="p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-xl space-y-1.5">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" /> Total Streaming
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white">
                {profileStats.totalMinutes}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">min</span>
            </div>
            <span className="text-[9px] text-neutral-500 block">Cumulative last 7 days</span>
          </div>

          <div className="p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-xl space-y-1.5">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" /> Daily Average
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {profileStats.avgDailyMinutes}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">min/day</span>
            </div>
            <span className="text-[9px] text-neutral-500 block">Usage intensity status</span>
          </div>

          <div className="p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-xl space-y-1.5">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-400" /> Favorite Genre
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-purple-400 truncate max-w-full">
                {profileStats.primaryGenre}
              </span>
            </div>
            <span className="text-[9px] text-neutral-500 block">Based on session counters</span>
          </div>

          <div className="p-3.5 bg-neutral-900/30 border border-neutral-900 rounded-xl space-y-1.5">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Watch Sessions
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {profileStats.totalSessions}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold">starts</span>
            </div>
            <span className="text-[9px] text-neutral-500 block">Cached interaction count</span>
          </div>

        </div>

        {/* INTERACTIVE CONTROLS TABS */}
        <div className="px-6 py-2 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Dashboard Home' },
              { id: 'genres', label: 'Genre Shares' },
              { id: 'timeline', label: 'Weekly Activity' },
              { id: 'hours', label: 'Viewer Hours' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-neutral-900 border-neutral-800 text-white font-bold'
                    : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSimulateWatch}
              className="px-2.5 py-1.5 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 rounded-lg text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Add a random movie title to streamed log simulation details context"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Log Watch
            </button>
            {simulatedLogs.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-400 rounded-lg cursor-pointer hover:bg-neutral-850"
                title="Reset simulation parameters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* WORKSPACE & VIEWPORTS SPLIT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-radial from-neutral-900/20 to-neutral-950">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* PRIMARY GRAPHICS CELL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. SHORT GENRE ANALYSIS BAR GRAPH */}
                <div className="p-5 bg-neutral-900/40 border border-neutral-900 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-purple-400" /> Genre Viewership Shares
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profileStats.genres} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="genre" stroke="#737373" fontSize={10} tickLine={false} />
                        <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px' }} 
                          labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                          {profileStats.genres.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_GENRES[index % COLORS_GENRES.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. ACTIVITY STREAM OVERVIEW AREA */}
                <div className="p-5 bg-neutral-900/40 border border-neutral-900 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> 7-Day Stream Activity (minutes)
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profileStats.timeline} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="day" stroke="#737373" fontSize={10} tickLine={false} />
                        <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#06b6d4', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="Watch Time (min)" stroke="#06b6d4" fillOpacity={1} fill="url(#gradientColor)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* SIMULATED SESSION HISTORY DETAILED TRACK */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    Telemetry Stream Logs ({profileStats.totalSessions} sessions logged)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Real-time Sandbox Cache</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {simulatedLogs.length === 0 ? (
                    <div className="p-6 text-center bg-[#171717]/20 rounded-xl border border-neutral-900/60 col-span-2">
                      <p className="text-xs text-neutral-500">
                        No custom streams added manually. Click "Log Watch" above to simulate real-time stream logs!
                      </p>
                    </div>
                  ) : (
                    simulatedLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-neutral-900/30 rounded-xl border border-neutral-900 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <strong className="block text-white truncate text-xs">{log.title}</strong>
                          <span className="text-[10px] text-neutral-500 mt-0.5 block font-mono">
                            Genre: <span className="text-purple-400">{log.genre}</span> • Time slot: hour {log.hour}:00
                          </span>
                        </div>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded font-mono text-[10px] text-neutral-300 shrink-0">
                          +{log.duration} min
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'genres' && (
            <div className="space-y-6">
              
              <div className="bg-neutral-900/40 p-6 border border-neutral-900 rounded-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  {/* CHART WRAPPER */}
                  <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profileStats.genres}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="genre"
                        >
                          {profileStats.genres.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_GENRES[index % COLORS_GENRES.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* CUSTOM METRIC LEGEND STATS */}
                  <div className="w-full md:w-1/2 space-y-3">
                    <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Target Genre Breakdown Details
                    </h5>
                    
                    <div className="space-y-2">
                      {profileStats.genres.map((entry, idx) => {
                        const percent = ((entry.count / profileStats.genres.reduce((acc, c) => acc + c.count, 0)) * 100).toFixed(0);
                        return (
                          <div 
                            key={entry.genre}
                            className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/40 border border-neutral-900 text-xs"
                          >
                            <span className="flex items-center gap-2 text-white font-semibold">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS_GENRES[idx % COLORS_GENRES.length] }} 
                              />
                              {entry.genre}
                            </span>
                            <span className="font-mono text-neutral-400 font-bold">
                              {entry.count} views ({percent}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>
              </div>

            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              
              <div className="bg-neutral-900/40 p-6 border border-neutral-900 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Daily Consumption Trends
                    </h5>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Minutes streaming day-by-day with dynamic weekday spikes</p>
                  </div>
                  <span className="text-[10px] text-cyan-400 bg-cyan-900/10 px-2.5 py-0.5 rounded font-mono border border-cyan-850/20">
                    Weekly Limit Target: 1000 min
                  </span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profileStats.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gradientTimeline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="day" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                      <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={10} style={{ fontSize: '11px' }} />
                      <Area type="monotone" name="Watch Time (min)" dataKey="Watch Time (min)" stroke="#8b5cf6" fillOpacity={1} fill="url(#gradientTimeline)" strokeWidth={2} />
                      <Line type="monotone" name="Stream Quality (Mbps)" dataKey="Average Stream Quality (Mbps)" stroke="#06b6d4" strokeWidth={2} dot={true} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'hours' && (
            <div className="space-y-6">
              
              <div className="bg-neutral-900/40 p-6 border border-neutral-900 rounded-xl space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Preferred Streaming Hours
                  </h5>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Optimal viewer hours logged for this specific profile identity</p>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profileStats.hours} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="slot" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                      <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                      />
                      <Line type="monotone" dataKey="Sessions" stroke="#a78bfa" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 bg-purple-600/5 border border-purple-500/10 rounded-xl">
                  <p className="text-[11px] text-neutral-400 leading-relaxed leading-normal">
                    💡 <strong>Insight recommendation:</strong> Based on historical patterns, your maximum screen interaction points cluster during <strong className="text-white">Late Evening and Nights</strong>. Turning on automatic Kwatch night time eye protector is advised for better sleep cycles!
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* SECURITY CACHE ACKNOWLEDGEMENT FOOTER */}
        <div className="p-4 px-6 bg-neutral-950 border-t border-neutral-900 text-[10px] sm:text-xs text-neutral-500 flex items-center justify-between bg-neutral-900/10">
          <span className="flex items-center gap-1.5 font-semibold">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            VOD Insight Vector Telemetry Sync Active
          </span>
          <span className="font-mono text-[9px] text-neutral-600">Recharts v2.12.0</span>
        </div>

      </motion.div>
    </div>
  );
}
