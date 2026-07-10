import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, Sparkles, User, ShieldAlert, LogOut, Moon, Sun, 
  Tv, Compass, HelpCircle, Activity, ChevronRight, Settings, Sliders, Shield
} from 'lucide-react';

import { Movie, UserProfile, UserAccount } from './types';
import { INITIAL_MOVIES } from './data/movies';
import AuthModal from './components/AuthModal';
import MainPortal from './components/MainPortal';
import AdminDashboard from './components/AdminDashboard';
import AiAssistant from './components/AiAssistant';
import ParentalControls from './components/ParentalControls';
import KwatchLogo from './components/KwatchLogo';
import ThemeInjector from './components/ThemeInjector';
import LandingPage from './components/LandingPage';

// Unified default profile configuration seeding
const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: "p-parent",
    name: "Papa Ken (Admin)",
    avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ken",
    isKids: false,
    maxMaturityRating: "All",
    pinCode: "41823",
    watchlist: ["m-1", "m-3"],
    favorites: ["m-1"],
    recentlyWatched: [],
    isVerified: true
  }
];

export default function App() {
  const [movies, setMovies] = useState<Movie[]>(() => {
    try {
      const stored = localStorage.getItem("kwatch_local_uploaded_movies");
      const locals = stored ? JSON.parse(stored) : [];
      return [...locals, ...INITIAL_MOVIES];
    } catch {
      return INITIAL_MOVIES;
    }
  });

  // Device authorization status check
  const [isNewDevice, setIsNewDevice] = useState<boolean>(() => {
    try {
      const authFlag = localStorage.getItem("kwatch_authorized_device_flag");
      return authFlag !== "true";
    } catch {
      return true;
    }
  });
  
  // Custom accounts management
  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(() => {
    try {
      const isDeviceAuthorized = localStorage.getItem("kwatch_authorized_device_flag") === "true";
      if (!isDeviceAuthorized) {
        // Recognize as a new device: clear auto-login sessions to always ask to login
        localStorage.removeItem("kwatch_active_account");
        localStorage.removeItem("kwatch_active_profile_id");
        return null;
      }
      const saved = localStorage.getItem("kwatch_active_account");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(() => {
    try {
      const savedActiveId = localStorage.getItem("kwatch_active_profile_id");
      if (savedActiveId && profiles.length > 0) {
        const found = profiles.find(p => p.id === savedActiveId);
        if (found) return found;
      }
    } catch {}
    return null;
  });

  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>([]);
  
  // App views: 'portal' or 'admin'
  const [appView, setAppView] = useState<'portal' | 'admin'>('portal');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(true);
  const [showParentalModal, setShowParentalModal] = useState<boolean>(false);
  const [watchPartyActive, setWatchPartyActive] = useState<boolean>(false);

  // App theme state
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem("kwatch_app_theme") as 'light' | 'dark') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleAppTheme = () => {
    const newTheme = appTheme === 'light' ? 'dark' : 'light';
    setAppTheme(newTheme);
    try {
      localStorage.setItem("kwatch_app_theme", newTheme);
    } catch (e) {
      console.error(e);
    }
  };

  // Sync profiles from/to storage based on active account
  useEffect(() => {
    if (!currentAccount) {
      setProfiles([]);
      setCurrentProfile(null);
      return;
    }
    
    try {
      const key = `kwatch_profiles_account_${currentAccount.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        let parsed = JSON.parse(saved);
        // Filter out Kwatch Guest, Rachael/Rachel, and Kids profiles
        parsed = parsed.filter((p: UserProfile) => 
          p.id !== "p-rachael" && 
          p.id !== "p-kids" && 
          p.id !== "p-guest" &&
          !p.name.toLowerCase().includes("rachael") &&
          !p.name.toLowerCase().includes("rachel") &&
          !p.name.toLowerCase().includes("guest") &&
          !p.name.toLowerCase().includes("kids")
        );

        // Force-sync administrative profile cached PINs to 41823 to override outdated localStorage
        parsed = parsed.map((p: UserProfile) => {
          if (p.id === "p-parent" || p.name.includes("Admin")) {
            return { ...p, pinCode: "41823" };
          }
          return p;
        });

        if (parsed.length === 0) {
          if (currentAccount.isAdmin) {
            parsed = [...DEFAULT_PROFILES];
          } else {
            parsed = [
              {
                id: `p-main-${Date.now()}`,
                name: currentAccount.name,
                avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentAccount.name)}`,
                isKids: false,
                maxMaturityRating: "All",
                watchlist: [],
                favorites: [],
                recentlyWatched: []
              }
            ];
          }
        }
        setProfiles(parsed);
        
        // Auto-select last selected profile if possible
        const lastProfileId = localStorage.getItem("kwatch_active_profile_id");
        let activeSelected = false;
        if (lastProfileId) {
          const match = parsed.find((p: UserProfile) => p.id === lastProfileId);
          if (match) {
            setCurrentProfile(match);
            activeSelected = true;
          }
        }
        if (!activeSelected && parsed.length > 0) {
          setCurrentProfile(parsed[0]);
        }
      } else {
        if (currentAccount.isAdmin) {
          setProfiles(DEFAULT_PROFILES);
          localStorage.setItem(key, JSON.stringify(DEFAULT_PROFILES));
        } else {
          // Initialize fresh custom profiles
          const initProfiles: UserProfile[] = [
            {
              id: `p-main-${Date.now()}`,
              name: currentAccount.name,
              avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentAccount.name}`,
              isKids: false,
              maxMaturityRating: "All",
              watchlist: [],
              favorites: [],
              recentlyWatched: []
            }
          ];
          setProfiles(initProfiles);
          localStorage.setItem(key, JSON.stringify(initProfiles));
          
          if (currentAccount.email === "guest@kwatch.com") {
            setCurrentProfile(initProfiles[0]);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentAccount]);

  // Sync state modifications back to physical disk
  useEffect(() => {
    if (!currentAccount || profiles.length === 0) return;
    try {
      const key = `kwatch_profiles_account_${currentAccount.email}`;
      localStorage.setItem(key, JSON.stringify(profiles));
    } catch (e) {
      console.error("Local persistence failure: ", e);
    }

    if (currentProfile) {
      const updatedMatch = profiles.find(p => p.id === currentProfile.id);
      if (updatedMatch && JSON.stringify(updatedMatch) !== JSON.stringify(currentProfile)) {
        setCurrentProfile(updatedMatch);
      }
    }
  }, [profiles, currentProfile, currentAccount]);

  // Sync selected profile cache
  useEffect(() => {
    try {
      if (currentProfile) {
        localStorage.setItem("kwatch_active_profile_id", currentProfile.id);
      } else {
        localStorage.removeItem("kwatch_active_profile_id");
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentProfile]);

  // Fetch movies from full-stack API
  const fetchMoviesAndPrompts = async () => {
    const loadLocalFallbacks = () => {
      try {
        const stored = localStorage.getItem("kwatch_local_uploaded_movies");
        const locals = stored ? JSON.parse(stored) : [];
        setMovies([...locals, ...INITIAL_MOVIES]);
      } catch {
        setMovies(INITIAL_MOVIES);
      }
    };

    try {
      const res = await fetch("/api/movies");
      if (res.ok) {
        const data = await res.json();
        let locals: Movie[] = [];
        try {
          const stored = localStorage.getItem("kwatch_local_uploaded_movies");
          if (stored) locals = JSON.parse(stored);
        } catch {}

        const serverIds = new Set(data.map((m: Movie) => m.id));
        const filteredLocals = locals.filter(m => !serverIds.has(m.id));
        setMovies([...filteredLocals, ...data]);
      } else {
        loadLocalFallbacks();
      }
    } catch (err) {
      console.warn("Soft warning: failed to fetch movies list, using default dataset in sandbox.", err);
      loadLocalFallbacks();
    }

    try {
      const annRes = await fetch("/api/announcements");
      if (annRes.ok) {
        const annData = await annRes.json();
        setActiveAnnouncements(annData);
      }
    } catch (err) {
      console.warn("Soft warning: failed to fetch active banners.", err);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  useEffect(() => {
    fetchMoviesAndPrompts();
  }, []);

  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentProfile(profile);
    setAppView('portal'); // default to user stream view
    setWatchPartyActive(false);
  };

  const handleLogout = () => {
    setCurrentProfile(null);
    setAppView('portal');
    setIsAiOpen(false);
    setWatchPartyActive(false);
  };

  const handleLoginAccount = (account: UserAccount) => {
    setCurrentAccount(account);
    try {
      localStorage.setItem("kwatch_active_account", JSON.stringify(account));
      localStorage.setItem("kwatch_authorized_device_flag", "true");
      setIsNewDevice(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccountLogout = () => {
    setCurrentAccount(null);
    setCurrentProfile(null);
    setAppView('portal');
    setIsAiOpen(false);
    try {
      localStorage.removeItem("kwatch_active_account");
      localStorage.removeItem("kwatch_active_profile_id");
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenMovieInDetail = (movie: Movie) => {
    // We pass movie through to child portal visually by triggering detail modal
    // Click events proxy seamlessly
    const portalElement = document.getElementById('main-workspace');
    if (portalElement) {
      // Set movie state in portal automatically via local dispatch simulation
      (window as any).dispatchOpenMovie?.(movie);
    }
  };

  // Allow main portal to notify detail updates
  useEffect(() => {
    (window as any).dispatchOpenMovie = (movie: Movie) => {
      // Find the fully details of movie from current list
      const freshMovie = movies.find(m => m.id === movie.id);
      if (freshMovie) {
        const modalBtn = document.getElementById(`modal-trig-${freshMovie.id}`);
        // Trigger simulated detail open
        (window as any).setPortalSelectedMovie?.(freshMovie);
      }
    };
  }, [movies]);

  return (
    <div className={`min-h-screen ${appTheme === 'light' ? 'light bg-neutral-50 text-neutral-900' : 'bg-[#07080c] text-neutral-100'} flex flex-col font-sans select-none relative overflow-x-hidden pb-12`}>
      <ThemeInjector currentProfile={currentProfile} />
      
      {/* PROFESSIONAL PHYSICS ROOM ENVIRONMENT BACKGROUNDS & FLOWS */}
      {/* Warm designer floorlamp back-glow */}
      <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-gradient-to-bl from-amber-600/[0.04] via-amber-600/[0.01] to-transparent rounded-full blur-[180px] pointer-events-none z-0" />
      
      {/* Subtle screen emission back-glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[700px] bg-gradient-to-r from-purple-900/[0.02] via-blue-900/[0.01] to-transparent rounded-full blur-[200px] pointer-events-none z-0" />

      {/* Header bar only rendered for admin system or fallback, hidden for portal view since MainPortal embeds the search and profile layout natively */}
      {currentProfile && appView === 'admin' && (
        <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          
          {/* Brand logo container */}
          <KwatchLogo size={34} />

          {/* Dynamic header items when profile is active */}
          <div className="flex items-center gap-4">
            
            {/* Global Theme Toggle Button */}
            <button
              onClick={toggleAppTheme}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center justify-center shadow"
              title={appTheme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {appTheme === 'light' ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
            
            {/* View selectors for parent admin profile */}
            {(currentProfile.name.includes("Admin") || currentAccount?.isAdmin) && (
              <div className="hidden sm:flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
                <button
                  onClick={() => setAppView('portal')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    appView === 'portal' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Streaming Portal
                </button>
                <button
                  onClick={() => setAppView('admin')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    appView === 'admin' ? 'bg-orange-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Admin Panel
                </button>
              </div>
            )}

            {/* Profile Avatar & dropdown clicker */}
            <div className="flex items-center gap-3 bg-neutral-900/60 pl-3 pr-2 py-1 border border-neutral-850 rounded-full">
              <div className="text-right hidden xs:block">
                <span className="text-xs font-semibold text-white block">{currentProfile.name}</span>
                <span className="text-[9px] text-orange-400 block -mt-0.5 uppercase tracking-wider">
                  {currentProfile.isKids ? 'Kids Restricted' : 'Premium Standard'}
                </span>
              </div>
              <div className="relative">
                <img
                  src={currentProfile.avatarUrl}
                  alt="Profile Avatar"
                  className="w-7 h-7 rounded-full border border-neutral-700 shadow"
                  referrerPolicy="no-referrer"
                />
                <span 
                  className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-neutral-900 transition-all duration-300 ${
                    watchPartyActive
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                      : 'bg-neutral-500'
                  }`}
                  title={watchPartyActive ? "Online (Active Watch Party)" : "Offline (No active Watch Party)"}
                />
              </div>
              <button
                onClick={() => setShowParentalModal(true)}
                className="p-1.5 hover:bg-neutral-800 rounded-full text-orange-450 hover:text-orange-400 transition-colors cursor-pointer"
                title="Account Settings & Parental Controls"
                id="parental-trigger-btn"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Log out and switch profiles"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </header>
      )}

      {/* DETAILED BRIDGING HOOK TO INTERCEPT INNER PORTAL SELECTIONS */}
      {currentProfile && (
        <PortalBridge movies={movies} />
      )}

      {/* MAIN SYSTEM CONTAINER - MODERN FULL-SCREEN MINIMAL LAYOUT */}
      <div className="flex-1 w-full flex flex-col justify-stretch relative z-10">
        
        {/* STANDARD NATIVE EDGE-TO-EDGE WEB CANVAS VIEW */}
        <div className="relative flex-1 w-full flex flex-col md:flex-row items-stretch bg-[#0c0d12] overflow-hidden">
          <main className="flex-1 w-full flex flex-col md:flex-row items-stretch">
            <div className="flex-1 min-w-0 relative" id="main-workspace">
              {isLoadingMovies ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-neutral-950/80 min-h-[580px]">
                  <div className="w-10 h-10 border-4 border-red-650 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Compiling supreme movie libraries...</p>
                </div>
              ) : !currentProfile ? (
  showAuth ? (
                <AuthModal 
                  currentProfile={currentProfile}
                  onSelectProfile={handleSelectProfile}
                  onLogout={handleLogout}
                  profiles={profiles}
                  onUpdateProfiles={setProfiles}
                  currentAccount={currentAccount}
                  onLoginAccount={handleLoginAccount}
                  onLogoutAccount={handleAccountLogout}
                  isNewDevice={isNewDevice}
                  setIsNewDevice={setIsNewDevice}
                />
  ) : (
    <LandingPage
  onSignIn={() => setShowAuth(true)}
  movies={movies}
/>
  )
              ) : (
                <AnimatePresence mode="wait">
                  {appView === 'admin' ? (
                    <motion.div
                      key="admin-workspace-view"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-4 sm:p-8"
                    >
                      {currentAccount?.isAdmin || currentProfile.name.includes("Admin") ? (
                        <AdminDashboard 
                          movies={movies}
                          onRefreshMovies={fetchMoviesAndPrompts}
                        />
                      ) : (
                        <div className="bg-red-950/20 border border-red-900 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
                          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
                          <h3 className="font-bold text-white text-lg">System Access Blocked</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed mt-2">
                            Your active cinematic profile <span className="text-white font-semibold">({currentProfile.name})</span> is not flagged with administrative clearances. Log out and choose Papa Ken (Admin) profile.
                          </p>
                          <button
                            onClick={handleLogout}
                            className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold rounded-lg text-white font-mono"
                          >
                            Change Profile Now
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="portal-workspace-view"
                      initial={{ opacity: 0, scale: 0.985, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.985, y: -12 }}
                      transition={{ 
                        duration: 0.45, 
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                      className="w-full h-full"
                    >
                      <MainPortal 
                        currentProfile={currentProfile}
                        movies={movies}
                        onOpenAiAssistant={() => setIsAiOpen(true)}
                        onRefreshMovies={fetchMoviesAndPrompts}
                        activeAnnouncements={activeAnnouncements}
                        profiles={profiles}
                        onUpdateProfiles={setProfiles}
                        watchPartyActive={watchPartyActive}
                        setWatchPartyActive={setWatchPartyActive}
                        isAdmin={currentProfile.name.includes("Admin") || currentAccount?.isAdmin}
                        onSetAppView={setAppView}
                        onLogout={handleLogout}
                        appTheme={appTheme}
                        onToggleTheme={toggleAppTheme}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {isAiOpen && currentProfile && (
              <div className="w-full md:w-80 flex-shrink-0 animate-slide-in border-t md:border-t-0 md:border-l border-white/5 bg-[#121319]/90 relative z-20">
                <AiAssistant 
                  movies={movies}
                  onOpenMovieDetail={handleOpenMovieInDetail}
                  onClose={() => setIsAiOpen(false)}
                />
              </div>
            )}
          </main>
        </div>

      </div>

      {/* Parental Gate controls settings overlay */}
      <AnimatePresence>
        {showParentalModal && currentProfile && (
          <ParentalControls
            currentProfile={currentProfile}
            profiles={profiles}
            onUpdateProfiles={setProfiles}
            onClose={() => setShowParentalModal(false)}
            movies={movies}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

// Minimal Portal Bridge element to let App.tsx state communicate easily to child Portal selection
function PortalBridge({ movies }: { movies: Movie[] }) {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    (window as any).setPortalSelectedMovie = (movie: Movie) => {
      setSelectedMovie(movie);
    };
  }, []);

  return null;
}

