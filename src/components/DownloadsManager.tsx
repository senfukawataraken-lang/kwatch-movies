import React from 'react';
import { motion } from 'motion/react';
import { 
  X, Trash2, ShieldCheck, Play, Download, HardDrive, AlertCircle, RefreshCw, Settings, Pause
} from 'lucide-react';
import { Movie, DownloadTask, UserProfile } from '../types';

interface DownloadsManagerProps {
  downloadedIds: string[];
  movies: Movie[];
  downloadTasks?: DownloadTask[];
  onPauseDownload?: (id: string) => void;
  onResumeDownload?: (id: string) => void;
  onCancelDownload?: (id: string) => void;
  onRemoveDownload: (id: string) => void;
  onRemoveAllDownloads: () => void;
  onPlayMovie: (movie: Movie) => void;
  onClose: () => void;
  autoDeleteWatched: boolean;
  onToggleAutoDeleteWatched: (checked: boolean) => void;
  currentProfile: UserProfile;
}

// OS system space constant
const SYSTEM_SPACE_GB = 14.8;
const MAX_STORAGE_GB = 128;

export default function DownloadsManager({
  downloadedIds,
  movies,
  downloadTasks = [],
  onPauseDownload,
  onResumeDownload,
  onCancelDownload,
  onRemoveDownload,
  onRemoveAllDownloads,
  onPlayMovie,
  onClose,
  autoDeleteWatched,
  onToggleAutoDeleteWatched,
  currentProfile
}: DownloadsManagerProps) {

  const [limitEnabled, setLimitEnabled] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`kwatch_dl_limit_enabled_${currentProfile.id}`);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [limitVal, setLimitVal] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem(`kwatch_dl_limit_val_${currentProfile.id}`);
      return saved ? parseInt(saved, 10) : 10;
    } catch {
      return 10;
    }
  });

  // Retrieve full movie details for downloaded items
  const downloadedMovies = movies.filter(m => downloadedIds.includes(m.id));

  // Determine size of each movie based on its id/title deterministically
  const getMovieSizeGB = (movie: Movie) => {
    let base = 0.8; // 800MB standard minimum
    if (movie.type === 'series') {
      base = 1.5; // series occupy more size
    }
    // Simple robust hash function to generate stable offline size values per resource
    const hash = mhash(movie.id + movie.title);
    const variantMultiplier = (hash % 11) * 0.12; 
    return parseFloat((base + variantMultiplier).toFixed(2));
  };

  // Simple string hashing helper for deterministic values
  function mhash(str: string): number {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      count += str.charCodeAt(i);
    }
    return count;
  }

  // Calculate stats
  const kwatchSpaceGB = parseFloat(
    downloadedMovies.reduce((acc, current) => acc + getMovieSizeGB(current), 0).toFixed(2)
  );

  const usedSpaceGB = parseFloat((SYSTEM_SPACE_GB + kwatchSpaceGB).toFixed(2));
  const remainingSpaceGB = parseFloat((MAX_STORAGE_GB - usedSpaceGB).toFixed(2));

  // Chart percentage lengths
  const systemPercent = (SYSTEM_SPACE_GB / MAX_STORAGE_GB) * 100;
  const kwatchPercent = (kwatchSpaceGB / MAX_STORAGE_GB) * 100;
  const freePercent = (remainingSpaceGB / MAX_STORAGE_GB) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-neutral-950 border border-neutral-850 rounded-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden shadow-2xl relative"
      >
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600/10 text-purple-400 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Offline Downloads Console</h3>
              <p className="text-[11px] text-neutral-500 font-mono tracking-wide uppercase">Offline storage caching & management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STORAGE STATISTICS SECTOR */}
        <div className="p-6 bg-neutral-950/40 border-b border-neutral-900 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-400">
            <span className="flex items-center gap-2 text-white">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Storage Status Overview</span>
            </span>
            <span className="text-neutral-300 font-mono">
              {usedSpaceGB.toFixed(1)} GB Used of {MAX_STORAGE_GB} GB Total
            </span>
          </div>

          {/* SPLIT HORIZONTAL CHARTS PROGRESS BAR */}
          <div className="h-4 bg-neutral-900 rounded-full overflow-hidden flex shadow-inner">
            {/* System Space Segment */}
            <div 
              style={{ width: `${systemPercent}%` }} 
              className="bg-neutral-700 h-full transition-all"
              title={`System Reserve & App Cache: ${SYSTEM_SPACE_GB} GB`}
            />
            {/* Kwatch Space Segment */}
            {kwatchSpaceGB > 0 && (
              <div 
                style={{ width: `${kwatchPercent}%` }} 
                className="bg-purple-600 h-full transition-all"
                title={`Kwatch Media Stream Cache: ${kwatchSpaceGB} GB`}
              />
            )}
            {/* Free Space Segment */}
            <div 
              style={{ width: `${freePercent}%` }} 
              className="bg-neutral-900 h-full"
              title={`Free/Unused Space: ${remainingSpaceGB} GB`}
            />
          </div>

          {/* STORAGE METRIC BULLETS */}
          <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
            <div className="p-2.5 bg-neutral-900/40 rounded-lg space-y-1 border border-neutral-900">
              <span className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase truncate">
                <span className="w-2.5 h-2.5 bg-neutral-700 rounded-full block flex-shrink-0" />
                OS & System
              </span>
              <span className="font-semibold text-white block mt-0.5">{SYSTEM_SPACE_GB} GB</span>
            </div>

            <div className="p-2.5 bg-neutral-900/40 rounded-lg space-y-1 border border-neutral-950">
              <span className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase truncate">
                <span className="w-2.5 h-2.5 bg-purple-600 rounded-full block flex-shrink-0" />
                Kwatch Videos
              </span>
              <span className="font-semibold text-purple-400 block mt-0.5">{kwatchSpaceGB} GB</span>
            </div>

            <div className="p-2.5 bg-neutral-900/40 rounded-lg space-y-1 border border-neutral-900">
              <span className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase truncate">
                <span className="w-2.5 h-2.5 bg-neutral-950 border border-neutral-800 rounded-full block flex-shrink-0" />
                Free Space
              </span>
              <span className="font-semibold text-green-400 block mt-0.5">{remainingSpaceGB} GB</span>
            </div>
          </div>
        </div>

        {/* DOWNLOAD SETTINGS PANEL */}
        <div className="px-6 py-4 bg-purple-950/5 border-b border-neutral-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-purple-400" /> System Downloads Configuration
              </span>
              <p className="text-[10px] text-neutral-500 leading-normal">
                Configure parameters to manage disk space and network bandwidth allocation automatically.
              </p>
            </div>
            <div>
              <button
                onClick={() => onToggleAutoDeleteWatched(!autoDeleteWatched)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-805 hover:border-neutral-700/60 rounded-xl cursor-pointer transition-all"
                title="Automatically remove cached content from offline list after watching"
              >
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${autoDeleteWatched ? 'bg-purple-600' : 'bg-neutral-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${autoDeleteWatched ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-xs font-bold text-neutral-300 leading-none">
                  Auto-delete watched downloads
                </span>
              </button>
            </div>
          </div>

          {/* NEW BANDWIDTH LIMITER CONTROLS */}
          <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900/30 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
                  Bandwidth Saver
                </span>
                <span className="text-xs font-black text-white">Download Speed Limiter</span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-tight">
                Capping download speed prevents video buffering or lag on other household devices.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Toggle switch */}
              <button
                onClick={() => {
                  const newVal = !limitEnabled;
                  setLimitEnabled(newVal);
                  localStorage.setItem(`kwatch_dl_limit_enabled_${currentProfile.id}`, String(newVal));
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg cursor-pointer transition-all text-[11px] font-bold ${limitEnabled ? 'text-purple-400 border-purple-900/40' : 'text-neutral-400'}`}
              >
                <div className={`w-6 h-3 rounded-full p-0.5 flex items-center transition-colors ${limitEnabled ? 'bg-purple-600' : 'bg-neutral-800'}`}>
                  <div className={`w-2 h-2 rounded-full bg-white transform transition-transform ${limitEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
                </div>
                <span>{limitEnabled ? "Limit Active" : "No Cap"}</span>
              </button>

              {/* Limit selector / slider */}
              {limitEnabled && (
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={limitVal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setLimitVal(val);
                      localStorage.setItem(`kwatch_dl_limit_val_${currentProfile.id}`, String(val));
                    }}
                    className="w-20 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className="text-purple-400 font-extrabold w-12 text-right">
                    {limitVal} MB/s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DOWNLOADED WORKSPACE LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {downloadTasks.filter(t => t.status !== 'completed').length > 0 && (
            <div className="space-y-2 border-b border-neutral-900 pb-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-purple-400 animate-spin animate-duration-1000" /> Active Downloads Queue
              </h4>
              <div className="space-y-2">
                {downloadTasks.filter(t => t.status !== 'completed').map((task) => {
                  const isDownloading = task.status === 'downloading';
                  const isPaused = task.status === 'paused';
                  return (
                    <div key={task.id} className="p-2.5 bg-neutral-900/50 rounded-xl border border-neutral-850/60 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-200 truncate block max-w-[150px]">{task.movieTitle}</span>
                          <span className="text-[8px] font-extrabold uppercase px-1 bg-purple-950/40 text-purple-300 rounded shrink-0">{task.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                          <span>{task.sizeGB.toFixed(1)} GB</span>
                          {isDownloading && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-400">{task.speedMBs} MB/s</span>
                            </>
                          )}
                        </div>
                        <div className="w-full h-1 bg-neutral-950 rounded-full mt-2 overflow-hidden flex">
                          <div 
                            style={{ width: `${task.progress}%` }} 
                            className={`h-full rounded-full ${isDownloading ? 'bg-gradient-to-r from-purple-600 to-orange-500' : 'bg-neutral-700'}`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDownloading && onPauseDownload && (
                          <button
                            onClick={() => onPauseDownload(task.id)}
                            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded border border-transparent hover:border-neutral-800 transition-colors cursor-pointer"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        {isPaused && onResumeDownload && (
                          <button
                            onClick={() => onResumeDownload(task.id)}
                            className="p-1 text-purple-400 hover:text-purple-300 hover:bg-neutral-900 rounded border border-transparent hover:border-neutral-800 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        )}
                        {onCancelDownload && (
                          <button
                            onClick={() => onCancelDownload(task.id)}
                            className="p-1 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded border border-transparent hover:border-neutral-850 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Cached Files Library ({downloadedMovies.length})
            </h4>
            {downloadedMovies.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Are you absolutely sure you want to clean up all cached offline video contents? This will release local storage space immediately.")) {
                    onRemoveAllDownloads();
                  }
                }}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase flex items-center gap-1 hover:underline transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Purge Cache ({kwatchSpaceGB} GB)
              </button>
            )}
          </div>

          {downloadedMovies.length === 0 ? (
            /* EMPTY OFFLINE STATE PANEL */
            <div className="py-12 px-6 text-center space-y-4">
              <div className="w-12 h-12 bg-neutral-900/80 rounded-full flex items-center justify-center mx-auto border border-neutral-850">
                <AlertCircle className="w-6 h-6 text-neutral-500" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h5 className="font-semibold text-sm text-neutral-200">No Offline Media Active</h5>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Your device has zero media caches. Browse films, tap "Download for Offline Viewing" to watch blockbusters buffer-free without an internet connection!
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200 transition-all cursor-pointer block mx-auto"
              >
                Return to Streaming Catalog
              </button>
            </div>
          ) : (
            /* ITEM TABLE LIST */
            <div className="space-y-3">
              {downloadedMovies.map((movie) => {
                const itemSize = getMovieSizeGB(movie);
                return (
                  <div 
                    key={movie.id}
                    className="flex items-center justify-between p-3 bg-neutral-900/30 hover:bg-neutral-900/60 rounded-xl border border-neutral-900 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={movie.posterUrl} 
                        alt="Poster" 
                        className="w-12 h-16 object-cover rounded-lg border border-neutral-800" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <strong className="block text-xs sm:text-sm font-semibold truncate text-white leading-snug">
                          {movie.title}
                        </strong>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-medium">
                          <span className="bg-neutral-900 px-1.5 py-0.5 rounded font-mono uppercase text-sky-400">
                            {movie.type}
                          </span>
                          <span>{movie.runtime}</span>
                          <span>•</span>
                          <span className="font-mono text-purple-400">{itemSize} GB</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPlayMovie(movie)}
                        className="p-2 sm:px-3 sm:py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow"
                        title="Stream Cached Copy"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Play</span>
                      </button>

                      <button
                        onClick={() => onRemoveDownload(movie.id)}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-lg transition-all cursor-pointer"
                        title="Remove offline copy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECURITY CACHE ACKNOWLEDGEMENT FOOTER */}
        <div className="p-4 px-6 bg-neutral-950 border-t border-neutral-900 text-[10px] sm:text-xs text-neutral-500 flex items-center justify-between bg-neutral-900/10">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            VOD Offline Playback Sandbox Active
          </span>
          <span className="font-mono text-[9px] text-neutral-600">Local IndexedDB Cache v4.2</span>
        </div>

      </motion.div>
    </div>
  );
}
