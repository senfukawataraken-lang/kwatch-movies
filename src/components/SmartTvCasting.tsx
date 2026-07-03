import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Cast, Link, Wifi, Smartphone, QrCode, MonitorPlay, 
  ArrowRightLeft, Power, RefreshCw, Volume2, VolumeX, 
  X, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, 
  ChevronRight, CheckCircle2, Sparkles, SmartphoneIcon,
  Laptop, Tablet, Monitor
} from 'lucide-react';
import { Movie } from '../types';

interface SmartTvCastingProps {
  movies: Movie[];
  activeVideoMovie: Movie | null;
  onPlayMovie: (movie: Movie) => void;
  onClose: () => void;
}

interface CastDevice {
  id: string;
  name: string;
  type: 'chromecast' | 'airplay' | 'tv';
  status: 'Ready' | 'Casting' | 'Disconnected';
}

interface SyncDevice {
  id: string;
  deviceName: string;
  lastActive: string;
  movieTitle: string;
  movieId: string;
  progressMinutes: number;
  totalDurationMinutes: number;
}

export default function SmartTvCasting({
  movies,
  activeVideoMovie,
  onPlayMovie,
  onClose
}: SmartTvCastingProps) {
  const [activeTab, setActiveTab] = useState<'cast' | 'remote' | 'qr' | 'sync'>('cast');

  // --- CASTING STATE ---
  const [devices, setDevices] = useState<CastDevice[]>([
    { id: 'dev-1', name: 'Living Room TV (Uganda)', type: 'chromecast', status: 'Ready' },
    { id: 'dev-2', name: 'Bedroom LG OLED (Kampala)', type: 'tv', status: 'Ready' },
    { id: 'dev-3', name: 'Apple Shacks Studio', type: 'airplay', status: 'Ready' },
    { id: 'dev-4', name: 'Sony Bravia 4K TV', type: 'chromecast', status: 'Ready' }
  ]);
  const [activeCastingDevice, setActiveCastingDevice] = useState<CastDevice | null>(null);
  const [castVolume, setCastVolume] = useState<number>(70);
  const [isCastPaused, setIsCastPaused] = useState<boolean>(false);
  const [searchStatusText, setSearchStatusText] = useState<string>('Connected to Local Area Wi-Fi Network');

  // --- REMOTE NAV STATE ---
  const [selectedMovieIndex, setSelectedMovieIndex] = useState<number>(0);
  const [remotePower, setRemotePower] = useState<boolean>(true);
  const [remoteFeedback, setRemoteFeedback] = useState<string>('');

  // --- QR PAIRING STATE ---
  const [qrScanned, setQrScanned] = useState<boolean>(false);
  const [pairedDeviceName, setPairedDeviceName] = useState<string>('');

  // --- CROSS DEVICE SYNC STATE ---
  const [syncHistory, setSyncHistory] = useState<SyncDevice[]>([
    {
      id: 'sync-1',
      deviceName: 'Samsung 4K (Kenyan Hub)',
      lastActive: '5 mins ago',
      movieTitle: 'The Kampala Hustle',
      movieId: 'm-1',
      progressMinutes: 42,
      totalDurationMinutes: 108
    },
    {
      id: 'sync-2',
      deviceName: 'Infinix Hot 30 (Mobile App)',
      lastActive: '1 hr ago',
      movieTitle: 'Ethereal Shadows',
      movieId: 'm-3',
      progressMinutes: 15,
      totalDurationMinutes: 72
    },
    {
      id: 'sync-3',
      deviceName: 'MacBook Air - Web Client',
      lastActive: '6 hrs ago',
      movieTitle: 'Nairobi Neon Nights',
      movieId: 'm-2',
      progressMinutes: 18,
      totalDurationMinutes: 20
    }
  ]);

  // Handle Chromecast / AirPlay Triggering
  const handleConnectDevice = (device: CastDevice) => {
    if (activeCastingDevice?.id === device.id) {
      // Disconnect
      setActiveCastingDevice(null);
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'Ready' } : d));
      setRemoteFeedback(`Disconnected from ${device.name}`);
    } else {
      // Connect
      if (activeCastingDevice) {
        // Disconnect previous first
        setDevices(prev => prev.map(d => d.id === activeCastingDevice.id ? { ...d, status: 'Ready' } : d));
      }
      setActiveCastingDevice(device);
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'Casting' } : d));
      setRemoteFeedback(`Connected as primary casting screen to: ${device.name}!`);
      
      // Auto-cast currently playing movie if available
      if (activeVideoMovie) {
        alert(`Successfully Casting "${activeVideoMovie.title}" directly to ${device.name} via ${device.type === 'airplay' ? 'Apple AirPlay 2' : 'Chromecast Ultra 4K protocol'}!`);
      }
    }
  };

  const handleRemotePress = (buttonName: string) => {
    if (!remotePower) {
      setRemoteFeedback('Power on the remote to initiate TV remote simulation.');
      return;
    }

    setRemoteFeedback(`Remote Button [${buttonName}] pressed`);
    
    // Simulate navigation actions on our simple movies list
    if (buttonName === 'UP') {
      setSelectedMovieIndex(prev => (prev > 0 ? prev - 1 : movies.length - 1));
    } else if (buttonName === 'DOWN') {
      setSelectedMovieIndex(prev => (prev < movies.length - 1 ? prev + 1 : 0));
    } else if (buttonName === 'LEFT') {
      setSelectedMovieIndex(prev => Math.max(0, prev - 2));
    } else if (buttonName === 'RIGHT') {
      setSelectedMovieIndex(prev => Math.min(movies.length - 1, prev + 2));
    } else if (buttonName === 'OK') {
      const selected = movies[selectedMovieIndex];
      if (selected) {
        onPlayMovie(selected);
        setRemoteFeedback(`Streaming film: "${selected.title}"`);
        alert(`TV Remote simulated select! Playing "${selected.title}" on the active portal!`);
      }
    } else if (buttonName === 'VOL_UP') {
      setCastVolume(v => Math.min(100, v + 10));
    } else if (buttonName === 'VOL_DOWN') {
      setCastVolume(v => Math.max(0, v - 10));
    } else if (buttonName === 'MUTE') {
      setCastVolume(0);
    } else if (buttonName === 'PLAY') {
      setIsCastPaused(false);
    } else if (buttonName === 'PAUSE') {
      setIsCastPaused(true);
    }
  };

  // Simulate scanning QR login code
  const handleSimulateQrScan = () => {
    setQrScanned(true);
    setPairedDeviceName('Tecno Camon 20 (Senfuka\'s Primary Phone)');
    setRemoteFeedback('Device paired successfully via secure QR protocol!');
    alert('QR Login Successful! Device "Tecno Camon 20" has connected this smart workspace session. Personalized user libraries and Uganda watch queues are instantly synchronized.');
  };

  const handleResumeSyncDevice = (sync: SyncDevice) => {
    const movieObj = movies.find(m => m.id === sync.movieId);
    if (movieObj) {
      onPlayMovie(movieObj);
      alert(`Cross-Device Playback Sync: Resumed "${movieObj.title}" from exactly ${sync.progressMinutes} minutes mark, pulling state smoothly from ${sync.deviceName}!`);
      onClose();
    } else {
      alert(`The movie "${sync.movieTitle}" was queried, but cannot be parsed inside this profile. Switching streams.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
        id="smart-tv-casting-backdrop"
      />

      {/* Main Casting Central Panel */}
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[580px] z-55 text-left"
        id="smart-tv-casting-panel"
      >
        {/* LEFT BAR: TABS & BRAND */}
        <div className="w-full md:w-64 bg-neutral-950 border-r border-neutral-900 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-650/15 text-purple-400 rounded-xl relative">
                <Tv className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div>
                <span className="text-[11px] font-black text-purple-400 tracking-wider uppercase">KWATCH LABS</span>
                <h3 className="text-sm font-extrabold text-white leading-none">Smart TV Suite</h3>
              </div>
            </div>

            {/* Quick status display */}
            <div className="p-3 bg-neutral-900/45 border border-neutral-850 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Network Frame</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-neutral-300 font-bold">Kwatch_Wi-Fi_East</span>
              </div>
            </div>

            {/* Navigation options */}
            <div className="space-y-1.5 pt-2">
              <button
                onClick={() => setActiveTab('cast')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                  activeTab === 'cast' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15' 
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <Cast className="w-4 h-4" />
                <span>Chromecast / AirPlay</span>
              </button>

              <button
                onClick={() => setActiveTab('remote')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                  activeTab === 'remote' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15' 
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>Simulate TV Remote</span>
              </button>

              <button
                onClick={() => setActiveTab('qr')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                  activeTab === 'qr' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15' 
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>TV QR Code Login</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                  activeTab === 'sync' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15' 
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Cross-Device Resume</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-900">
            <button
              onClick={onClose}
              className="w-full py-2 bg-neutral-900 border border-neutral-850 text-xs font-bold text-neutral-400 hover:text-white rounded-xl cursor-pointer text-center text-ellipsis block transition-all"
            >
              Back to Showroom
            </button>
          </div>
        </div>

        {/* MAIN DYNAMIC CONTENT WORKSPACE */}
        <div className="flex-1 bg-black p-6 flex flex-col justify-between overflow-y-auto">
          {/* TAB 1: CHROMECAST / AIRPLAY PAIRING */}
          {activeTab === 'cast' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Cast className="w-5 h-5 text-purple-400" /> Chromecast & AirPlay Integration
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Identify and cast active film playback vectors directly to any smart display in your East Africa workspace.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Available TV Devices</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {devices.map((dev) => {
                      const isConnected = activeCastingDevice?.id === dev.id;
                      return (
                        <div 
                          key={dev.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                            isConnected 
                              ? 'bg-purple-650/10 border-purple-500/50 shadow-md' 
                              : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-neutral-200">{dev.name}</h4>
                              <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                                {dev.type === 'chromecast' ? 'Google Cast Ultra' : dev.type === 'airplay' ? 'Apple AirPlay 2' : 'LG Connect API'}
                              </span>
                            </div>
                            <div className={`p-1.5 rounded-lg ${isConnected ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-900 text-neutral-500'}`}>
                              <Tv className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <button
                            onClick={() => handleConnectDevice(dev)}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              isConnected 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                                : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300'
                            }`}
                          >
                            {isConnected ? '✓ Casting Active (Click to Disconnect)' : 'Cast to Device'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* CASTING CONTROLS SIMULATION */}
              {activeCastingDevice ? (
                <div className="p-4 bg-purple-950/10 border border-purple-500/30 rounded-2xl space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-pulse" /> Active Cast Receiver Stream: {activeCastingDevice.name}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/30 rounded-full">
                      CONNECTED
                    </span>
                  </div>

                  <div className="flex items-center gap-3 justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-400 block leading-none">STREAM CONTENT:</span>
                      <strong className="text-xs text-white block">
                        {activeVideoMovie ? activeVideoMovie.title : 'No film playing yet - Choose one to stream!'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCastPaused(!isCastPaused)}
                        className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg cursor-pointer flex items-center justify-center transition-all"
                      >
                        {isCastPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setCastVolume(v => v === 0 ? 70 : 0)}
                        className="p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg cursor-pointer flex items-center justify-center transition-all"
                      >
                        {castVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-neutral-400">
                      <span>Simulated Volume Level</span>
                      <span>{castVolume}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${castVolume}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-950/60 border border-neutral-900 rounded-2xl text-center text-xs text-neutral-500 mt-4">
                  Select a casting receiver from the devices list to launch Chromecast or AirPlay session.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SMART TV REMOTE SIMULATOR */}
          {activeTab === 'remote' && (
            <div className="space-y-4 flex-1 flex flex-col md:flex-row gap-6">
              {/* REMOTE CONTROLLER SIMULATOR GRID */}
              <div className="w-full md:w-56 bg-neutral-950 p-4 rounded-3xl border border-neutral-900 flex flex-col items-center gap-4 relative">
                {/* Remote Brand Frame */}
                <div className="flex items-center justify-between w-full border-b border-neutral-900 pb-2 mb-1">
                  <span className="text-[10px] font-black tracking-widest text-neutral-500">KWATCH REMOTE</span>
                  <button 
                    onClick={() => setRemotePower(!remotePower)}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      remotePower ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-neutral-900 text-neutral-600'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simulated Tactile Buttons */}
                <div className="space-y-4 w-full flex flex-col items-center">
                  {/* Directional Pad */}
                  <div className="relative w-36 h-36 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-850 shadow-inner">
                    <button 
                      onClick={() => handleRemotePress('UP')}
                      className="absolute top-2 left-1/2 -translate-x-1/2 p-2 text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleRemotePress('LEFT')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title="Move Left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleRemotePress('OK')}
                      className="w-12 h-12 bg-neutral-950 hover:bg-purple-650/20 border border-neutral-800 text-neutral-200 hover:text-purple-400 rounded-full flex items-center justify-center text-xs font-black shadow-md cursor-pointer transition-all"
                      title="Select (OK)"
                    >
                      OK
                    </button>
                    <button 
                      onClick={() => handleRemotePress('RIGHT')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title="Move Right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleRemotePress('DOWN')}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 p-2 text-neutral-400 hover:text-white transition-all cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Volume / Play Controls */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <button 
                      onClick={() => handleRemotePress('VOL_UP')}
                      className="py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-[10px] font-bold border border-neutral-850 cursor-pointer text-center"
                    >
                      VOL +
                    </button>
                    <button 
                      onClick={() => handleRemotePress('VOL_DOWN')}
                      className="py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-[10px] font-bold border border-neutral-850 cursor-pointer text-center"
                    >
                      VOL -
                    </button>
                    <button 
                      onClick={() => handleRemotePress('PLAY')}
                      className="py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-[10px] font-bold border border-neutral-850 cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current text-emerald-400" /> PLAY
                    </button>
                    <button 
                      onClick={() => handleRemotePress('PAUSE')}
                      className="py-2 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-[10px] font-bold border border-neutral-850 cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Pause className="w-3 h-3 text-amber-500" /> PAUSE
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-center text-neutral-600 mt-2 font-mono">
                  Smart pairing ready
                </div>
              </div>

              {/* FILM LIST TO CHOOSE / TEST NAVIGATION */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Tv className="w-5 h-5 text-purple-400" /> Live TV Remote Simulator
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Use the virtual remote D-pad to scroll/select East African and global cinematic catalogs. Click <strong>OK</strong> to simulate play!
                  </p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {movies.map((mov, mIdx) => {
                    const isSelected = selectedMovieIndex === mIdx;
                    return (
                      <div 
                        key={mov.id}
                        onClick={() => setSelectedMovieIndex(mIdx)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-900/20 border-purple-500 shadow-md ring-1 ring-purple-600/30' 
                            : 'bg-neutral-950 border-neutral-900 hover:border-neutral-850'
                        }`}
                      >
                        <img src={mov.posterUrl} alt="" className="w-10 h-14 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="text-xs font-extrabold text-white truncate">{mov.title}</h4>
                          <p className="text-[10px] text-neutral-400 truncate">Directed by {mov.director}</p>
                          <div className="flex items-center gap-2 text-[9px] text-neutral-500 font-bold uppercase">
                            <span>★ {mov.rating}</span>
                            <span>•</span>
                            <span>{mov.runtime}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded uppercase animate-pulse">
                            Selected
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Haptic text display info */}
                {remoteFeedback && (
                  <div className="p-2.5 bg-neutral-900/60 border border-neutral-850 rounded-xl text-[11px] text-purple-300 font-mono text-center">
                    📢 {remoteFeedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SMART TV QR CODE LOGIN */}
          {activeTab === 'qr' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-400" /> Swift QR Code Authenticator
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connect instantly with your mobile account profile settings. Bypass entering tedious passwords on screen.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-neutral-950 border border-neutral-900 rounded-3xl">
                  {/* GENERATED QR GRID */}
                  <div className="p-3 bg-white rounded-2xl relative">
                    <div className="w-36 h-36 grid grid-cols-6 gap-0.5">
                      {/* Fake Custom High-fidelity QR look using CSS dots */}
                      {Array.from({ length: 36 }).map((_, idx) => {
                        // Create classic corner blocks & random bits
                        const isCorner = 
                          (idx < 2 || idx === 6 || idx === 7) || 
                          (idx === 4 || idx === 5 || idx === 10 || idx === 11) ||
                          (idx > 29 && idx < 32) || (idx === 34 || idx === 35);
                        const isBitActive = isCorner || (idx * 3 + 1) % 5 === 0 || (idx + 7) % 3 === 0;

                        return (
                          <div 
                            key={idx} 
                            className={`rounded-sm transition-all duration-300 ${
                              isBitActive ? 'bg-black' : 'bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                    {/* Tiny visual lock indicator */}
                    <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center p-1 font-black text-[9px] text-purple-700">
                      KW
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">How to connect cross-device:</h4>
                      <ol className="text-[11px] text-neutral-400 space-y-1 list-decimal list-inside leading-relaxed">
                        <li>Open the Kwatch Mobile App on your Android / iOS smartphone.</li>
                        <li>Navigate to Account Settings &gt; Link Smart TV.</li>
                        <li>Point your phone camera toward this television QR code.</li>
                        <li>Confirm the biometric prompt to link profile accounts.</li>
                      </ol>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleSimulateQrScan}
                        className={`w-full sm:w-auto px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          qrScanned 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/15'
                        }`}
                      >
                        <SmartphoneIcon className="w-4 h-4" />
                        {qrScanned ? '✓ Phone Connected (Sync Live)' : 'Simulate Phone QR Scan'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {qrScanned && pairedDeviceName && (
                <div className="p-4 bg-emerald-950/15 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-bounce" />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Active Companion Device Connected</span>
                    <p className="text-xs text-neutral-200 mt-0.5 font-bold">{pairedDeviceName}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                      Your East African watching progress, favorite Ugandan shows, and custom billing status is fully synced. Continue playing videos anywhere.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CROSS-DEVICE CONTINUE WATCHING RESUME */}
          {activeTab === 'sync' && (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-purple-400" /> Cross-Device Sync & Session Transfer
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Continue watching movies seamlessly from exact timestamps recorded on your TV, phone, or tablet in East Africa!
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Other Devices Active Watch progress</span>
                  <div className="space-y-2">
                    {syncHistory.map((sync) => {
                      const percentage = Math.round((sync.progressMinutes / sync.totalDurationMinutes) * 100);
                      return (
                        <div 
                          key={sync.id}
                          className="bg-neutral-950 border border-neutral-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-800 transition-all"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              {sync.deviceName.includes('Samsung') || sync.deviceName.includes('LG') ? (
                                <Monitor className="w-4 h-4 text-purple-400" />
                              ) : sync.deviceName.includes('MacBook') ? (
                                <Laptop className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Smartphone className="w-4 h-4 text-emerald-400" />
                              )}
                              <span className="text-xs font-bold text-white">{sync.deviceName}</span>
                              <span className="text-[10px] text-neutral-500">• {sync.lastActive}</span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-neutral-200">
                                {sync.movieTitle}
                              </h4>
                              <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                                <span>Watched: {sync.progressMinutes} mins / {sync.totalDurationMinutes} mins</span>
                                <span>{percentage}%</span>
                              </div>
                              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-purple-600 h-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleResumeSyncDevice(sync)}
                              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 hover:text-white text-xs font-bold border border-neutral-850 hover:border-neutral-700 text-neutral-300 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              Resume Stream <MonitorPlay className="w-4 h-4 text-purple-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-neutral-900/40 border border-neutral-850/60 rounded-xl text-center text-[10px] text-neutral-500 leading-normal">
                💡 Timestamps are live-synchronized with the secure Kwatch database. Logging in on any mobile device or smart projector will match progress.
              </div>
            </div>
          )}

          {/* DYNAMIC FOOTER STATUS INFO */}
          <div className="flex items-center justify-between border-t border-neutral-900 pt-4 mt-6 text-[11px] text-neutral-400">
            <span>East Africa Server Hub Sync Level: <strong className="text-emerald-400">Optimal</strong></span>
            <span>Local Codecast ID: <strong className="text-white font-mono">KW-SPA-8008</strong></span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
