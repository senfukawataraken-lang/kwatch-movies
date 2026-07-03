import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Play, Trash2, Settings, HardDrive, AlertCircle, 
  Wifi, WifiOff, Zap, Activity, CheckCircle, Sliders, RefreshCw, 
  FileVideo, ShieldCheck, HelpCircle, ChevronRight, Ban
} from 'lucide-react';
import { Movie, UserProfile, DownloadTask } from '../types';
import { Pause, X as XIcon } from 'lucide-react';

interface MyDownloadsPageProps {
  downloadedIds: string[];
  movies: Movie[];
  downloadTasks: DownloadTask[];
  onPauseDownload: (id: string) => void;
  onResumeDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onRemoveDownload: (id: string) => void;
  onRemoveAllDownloads: () => void;
  onPlayMovie: (movie: Movie) => void;
  onTriggerDownload: (movieId: string) => void;
  autoDeleteWatched: boolean;
  onToggleAutoDeleteWatched: (checked: boolean) => void;
  currentProfile: UserProfile;
}

// OS / Storage reserve constant
const OS_RESERVE_GB = 14.8;
const DISK_LIMIT_GB = 128;

export default function MyDownloadsPage({
  downloadedIds,
  movies,
  downloadTasks = [],
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onRemoveDownload,
  onRemoveAllDownloads,
  onPlayMovie,
  onTriggerDownload,
  autoDeleteWatched,
  onToggleAutoDeleteWatched,
  currentProfile
}: MyDownloadsPageProps) {

  // Derived variables to preserve 100% backward compatibility
  const downloadingTask = downloadTasks.find(t => t.status === 'downloading');
  const downloadingMovieId = downloadingTask ? downloadingTask.id : null;
  const downloadProgress = downloadingTask ? Math.round(downloadingTask.progress) : 0;

  // Additional mock settings for high-fidelity offline simulation
  const [wifiOnly, setWifiOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem(`kwatch_dl_wifi_only_${currentProfile.id}`);
    return saved === "true";
  });

  const [downloadLimit, setDownloadLimit] = useState<number>(() => {
    const saved = localStorage.getItem(`kwatch_dl_limit_${currentProfile.id}`);
    return saved ? parseInt(saved) : 50; // default 50GB limit
  });

  const [speedSetting, setSpeedSetting] = useState<'standard' | 'high' | 'ultra'>(() => {
    const saved = localStorage.getItem(`kwatch_dl_speed_${currentProfile.id}`);
    return (saved as any) || 'high';
  });

  const [limitEnabled, setLimitEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(`kwatch_dl_limit_enabled_${currentProfile.id}`);
    return saved === 'true';
  });

  const [limitVal, setLimitVal] = useState<number>(() => {
    const saved = localStorage.getItem(`kwatch_dl_limit_val_${currentProfile.id}`);
    return saved ? parseInt(saved, 10) : 10;
  });

  const [dlStatusMessage, setDlStatusMessage] = useState<string | null>(null);

  // Sync high-fidelity offline options to local disk
  useEffect(() => {
    localStorage.setItem(`kwatch_dl_wifi_only_${currentProfile.id}`, wifiOnly ? "true" : "false");
  }, [wifiOnly, currentProfile.id]);

  useEffect(() => {
    localStorage.setItem(`kwatch_dl_limit_${currentProfile.id}`, downloadLimit.toString());
  }, [downloadLimit, currentProfile.id]);

  useEffect(() => {
    localStorage.setItem(`kwatch_dl_speed_${currentProfile.id}`, speedSetting);
  }, [speedSetting, currentProfile.id]);

  useEffect(() => {
    localStorage.setItem(`kwatch_dl_limit_enabled_${currentProfile.id}`, limitEnabled ? "true" : "false");
  }, [limitEnabled, currentProfile.id]);

  useEffect(() => {
    localStorage.setItem(`kwatch_dl_limit_val_${currentProfile.id}`, limitVal.toString());
  }, [limitVal, currentProfile.id]);

  // Real storage status estimate leveraging browser navigator.storage API
  const [realQuotaGB, setRealQuotaGB] = useState<number | null>(null);
  const [realUsageGB, setRealUsageGB] = useState<number | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.quota !== undefined && estimate.usage !== undefined) {
          setRealQuotaGB(parseFloat((estimate.quota / (1024 * 1024 * 1024)).toFixed(1)));
          setRealUsageGB(parseFloat((estimate.usage / (1024 * 1024 * 1024)).toFixed(3)));
        }
      }).catch(err => {
        console.warn("Storage estimate failed", err);
      });
    }
  }, []);

  // Compute live speed metrics depending on state
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  useEffect(() => {
    if (!downloadingMovieId) {
      setLiveSpeed(0);
      return;
    }
    const interval = setInterval(() => {
      let baseSpeed = 5;
      if (speedSetting === 'high') baseSpeed = 22;
      if (speedSetting === 'ultra') baseSpeed = 54;
      const fluctuation = (Math.random() - 0.5) * (baseSpeed * 0.3);
      let currentSimulatedSpeed = parseFloat((baseSpeed + fluctuation).toFixed(1));
      if (limitEnabled) {
        currentSimulatedSpeed = Math.min(currentSimulatedSpeed, limitVal);
      }
      setLiveSpeed(Math.max(0.5, currentSimulatedSpeed));
    }, 850);

    return () => clearInterval(interval);
  }, [downloadingMovieId, speedSetting, limitEnabled, limitVal]);

  // Retrieve matching downloaded movies objects
  const downloadedMovies = movies.filter(m => downloadedIds.includes(m.id));
  const activeDownloadingMovie = movies.find(m => m.id === downloadingMovieId);

  // Helper calculating size in GB deterministically list
  const getMovieSizeGB = (movie: Movie) => {
    let base = 0.8;
    if (movie.type === 'series') {
      base = 1.6;
    }
    let count = 0;
    const key = movie.id + movie.title;
    for (let i = 0; i < key.length; i++) {
      count += key.charCodeAt(i);
    }
    return parseFloat((base + (count % 8) * 0.15).toFixed(2));
  };

  // Live storage math
  const kwatchCachedGB = parseFloat(
    downloadedMovies.reduce((acc, current) => acc + getMovieSizeGB(current), 0).toFixed(2)
  );
  
  const currentTotalUsedGB = parseFloat((OS_RESERVE_GB + kwatchCachedGB).toFixed(2));
  const remainingFreeGB = parseFloat((DISK_LIMIT_GB - currentTotalUsedGB).toFixed(2));

  // Visual percentages 
  const osPercent = (OS_RESERVE_GB / DISK_LIMIT_GB) * 100;
  const kwatchPercent = (kwatchCachedGB / DISK_LIMIT_GB) * 100;
  const freePercent = (remainingFreeGB / DISK_LIMIT_GB) * 100;

  // Visual quota status Check
  const quotaUsedPercent = Math.min(100, (kwatchCachedGB / downloadLimit) * 100);

  // Trigger simulated offline download item
  const handleInitiateDownload = (movieId: string) => {
    if (wifiOnly) {
      setDlStatusMessage("⚠️ Network Restricted: Enabled 'Wi-Fi Only Downloads' block! Connect or disable Wi-Fi lock to download.");
      setTimeout(() => setDlStatusMessage(null), 5000);
      return;
    }

    if (kwatchCachedGB >= downloadLimit) {
      setDlStatusMessage("❌ Storage Failure: Allocated Download Limit capacity has reached maximum constraints!");
      setTimeout(() => setDlStatusMessage(null), 5000);
      return;
    }

    onTriggerDownload(movieId);
  };

  // Helper adding 3 random films to test cache quickly
  const handleFillDemoCache = () => {
    const unDownloaded = movies.filter(m => !downloadedIds.includes(m.id) && m.id !== downloadingMovieId);
    if (unDownloaded.length === 0) {
      alert("All catalogs are already present within current offline downloads container!");
      return;
    }
    // Pick 3 random
    const shuffled = [...unDownloaded].sort(() => 0.5 - Math.random()).slice(0, 3);
    shuffled.forEach(m => {
      if (kwatchCachedGB + getMovieSizeGB(m) <= downloadLimit) {
        onTriggerDownload(m.id);
        // Force complete directly
        setTimeout(() => {
          // Trigger downloaded action on backend states
        }, 10);
      }
    });

    // Directly append to state through bypass triggering event packets
    shuffled.forEach(m => {
      if (!downloadedIds.includes(m.id)) {
        // Mocking direct local injection
        const rawList = localStorage.getItem(`kwatch_downloads_${currentProfile.id}`);
        let cur: string[] = [];
        try { cur = rawList ? JSON.parse(rawList) : []; } catch {}
        if (!cur.includes(m.id)) {
          cur.push(m.id);
          localStorage.setItem(`kwatch_downloads_${currentProfile.id}`, JSON.stringify(cur));
        }
      }
    });

    // Notify user to click refresh if state delay
    alert(`Injected simulated cached copies for: \n${shuffled.map(m => `• ${m.title}`).join('\n')}\n(Local lists populated instantly!)`);
    window.location.reload(); 
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* DOWNLOAD MANAGER STATUS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-950 p-6 rounded-3xl border border-neutral-900 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-2xl border border-purple-500/20">
            <Download className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              Offline Workspace Console
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Store stream packets on local sandbox disk. Watch hyper-vivid, buffer-free movies uninterrupted offline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px]">
          <span className="bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-850 text-neutral-300 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span>Connection: {wifiOnly ? "Virtual Mobile/Wi-Fi Mesh" : "Direct Broadband Fiber"}</span>
          </span>
        </div>
      </div>

      {dlStatusMessage && (
        <div className="p-4 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-xs text-purple-300 font-semibold flex items-center gap-2.5 animate-bounce">
          <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>{dlStatusMessage}</span>
        </div>
      )}

      {/* STORAGE OVERVIEW & SETTINGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: STATIC DISK ANALYZER */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-purple-400" /> Device Storage Status
            </h3>
            <div className="flex justify-between items-baseline pt-2">
              <span className="text-2xl font-black tracking-tight text-white">{currentTotalUsedGB} GB</span>
              <span className="text-xs text-neutral-400 font-medium">Used of {DISK_LIMIT_GB} GB limit</span>
            </div>
            {realQuotaGB !== null && (
              <div className="mt-2 bg-purple-950/20 border border-purple-900/40 p-2.5 rounded-xl flex flex-col gap-1 text-[10px] text-neutral-400 font-mono leading-relaxed">
                <span className="text-purple-300 font-extrabold uppercase text-[9px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 animate-pulse" /> Sandbox Device Access OK
                </span>
                <div className="flex justify-between">
                  <span>HTML5 Storage Quota:</span>
                  <span className="text-neutral-200 font-bold">{realQuotaGB.toLocaleString()} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Current App Footprint:</span>
                  <span className="text-neutral-200 font-bold">{realUsageGB !== null ? `${realUsageGB} GB` : "estimating..."}</span>
                </div>
              </div>
            )}
          </div>

          {/* STORAGE BAR GAUGE */}
          <div className="h-4 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-850 shadow-inner">
            <div 
              style={{ width: `${osPercent}%` }} 
              className="bg-neutral-700 h-full transition-all duration-500" 
              title={`System Reserve Files: ${OS_RESERVE_GB} GB`}
            />
            {kwatchCachedGB > 0 && (
              <div 
                style={{ width: `${kwatchPercent}%` }} 
                className="bg-gradient-to-r from-purple-600 to-purple-500 h-full transition-all duration-500" 
                title={`Kwatch Media Stream Cache: ${kwatchCachedGB} GB`}
              />
            )}
            <div 
              style={{ width: `${freePercent}%` }} 
              className="bg-neutral-950/80 h-full" 
              title={`Remaining unused block: ${remainingFreeGB} GB`}
            />
          </div>

          {/* STORAGE DETAILS SCALE CHEVRONS */}
          <div className="space-y-2.5 pt-2">
            <div className="flex justify-between items-center text-[11px] hover:bg-neutral-900/40 p-1 rounded-lg transition-colors">
              <span className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" /> OS & Local Application
              </span>
              <span className="font-mono text-neutral-300 font-bold">{OS_RESERVE_GB} GB</span>
            </div>
            <div className="flex justify-between items-center text-[11px] hover:bg-neutral-900/40 p-1 rounded-lg transition-colors">
              <span className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Kwatch Cache
              </span>
              <span className="font-mono text-purple-400 font-bold">{kwatchCachedGB} GB</span>
            </div>
            <div className="flex justify-between items-center text-[11px] hover:bg-neutral-900/40 p-1 rounded-lg transition-colors">
              <span className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase">
                <span className="w-2.5 h-2.5 rounded-full border border-neutral-850 bg-transparent" /> Remaining Empty
              </span>
              <span className="font-mono text-green-400 font-bold">{remainingFreeGB} GB</span>
            </div>
          </div>
        </div>

        {/* PANEL 2: OFFLINE SYSTEM SETTINGS */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-purple-400" /> Manager Settings & Lockers
          </h3>

          <div className="space-y-3.5">
            {/* Automatic Clear Setting */}
            <div className="flex justify-between items-start gap-4 p-1.5 rounded-xl transition-all">
              <div className="min-w-0">
                <label className="text-[11px] font-black text-neutral-200 block">Auto-Delete Clean Cache</label>
                <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">Purges files off disk immediately after watching completes</span>
              </div>
              <button
                id="toggle-auto-delete-watched-btn"
                onClick={() => onToggleAutoDeleteWatched(!autoDeleteWatched)}
                className={`w-10 h-5.5 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${autoDeleteWatched ? 'bg-purple-600' : 'bg-neutral-800'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${autoDeleteWatched ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Network Lock WIFI only */}
            <div className="flex justify-between items-start gap-4 p-1.5 rounded-xl transition-all">
              <div className="min-w-0">
                <label className="text-[11px] font-black text-neutral-200 block">Wi-Fi Only Isolation</label>
                <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">Locks download pipeline over metered cellular networks</span>
              </div>
              <button
                id="toggle-wifi-lock-btn"
                onClick={() => setWifiOnly(!wifiOnly)}
                className={`w-10 h-5.5 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${wifiOnly ? 'bg-purple-600' : 'bg-neutral-800'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${wifiOnly ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Download Speed Limiter */}
            <div className="border-t border-neutral-900/60 pt-3.5 space-y-2">
              <div className="flex justify-between items-start gap-4 p-1.5 rounded-xl transition-all">
                <div className="min-w-0">
                  <label className="text-[11px] font-black text-neutral-200 block">Bandwidth Speed Limiter</label>
                  <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">Caps download rate to prevent buffering/lag on other devices</span>
                </div>
                <button
                  id="toggle-speed-limiter-btn"
                  onClick={() => setLimitEnabled(!limitEnabled)}
                  className={`w-10 h-5.5 rounded-full p-1 transition-colors relative shrink-0 cursor-pointer ${limitEnabled ? 'bg-purple-600' : 'bg-neutral-800'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${limitEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {limitEnabled && (
                <div className="px-1.5 pb-1 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-purple-400 font-bold">
                    <span>MAX SPEED LIMIT:</span>
                    <span className="bg-purple-950 px-2 py-0.5 rounded border border-purple-900/40">{limitVal} MB/s</span>
                  </div>
                  <input
                    id="speed-limiter-slider"
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={limitVal}
                    onChange={(e) => setLimitVal(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-neutral-500">
                    <span>1 MB/s (Strict)</span>
                    <span>20 MB/s</span>
                    <span>45 MB/s (High)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <div className="bg-neutral-900/50 border border-neutral-850 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-neutral-400">
              <Wifi className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Restricts background metadata sync unless Virtual Wi-Fi mode is active.</span>
            </div>
          </div>
        </div>

        {/* PANEL 3: STORAGE QUOTA ALLOCATOR */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-purple-400" /> Cash Allocation Quotas
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className="text-neutral-400 uppercase">Limit Pool:</span>
              <span className="text-purple-400">{downloadLimit} GB Pool</span>
            </div>

            {/* QUOTA RANGE SELECTOR */}
            <div className="space-y-1">
              <input 
                id="downloads-quota-slider"
                type="range"
                min="10"
                max="100"
                step="5"
                value={downloadLimit}
                onChange={(e) => setDownloadLimit(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>10 GB</span>
                <span>40 GB</span>
                <span>70 GB</span>
                <span>100 GB</span>
              </div>
            </div>

            {/* Allocator progress bar */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase">
                <span>Allocated usage</span>
                <span>{kwatchCachedGB} GB / {downloadLimit} GB ({quotaUsedPercent.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${quotaUsedPercent >= 90 ? 'bg-red-500' : 'bg-purple-600'}`}
                  style={{ width: `${quotaUsedPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              id="fill-demo-cache-btn"
              onClick={handleFillDemoCache}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all flex-1"
            >
              <RefreshCw className="w-3 h-3 text-orange-400" /> Fast Seed Case
            </button>
            <button
              id="purge-demo-cache-btn"
              onClick={() => {
                if (confirm("Are you absolutely sure you want to clean up all local cached files? This will release temporary sandbox cache storage instantly.")) {
                  onRemoveAllDownloads();
                }
              }}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-red-950/20 border border-neutral-850 hover:border-red-500/20 text-red-400 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Clear Library
            </button>
          </div>
        </div>

      </div>

      {/* DETAILED ACTIVE DOWNLOAD MANAGER PANEL */}
      <AnimatePresence>
        {downloadTasks.filter(t => t.status !== 'completed').length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 bg-gradient-to-r from-purple-950/20 via-neutral-950 to-neutral-950/40 border border-purple-500/20 rounded-3xl space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black text-neutral-200 uppercase tracking-widest">
                    Active Download Queue Manager
                  </h3>
                  <span className="text-[10px] text-neutral-500">
                    {downloadTasks.filter(t => t.status === 'downloading').length} downloading, {downloadTasks.filter(t => t.status === 'queued').length} queued, {downloadTasks.filter(t => t.status === 'paused').length} paused
                  </span>
                </div>
              </div>

              {/* Visual Speedometer controller */}
              <div className="flex items-center gap-3 font-mono text-[10px]">
                <span className="text-neutral-400 uppercase font-black flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400 animate-pulse" /> Speed:
                </span>
                <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-850 font-bold uppercase">
                  {(['standard', 'high', 'ultra'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setSpeedSetting(speed)}
                      className={`px-2 py-1 rounded transition-all cursor-pointer ${speedSetting === speed ? 'bg-purple-600 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="divide-y divide-neutral-900 space-y-3.5">
              {downloadTasks.filter(t => t.status !== 'completed').map((task, idx) => {
                const isDownloading = task.status === 'downloading';
                const isPaused = task.status === 'paused';
                const isQueued = task.status === 'queued';
                
                // Calculate ETA
                let eta = 'Pending';
                if (isDownloading && task.speedMBs > 0) {
                  const remainingMB = (1 - (task.progress / 100)) * (task.sizeGB * 1024);
                  const seconds = Math.ceil(remainingMB / task.speedMBs);
                  if (seconds < 60) eta = `${seconds}s`;
                  else {
                    const minutes = Math.floor(seconds / 60);
                    const remainingSec = seconds % 60;
                    eta = `${minutes}m ${remainingSec}s`;
                  }
                } else if (isPaused) {
                  eta = 'Paused';
                } else if (isQueued) {
                  eta = 'Queued';
                }

                return (
                  <div key={task.id} className={`pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 ${idx > 0 ? 'border-t border-neutral-900/40' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative flex-shrink-0 w-10 h-14 bg-neutral-900 rounded-md overflow-hidden border border-neutral-800">
                        {task.moviePosterUrl ? (
                          <img 
                            src={task.moviePosterUrl} 
                            alt={task.movieTitle} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                            <FileVideo className="w-5 h-5 text-neutral-700" />
                          </div>
                        )}
                        {isDownloading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Download className="w-4 h-4 text-purple-400 animate-bounce" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate max-w-[200px] md:max-w-[320px]">
                            {task.movieTitle}
                          </h4>
                          <span className={`text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider ${
                            isDownloading ? 'bg-purple-950 text-purple-300 border border-purple-800/30' :
                            isPaused ? 'bg-neutral-800 text-neutral-400' :
                            'bg-yellow-950/40 text-yellow-500 border border-yellow-900/30'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                          <span>Size: <strong className="text-neutral-300">{task.sizeGB.toFixed(1)} GB</strong></span>
                          <span>•</span>
                          {isDownloading && (
                            <>
                              <span>Speed: <strong className="text-yellow-400 animate-pulse">{task.speedMBs} MB/s</strong></span>
                              <span>•</span>
                            </>
                          )}
                          <span>ETA: <strong className="text-purple-400">{eta}</strong></span>
                        </p>

                        {/* Progress bar inside task row */}
                        <div className="mt-2 flex items-center gap-3">
                          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden flex border border-neutral-850">
                            <div 
                              style={{ width: `${task.progress}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                isDownloading ? 'bg-gradient-to-r from-purple-600 to-orange-500' :
                                isPaused ? 'bg-neutral-700' : 'bg-neutral-800'
                              }`}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-neutral-400 font-bold shrink-0">
                            {Math.round(task.progress)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS FOR INDIVIDUAL TASK */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {isDownloading && (
                        <button
                          title="Pause Download"
                          onClick={() => onPauseDownload(task.id)}
                          className="p-1.5 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded-lg border border-neutral-850 hover:border-neutral-700 transition-colors cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isPaused && (
                        <button
                          title="Resume Download"
                          onClick={() => onResumeDownload(task.id)}
                          className="p-1.5 hover:bg-neutral-900 text-purple-400 hover:text-purple-300 rounded-lg border border-purple-950 hover:border-purple-800 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-purple-400" />
                        </button>
                      )}
                      {isQueued && (
                        <button
                          title="Waiting in Queue"
                          disabled
                          className="p-1.5 text-neutral-600 rounded-lg border border-neutral-900 cursor-not-allowed"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-600" />
                        </button>
                      )}
                      <button
                        title="Cancel & Remove"
                        onClick={() => {
                          if (confirm(`Remove "${task.movieTitle}" from downloads queue?`)) {
                            onCancelDownload(task.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-950/25 text-neutral-400 hover:text-red-400 rounded-lg border border-neutral-850 hover:border-red-900/40 transition-colors cursor-pointer"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPLETED DOWNLOADS SHELF GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-purple-400" />
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
              My Cached Offline Titles Library ({downloadedMovies.length})
            </h3>
          </div>
          {downloadedMovies.length > 0 && (
            <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold tracking-wide">
              Capacity Locked: {kwatchCachedGB} GB
            </span>
          )}
        </div>

        {downloadedMovies.length === 0 ? (
          /* CACHE CATALOG EMPTY VIEW */
          <div className="text-center py-16 bg-neutral-950 border border-neutral-900 rounded-3xl p-8 space-y-4 max-w-xl mx-auto border-dashed">
            <div className="w-12 h-12 bg-neutral-900/60 rounded-2xl flex items-center justify-center mx-auto border border-neutral-800">
              <Ban className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">No Cached Offline Content</h4>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto mt-2">
                Your sandbox caching directory is empty. Return to the streaming catalogue feed, click the <span className="text-purple-400 font-semibold">Download</span> button on any show, and it will list here immediately!
              </p>
            </div>
          </div>
        ) : (
          /* MULTI COLUMN FLUID GRID OF DOWNLOAD CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {downloadedMovies.map((movie) => {
              const itemSize = getMovieSizeGB(movie);
              return (
                <div 
                  key={movie.id}
                  className="group relative bg-neutral-950 border border-neutral-900 rounded-2xl p-4 transition-all duration-200 hover:border-purple-500/40 hover:bg-neutral-950/70 hover:-translate-y-0.5 shadow-md flex gap-4 overflow-hidden"
                >
                  {/* Left Column: Image wrapper */}
                  <div className="relative w-16 h-24 shrink-0 overflow-hidden rounded-xl border border-neutral-900">
                    <img 
                      src={movie.posterUrl} 
                      alt={movie.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 left-1 bg-black/75 px-1 py-0.5 rounded text-[9px] font-mono text-purple-400 uppercase tracking-widest font-black leading-none">
                      ★ {movie.rating}
                    </div>
                  </div>

                  {/* Right Column: Title info details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8.5px] bg-neutral-900 text-sky-400 px-1.5 py-0.5 rounded font-mono font-black uppercase inline-block">
                          {movie.type}
                        </span>
                        <span className="text-[8.5px] text-neutral-500 font-mono">
                          {movie.runtime}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-purple-300 transition-colors leading-tight">
                        {movie.title}
                      </h4>
                      <p className="text-[10px] text-neutral-400 truncate font-semibold">
                        {movie.genres ? movie.genres.join(' • ') : 'Drama & Series'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2.5 pt-2">
                      <span className="font-mono text-[10px] text-purple-400 font-semibold block uppercase">
                        Size: {itemSize} GB
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          id={`play-offline-btn-${movie.id}`}
                          onClick={() => onPlayMovie(movie)}
                          className="px-2.5 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-colors cursor-pointer select-none"
                          title="Open Offline Video Sandbox"
                        >
                          <Play className="w-3 h-3 fill-current" /> Play Offline
                        </button>

                        <button
                          id={`remove-offline-btn-${movie.id}`}
                          onClick={() => {
                            if (confirm(`Remove offline downloaded copy of "${movie.title}" from storage database?`)) {
                              onRemoveDownload(movie.id);
                            }
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 hover:border-neutral-800 rounded-lg border border-transparent transition-all cursor-pointer"
                          title="Purge local video cache"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK OFFLINE BROWSING LOADER */}
      <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-3xl space-y-4">
        <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-green-400" /> VOD Sandbox Encryption Rules
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Kwatch applies supreme end-to-end sandbox disk encryption on downloaded packets. Offline playable titles are restricted to this active viewer browser context according to the <strong>Multi-Tier Verified Security Agreement (Local v4.2)</strong>.
        </p>
      </div>

    </div>
  );
}
