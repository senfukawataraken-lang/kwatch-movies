import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Plus, Check, Star, Search, Sparkles, Tv, HelpCircle, 
  ChevronRight, ChevronLeft, Info, X, Volume2, Maximize, SkipForward, Globe, 
  Download, Image as ImageIcon, Send, Share2, Users, CreditCard, 
  CheckCircle, Sliders, VolumeX, Eye, AlertTriangle, ArrowRight, ShieldCheck,
  BarChart3, Trash2, Settings, Mic, MicOff, Cast, Video, Pause, RotateCcw,
  Home, Heart, Calendar, Bell, Shield, ShieldAlert, LogOut, Menu, MoreVertical, Sun, Moon
} from 'lucide-react';
import { Movie, UserProfile, Episode, SubscriptionPlan, CommentMessage, DownloadTask } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/movies';
import DownloadsManager from './DownloadsManager';
import UserInsights from './UserInsights';
import SmartTvCasting from './SmartTvCasting';
import CreatorStudio from './CreatorStudio';
import MyDownloadsPage from './MyDownloadsPage';

interface MainPortalProps {
  currentProfile: UserProfile;
  movies: Movie[];
  onOpenAiAssistant: () => void;
  onRefreshMovies: () => void;
  activeAnnouncements: { id: string; text: string; date: string }[];
  profiles?: UserProfile[];
  onUpdateProfiles?: (updated: UserProfile[]) => void;
  watchPartyActive?: boolean;
  setWatchPartyActive?: (active: boolean) => void;
  isAdmin?: boolean;
  onSetAppView?: (view: 'portal' | 'admin') => void;
  onLogout?: () => void;
  appTheme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export default function MainPortal({ 
  currentProfile, 
  movies, 
  onOpenAiAssistant, 
  onRefreshMovies,
  activeAnnouncements,
  profiles = [],
  onUpdateProfiles,
  watchPartyActive = false,
  setWatchPartyActive,
  isAdmin = false,
  onSetAppView,
  onLogout,
  appTheme = 'dark',
  onToggleTheme
}: MainPortalProps) {
  
  // Weight map for maturity limit check
  const getMaturityWeight = (rating?: string) => {
    switch (rating) {
      case 'G': return 1;
      case 'PG': return 2;
      case 'PG-13': return 3;
      case 'R': return 4;
      default: return 5; // Unrestricted
    }
  };

  // Global parental gate setting state
  const [globalParentalActive, setGlobalParentalActive] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/parental-settings")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (typeof data.enabled === 'boolean') {
          setGlobalParentalActive(data.enabled);
        }
      })
      .catch(() => {});
  }, [profiles]);

  // Filtering movies for kids profile and account content rating settings
  const filteredMovies = movies.filter(m => {
    // 1. Kids profile strict constraints
    if (currentProfile.isKids) {
      const isFamilyOrCartoon = m.genres.includes('Family') || m.genres.includes('Animation') || m.genres.includes('Comedy');
      const isSafeRating = m.maturityRating === 'G' || !m.maturityRating;
      return isFamilyOrCartoon && isSafeRating;
    }
    // 2. Parental controls filter limit ceiling
    if (globalParentalActive) {
      if (currentProfile.maxMaturityRating && currentProfile.maxMaturityRating !== 'All') {
        const userCeiling = getMaturityWeight(currentProfile.maxMaturityRating);
        const movieRating = getMaturityWeight(m.maturityRating);
        if (movieRating > userCeiling) {
          return false;
        }
      }
    }
    return true;
  });

  // Sliding Hero Carousel
  const featuredMovies = filteredMovies.filter(m => m.isFeatured || m.isPopular || m.rating >= 4.5).slice(0, 5);
  const [heroIndex, setHeroIndex] = useState(0);
  const featuredMovie = featuredMovies[heroIndex] || filteredMovies[0];

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningFeedback, setListeningFeedback] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeVideoMovie, setActiveVideoMovie] = useState<Movie | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [initialSeekTime, setInitialSeekTime] = useState<number | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>("");
  const [isLoadingPlayUrl, setIsLoadingPlayUrl] = useState<boolean>(false);
  const [playUrlError, setPlayUrlError] = useState<string | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0);

  useEffect(() => {
    if (!activeVideoMovie) {
      setResolvedVideoSrc("");
      setPlayUrlError(null);
      return;
    }

    const fetchSignedPlayUrl = async () => {
      setIsLoadingPlayUrl(true);
      setPlayUrlError(null);
      try {
        const typeParam = activeEpisode ? "episode" : "video";
        let accountEmail = "";
        
        try {
          const savedAccount = localStorage.getItem("kwatch_active_account");
          if (savedAccount) {
            accountEmail = JSON.parse(savedAccount).email || "";
          }
        } catch (e) {
          console.error("Failed to parse active account from localStorage:", e);
        }

        // Fallback email if no account in localStorage
        if (!accountEmail && currentProfile) {
          accountEmail = currentProfile.name.toLowerCase().includes("admin") ? "admin@kwatch.com" : "user@kwatch.com";
        }

        const endpoint = `/api/movies/${activeVideoMovie.id}/play?email=${encodeURIComponent(accountEmail)}&type=${typeParam}`;
        const res = await fetch(endpoint);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (errData.code === "ADS_REQUIRED") {
            setIsAdPlaying(true);
            setCurrentAdIndex(errData.completedCount || 0);
            setAdSecondsLeft(5);
            setResolvedVideoSrc("");
            return;
          }
          throw new Error(errData.error || `Failed to fetch play URL (Status ${res.status})`);
        }

        const data = await res.json();
        if (data.playUrl) {
          setResolvedVideoSrc(data.playUrl);
        } else {
          throw new Error("No playUrl returned from server");
        }
      } catch (err: any) {
        console.error("Error fetching signed play URL:", err);
        setPlayUrlError(err.message || "Unable to retrieve secure playback link.");
        // Fallback to what we have in movies or a default video URL so the user is never stuck
        const rawUrl = activeEpisode ? activeEpisode.videoUrl : activeVideoMovie.videoUrl;
        if (rawUrl && rawUrl.startsWith("http")) {
          setResolvedVideoSrc(rawUrl);
        } else {
          setResolvedVideoSrc("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
        }
      } finally {
        setIsLoadingPlayUrl(false);
      }
    };

    fetchSignedPlayUrl();
  }, [activeVideoMovie?.id, activeEpisode?.id, currentProfile?.id, fetchTrigger]);
  
  const [watchlist, setWatchlist] = useState<string[]>(currentProfile.watchlist || []);
  const [favorites, setFavorites] = useState<string[]>(currentProfile.favorites || []);
  const [continueWatching, setContinueWatching] = useState<any[]>([
    { movieId: "m-1", progress: 65 },
    { movieId: "m-2", progress: 20 }
  ]);

  // Synchronize local states when switching profiles
  useEffect(() => {
    setWatchlist(currentProfile.watchlist || []);
    setFavorites(currentProfile.favorites || []);
  }, [currentProfile.id, currentProfile.watchlist, currentProfile.favorites]);

  // Sync watchlist/favorites back to global profiles state
  useEffect(() => {
    if (onUpdateProfiles && profiles.length > 0) {
      const match = profiles.find(p => p.id === currentProfile.id);
      if (match) {
        const isWatchlistDiff = JSON.stringify(match.watchlist || []) !== JSON.stringify(watchlist);
        const isFavoritesDiff = JSON.stringify(match.favorites || []) !== JSON.stringify(favorites);
        if (isWatchlistDiff || isFavoritesDiff) {
          const updated = profiles.map(p => {
            if (p.id === currentProfile.id) {
              return { ...p, watchlist, favorites };
            }
            return p;
          });
          onUpdateProfiles(updated);
        }
      }
    }
  }, [watchlist, favorites, currentProfile.id, onUpdateProfiles, profiles]);

  // Synchronize continueWatching row from currentProfile's recentlyWatched list
  useEffect(() => {
    const profileHistory = currentProfile.recentlyWatched || [];
    const partiallyWatched = profileHistory.filter(item => item.progress > 0 && item.progress < 95);

    if (partiallyWatched.length > 0) {
      setContinueWatching(partiallyWatched);
    } else {
      // Fallback initial mock items with timestamps to support demo resume capabilities
      setContinueWatching([
        { movieId: "m-1", progress: 65, timestamp: 350 },
        { movieId: "m-2", progress: 20, timestamp: 120 }
      ]);
    }
  }, [currentProfile.recentlyWatched]);

  // Video Settings States
  const [videoQuality, setVideoQuality] = useState<string>("Auto (1080p)");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>("English");
  const [areSubtitlesOn, setAreSubtitlesOn] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playerVolume, setPlayerVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoScaleMode, setVideoScaleMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Auto-hide controls when in fullscreen
  useEffect(() => {
    if (!activeVideoMovie) {
      setControlsVisible(true);
      return;
    }

    let timeoutId: any;

    const resetTimer = () => {
      setControlsVisible(true);
      if (isFullscreen) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setControlsVisible(false);
        }, 3000); // 3 seconds of inactivity
      }
    };

    // If we transition into/out of fullscreen, make sure we show them initially
    resetTimer();

    const handleMouseMove = () => {
      resetTimer();
    };

    const container = playerContainerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('click', handleMouseMove);
    }

    return () => {
      clearTimeout(timeoutId);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleMouseMove);
      }
    };
  }, [isFullscreen, activeVideoMovie]);

  // Set up global shortcut keys for awesome video playback controls when stream is open
  useEffect(() => {
    if (!activeVideoMovie) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in chat, feedback, search or form inputs
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Spacebar
          e.preventDefault();
          togglePlay();
          break;
        case 'f': // F key
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm': // M key
          e.preventDefault();
          handleVolumeMuteToggle();
          break;
        case 's': // S key - cycle fitting
          e.preventDefault();
          setVideoScaleMode(prev => {
            const list: ('contain' | 'cover' | 'stretch')[] = ['contain', 'cover', 'stretch'];
            const nextIdx = (list.indexOf(prev) + 1) % list.length;
            return list[nextIdx];
          });
          break;
        case 'arrowright': // Arrow Right - forward 10s
          e.preventDefault();
          handleSkip(10);
          break;
        case 'arrowleft': // Arrow Left - rewind 10s
          e.preventDefault();
          handleSkip(-10);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVideoMovie, muted, isPlaying, duration, currentTime, playerVolume, isFullscreen]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => console.error("Could not play video:", err));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      let targetTime = videoRef.current.currentTime + seconds;
      if (targetTime < 0) targetTime = 0;
      if (targetTime > duration) targetTime = duration;
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setPlayerVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
    if (vol > 0 && muted) {
      setMuted(false);
    }
  };

  const handleVolumeMuteToggle = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error("Fullscreen exit error:", err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Download simulation and robust queue management
  const [downloadTasks, setDownloadTasks] = useState<DownloadTask[]>(() => {
    try {
      const saved = localStorage.getItem(`kwatch_download_tasks_${currentProfile.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [downloadedList, setDownloadedList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`kwatch_downloads_${currentProfile.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Derived variables to preserve 100% backward compatibility for single-movie displays
  const downloadingTask = downloadTasks.find(t => t.status === 'downloading');
  const downloadingMovieId = downloadingTask ? downloadingTask.id : null;
  const downloadProgress = downloadingTask ? Math.round(downloadingTask.progress) : 0;

  const [showDownloadsModal, setShowDownloadsModal] = useState<boolean>(false);
  const [showPaymentModalForMovie, setShowPaymentModalForMovie] = useState<Movie | null>(null);
  const [isSimulatingDeviceDownload, setIsSimulatingDeviceDownload] = useState<boolean>(false);
  const [showInsightsModal, setShowInsightsModal] = useState<boolean>(false);
  const [showSmartTvModal, setShowSmartTvModal] = useState<boolean>(false);
  const [showCreatorStudio, setShowCreatorStudio] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'browse' | 'downloads'>('browse');
  const [sidebarTab, setSidebarTab] = useState<'browse' | 'wishlist' | 'coming-soon'>('browse');
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState<boolean>(false);
  const [overlaySearchQuery, setOverlaySearchQuery] = useState<string>("");
  const [overlaySelectedGenre, setOverlaySelectedGenre] = useState<string>("All");

  // Real-time Search configuration (Advanced search removed by request)

  // Sync state back to local offline capacity
  useEffect(() => {
    try {
      localStorage.setItem(`kwatch_downloads_${currentProfile.id}`, JSON.stringify(downloadedList));
    } catch (e) {
      console.error("Local Storage persistent caching error: ", e);
    }
  }, [downloadedList, currentProfile.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`kwatch_download_tasks_${currentProfile.id}`, JSON.stringify(downloadTasks));
    } catch (e) {
      console.error("Local Storage tasks caching error: ", e);
    }
  }, [downloadTasks, currentProfile.id]);

  // Download Queue processing background scheduler
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloadTasks((currentTasks) => {
        // If there is no task currently downloading, look for the first queued task
        const isAnyDownloading = currentTasks.some(t => t.status === 'downloading');
        let updatedTasks = [...currentTasks];

        if (!isAnyDownloading) {
          const firstQueuedIndex = updatedTasks.findIndex(t => t.status === 'queued');
          if (firstQueuedIndex !== -1) {
            updatedTasks[firstQueuedIndex] = {
              ...updatedTasks[firstQueuedIndex],
              status: 'downloading'
            };
            return updatedTasks;
          }
        }

        // Advance progress for the downloading task
        let hasChanges = false;
        updatedTasks = updatedTasks.map(task => {
          if (task.status === 'downloading') {
            hasChanges = true;
            
            // Speed setting retrieval (standard, high, ultra)
            let baseSpeed = 5;
            let speedSetting = 'high';
            try {
              const savedSpeed = localStorage.getItem(`kwatch_dl_speed_${currentProfile.id}`);
              if (savedSpeed) speedSetting = savedSpeed;
            } catch {}

            if (speedSetting === 'high') baseSpeed = 22;
            if (speedSetting === 'ultra') baseSpeed = 54;

            const fluctuation = (Math.random() - 0.5) * (baseSpeed * 0.3);
            let currentSpeed = parseFloat((baseSpeed + fluctuation).toFixed(1));

            // Apply download speed limiter settings if enabled
            try {
              const savedLimitEnabled = localStorage.getItem(`kwatch_dl_limit_enabled_${currentProfile.id}`);
              const limitEnabled = savedLimitEnabled === 'true';
              if (limitEnabled) {
                const savedLimitVal = localStorage.getItem(`kwatch_dl_limit_val_${currentProfile.id}`);
                if (savedLimitVal) {
                  const limitVal = parseInt(savedLimitVal, 10);
                  currentSpeed = Math.min(currentSpeed, limitVal);
                }
              }
            } catch {}

            // Convert size from GB to MB (e.g. 1.5 GB -> 1536 MB)
            const sizeMB = (task.sizeGB || 1) * 1024;
            // Percent increase per second
            const progressDelta = (currentSpeed / sizeMB) * 100;
            const nextProgress = Math.min(100, task.progress + progressDelta);

            if (nextProgress >= 100) {
              // Add to completed list
              setDownloadedList(prev => {
                if (prev.includes(task.id)) return prev;
                return [...prev, task.id];
              });

              // Trigger success audit log on server
              fetch("/api/audit-logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user: currentProfile.name || "Default User",
                  action: `Completed download of "${task.movieTitle}" (${task.sizeGB} GB) to local device storage.`,
                  category: "MARKETING",
                  status: "SUCCESS"
                })
              }).catch(() => {});

              // Toast
              triggerMonetizationToast(
                `🏁 Download Complete!`,
                `Successfully cached "${task.movieTitle}" (${task.sizeGB} GB) to your device storage.`
              );

              return {
                ...task,
                progress: 100,
                speedMBs: 0,
                status: 'completed'
              };
            }

            return {
              ...task,
              progress: parseFloat(nextProgress.toFixed(1)),
              speedMBs: currentSpeed
            };
          }
          return task;
        });

        if (hasChanges) {
          return updatedTasks;
        }
        return currentTasks;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentProfile.id]);

  // Forbid non-admins from stay on different viewModes
  useEffect(() => {
    if (!isAdmin) {
      setViewMode('browse');
    }
  }, [currentProfile.id, isAdmin]);

  // Voice Search / Web Speech API integration
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please try using modern Google Chrome, Microsoft Edge, or another speech-enabled browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping voice recognition:", e);
        }
      }
      setIsListening(false);
      setListeningFeedback("");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setListeningFeedback("Listening... Say a movie, star, or genre...");
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          setSearchInput(transcript);
          setSearchQuery(transcript);
          setListeningFeedback(`Searched: "${transcript}"`);
          setTimeout(() => {
            setIsListening(false);
            setListeningFeedback("");
          }, 3000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setListeningFeedback("Error: Microphone access denied");
        } else {
          setListeningFeedback(`Error: Speech not recognized (${event.error})`);
        }
        setTimeout(() => {
          setIsListening(false);
          setListeningFeedback("");
        }, 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition setup failed:", err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Presentation API & External Screen Cast Trigger
  const handleCastPresentation = () => {
    const videoUrl = resolvedVideoSrc || (activeEpisode ? activeEpisode.videoUrl : activeVideoMovie?.videoUrl);
    if (!videoUrl) {
      alert("No active movie or episode streaming to cast.");
      return;
    }

    const PresentationRequest = (window as any).PresentationRequest;
    if (!PresentationRequest) {
      alert("Presentation API is not supported directly in this sandbox container. Activating Kwatch Smart TV & Casting connection suite as a dynamic, interactive fallback!");
      setShowSmartTvModal(true);
      return;
    }

    try {
      // Create request with video url, fallback to current origin
      const request = new PresentationRequest([videoUrl, window.location.origin]);
      (window as any).defaultPresentationRequest = request;

      request.start()
        .then((connection: any) => {
          alert(`Success! Chromecast/Airplay presentation request initialized. Connection ID: ${connection.id}. Active screen is casting "${activeVideoMovie?.title}" successfully!`);
          connection.onclose = () => {
            console.log("Presentation casting closed.");
          };
        })
        .catch((err: any) => {
          console.warn("User closed window or device not found:", err);
          if (err.name === 'NotAllowedError') {
            alert("External screen selection cancelled. Activating Kwatch simulated casting control hub instead!");
          } else {
            alert(`Unable to stream via Presentation request: ${err.message}. Routing to Smart TV Casting Suite...`);
          }
          setShowSmartTvModal(true);
        });
    } catch (e: any) {
      console.error("PresentationRequest failure:", e);
      setShowSmartTvModal(true);
    }
  };

  // Ads variables
  const [isAdPlaying, setIsAdPlaying] = useState<boolean>(false);
  const [adSecondsLeft, setAdSecondsLeft] = useState<number>(0);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([]);
  const [downloadPrice, setDownloadPrice] = useState<number>(5000);
  const [adsenseEnabled, setAdsenseEnabled] = useState<boolean>(true);
  const [adsensePublisherId, setAdsensePublisherId] = useState<string>("ca-pub-3940251849102834");
  const [admobEnabled, setAdmobEnabled] = useState<boolean>(true);
  const [admobAppId, setAdmobAppId] = useState<string>("ca-app-pub-3940251849102834~1028394829");
  const [admobBannerUnitId, setAdmobBannerUnitId] = useState<string>("ca-app-pub-3940251849102834/1029384729");
  const [admobRewardedUnitId, setAdmobRewardedUnitId] = useState<string>("ca-app-pub-3940251849102834/4820193849");

  // Custom non-blocking interactive notification toast for simulated monetization triggers
  const [monetizationToast, setMonetizationToast] = useState<{ message: string; sub: string; active: boolean }>({
    message: "",
    sub: "",
    active: false
  });

  const triggerMonetizationToast = (message: string, sub: string) => {
    setMonetizationToast({ message, sub, active: true });
    setTimeout(() => {
      setMonetizationToast(prev => ({ ...prev, active: false }));
    }, 5000);
  };

  const [showAdmobRewardedVideo, setShowAdmobRewardedVideo] = useState<boolean>(false);
  const [admobTimer, setAdmobTimer] = useState<number>(10);

  useEffect(() => {
    let interval: any = null;
    if (showAdmobRewardedVideo && admobTimer > 0) {
      interval = setInterval(() => {
        setAdmobTimer(prev => prev - 1);
      }, 1000);
    } else if (showAdmobRewardedVideo && admobTimer === 0) {
      setShowAdmobRewardedVideo(false);
      fetch("/api/ads/simulate-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "admob" })
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error();
        })
        .then(data => {
          triggerMonetizationToast(
            `💰 Google AdMob: Video Reward Issued!`,
            `Simulated Shs ${data.added.toLocaleString()} added to publisher account ${admobRewardedUnitId}. Rewarded VIP HD unlocked!`
          );
        })
        .catch(err => {
          console.error(err);
        });
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showAdmobRewardedVideo, admobTimer]);

  useEffect(() => {
    fetch("/api/ads-settings")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (data) {
          setAdsenseEnabled(data.adsenseEnabled !== false);
          if (data.adsensePublisherId) setAdsensePublisherId(data.adsensePublisherId);
          setAdmobEnabled(data.admobEnabled !== false);
          if (data.admobAppId) setAdmobAppId(data.admobAppId);
          if (data.admobBannerUnitId) setAdmobBannerUnitId(data.admobBannerUnitId);
          if (data.admobRewardedUnitId) setAdmobRewardedUnitId(data.admobRewardedUnitId);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/pricing-plans")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const dlPlan = data.find((p: any) => p.id === "plan-download");
          if (dlPlan && typeof dlPlan.price === 'number') {
            setDownloadPrice(dlPlan.price);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/ads-campaigns")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setAdCampaigns(data.filter((c: any) => c.status === "Active"));
        }
      })
      .catch(err => {
        console.warn("Failed to fetch ad campaigns, using fallbacks:", err);
      });
  }, []);

  const [userSubscription, setUserSubscription] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("kwatch_user_subscription");
      return saved || "Free Ad-Supported";
    } catch {
      return "Free Ad-Supported";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("kwatch_user_subscription", userSubscription);
    } catch (e) {
      console.error(e);
    }
  }, [userSubscription]);

  useEffect(() => {
    const handleSubscriptionChange = (e: Event) => {
      try {
        const customEv = e as CustomEvent;
        if (customEv.detail) {
          setUserSubscription(customEv.detail);
        } else {
          const saved = localStorage.getItem("kwatch_user_subscription");
          if (saved) {
            setUserSubscription(saved);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    window.addEventListener("kwatch_subscription_update", handleSubscriptionChange);
    return () => {
      window.removeEventListener("kwatch_subscription_update", handleSubscriptionChange);
    };
  }, []);

  const handleAdsenseClick = async () => {
    try {
      const res = await fetch("/api/ads/simulate-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "adsense" })
      });
      if (res.ok) {
        const data = await res.json();
        triggerMonetizationToast(
          `Google AdSense: Click registered!`,
          `Simulated Shs ${data.added.toLocaleString()} added to publisher account: ${adsensePublisherId}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Subscription modal state
  const [showBillingModal, setShowBillingModal] = useState<boolean>(false);
  const [billingPlanCandidate, setBillingPlanCandidate] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Card"); // Card, MobileMoney
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);

  // Auto-delete watched downloads setting state
  const [autoDeleteWatched, setAutoDeleteWatched] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`kwatch_auto_delete_watched_${currentProfile.id}`);
      return saved === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`kwatch_auto_delete_watched_${currentProfile.id}`, autoDeleteWatched ? "true" : "false");
    } catch (e) {
      console.error(e);
    }
  }, [autoDeleteWatched, currentProfile.id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kwatch_auto_delete_watched_${currentProfile.id}`);
      setAutoDeleteWatched(saved === "true");
    } catch (e) {
      console.error(e);
    }
  }, [currentProfile.id]);

  // Watch Party States (now powered by shared props)
  const [partyMessage, setPartyMessage] = useState<string>("");
  const [partyComments, setPartyComments] = useState<CommentMessage[]>([
    { id: "c1", userName: "Aisha", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Aisha", text: "Oh wow, Sintel's companion looks incredible! 🔥", timestamp: "Just now" },
    { id: "c2", userName: "Mark_K", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mark", text: "Wait, skip to episode 2 if you are on season 1!", timestamp: "Just now" }
  ]);

  // Accessibility States
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [textSizeMultiplier, setTextSizeMultiplier] = useState<'normal' | 'large'>('normal');

  // Video HTML Player ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle Incremental View Trigger
  const registerContentView = async (movieId: string) => {
    try {
      await fetch(`/api/movies/${movieId}/view`, { method: "POST" });
      onRefreshMovies();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayClick = (movie: Movie, episode?: Episode, resumeTime?: number) => {
    setActiveVideoMovie(movie);
    setActiveEpisode(episode || null);
    registerContentView(movie.id);

    // Determine target seek time
    let targetSeekTime: number | null = null;
    if (resumeTime !== undefined && resumeTime !== null) {
      targetSeekTime = resumeTime;
    } else {
      // Find saved position in profile's recentlyWatched
      const historyItem = (currentProfile.recentlyWatched || []).find(item => item.movieId === movie.id);
      if (historyItem && historyItem.timestamp && historyItem.progress > 0 && historyItem.progress < 95) {
        targetSeekTime = historyItem.timestamp;
      }
    }

    if (targetSeekTime !== null) {
      setInitialSeekTime(targetSeekTime);
      setCurrentTime(targetSeekTime);
    } else {
      setInitialSeekTime(null);
      setCurrentTime(0);
    }
    lastSaveTimeRef.current = Date.now();

    // Update recentlyWatched in parent profiles state for gamification
    if (onUpdateProfiles && profiles.length > 0) {
      const existHistory = currentProfile.recentlyWatched || [];
      let updatedHistory = [...existHistory];
      const existing = existHistory.find(item => item.movieId === movie.id);

      if (existing) {
        updatedHistory = updatedHistory.map(item => 
          item.movieId === movie.id 
            ? { 
                ...item, 
                watchedAt: new Date().toISOString(),
                timestamp: targetSeekTime !== null ? targetSeekTime : (item.timestamp || 0),
                progress: targetSeekTime !== null && item.duration ? Math.min(Math.round((targetSeekTime / item.duration) * 100), 100) : (item.progress || 0)
              }
            : item
        );
      } else {
        updatedHistory.unshift({
          movieId: movie.id,
          watchedAt: new Date().toISOString(),
          progress: targetSeekTime ? Math.min(Math.round((targetSeekTime / 100) * 100), 100) : 0,
          timestamp: targetSeekTime || 0,
          duration: 100 // placeholder till video metadata is parsed
        });
      }

      const updated = profiles.map(p => {
        if (p.id === currentProfile.id) {
          return { ...p, recentlyWatched: updatedHistory };
        }
        return p;
      });
      onUpdateProfiles(updated);
    }

    // If user is Free Tier, trigger an unskippable ad!
    if (userSubscription === "Free Ad-Supported") {
      setIsAdPlaying(true);
      setAdSecondsLeft(5);
    }
  };

  const savePlaybackProgress = (currentTimeVal: number, durationVal: number) => {
    if (!activeVideoMovie || !onUpdateProfiles || !currentProfile || profiles.length === 0) return;

    const progressPercent = durationVal > 0 ? Math.min(Math.round((currentTimeVal / durationVal) * 100), 100) : 0;
    const existHistory = currentProfile.recentlyWatched || [];
    let updatedHistory = [...existHistory];

    const existingIndex = existHistory.findIndex(item => item.movieId === activeVideoMovie.id);
    if (existingIndex > -1) {
      updatedHistory[existingIndex] = {
        ...updatedHistory[existingIndex],
        watchedAt: new Date().toISOString(),
        progress: progressPercent,
        timestamp: currentTimeVal,
        duration: durationVal
      };
    } else {
      updatedHistory.unshift({
        movieId: activeVideoMovie.id,
        watchedAt: new Date().toISOString(),
        progress: progressPercent,
        timestamp: currentTimeVal,
        duration: durationVal
      });
    }

    const updated = profiles.map(p => {
      if (p.id === currentProfile.id) {
        return { ...p, recentlyWatched: updatedHistory };
      }
      return p;
    });
    onUpdateProfiles(updated);
  };

  // Timer for Ads
  useEffect(() => {
    if (isAdPlaying && adSecondsLeft > 0) {
      const timer = setTimeout(() => {
        setAdSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isAdPlaying && adSecondsLeft === 0) {
      const recordAdAndAdvance = async () => {
        try {
          let email = "";
          try {
            const savedAccount = localStorage.getItem("kwatch_active_account");
            if (savedAccount) {
              email = JSON.parse(savedAccount).email || "";
            }
          } catch {}
          if (!email && currentProfile) {
            email = currentProfile.name.toLowerCase().includes("admin") ? "admin@kwatch.com" : "user@kwatch.com";
          }

          const adId = adCampaigns[currentAdIndex]?.id || `fallback-ad-${currentAdIndex + 1}`;
          
          // Record to DB
          await fetch("/api/ads/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              movieId: activeVideoMovie?.id,
              adId
            })
          });

          // Transition to next ad or finish
          const nextIndex = currentAdIndex + 1;
          if (nextIndex < 3) {
            setCurrentAdIndex(nextIndex);
            setAdSecondsLeft(5); // start next ad countdown
          } else {
            setIsAdPlaying(false);
            // Increment fetchTrigger to trigger signed URL fetch!
            setFetchTrigger(prev => prev + 1);
          }
        } catch (err) {
          console.error("Failed to record ad:", err);
          // Fallback progress anyway to prevent UI locks
          const nextIndex = currentAdIndex + 1;
          if (nextIndex < 3) {
            setCurrentAdIndex(nextIndex);
            setAdSecondsLeft(5);
          } else {
            setIsAdPlaying(false);
            setFetchTrigger(prev => prev + 1);
          }
        }
      };

      recordAdAndAdvance();
    }
  }, [isAdPlaying, adSecondsLeft, currentAdIndex, adCampaigns, activeVideoMovie?.id]);

  // Handle Downloads via Queue Manager
  const handleDownloadTrigger = (movieId: string) => {
    if (downloadedList.includes(movieId)) {
      alert("Movie currently stored in local cache storage offline!");
      return;
    }

    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    // Check if task is already in the queue
    const existingTask = downloadTasks.find(t => t.id === movieId);
    if (existingTask) {
      if (existingTask.status === 'completed') {
        alert("Movie currently stored in local cache storage offline!");
      } else if (existingTask.status === 'paused') {
        // Resume it
        setDownloadTasks(prev => prev.map(t => t.id === movieId ? { ...t, status: 'queued' } : t));
        triggerMonetizationToast(
          `📥 Download Resumed`,
          `"${movie.title}" download has been resumed.`
        );
      } else {
        alert(`"${movie.title}" is already in the download manager queue (Status: ${existingTask.status}).`);
      }
      return;
    }

    // Determine movie size deterministically
    const sizeGB = getMovieSizeGB(movie);

    const newTask: DownloadTask = {
      id: movieId,
      movieTitle: movie.title,
      moviePosterUrl: movie.posterUrl,
      sizeGB,
      progress: 0,
      speedMBs: 0,
      status: downloadTasks.some(t => t.status === 'downloading') ? 'queued' : 'downloading',
      addedAt: new Date().toLocaleTimeString()
    };

    setDownloadTasks(prev => [...prev, newTask]);

    triggerMonetizationToast(
      `📥 Download Started`,
      `"${movie.title}" has been added to the offline downloads queue.`
    );

    // Record the audit log on the server
    fetch("/api/audit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: currentProfile.name || "Default User",
        action: `Started offline download queue request for "${movie.title}"`,
        category: "MARKETING",
        status: "SUCCESS"
      })
    }).catch(() => {});
  };

  const handlePauseDownload = (movieId: string) => {
    setDownloadTasks(prev => prev.map(task => {
      if (task.id === movieId && task.status === 'downloading') {
        return { ...task, status: 'paused', speedMBs: 0 };
      }
      return task;
    }));
  };

  const handleResumeDownload = (movieId: string) => {
    setDownloadTasks(prev => prev.map(task => {
      if (task.id === movieId && task.status === 'paused') {
        return { ...task, status: 'queued' };
      }
      return task;
    }));
  };

  const handleCancelDownload = (movieId: string) => {
    setDownloadTasks(prev => prev.filter(task => task.id !== movieId));
    setDownloadedList(prev => prev.filter(id => id !== movieId));
  };

  const getMovieSizeGB = (movie: Movie) => {
    const len = movie.title.length;
    return parseFloat((1.2 + (len % 5) * 0.7).toFixed(1));
  };

  const handleDownloadLocalFile = (movie: Movie) => {
    setIsSimulatingDeviceDownload(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsSimulatingDeviceDownload(false);
        setShowPaymentModalForMovie(null);

        // 1. Record the audit log on the server
        fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: currentProfile.name || "Default User",
            action: `Purchased and downloaded "${movie.title}" directly to local device storage for Shs ${downloadPrice.toLocaleString()}`,
            category: "PRICING",
            status: "SUCCESS"
          })
        }).catch(() => {});

        // 2. Trigger the actual browser file download
        const now = new Date();
        const expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const blobContent = `KWATCH PREMIUM OFFLINE MOVIE FILE LICENSED COPY
--------------------------------------------------
Title: ${movie.title}
Size: ${getMovieSizeGB(movie)} GB
Direct Download ID: ${movie.id}
License Status: Paid & Verified (2-Week Local Offline License)
Price Paid: Shs ${downloadPrice.toLocaleString()}
Licensed On: ${now.toLocaleString()}
Expires On: ${expires.toLocaleString()} (14 Days Validity)

Enjoy viewing your high-speed, offline-rendered premium content directly from your device storage! This file is licensed for local offline playback until ${expires.toLocaleDateString()}.`;
         
        const blob = new Blob([blobContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${movie.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_offline_hd.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Success! "${movie.title}" offline HD package has been purchased for Shs ${downloadPrice.toLocaleString()} and downloaded to your local device. Your license is valid for 2 weeks (expires on ${expires.toLocaleDateString()}).`);
      }
    }, 200);
  };

  const handleRemoveDownload = (movieId: string) => {
    setDownloadedList(current => current.filter(id => id !== movieId));
    setDownloadTasks(prev => prev.filter(task => task.id !== movieId));
  };

  const handleRemoveAllDownloads = () => {
    setDownloadedList([]);
    setDownloadTasks([]);
  };

  const handlePlayDownloadedMovie = (movie: Movie) => {
    setShowDownloadsModal(false);
    handlePlayClick(movie);
  };

  const renderDownloadStatusBadge = (movie: Movie) => {
    if (!isAdmin) return null;
    const isDownloading = downloadingMovieId === movie.id;
    const isDownloaded = downloadedList.includes(movie.id);

    if (isDownloading) {
      return (
        <div className="absolute top-2 left-2 bg-purple-950/95 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-purple-500/40 backdrop-blur-md z-20 shadow-md">
          <div className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>DL {downloadProgress}%</span>
        </div>
      );
    }

    if (isDownloaded) {
      return (
        <>
          <div className="absolute top-2 left-2 bg-emerald-950/95 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-555/40 backdrop-blur-md z-20 shadow-md">
            <Check className="w-3 h-3" />
            <span>Offline</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remove downloaded copy of "${movie.title}"?`)) {
                handleRemoveDownload(movie.id);
              }
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-950 hover:text-red-400 border border-neutral-800 hover:border-red-900 text-neutral-400 rounded-lg transition-all cursor-pointer z-35 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg"
            title="Remove downloaded copy"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      );
    }

    return null;
  };

  // Watch Party simulation messages generator
  useEffect(() => {
    if (watchPartyActive) {
      const interval = setInterval(() => {
        const fakeNames = ["Luganda_Pro", "Sarah_Ug", "NairobiCine", "KigaliView", "SwahiliGamer", "KampalaBoy"];
        const fakeAvatars = ["Sarah", "Boy", "Cine", "Luganda", "View", "Pro"];
        const fakeChats = [
          "This streaming visual is extremely razor-sharp!",
          "Swahili subtitle translations are fully correct!",
          "Audio quality is cinematic, great Dolby sound simulation.",
          "Wow look at this scenery...",
          "Who is directing this?",
          "Skip forward 10 seconds pls!"
        ];
        const randomIdx = Math.floor(Math.random() * fakeChats.length);
        const nameIdx = Math.floor(Math.random() * fakeNames.length);

        const newComment: CommentMessage = {
          id: `f-${Date.now()}`,
          userName: fakeNames[nameIdx],
          avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${fakeAvatars[nameIdx]}`,
          text: fakeChats[randomIdx],
          timestamp: "Just now"
        };
        setPartyComments(prev => [...prev, newComment]);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [watchPartyActive]);

  // Submit new Watch Party chat
  const handleSendPartyChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyMessage.trim()) return;

    const myChat: CommentMessage = {
      id: `m-chat-${Date.now()}`,
      userName: currentProfile.name,
      avatar: currentProfile.avatarUrl,
      text: partyMessage,
      timestamp: "Just now",
      isActivePartyMessage: true
    };
    setPartyComments(prev => [...prev, myChat]);
    setPartyMessage("");
  };

  const toggleWatchlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (watchlist.includes(id)) {
      setWatchlist(watchlist.filter(item => item !== id));
    } else {
      setWatchlist([...watchlist, id]);
    }
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(item => item !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleDetailedSubmissionReview = async (movieId: string, stars: number, text: string) => {
    try {
      const res = await fetch(`/api/movies/${movieId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: currentProfile.name, rating: stars, comment: text })
      });
      if (res.ok) {
        onRefreshMovies();
        // Update loaded detail modal
        const refreshed = movies.find(m => m.id === movieId);
        if (refreshed) {
          const freshReview = await res.json();
          const updated = { ...refreshed, reviews: [freshReview, ...refreshed.reviews] };
          setSelectedMovie(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentVerified(true);
    setTimeout(() => {
      if (billingPlanCandidate) {
        setUserSubscription(billingPlanCandidate.name);
      }
      setShowBillingModal(false);
      setPaymentVerified(false);
      setBillingPlanCandidate(null);
    }, 2000);
  };

  // Movie filtering on Search & Genres (Advanced search criteria removed)
  const searchedMovies = filteredMovies.filter(m => {
    const matchesQuery = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         m.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.director.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = selectedGenre === "All" || m.genres.includes(selectedGenre as any);

    return matchesQuery && matchesGenre;
  });

  const GENRES_LIST = [
    "All", "Sci-Fi", "Comedy", "Drama", "Horror", "Romance", "Adventure", "Animation", "Documentary", "Family", "Action"
  ];

  return (
    <div className={`w-full flex text-neutral-100 font-sans h-full min-h-[640px] ${highContrast ? 'contrast-125' : ''} ${textSizeMultiplier === 'large' ? 'text-lg' : 'text-sm'}`}>
      
      {/* 1. FLOATING MINI TOOL DOCK ON THE FAR LEFT */}
      <div className="w-[64px] border-r border-[#151722] bg-[#0c0d12]/30 flex flex-col items-center py-6 gap-8 flex-shrink-0 z-20">
        <div className="flex flex-col gap-5 items-center bg-[#151722]/50 border border-white/[0.04] p-2.5 rounded-2xl shadow-xl">
          <button 
            onClick={onOpenAiAssistant}
            className="w-9 h-9 rounded-xl bg-[#db242d] hover:bg-[#b01c23] flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(219,36,45,0.4)] cursor-pointer"
            title="Open AI Mood Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowInsightsModal(true)}
            className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="User Analytics Insights"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSmartTvModal(true)}
            className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Digital Smart TV Cast Client"
          >
            <Cast className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => {
              const btn = document.getElementById("parental-trigger-btn");
              if (btn) btn.click();
            }}
            className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
            title="Parental Account Center"
          >
            <ShieldCheck className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => {
              setSidebarTab('browse');
              setViewMode('browse');
              setSearchInput("");
              setSearchQuery("");
              setSelectedGenre("All");
            }}
            className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Reset to Home Feed"
          >
            <Home className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => {
              const input = document.getElementById("portal-search-box");
              if (input) input.focus();
            }}
            className="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Focus Search Bar"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN STREAMING WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0e1017]/95 relative">
        
        {/* GLOBAL ALERTS BROADCASTER ROW */}
        {activeAnnouncements.length > 0 && (
          <div className="bg-[#db242d]/15 px-6 py-2 border-b border-[#db242d]/10 flex items-center justify-between gap-4 text-xs text-red-100 z-30">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#db242d] animate-pulse flex-shrink-0" />
              <span className="font-semibold tracking-wide">
                {activeAnnouncements[0].text}
              </span>
            </div>
            <span className="text-[9px] bg-[#db242d]/30 px-2 py-0.5 rounded font-black font-mono tracking-wider">ALERT</span>
          </div>
        )}

        {/* TOP COMPREHENSIVE HEADER ROW */}
        <header className="h-[72px] border-b border-white/[0.03] px-6 flex items-center justify-between gap-4 z-40 bg-[#0c0d12]/40 backdrop-blur-md">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => { setSidebarTab('browse'); setViewMode('browse'); setSelectedGenre("All"); setSearchInput(""); setSearchQuery(""); }}>
              <span className="text-xl font-sans font-black tracking-tighter text-[#db242d] uppercase">
                KWATCH
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#db242d] animate-bounce mt-2.5" />
            </div>

            <div className="hidden xs:flex items-center gap-1.5">
              <button 
                onClick={() => { setSidebarTab('browse'); setViewMode('browse'); }}
                className="w-7 h-7 rounded-lg bg-[#181a25] border border-white/[0.03] flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                className="w-7 h-7 rounded-lg bg-[#181a25] border border-white/[0.03] flex items-center justify-center text-neutral-500 cursor-default"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSearching(true);
                setSearchQuery(searchInput);
                setTimeout(() => {
                  setIsSearching(false);
                }, 400);
              }}
              className="relative w-full"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                id="portal-search-box"
                type="text"
                placeholder="Search movies, genre collections, directors..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  if (val === "") {
                    setSearchQuery("");
                  }
                }}
                className="w-full bg-[#14151f] border border-white/[0.04] py-2 pl-10 pr-10 rounded-xl text-xs focus:outline-none focus:border-[#db242d] transition-all text-white placeholder-neutral-500"
              />
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Search by voice"
              >
                {isListening ? (
                  <MicOff className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4">
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearchOverlay(true)}
              className="relative p-2 rounded-xl bg-purple-600/10 border border-purple-500/25 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 transition-all cursor-pointer shadow-md shadow-purple-900/10 flex items-center justify-center"
              title="Open Overlay Movie Search"
            >
              <Search className="w-4.5 h-4.5 text-purple-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            </motion.button>

            <button className="relative p-2 rounded-xl hover:bg-white/[0.03] text-neutral-400 hover:text-white transition-colors cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#db242d] border border-neutral-900 animate-pulse" />
            </button>

            {/* Global Theme Toggle */}
            {onToggleTheme && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleTheme}
                className="relative p-2 rounded-xl hover:bg-white/[0.03] text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                title={appTheme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {appTheme === 'light' ? (
                  <Moon className="w-4.5 h-4.5 text-purple-400" />
                ) : (
                  <Sun className="w-4.5 h-4.5 text-amber-550" />
                )}
              </motion.button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 bg-[#141620] hover:bg-[#1b1c2b] border border-white/[0.04] pl-2.5 pr-3 py-1.5 rounded-xl transition-all select-none cursor-pointer"
              >
                <img
                  src={currentProfile.avatarUrl}
                  alt="Avatar"
                  className="w-6.5 h-6.5 rounded-lg border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left hidden md:block">
                  <span className="text-xs font-semibold text-white block -mb-0.5">{currentProfile.name}</span>
                  <span className="text-[9px] text-[#db242d] block uppercase tracking-wider font-bold">Samantha G.</span>
                </div>
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2.5 w-60 bg-[#121319] border border-white/[0.05] rounded-2xl p-3 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-2.5 py-2 border-b border-white/[0.03] mb-2 text-left">
                      <p className="text-xs font-bold text-white leading-none mb-1">{currentProfile.name}</p>
                      <span className="text-[10px] text-neutral-500 font-mono tracking-wider block">@samantha • Premium</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      
                      {currentProfile.isVerified && (
                        <button
                          onClick={() => { setShowCreatorStudio(true); setShowProfileDropdown(false); }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-bold text-[#db242d] hover:text-white transition-colors flex items-center gap-2 border-b border-white/[0.03] pb-2 mb-1"
                        >
                          <Video className="w-3.5 h-3.5 text-cyan-400" />
                          <span>🎬 Creator Studio (Upload)</span>
                        </button>
                      )}

                      {isAdmin && onSetAppView && (
                        <button
                          onClick={() => { onSetAppView('admin'); setShowProfileDropdown(false); }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-400" />
                          <span>Admin Control Panel</span>
                        </button>
                      )}

                      <button
                        onClick={() => { setShowSmartTvModal(true); setShowProfileDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Tv className="w-3.5 h-3.5 text-blue-400" />
                        <span>Casting Client Screen</span>
                      </button>

                      <button
                        onClick={() => { setShowInsightsModal(true); setShowProfileDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-green-400" />
                        <span>Visual User Insights</span>
                      </button>

                      <button
                        onClick={() => { setShowBillingModal(true); setShowProfileDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-orange-400" />
                        <span>Subscription Plans</span>
                      </button>

                      <button
                        onClick={() => {
                          const btn = document.getElementById("parental-trigger-btn");
                          if (btn) btn.click();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-red-400" />
                        <span>Parental Controls</span>
                      </button>

                      <button
                        onClick={() => { setViewMode(viewMode === "browse" ? "downloads" : "browse"); setShowProfileDropdown(false); }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-white/[0.04] rounded-lg text-xs font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2 border-t border-white/[0.03] mt-1 pt-2"
                      >
                        <Download className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Offline Downloads Cache</span>
                      </button>

                      <button
                        onClick={() => { if (onLogout) onLogout(); }}
                        className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/20 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out / Switch Profile</span>
                      </button>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </header>

        {/* 3. MAIN WORKSPACE SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-16">
          
          {/* SEARCH SUGGESTIONS CHIPS (WHEN QUERY EMPTY) */}
          {searchInput && !searchQuery && (
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-900 text-left">
              <span className="text-[10px] text-neutral-500 uppercase font-black mr-2 font-mono">Select match suggestion:</span>
              {filteredMovies.filter(m => m.title.toLowerCase().includes(searchInput.toLowerCase())).slice(0, 4).map(m => (
                <button
                  key={m.id}
                  onClick={() => { setSearchInput(m.title); setSearchQuery(m.title); }}
                  className="px-2 py-1 bg-neutral-900 hover:bg-neutral-850 hover:text-white rounded border border-neutral-850 text-xs text-[#db242d] mr-1.5 transition-colors cursor-pointer"
                >
                  {m.title}
                </button>
              ))}
            </div>
          )}

          {/* NETFLIX-SIDEBAR CONTROLS: QUICK FILTER NAVIGATION PILLS */}
          <div className="flex justify-between items-center bg-[#14151f] p-3 rounded-2xl border border-white/[0.03] text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-[10.5px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Dashboard:</span>
              <button 
                onClick={() => { setSidebarTab('browse'); setViewMode('browse'); }} 
                className={`px-3 py-1 rounded-lg font-bold transition-all ${sidebarTab === 'browse' ? 'bg-[#db242d] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                Browse Feed
              </button>
              <button 
                onClick={() => { setSidebarTab('wishlist'); setViewMode('browse'); }} 
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${sidebarTab === 'wishlist' ? 'bg-[#db242d] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                <Heart className="w-3.5 h-3.5" /> Wishlist ({watchlist.length})
              </button>
              <button 
                onClick={() => { setSidebarTab('coming-soon'); setViewMode('browse'); }} 
                className={`px-3 py-1 rounded-lg font-bold transition-all ${sidebarTab === 'coming-soon' ? 'bg-[#db242d] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'}`}
              >
                Coming Soon 🌟
              </button>
              {currentProfile.isVerified && (
                <button 
                  onClick={() => setShowCreatorStudio(true)} 
                  className="px-3 py-1 rounded-lg font-bold transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-indigo-900/30 flex items-center gap-1.5 animate-pulse"
                >
                  <Video className="w-3.5 h-3.5" /> Creator Studio 🎬
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#db242d] font-bold uppercase tracking-wider font-mono">PREMIUM ACCOUNT ACTIVATED</span>
            </div>
           </div>

          {viewMode === "browse" ? (
            <>

      {/* DETAILED SEARCH SHOW / BANNER SECTOR */}
      {searchQuery || selectedGenre !== "All" ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-400 uppercase tracking-widest">
                Matched Results ({searchedMovies.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Found {searchedMovies.length} title{searchedMovies.length !== 1 ? 's' : ''} matching your parameters.
              </p>
            </div>
            
            {/* Active filter summary chips */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedGenre !== "All" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-full">
                  Genre: {selectedGenre}
                  <button onClick={() => setSelectedGenre("All")} className="hover:text-red-400 cursor-pointer text-[10px] font-bold">✕</button>
                </span>
              )}
              {(selectedGenre !== "All" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchInput("");
                    setSelectedGenre("All");
                  }}
                  className="text-xs font-semibold text-neutral-400 hover:text-white underline cursor-pointer px-2 py-1 select-none"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
          {searchedMovies.length === 0 ? (
            <div className="p-12 text-center bg-neutral-950 border border-neutral-900 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">No content matches your queries. Try using alternative tags or open AI chatbot.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {searchedMovies.map((movie) => (
                <div 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/40 transform hover:-translate-y-1 transition-all shadow-md relative"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-56 object-cover" referrerPolicy="no-referrer" />
                  {renderDownloadStatusBadge(movie)}
                  <div className="p-3">
                    <span className="text-[10px] uppercase font-bold text-purple-400">{movie.genres[0]}</span>
                    <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-1">{movie.title}</strong>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-2">
                      <span>★ {movie.rating}</span>
                      <span className="bg-neutral-900 px-1.5 py-0.5 rounded uppercase font-bold">{movie.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* STANDARD NETFLIX-LIKE FEED (Carousel / Hero banner) */
        <div className="space-y-12">
          
          {/* HERO FEATURED BILLBOARD */}
          {featuredMovie && (
            <div className="relative min-h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-neutral-900 bg-neutral-950 flex flex-col justify-end p-6 sm:p-12 group/hero animate-fade-in">
              <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/40 to-transparent z-10" />
              
              {/* SLIDING CANVAS IMAGES */}
              <AnimatePresence mode="popLayout">
                <motion.img 
                  key={featuredMovie.id}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  src={featuredMovie.bannerUrl} 
                  alt={featuredMovie.title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              {/* MANUAL ACTION SLIDE TRIGGERS */}
              {featuredMovies.length > 1 && (
                <>
                  <button
                    onClick={() => setHeroIndex(prev => (prev - 1 + featuredMovies.length) % featuredMovies.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-orange-600 border border-neutral-800 text-white opacity-0 group-hover/hero:opacity-100 transition-all cursor-pointer z-35 shadow-md transform hover:scale-105 active:scale-95"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setHeroIndex(prev => (prev + 1) % featuredMovies.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-orange-600 border border-neutral-800 text-white opacity-0 group-hover/hero:opacity-100 transition-all cursor-pointer z-35 shadow-md transform hover:scale-105 active:scale-95"
                    aria-label="Next Slide"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* SLIDE PROGRESS PAGINATIONS */}
              {featuredMovies.length > 1 && (
                <div className="absolute right-8 bottom-8 flex gap-2 z-35 bg-neutral-950/50 p-2 rounded-full border border-neutral-900/40 backdrop-blur-xs">
                  {featuredMovies.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => setHeroIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        idx === heroIndex ? 'bg-orange-500 w-7' : 'bg-neutral-600 hover:bg-neutral-400'
                      }`}
                      title={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
              
              <div className="relative z-20 max-w-xl space-y-4">
                <span className="text-[10px] bg-red-600 text-white font-black tracking-widest px-3 py-1 rounded-full uppercase inline-block">
                  {featuredMovie.isFeatured ? "Featured Masterpiece" : "Top Ranked Stream"}
                </span>
                
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  {featuredMovie.title}
                </h1>

                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                  {featuredMovie.synopsis}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-neutral-400">
                  <span className="text-white">Director: {featuredMovie.director}</span>
                  <span>•</span>
                  <span>Rating: ★ {featuredMovie.rating}</span>
                  <span>•</span>
                  <span className="bg-neutral-900 px-2 py-0.5 rounded text-neutral-300 border border-neutral-800 uppercase font-mono">{featuredMovie.runtime}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <button
                    onClick={() => handlePlayClick(featuredMovie)}
                    className="px-6 py-3 bg-white text-black hover:bg-neutral-200 font-bold text-sm rounded-xl flex items-center gap-2 transform active:scale-95 transition-all shadow-lg cursor-pointer"
                  >
                    <Play className="w-4.5 h-4.5 fill-black" /> Stream Now
                  </button>

                  <button
                    onClick={() => setSelectedMovie(featuredMovie)}
                    className="px-6 py-3 bg-neutral-900/80 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 border border-neutral-850 backdrop-blur transition-all cursor-pointer"
                  >
                    <Info className="w-4.5 h-4.5" /> Full Details
                  </button>

                  <button
                    onClick={(e) => toggleWatchlist(e, featuredMovie.id)}
                    className="p-3 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-850 text-white rounded-xl transform active:scale-95 transition-all cursor-pointer"
                    title="Add to Watchlist"
                  >
                    {watchlist.includes(featuredMovie.id) ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Plus className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: CONTINUE WATCHING */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase">Continue Watching</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {continueWatching.map((item, index) => {
                const target = filteredMovies.find(m => m.id === item.movieId);
                if (!target) return null;
                const savedTimestamp = item.timestamp || Math.round((item.progress / 100) * 5400);
                return (
                  <div 
                    key={index}
                    onClick={() => handlePlayClick(target, undefined, savedTimestamp)}
                    className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/40 transform hover:-translate-y-1 transition-all relative"
                  >
                    <div className="relative">
                      <img src={target.posterUrl} alt="Poster" className="w-full h-36 object-cover" referrerPolicy="no-referrer" />
                      {renderDownloadStatusBadge(target)}
                      
                      {/* Premium Hover Interactive Overlay */}
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-2.5 transition-all duration-200 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayClick(target, undefined, savedTimestamp);
                          }}
                          className="w-full py-1.5 bg-red-650 hover:bg-red-700 text-[10px] font-black text-white rounded-lg flex items-center justify-center gap-1 shadow-md transition-all border border-red-500/10 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Resume at {formatTime(savedTimestamp)}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayClick(target, undefined, 0);
                          }}
                          className="w-full py-1 bg-neutral-900 hover:bg-neutral-800 text-[9px] font-bold text-neutral-450 hover:text-white rounded-lg flex items-center justify-center gap-1 transition-all border border-neutral-800/80 cursor-pointer"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" /> Start Over
                        </button>
                      </div>
                      
                      {/* Progress bar line */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                        <div className="h-full bg-purple-500" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    <div className="p-3 flex justify-between items-center text-xs">
                      <span className="font-semibold text-white truncate max-w-[80%]">{target.title}</span>
                      <span className="text-[10px] text-purple-400 font-mono">{item.progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GOOGLE ADSENSE INTEGRATION FRAME */}
          {adsenseEnabled && userSubscription === "Free Ad-Supported" && (
            <div 
              onClick={handleAdsenseClick}
              className="bg-neutral-900/40 border border-neutral-850 rounded-2xl p-4.5 cursor-pointer relative overflow-hidden group transition-all hover:border-purple-500/30 active:scale-[0.99] select-none"
            >
              <div className="flex justify-between items-start text-[9px] font-mono font-bold text-neutral-500 mb-2">
                <span className="bg-[#0e1017] px-2 py-0.5 rounded border border-neutral-800">Google AdSense responsive_ad_slot</span>
                <span className="text-purple-400 uppercase tracking-widest flex items-center gap-1">
                  <span>Ads by Google</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0e1017] flex items-center justify-center text-[8px] border border-neutral-850 font-sans">i</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1c122c] border border-purple-500/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    🌐
                  </div>
                  <div className="text-left">
                    <h5 className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">SafeRide Uganda: Zero Transfer Rates on Mobile Money Bills!</h5>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">Pay water, electricity, and pay TV bills with MTN/Airtel Mobile Money and enjoy zero transaction fees nationwide.</p>
                  </div>
                </div>

                <div className="px-4 py-1.5 bg-purple-650 hover:bg-purple-600 text-white text-[10px] font-black rounded-lg shrink-0 transition-colors uppercase tracking-wider font-mono">
                  Visit site
                </div>
              </div>

              {/* Simulated ID footer */}
              <div className="text-[7px] font-mono text-neutral-600 mt-2.5 pt-2 border-t border-neutral-850/40 flex justify-between">
                <span>SLOT_ID: s-adsense-detail-top</span>
                <span>PUB_ID: {adsensePublisherId}</span>
              </div>
            </div>
          )}

          {/* SECTION 2: RECENTLY ADDED — always shows newly uploaded movies */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase">Recently Added</h3>
              <span className="text-xs text-purple-400 flex items-center gap-0.5">Latest uploads <ChevronRight className="w-3 h-3" /></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {[...filteredMovies]
                .sort((a, b) => {
                  const aTime = Number(a.id.replace(/\D/g, "")) || Date.parse(a.releaseDate || "") || 0;
                  const bTime = Number(b.id.replace(/\D/g, "")) || Date.parse(b.releaseDate || "") || 0;
                  return bTime - aTime;
                })
                .slice(0, 10)
                .map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/30 transform hover:-translate-y-1 transition-all relative"
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-48 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {renderDownloadStatusBadge(movie)}
                    <div className="p-3">
                      <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-1">{movie.title}</strong>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-2">
                        <span>★ {movie.rating}</span>
                        <span className="text-neutral-500">{movie.runtime}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* SECTION 3: TRENDING RELEASES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase">Trending Movies</h3>
              <span className="text-xs text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5">View all <ChevronRight className="w-3 h-3" /></span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMovies.filter(m => m.isTrending && m.id !== featuredMovie?.id).map((movie) => (
                <div 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/30 transform hover:-translate-y-1 transition-all relative"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                  {renderDownloadStatusBadge(movie)}
                  <div className="p-3">
                    <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-1">{movie.title}</strong>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-2">
                      <span>★ {movie.rating}</span>
                      <span className="text-neutral-500">{movie.runtime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: MY WATCHLIST */}
          {watchlist.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-1.5 text-white">
                <CheckCircle className="w-4 h-4 text-green-400" /> My Current Watchlist ({watchlist.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {filteredMovies.filter(m => watchlist.includes(m.id)).map((movie) => (
                  <div 
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/30 transform hover:-translate-y-1 transition-all relative"
                  >
                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                    {renderDownloadStatusBadge(movie)}
                    <div className="p-3">
                      <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-1">{movie.title}</strong>
                      <div className="flex justify-between items-center text-[10px] text-neutral-300 mt-2">
                        <span>★ {movie.rating}</span>
                        <button
                          onClick={(e) => toggleWatchlist(e, movie.id)}
                          className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 hover:border-red-900 hover:text-red-400 rounded text-[9px]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: NON-TRANSLATED MOVIES (Pristine Original Audio) */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-1.5 font-sans">
                  <Globe className="w-4 h-4 text-orange-400 animate-pulse" /> Non-Translated (Original English Audio)
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">Watch premium content directly in its pure pristine original theater audio format with optional custom subtitles.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMovies.filter(m => m.isTranslated === false || m.language?.toLowerCase() === 'english').map((movie) => (
                <div 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-orange-500/40 transform hover:-translate-y-1 transition-all relative"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                  {renderDownloadStatusBadge(movie)}
                  <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-md border border-neutral-800 px-2 py-0.5 rounded text-[8px] font-bold text-neutral-300 font-mono tracking-wider uppercase">
                    Original Sound
                  </div>
                  <div className="p-3">
                    <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-1">{movie.title}</strong>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                      <span>★ {movie.rating}</span>
                      <span>{movie.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: DOCUMENTARIES / OTHERS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase">Popular selections</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMovies.filter(m => m.isPopular).map((movie) => (
                <div 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/40 transform hover:-translate-y-1 transition-all relative"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                  {renderDownloadStatusBadge(movie)}
                  <div className="p-3">
                    <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-1">{movie.title}</strong>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                      <span>★ {movie.rating}</span>
                      <span>{movie.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: THRILLER CINEMA Row */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-neutral-400 tracking-widest uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Thriller Specimen Cinema
                </h3>
                <p className="text-[10px] text-neutral-500 mt-0.5">High-stakes plots, intense suspense, and compelling psychological intrigue.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {filteredMovies.filter(m => m.genres.some(g => g.toLowerCase() === 'thriller')).map((movie) => (
                <div 
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="group bg-neutral-950 rounded-xl overflow-hidden border border-neutral-900 cursor-pointer hover:border-purple-500/40 transform hover:-translate-y-1 transition-all relative"
                >
                  <img src={movie.posterUrl} alt={movie.title} className="w-full h-48 object-cover" referrerPolicy="no-referrer" />
                  {renderDownloadStatusBadge(movie)}
                  <div className="p-3">
                    <span className="text-[9px] uppercase font-bold text-purple-400 font-mono">Thriller Genre</span>
                    <strong className="block text-xs sm:text-sm font-semibold truncate text-white mt-0.5">{movie.title}</strong>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                      <span>★ {movie.rating}</span>
                      <span>{movie.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
        </>
      ) : (
        <MyDownloadsPage
          downloadedIds={downloadedList}
          movies={movies}
          downloadTasks={downloadTasks}
          onPauseDownload={handlePauseDownload}
          onResumeDownload={handleResumeDownload}
          onCancelDownload={handleCancelDownload}
          onRemoveDownload={handleRemoveDownload}
          onRemoveAllDownloads={handleRemoveAllDownloads}
          onPlayMovie={handlePlayDownloadedMovie}
          onTriggerDownload={handleDownloadTrigger}
          autoDeleteWatched={autoDeleteWatched}
          onToggleAutoDeleteWatched={setAutoDeleteWatched}
          currentProfile={currentProfile}
        />
      )}

        </div>
      </div>

      {/* DETAILED MOVIE DIALOG LAYOUT MODEL */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-neutral-950 border border-neutral-850 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
            >
              
              {/* Image banner inside modal */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent z-10" />
                <img src={selectedMovie.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                <button
                  onClick={() => setSelectedMovie(null)}
                  className="absolute top-4 right-4 p-2 bg-neutral-900/80 hover:bg-purple-600 rounded-full text-white z-20 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-6 left-6 sm:left-12 z-20 space-y-2 max-w-lg">
                  <span className="text-[10px] bg-purple-650/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full uppercase font-black tracking-wide">★ {selectedMovie.rating} Popular</span>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{selectedMovie.title}</h2>
                </div>
              </div>

              {/* Contents block */}
              <div className="p-6 sm:p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Left Column 2/3 */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Synopsis</h4>
                      <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">{selectedMovie.synopsis}</p>
                    </div>

                    {/* EPISODES INDEX IF TELEVISED SERIES */}
                    {selectedMovie.type === 'series' && selectedMovie.episodes && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest block border-b border-neutral-900 pb-2">Seasons and Episodes</h4>
                        <div className="space-y-3">
                          {selectedMovie.episodes.map((ep) => (
                            <div 
                              key={ep.id}
                              className="flex flex-col sm:flex-row gap-4 p-3 bg-neutral-900/40 rounded-xl border border-neutral-900 hover:border-neutral-800 transition-all"
                            >
                              <img src={ep.thumbnail} alt="Ep Poster" className="w-full sm:w-28 h-20 object-cover rounded-lg border border-neutral-800" referrerPolicy="no-referrer" />
                              <div className="flex-1 space-y-1.5">
                                <span className="text-[10px] text-purple-400 font-bold uppercase">S{ep.season} E{ep.episodeNumber} • {ep.duration}</span>
                                <h5 className="font-semibold text-xs text-white block">{ep.title}</h5>
                                <p className="text-[11px] text-neutral-400 line-clamp-2">{ep.synopsis}</p>
                              </div>
                              <button
                                onClick={() => { setSelectedMovie(null); handlePlayClick(selectedMovie, ep); }}
                                className="self-end sm:self-center px-4 py-2 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-[10px] font-bold uppercase rounded-lg text-purple-400 cursor-pointer transition-all"
                              >
                                Play Episode
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* INTERACTIVE SOCIAL COMMENTS / REVIEWS SECTION */}
                    <div className="border-t border-neutral-900 pt-6 space-y-4">
                      <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Viewer Reviews & Rating</h4>
                      
                      {/* Review input card */}
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const starsInput = form.elements.namedItem('stars') as HTMLInputElement;
                          const cmtInput = form.elements.namedItem('cmtText') as HTMLTextAreaElement;
                          handleDetailedSubmissionReview(selectedMovie.id, parseInt(starsInput.value), cmtInput.value);
                          cmtInput.value = "";
                        }}
                        className="bg-neutral-900 p-4 border border-neutral-850 rounded-xl space-y-3"
                      >
                        <span className="text-xs block text-neutral-400 font-semibold">Write an honest review</span>
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] text-neutral-400 uppercase font-medium">Rating stars:</label>
                          <select 
                            name="stars" 
                            className="bg-neutral-950 bg-none border border-neutral-800 text-xs px-2.5 py-1 rounded text-purple-400"
                          >
                            <option value="5">★★★★★ Outstanding (5)</option>
                            <option value="4">★★★★☆ Great (4)</option>
                            <option value="3">★★★☆☆ Average (3)</option>
                            <option value="2">★★☆☆☆ Subpar (2)</option>
                            <option value="1">★☆☆☆☆ Terrible (1)</option>
                          </select>
                        </div>
                        <textarea
                          required
                          name="cmtText"
                          placeholder="What did you think of the direction, cinematography, or storyline?"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white focus:outline-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 font-bold text-[10px] uppercase rounded-lg text-purple-400 cursor-pointer transition-all"
                          >
                            Post Review
                          </button>
                        </div>
                      </form>

                      {/* Display reviews */}
                      <div className="space-y-3">
                        {selectedMovie.reviews.length === 0 ? (
                          <p className="text-xs text-neutral-500">No reviews compiled yet. Be the absolute first to submit!</p>
                        ) : (
                          selectedMovie.reviews.map((rev) => (
                            <div key={rev.id} className="p-3 bg-neutral-900/20 border border-neutral-900 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                  <img src={rev.userAvatar} alt="Profile" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                                  <span className="font-semibold text-white">@{rev.userName}</span>
                                </div>
                                <span className="text-purple-400 font-bold">★ {rev.rating}</span>
                              </div>
                              <p className="text-neutral-400 text-xs leading-relaxed">"{rev.comment}"</p>
                              <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1">
                                <span>Uploaded: {rev.timestamp}</span>
                                <div className="flex gap-2">
                                  <span>👍 {rev.likes}</span>
                                  <span>👎 {rev.dislikes}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Column 1/3 (Meta panels) */}
                  <div className="space-y-6">
                    
                    {/* Catalog Details Block */}
                    <div className="bg-neutral-900 p-4 border border-neutral-850 rounded-xl space-y-3.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Cast Members</span>
                        <p className="text-neutral-200 mt-0.5">{selectedMovie.cast.join(", ")}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Director</span>
                        <p className="text-neutral-200 mt-0.5">{selectedMovie.director}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Release Date</span>
                        <p className="text-neutral-200 mt-0.5">{selectedMovie.releaseDate}</p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase text-neutral-500 font-semibold block">Genres</span>
                        <p className="text-neutral-200 mt-0.5 font-mono">{selectedMovie.genres.join(" / ")}</p>
                      </div>
                    </div>

                    {/* Operational CTA buttons */}
                    <div className="space-y-2.5">
                      {selectedMovie.type === 'movie' && (
                        <button
                          onClick={() => { setSelectedMovie(null); handlePlayClick(selectedMovie); }}
                          className="w-full py-3 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl text-center text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-black" /> Play Full Movie
                        </button>
                      )}

                      {/* DOWNLOAD BUTTON SIMULATION */}
                      {isAdmin && (
                        downloadingMovieId === selectedMovie.id ? (
                          <div className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1.5 text-center">
                            <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Downloading offline package...</span>
                            <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full" style={{ width: `${downloadProgress}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-purple-400 font-bold">{downloadProgress}% Completed</span>
                          </div>
                        ) : downloadedList.includes(selectedMovie.id) ? (
                          <div className="w-full p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-center text-green-400 text-xs font-semibold flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Cached Offline
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadTrigger(selectedMovie.id)}
                            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-center text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Download className="w-4 h-4" /> Download for Offline Viewing
                          </button>
                        )
                      )}

                      {/* PREMIUM DIRECT LOCAL DEVICE FILE DOWNLOAD WITH PRICING */}
                      <button
                        onClick={() => setShowPaymentModalForMovie(selectedMovie)}
                        className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 border border-purple-550 hover:border-purple-500 text-white rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download to Device (Shs {downloadPrice.toLocaleString()} / 2 Weeks)</span>
                      </button>

                      <button
                        onClick={(e) => toggleWatchlist(e, selectedMovie.id)}
                        className="w-full py-2.5 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-850 text-neutral-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {watchlist.includes(selectedMovie.id) ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" /> Removed watchlist
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Add to My Watchlist
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => toggleFavorite(e, selectedMovie.id)}
                        className="w-full py-2.5 bg-neutral-900/40 hover:bg-neutral-900 border border-neutral-855 text-neutral-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${favorites.includes(selectedMovie.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} /> 
                        {favorites.includes(selectedMovie.id) ? 'Favourited' : 'Add to Favorites'}
                      </button>

                    </div>

                  </div>

                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED CINEMATIC VIDEO PLAYER OVERLAY INTERACTIVE CANVAS */}
      <AnimatePresence>
        {activeVideoMovie && (
          <motion.div 
            ref={playerContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row text-white"
          >
            
            {/* LEFT AREA: CORE PLAYER WITH ADVANCED MOCK TRIGGERS */}
            <div className={`flex-1 flex flex-col justify-between p-6 relative transition-all duration-300 ${
              isFullscreen && !controlsVisible ? 'cursor-none' : 'cursor-default'
            }`}>
              
              {/* TOP HEADER CONTROLS bar */}
              <div className={`flex justify-between items-center z-10 transition-all duration-300 ${
                isFullscreen && !controlsVisible 
                  ? 'opacity-0 -translate-y-4 pointer-events-none' 
                  : 'opacity-100 translate-y-0'
              }`}>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                    {activeVideoMovie.title}
                  </h3>
                  {activeEpisode && (
                    <span className="text-xs text-purple-400 font-bold block mt-1">
                      Playing Season {activeEpisode.season} Episode {activeEpisode.episodeNumber}: {activeEpisode.title}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setWatchPartyActive(!watchPartyActive)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                      watchPartyActive ? 'bg-purple-600 text-white animate-pulse' : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <Users className="w-4 h-4" /> {watchPartyActive ? 'Watch Party: SYNCED' : 'Host Watch Party'}
                  </button>
                  <button
                    onClick={() => setActiveVideoMovie(null)}
                    className="p-1 px-2 text-xs bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg cursor-pointer"
                  >
                    Exit Stream
                  </button>
                </div>
              </div>

              {/* CORE HTML5 LIVE VIDEO BLOCK */}
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                {isAdPlaying ? (
                  /* MOCK INTERSTITIAL AD OVERLAY FOR FREE PLANS */
                  <div className="w-full max-w-md bg-neutral-950 p-8 border border-purple-500/30 rounded-3xl text-center space-y-5 shadow-2xl relative z-30 m-4 animate-fade-in">
                    <span className="text-[10px] border border-orange-500/20 bg-orange-500/10 text-orange-400 px-3 py-1 rounded font-black tracking-widest uppercase inline-block animate-pulse">
                      Ad Campaign Interval Running
                    </span>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-400 uppercase font-semibold tracking-wider">
                        Playing Ad {currentAdIndex + 1} of 3
                      </p>
                      <h3 className="text-xl font-black text-white leading-tight">
                        {adCampaigns[currentAdIndex]?.title || (
                          currentAdIndex === 0 ? "Mukwano Cooking Oil" :
                          currentAdIndex === 1 ? "Riham Cola Refreshment" :
                          "MTN MoMo Secure Cash Transfer"
                        )}
                      </h3>
                    </div>

                    {/* Creative Visual Representation of the Ad */}
                    <div className="p-6 bg-neutral-900/50 border border-neutral-800/80 rounded-2xl flex flex-col items-center justify-center space-y-3 min-h-[140px] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-orange-500/5 opacity-40" />
                      
                      {currentAdIndex % 3 === 0 && (
                        <>
                          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center border border-amber-500/20">
                            <Sliders className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                          </div>
                          <p className="text-xs text-amber-300 font-bold">Mukwano Cooking Oil</p>
                          <p className="text-[10px] text-neutral-400 leading-normal max-w-xs">
                            Uganda's number one pure double-refined cooking oil. Made for delicious home-cooked meals!
                          </p>
                        </>
                      )}
                      
                      {currentAdIndex % 3 === 1 && (
                        <>
                          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center border border-red-500/20">
                            <span className="font-black text-xs">RIHAM</span>
                          </div>
                          <p className="text-xs text-red-400 font-bold">Riham Cola - Grab a Cold One</p>
                          <p className="text-[10px] text-neutral-400 leading-normal max-w-xs">
                            Refreshing the Pearl of Africa. Sweet, bubbly, and ice-cold to beat the midday sun!
                          </p>
                        </>
                      )}

                      {currentAdIndex % 3 === 2 && (
                        <>
                          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center border border-yellow-500/20">
                            <CreditCard className="w-6 h-6 animate-bounce" />
                          </div>
                          <p className="text-xs text-yellow-500 font-bold">MTN MoMo is Cashless</p>
                          <p className="text-[10px] text-neutral-400 leading-normal max-w-xs">
                            Send, receive, and pay bills safely with MTN Mobile Money. Everywhere you go!
                          </p>
                        </>
                      )}
                    </div>

                    {/* AD Progress Countdown */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="text-4xl font-extrabold text-orange-500 font-mono tracking-widest">{adSecondsLeft}s</div>
                      <p className="text-[10px] text-neutral-400 uppercase font-black tracking-wider animate-pulse">Required Advertisement Progressing</p>
                    </div>

                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Ad campaign finishes shortly. Want completely endless uninterrupted movies? Upgrade to our standard Premium Pack today!
                    </p>
                    
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => { setIsAdPlaying(false); setShowBillingModal(true); }}
                        className="px-5 py-2.5 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-xs font-bold rounded-xl text-purple-400 inline-block flex items-center gap-1 cursor-pointer transition-all"
                      >
                        Skip Ads Forever (Upgrade) <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : isLoadingPlayUrl ? (
                  <div className="flex flex-col items-center justify-center space-y-3 z-10 m-4">
                    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-purple-300 animate-pulse">Securing private media connection...</p>
                  </div>
                ) : playUrlError && !resolvedVideoSrc ? (
                  <div className="flex flex-col items-center justify-center space-y-4 max-w-md p-8 bg-neutral-950 border border-neutral-900 rounded-3xl text-center z-10 m-4">
                    <div className="p-3 bg-red-500/10 rounded-full text-red-400">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Stream Authorization Failed</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">{playUrlError}</p>
                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        onClick={() => {
                          // Trigger re-fetch
                          setActiveVideoMovie({ ...activeVideoMovie });
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white rounded-xl cursor-pointer transition-all"
                      >
                        Retry Stream
                      </button>
                      <button 
                        onClick={() => setActiveVideoMovie(null)}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-xs font-bold text-neutral-300 border border-neutral-800 rounded-xl cursor-pointer transition-all"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Play actual trailer element */
                  <video
                    ref={videoRef}
                    src={resolvedVideoSrc}
                    autoPlay
                    muted={muted}
                    style={{ 
                      filter: [
                        highContrast ? 'contrast(1.25)' : '',
                        videoQuality.includes("480p") ? 'blur(1.6px) saturate(0.9) contrast(0.95)' : '',
                        videoQuality.includes("720p") ? 'blur(0.7px)' : '',
                        videoQuality.includes("4K") ? 'contrast(1.04) brightness(1.02) saturate(1.05)' : ''
                      ].filter(Boolean).join(' ') 
                    }}
                    className={`w-full h-full z-0 cursor-pointer transition-all duration-300 ${
                      videoScaleMode === 'cover' 
                        ? 'object-cover' 
                        : videoScaleMode === 'stretch' 
                        ? 'object-fill' 
                        : 'object-contain'
                    }`}
                    onClick={togglePlay}
                    onDoubleClick={toggleFullscreen}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => {
                      setIsPlaying(false);
                      if (videoRef.current) {
                        savePlaybackProgress(videoRef.current.currentTime, videoRef.current.duration || duration || 100);
                      }
                    }}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        const cur = videoRef.current.currentTime;
                        setCurrentTime(cur);
                        const now = Date.now();
                        if (now - lastSaveTimeRef.current > 4000) { // Save every 4 seconds
                          lastSaveTimeRef.current = now;
                          savePlaybackProgress(cur, videoRef.current.duration || duration || 100);
                        }
                      }
                    }}
                    onDurationChange={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        const dur = videoRef.current.duration;
                        setDuration(dur);
                        videoRef.current.playbackRate = playbackSpeed;
                        if (initialSeekTime !== null) {
                          videoRef.current.currentTime = initialSeekTime;
                          setInitialSeekTime(null);
                        }
                      }
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      if (videoRef.current) {
                        savePlaybackProgress(videoRef.current.duration || duration || 100, videoRef.current.duration || duration || 100);
                      }
                      if (activeVideoMovie) {
                        if (autoDeleteWatched && downloadedList.includes(activeVideoMovie.id)) {
                          handleRemoveDownload(activeVideoMovie.id);
                          alert(`Auto-delete watched downloads is enabled. Local video files for "${activeVideoMovie.title}" have been cleaned up automatically to free device disk space!`);
                        }
                      }
                    }}
                  />
                )}
              </div>

              {/* FLOATING ACTION OVERLAYS inside player */}
              {!isAdPlaying && (
                <div className={`relative z-20 flex flex-col justify-end items-end gap-2 pr-0 pt-0 transition-all duration-300 ${
                  isFullscreen && !controlsVisible 
                    ? 'opacity-0 translate-x-4 pointer-events-none' 
                    : 'opacity-100 translate-x-0'
                }`}>
                  {/* Skip Intro floating controller */}
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime += 30; // Skip 30s
                      }
                      alert("Jumped 30 seconds ahead.");
                    }}
                    className="px-4 py-2 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow"
                  >
                    Skip Intro / Recaps <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CORE ADVANCED STREAM CONTROLLER CONSOLE BAR */}
              <div className={`relative z-20 bg-neutral-950/95 border border-neutral-900 p-5 rounded-2xl backdrop-blur flex flex-col gap-4 shadow-2xl transition-all duration-300 ${
                isFullscreen && !controlsVisible 
                  ? 'opacity-0 translate-y-4 pointer-events-none' 
                  : 'opacity-100 translate-y-0'
              }`}>
                
                {/* 1. CUSTOM PROGRESS RANGE TIMELINE SCRUBBER */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-neutral-400 select-none w-10 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 relative group py-2">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-neutral-850 transition-all outline-none"
                    />
                    <div 
                      style={{ width: `${(currentTime / (duration || 100)) * 100}%` }}
                      className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-purple-600 rounded-lg pointer-events-none"
                    />
                  </div>
                  <span className="text-xs font-mono text-neutral-400 select-none w-10">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* 2. PLAYER BUTTONS & PREFERENCES row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Left block: Playback controls & Volume */}
                  <div className="flex items-center gap-3 sm:gap-5">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-lg shadow-purple-600/30"
                      title={isPlaying ? "Pause Stream" : "Play Stream"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white text-white" />}
                    </button>

                    {/* Quick jumps */}
                    <button
                      onClick={() => handleSkip(-10)}
                      className="p-1 px-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-lg text-xs text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="font-mono text-[10px] font-bold">10s</span>
                    </button>
                    <button
                      onClick={() => handleSkip(10)}
                      className="p-1 px-1.5 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-lg text-xs text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      title="Forward 10s"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span className="font-mono text-[10px] font-bold">10s</span>
                    </button>

                    {/* Mute toggle and Volume slider */}
                    <div className="flex items-center gap-2 border-l border-neutral-900 pl-3 sm:pl-5">
                      <button
                        onClick={handleVolumeMuteToggle}
                        className="p-1 text-neutral-400 hover:text-white bg-neutral-900/40 hover:bg-neutral-850/50 rounded cursor-pointer transition-colors"
                        title={muted ? "Unmute" : "Mute"}
                      >
                        {muted || playerVolume === 0 ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={muted ? 0 : playerVolume}
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-20 h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-neutral-800"
                        title="Volume level"
                      />
                    </div>
                  </div>

                  {/* Right block: Audio details, Speed/Qualities, Cast & Fullscreen */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    
                    {/* Subtitles dropdown */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <button
                        onClick={() => setAreSubtitlesOn(!areSubtitlesOn)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider font-mono ${
                          areSubtitlesOn ? 'bg-purple-650 text-white' : 'bg-neutral-900 border border-neutral-800'
                        }`}
                      >
                        {areSubtitlesOn ? 'CC ON' : 'CC OFF'}
                      </button>
                      {areSubtitlesOn && (
                        <select
                          value={subtitleLanguage}
                          onChange={(e) => setSubtitleLanguage(e.target.value)}
                          className="bg-neutral-900 text-white focus:outline-none px-2 py-0.5 rounded text-[11px] font-mono border border-neutral-800"
                        >
                          <option value="English">English CC</option>
                          <option value="Swahili">Swahili</option>
                          <option value="Luganda">Luganda</option>
                          <option value="French">French</option>
                          <option value="Arabic">Arabic</option>
                        </select>
                      )}
                    </div>

                    {/* Speed dropdown */}
                    <div className="flex items-center gap-1 text-xs">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <select
                        value={playbackSpeed}
                        onChange={(e) => {
                          const newSpeed = parseFloat(e.target.value);
                          setPlaybackSpeed(newSpeed);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = newSpeed;
                          }
                        }}
                        className="bg-neutral-900 px-2 py-0.5 rounded text-white text-[11px] focus:outline-none"
                      >
                        <option value="0.5">0.5x Slow</option>
                        <option value="1">1x Normal</option>
                        <option value="1.5">1.5x Fast</option>
                        <option value="2">2x Speed</option>
                      </select>
                    </div>

                    {/* Resolution Quality */}
                    <div className="flex items-center gap-1 text-xs">
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <select
                        value={videoQuality}
                        onChange={(e) => {
                          const q = e.target.value;
                          if (q.includes("4K") && userSubscription === "Free Ad-Supported") {
                            alert("4K UHD formats is locked under VIP premium membership tier. Please upgrade accounts to use UHD streaming!");
                          } else {
                            setVideoQuality(q);
                          }
                        }}
                        className="bg-neutral-900 px-2 py-0.5 rounded text-white text-[11px] focus:outline-none"
                      >
                        <option value="Auto (1080p)">Auto HD</option>
                        <option value="1080p FHD">1080p FHD</option>
                        <option value="720p HD">720p HD</option>
                        <option value="480p standard">480p standard</option>
                        <option value="4K UHD (Membership lock)">4K UHD 👑</option>
                      </select>
                    </div>

                    {/* Scale Mode Selector / Fit Aspect Ratio */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoScaleMode(prev => prev === 'contain' ? 'cover' : 'contain');
                        }}
                        className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-[11px] font-bold text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                        title="Quick toggle between Aspect Fit (letterboxing) and Aspect Fill (zoomed cropped screen)"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>Aspect: <strong className="text-purple-300">{videoScaleMode === 'contain' ? 'Fit (16:9)' : videoScaleMode === 'cover' ? 'Fill (Zoom)' : 'Stretch'}</strong></span>
                      </button>

                      <select
                        value={videoScaleMode}
                        onChange={(e) => setVideoScaleMode(e.target.value as 'contain' | 'cover' | 'stretch')}
                        className="bg-neutral-900 px-2 py-0.5 rounded text-white text-[11px] focus:outline-none border border-neutral-800 focus:border-purple-500 cursor-pointer"
                        title="Choose scaling mode (Aspect Letterbox Fit, Zoom Fill, or Stretch Fullscreen)"
                      >
                        <option value="contain">🎨 Aspect Fit (Letterbox)</option>
                        <option value="cover">🎥 Aspect Fill (Zoom)</option>
                        <option value="stretch">🖥️ Stretch (Full Width)</option>
                      </select>
                    </div>

                    {/* Casting button */}
                    <button
                      type="button"
                      onClick={handleCastPresentation}
                      className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-650 hover:text-white border border-purple-500/40 text-[11px] font-bold text-purple-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      title="Cast current movie to TVs or monitors using Presentation API"
                    >
                      <Cast className="w-3.5 h-3.5" />
                      <span>Cast</span>
                    </button>

                    {/* Custom Fullscreen toggle */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-1 px-2.5 text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      title="Toggle Fullscreen"
                    >
                      <Maximize className="w-3.5 h-3.5" />
                      <span>{isFullscreen ? "Exit Full" : "Full"}</span>
                    </button>

                  </div>

                </div>

              </div>

            </div>

            {/* RIGHT AREA: WATCH PARTY SYNCED LIVE CHAT FEED */}
            {watchPartyActive && (
              <div className={`w-full md:w-80 bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-900 flex flex-col justify-between p-4 z-20 transition-all duration-300 ${
                isFullscreen && !controlsVisible 
                  ? 'opacity-0 translate-x-4 pointer-events-none' 
                  : 'opacity-100 translate-x-0'
              }`}>
                <div className="border-b border-neutral-900 pb-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-green-400 animate-pulse" /> Live Shared Session Lobby
                  </span>
                  <button 
                    onClick={() => {
                      const shareLink = `${window.location.origin}?partyId=kwatch-${Date.now()}`;
                      navigator.clipboard.writeText(shareLink);
                      alert("Watch party synchronization link safe invitation copied to clipboard! Share it with friends.");
                    }}
                    className="p-1 px-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] text-neutral-300 rounded flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3" /> Invite
                  </button>
                </div>

                {/* Multi user comments */}
                <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 pr-1 max-h-80 md:max-h-none scrollbar-thin">
                  {partyComments.map((com, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <img src={com.avatar} alt="Simulated Pfp" className="w-4 h-4 rounded-full border border-neutral-800" referrerPolicy="no-referrer" />
                        <strong className="text-neutral-300 font-bold">{com.userName}</strong>
                        {com.isActivePartyMessage && <span className="bg-purple-600 text-[8px] font-bold text-white px-1.5 py-0.2 rounded uppercase">you</span>}
                      </div>
                      <p className="text-neutral-400 text-xs pl-5 leading-relaxed bg-neutral-900/10 p-1 rounded-lg">
                        {com.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Send chat */}
                <form onSubmit={handleSendPartyChat} className="border-t border-neutral-900 pt-3 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Express reaction/discussions..."
                    value={partyMessage}
                    onChange={(e) => setPartyMessage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-purple-650 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* BILLING / TICKET SELECTION MODAL */}
      <AnimatePresence>
        {showBillingModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-neutral-950 border border-neutral-850 rounded-2xl max-w-3xl w-full p-6 sm:p-10 shadow-2xl relative"
            >
              <button
                onClick={() => { setShowBillingModal(false); setBillingPlanCandidate(null); }}
                className="absolute top-4 right-4 p-2 bg-neutral-900 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 space-y-2">
                <span className="text-[10px] bg-purple-600/10 text-purple-400 px-3 py-1 rounded-full uppercase font-black border border-purple-500/20 inline-block">
                  MONETIZATION MEMBERSHIP PLANS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">Elevate Your Cinematic Experience</h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">Skip all banner ads, stream in Dolby Sound and unlock premium 4K Ultra HD files.</p>
              </div>

              {/* TWO PARTS: SELECT TICKET OR VERIFY BILLING */}
              {!billingPlanCandidate ? (
                /* PART A: OFFER PACKAGES GRID */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const active = userSubscription === plan.name;
                    return (
                      <div 
                        key={plan.id}
                        className={`p-6 rounded-2xl bg-neutral-900 border transition-all text-left flex flex-col justify-between h-full ${
                          active 
                            ? 'border-purple-500 shadow-md shadow-purple-500/10 scale-[1.02]' 
                            : 'border-neutral-850 hover:border-neutral-800'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm uppercase text-neutral-200">{plan.name}</h4>
                            {active && <span className="bg-purple-600/10 text-purple-400 text-[8px] font-black tracking-wide border border-purple-500/30 px-2 py-0.5 rounded uppercase">current</span>}
                          </div>

                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-black text-white">{plan.price}</span>
                            <span className="text-xs text-neutral-500">/{plan.billingPeriod}</span>
                          </div>

                          <ul className="space-y-2.5 pt-3 border-t border-neutral-850">
                            {plan.benefits.map((b, bi) => (
                              <li key={bi} className="text-[11px] text-neutral-400 flex items-start gap-2 leading-relaxed">
                                <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {!active && (
                          <button
                            onClick={() => setBillingPlanCandidate(plan)}
                            className="w-full mt-6 py-2 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-xs font-bold rounded-xl transition-all text-purple-400 cursor-pointer"
                          >
                            Choose {plan.name}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* PART B: PAYMENT CHECKOUT PORTAL */
                <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-850 p-6 rounded-2xl text-left space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">Selected membership:</span>
                      <strong className="text-sm font-semibold text-white">{billingPlanCandidate.name}</strong>
                    </div>
                    <span className="text-xl font-black text-purple-400">{billingPlanCandidate.price}<span className="text-[10px] text-neutral-400 font-normal">/{billingPlanCandidate.billingPeriod}</span></span>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1.5">Payment integration type</label>
                      <div className="grid grid-cols-2 gap-3.5">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("Card")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border text-center cursor-pointer ${
                            paymentMethod === "Card" ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          💳 Visa / Mastercard
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("MobileMoney")}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border text-center cursor-pointer ${
                            paymentMethod === "MobileMoney" ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          💸 Mobile Money (East Africa)
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "Card" ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-neutral-500 mb-1">Card Number</label>
                          <input required type="text" placeholder="xxxx xxxx xxxx xxxx" className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">Expiry Date</label>
                            <input required type="text" placeholder="MM/YY" className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-neutral-500 mb-1">CVC Code</label>
                            <input required type="password" maxLength={3} placeholder="xxx" className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-neutral-500 mb-1">Select Network Provider</label>
                          <select className="w-full bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs text-white">
                            <option value="mtn">MTN Mobile Money Uganda / Rwanda</option>
                            <option value="airtel">Airtel Money</option>
                            <option value="mpesa">Safaricom M-Pesa Kenya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-500 mb-1">Mobile Wallet Phone Number</label>
                          <input required type="tel" placeholder="+256 771 234 567" className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs focus:outline-none" />
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-neutral-850 flex gap-3.5">
                      <button
                        type="button"
                        onClick={() => setBillingPlanCandidate(null)}
                        className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold text-center text-neutral-300"
                      >
                        Cancel
                      </button>
                       <button
                        type="submit"
                        className="flex-1 py-2.5 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-xs font-bold rounded-xl text-center text-purple-400 cursor-pointer transition-all"
                      >
                        {paymentVerified ? 'Completing payment...' : 'Authorize Payment Secure'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOWNLOADS MANAGER CACHE CONSOLE MODAL */}
      <AnimatePresence>
        {showDownloadsModal && (
          <DownloadsManager
            downloadedIds={downloadedList}
            movies={movies}
            downloadTasks={downloadTasks}
            onPauseDownload={handlePauseDownload}
            onResumeDownload={handleResumeDownload}
            onCancelDownload={handleCancelDownload}
            onRemoveDownload={handleRemoveDownload}
            onRemoveAllDownloads={handleRemoveAllDownloads}
            onPlayMovie={handlePlayDownloadedMovie}
            onClose={() => setShowDownloadsModal(false)}
            autoDeleteWatched={autoDeleteWatched}
            onToggleAutoDeleteWatched={setAutoDeleteWatched}
            currentProfile={currentProfile}
          />
        )}
      </AnimatePresence>

      {/* LOCAL DEVICE DIRECT FILE DOWNLOAD & PAYMENT MODAL */}
      <AnimatePresence>
        {showPaymentModalForMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[150] p-4 font-sans text-neutral-200"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-3xl p-6 relative shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider block font-mono">
                    Premium Content Delivery
                  </span>
                  <h3 className="text-base font-black text-white mt-1">
                    Direct Device Download
                  </h3>
                </div>
                <button
                  onClick={() => {
                    if (!isSimulatingDeviceDownload) {
                      setShowPaymentModalForMovie(null);
                    }
                  }}
                  className="p-1 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  disabled={isSimulatingDeviceDownload}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-850 flex gap-3.5">
                <img
                  src={showPaymentModalForMovie.posterUrl}
                  alt={showPaymentModalForMovie.title}
                  className="w-14 h-20 object-cover rounded-xl border border-neutral-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white truncate">
                      {showPaymentModalForMovie.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">
                      {showPaymentModalForMovie.genres.join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-neutral-500 font-mono mt-2">
                    <span>Format: High Definition MP4</span>
                    <span>Size: {getMovieSizeGB(showPaymentModalForMovie)} GB</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <span className="text-xs text-neutral-400">Direct Download Fee:</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-purple-400 font-mono">
                      Shs {downloadPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">2-Week Active License</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 leading-relaxed bg-neutral-900/30 p-3 rounded-xl border border-neutral-900 space-y-1.5">
                  <p>⚠️ This license permits downloading the raw media file directly onto your local device disk (MP4 container format, compatible with standard media players, TVs, and mobile phones).</p>
                  <p className="text-purple-400/90 font-medium font-sans">✨ Your playback access license remains valid on your physical device for exactly 14 days (2 weeks) from download date.</p>
                </div>
              </div>

              {isSimulatingDeviceDownload ? (
                <div className="space-y-3.5 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1.5 font-bold uppercase">
                      <div className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      Downloading Media Packages...
                    </span>
                    <span>HD 1080p Stream</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-850">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-500 h-full animate-pulse transition-all duration-300" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[9px] text-neutral-500 text-center uppercase font-black tracking-widest font-mono">
                    Please keep this window open while the stream is written to disk
                  </p>
                </div>
              ) : (
                <div className="flex gap-3.5 pt-2">
                  <button
                    onClick={() => setShowPaymentModalForMovie(null)}
                    className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDownloadLocalFile(showPaymentModalForMovie)}
                    className="flex-1 py-2.5 bg-purple-650 hover:bg-purple-600 border border-purple-550 hover:border-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-950/40 hover:shadow-purple-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Shs {downloadPrice.toLocaleString()}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER INSIGHTS OVERLAY MODAL */}
      <AnimatePresence>
        {showInsightsModal && (
          <UserInsights
            currentProfile={currentProfile}
            movies={movies}
            onClose={() => setShowInsightsModal(false)}
          />
        )}
      </AnimatePresence>

      {/* SMART TV & CASTING SUITE MODAL */}
      <AnimatePresence>
        {showSmartTvModal && (
          <SmartTvCasting
            movies={movies}
            activeVideoMovie={activeVideoMovie}
            onPlayMovie={(movie) => {
              handlePlayClick(movie);
              setShowSmartTvModal(false);
            }}
            onClose={() => setShowSmartTvModal(false)}
          />
        )}
      </AnimatePresence>

      {/* VERIFIED CREATOR STUDIO OVERLAY MODAL */}
      <AnimatePresence>
        {showCreatorStudio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreatorStudio(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            {/* Sliding Drawer / Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <CreatorStudio
                movies={movies}
                onRefreshMovies={onRefreshMovies}
                onClose={() => setShowCreatorStudio(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* FLOATING ACCESSIBILITY UTILS BAR */}
      <div className="fixed bottom-6 left-6 z-40 bg-neutral-950/90 border border-neutral-800 px-3.5 py-2.5 rounded-2xl backdrop-blur flex items-center gap-3 shadow-xl">
        <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Accessibility Controls:</span>
        
        <button
          onClick={() => setHighContrast(!highContrast)}
          className={`px-2 py-1 rounded text-[10px] font-bold ${
            highContrast ? 'bg-purple-600 text-white' : 'bg-neutral-900 text-neutral-400'
          }`}
          title="Enhance contrast ratios"
        >
          Contrast: {highContrast ? 'HIGH' : 'STD'}
        </button>

        <button
          onClick={() => setTextSizeMultiplier(textSizeMultiplier === 'normal' ? 'large' : 'normal')}
          className="px-2 py-1 bg-neutral-900 text-neutral-300 hover:text-white rounded text-[10px] font-bold"
        >
          Text: {textSizeMultiplier === 'normal' ? 'Normal' : 'Large A+'}
        </button>
      </div>

      {/* SIMPLE SEARCH OVERLAY MODEL */}
      <AnimatePresence>
        {showSearchOverlay && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-20 px-4 sm:px-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSearchOverlay(false);
                setOverlaySearchQuery("");
                setOverlaySelectedGenre("All");
              }}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl cursor-default"
            />

            {/* Main overlay core panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-4xl bg-[#0c0d13]/50 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/5 max-h-[80vh] overflow-y-auto flex flex-col gap-6 z-10"
            >
              {/* Top controls: Input & close */}
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type movie title, genres, cast, or director..."
                    value={overlaySearchQuery}
                    onChange={(e) => setOverlaySearchQuery(e.target.value)}
                    className="w-full bg-[#121319]/80 border border-purple-500/20 focus:border-purple-500/80 py-3.5 pl-12 pr-10 rounded-2xl text-sm focus:outline-none transition-all text-white placeholder-neutral-500 font-medium"
                  />
                  {overlaySearchQuery && (
                    <button 
                      onClick={() => setOverlaySearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowSearchOverlay(false);
                    setOverlaySearchQuery("");
                    setOverlaySelectedGenre("All");
                  }}
                  className="w-11 h-11 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-2xl flex items-center justify-center text-neutral-450 hover:text-white transition-all cursor-pointer"
                  title="Close Search Overlay"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Genre Pill Filters */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider font-mono">Quick Category Filter:</span>
                <div className="flex flex-wrap gap-2">
                  {["All", "Drama", "Crime", "Animation", "Comedy", "Sci-Fi", "Action", "Romance", "Thriller"].map((g) => {
                    const isSelected = overlaySelectedGenre === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setOverlaySelectedGenre(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-[1.03]'
                            : 'bg-[#12131a] text-neutral-400 hover:bg-neutral-800 hover:text-white border border-white/[0.02]'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic results layout */}
              <div className="flex-1 overflow-y-auto text-left">
                {(() => {
                  const queryFiltered = filteredMovies.filter(m => {
                    const matchesQuery = !overlaySearchQuery 
                      ? true 
                      : (
                        m.title.toLowerCase().includes(overlaySearchQuery.toLowerCase()) ||
                        m.genres.some(g => g.toLowerCase().includes(overlaySearchQuery.toLowerCase())) ||
                        m.synopsis.toLowerCase().includes(overlaySearchQuery.toLowerCase()) ||
                        (m.director && m.director.toLowerCase().includes(overlaySearchQuery.toLowerCase())) ||
                        (m.cast && m.cast.some(c => c.toLowerCase().includes(overlaySearchQuery.toLowerCase())))
                      );
                    
                    const matchesGenre = overlaySelectedGenre === "All" || m.genres.includes(overlaySelectedGenre as any);
                    return matchesQuery && matchesGenre;
                  });

                  if (queryFiltered.length === 0) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                        <Search className="w-12 h-12 text-neutral-700 animate-pulse" />
                        <div>
                          <p className="text-sm font-semibold text-neutral-300">No matching titles found</p>
                          <p className="text-xs text-neutral-500 mt-1">Try adjusting your keyword query or switching the category pill.</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-neutral-500 text-[10px] font-mono uppercase tracking-wider font-semibold">
                        <span>Matched Results ({queryFiltered.length})</span>
                        <span>Click card to inspect</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {queryFiltered.map((movie) => (
                          <motion.div
                            key={movie.id}
                            layoutId={`overlay-search-${movie.id}`}
                            whileHover={{ scale: 1.01, translateY: -2 }}
                            onClick={() => {
                              setSelectedMovie(movie);
                              setShowSearchOverlay(false);
                            }}
                            className="bg-[#121319]/90 border border-white/[0.03] hover:border-purple-500/20 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all self-stretch group animate-fadeIn"
                          >
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-12 h-18 rounded-lg object-cover bg-neutral-900 border border-white/[0.05] group-hover:border-purple-500/30 transition-all shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <h6 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">{movie.title}</h6>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                  {movie.genres[0]}
                                </span>
                                {movie.rating && (
                                  <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-0.5">
                                    ★ {movie.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                                {movie.synopsis}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOOGLE ADMOB BOTTOM MOBILE BANNER DOCK */}
      {admobEnabled && userSubscription === "Free Ad-Supported" && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#090a0f]/95 backdrop-blur border-t border-purple-500/20 z-45 flex items-center justify-between px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.8)] animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="text-[10px] bg-purple-650 text-white font-mono font-bold uppercase px-2 py-0.5 rounded tracking-wider shrink-0">
              AdMob Banner
            </div>
            <div className="text-left hidden xs:block min-w-0">
              <span className="text-[8px] text-neutral-500 font-mono block">UNIT_ID: {admobBannerUnitId}</span>
              <span className="text-[11px] font-semibold text-white truncate block">Centenary Bank Mobile Loan: Instantly qualify for up to Shs 5,000,000 with no collateral!</span>
            </div>
            <div className="text-left xs:hidden min-w-0">
              <span className="text-[11px] font-semibold text-white truncate block">Centenary Mobile Loan: Qualify for Shs 5,000,000!</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/ads/simulate-click", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "admob" })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    triggerMonetizationToast(
                      `📲 Google AdMob: Banner Clicked!`,
                      `Simulated Shs ${data.added.toLocaleString()} added to publisher account: ${admobAppId}`
                    );
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-3 py-1.5 bg-purple-650 hover:bg-purple-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider font-mono cursor-pointer transition-all hidden sm:inline-block"
            >
              Learn More
            </button>
            <button
              onClick={() => {
                setAdmobTimer(10);
                setShowAdmobRewardedVideo(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider font-mono cursor-pointer transition-all flex items-center gap-1"
              title="Watch a Rewarded video ad to earn rewards!"
            >
              🎬 Watch Rewarded Ad
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE ADMOB FULLSCREEN REWARDED VIDEO AD MODAL */}
      <AnimatePresence>
        {showAdmobRewardedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full bg-[#0d0e12] border border-neutral-800 rounded-3xl p-8 text-center space-y-6 relative shadow-2xl overflow-hidden">
              {/* Decorative radial pulse background */}
              <div className="absolute inset-0 bg-purple-500/5 rounded-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 uppercase tracking-widest relative z-10">
                <span>Google AdMob SDK v23.2</span>
                <span className="text-purple-400 font-bold">REWARDED VIDEO ACTIVE</span>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 mx-auto flex items-center justify-center text-3xl animate-bounce">
                  📺
                </div>
                <h4 className="text-lg font-black text-white">Speke Apartments Kampala</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Experience ultimate luxury in our serviced 1, 2, and 3-bedroom fully integrated residential suites in the heart of Kampala. Free access to Olympic pool, modern health club, and gourmet dining.
                </p>
              </div>

              {/* Progress and countdown bar */}
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-neutral-400 uppercase tracking-wide">Reward will issue in</span>
                  <span className="text-purple-400 font-mono text-sm">{admobTimer}s</span>
                </div>
                <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${(admobTimer / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-[9px] font-mono text-neutral-500 relative z-10 bg-neutral-900/60 p-3 rounded-xl border border-neutral-850">
                <div className="flex justify-between">
                  <span>AdUnit:</span>
                  <span className="text-neutral-400 truncate max-w-[200px] font-bold">{admobRewardedUnitId}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>AppID:</span>
                  <span className="text-neutral-400 truncate max-w-[200px] font-bold">{admobAppId}</span>
                </div>
              </div>

              <div className="text-[10px] text-neutral-500 relative z-10">
                ⚠️ Closing this video early will forfeit your simulated developer and viewer reward payout.
              </div>

              <button
                onClick={() => {
                  setShowAdmobRewardedVideo(false);
                  triggerMonetizationToast("AdMob Video Ad Skipped", "Simulated payout and user rewards were forfeited.");
                }}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white text-xs font-bold rounded-xl border border-neutral-800 cursor-pointer transition-all relative z-10"
              >
                Skip Video & Forfeit Reward
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM MONETIZATION INTERACTIVE TOAST OVERLAY */}
      <AnimatePresence>
        {monetizationToast.active && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-6 z-50 max-w-sm w-full bg-[#0d0e12] border border-purple-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg shrink-0">
              💰
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h5 className="text-xs font-black text-white">{monetizationToast.message}</h5>
              <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">{monetizationToast.sub}</p>
            </div>
            <button
              onClick={() => setMonetizationToast(prev => ({ ...prev, active: false }))}
              className="p-1 bg-neutral-900 hover:bg-neutral-850 rounded text-neutral-500 hover:text-white text-[10px] cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}