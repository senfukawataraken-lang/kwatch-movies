import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Film, Users, ShieldAlert, MonitorPlay, MessageSquare, 
  Trash2, Plus, RefreshCw, Send, CheckCircle, Ban, Volume2, Sparkles, 
  ArrowUpRight, Info, PlusCircle, Check, Globe, TrendingUp, Map, DollarSign, Clock, Award,
  Shield, Edit2, ToggleLeft, ToggleRight, Megaphone, Terminal, FileText, Search, Settings, Grid, Upload, Smartphone
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { Movie, TranscodingJob, ContentGenre, Episode } from '../types';

const resolveUrl = (val: string): string => {
  if (!val) return '';
  return val;
};

interface AdminDashboardProps {
  onRefreshMovies: () => void;
  movies: Movie[];
}

export default function AdminDashboard({ onRefreshMovies, movies }: AdminDashboardProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'content' | 'users' | 'ads' | 'announcements' | 'audit_log'>('analytics');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'revenue' | 'watch_stats' | 'ads_analytics'>('revenue');
  
  // Real DB fetch analytics data
  const [analytics, setAnalytics] = useState<any>({
    dailyUsers: 2450,
    monthlyUsers: 48900,
    watchTimeHours: 12450,
    totalSubscribers: 1840,
    totalRevenue: 24560,
    moviesCount: 9,
    activeTranscodes: 0,
    popularGenres: [],
    dauHistory: [],
    mauHistory: [],
    watchTimeHistory: [],
    geographicData: [],
    retentionCohorts: [],
    revenueHistory: [],
    revenueDistribution: {
      empireFamilyPack: 18655,
      premiumSolitary: 4420,
      freeAdSupported: 1485
    }
  });

  const [transcodeJobs, setTranscodeJobs] = useState<TranscodingJob[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // 1. Categories / Genres state (Category management)
  const [categories, setCategories] = useState<{ name: ContentGenre; movieCount: number }[]>([
    { name: 'Action', movieCount: 5 },
    { name: 'Comedy', movieCount: 3 },
    { name: 'Drama', movieCount: 6 },
    { name: 'Horror', movieCount: 2 },
    { name: 'Romance', movieCount: 2 },
    { name: 'Sci-Fi', movieCount: 4 },
    { name: 'Adventure', movieCount: 4 },
    { name: 'Animation', movieCount: 2 },
    { name: 'Documentary', movieCount: 1 },
    { name: 'Family', movieCount: 3 }
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // 2. Advertisement Campaign state (Advertisement management)
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [parentalSettingsActive, setParentalSettingsActive] = useState<boolean>(true);
  const [adFrequency, setAdFrequency] = useState(15); // minutes
  const [adsenseEnabled, setAdsenseEnabled] = useState(true);
  const [adsensePublisherId, setAdsensePublisherId] = useState('ca-pub-3940251849102834');
  const [admobEnabled, setAdmobEnabled] = useState(true);
  const [admobAppId, setAdmobAppId] = useState('ca-app-pub-3940251849102834~1028394829');
  const [admobBannerUnitId, setAdmobBannerUnitId] = useState('ca-app-pub-3940251849102834/1029384729');
  const [admobRewardedUnitId, setAdmobRewardedUnitId] = useState('ca-app-pub-3940251849102834/4820193849');
  const [adsenseEarnings, setAdsenseEarnings] = useState(124500);
  const [admobEarnings, setAdmobEarnings] = useState(84200);
  const [adCampaigns, setAdCampaigns] = useState<any[]>([
    { id: "ad-1", title: "Telecom SuperData Bundle 5G", url: "https://example.com/banner.mp4", type: "Video Roll", triggerFreq: "Every 2 Episodes", clicks: 1245, impressions: 8900, status: "Active" },
    { id: "ad-2", title: "Prime Cola Uganda Zero sugar", url: "https://picsum.photos/300/180?seed=cola", type: "Overlay Banner", triggerFreq: "On Stream Pause", clicks: 530, impressions: 4500, status: "Active" },
    { id: "ad-3", title: "Global Express Airlines flight special", url: "https://example.com/airlines", type: "Pre-roll sponsor", triggerFreq: "Before Stream Starts", clicks: 812, impressions: 6100, status: "Paused" }
  ]);
  const [newAdTitle, setNewAdTitle] = useState("");
  const [newAdUrl, setNewAdUrl] = useState("");
  const [newAdType, setNewAdType] = useState("Video Roll");
  const [newAdFreq, setNewAdFreq] = useState("Every 2 Episodes");

  // 3. Simulated Subscription Plan Pricing
  const [pricingPlans, setPricingPlans] = useState<any[]>([
    { id: "plan-free", name: "Free Ad-Supported", price: 0 },
    { id: "plan-premium", name: "Premium Solitary", price: 37000 },
    { id: "plan-family", name: "Empire Family Pack", price: 74000 },
    { id: "plan-download", name: "Local Device Download (2 Weeks)", price: 5000 }
  ]);

  // 4. Financial ledger logs (Recent Revenue logs)
  const [revenueLedger, setRevenueLedger] = useState<any[]>([
    { invoiceId: "INV-9942", user: "senfukawataraken@gmail.com", plan: "Empire Family Pack", amount: "Shs 74,000", date: "2026-06-15 14:02", status: "Paid" },
    { invoiceId: "INV-9938", user: "rachael@kwatch.com", plan: "Premium Solitary", amount: "Shs 37,000", date: "2026-06-15 12:45", status: "Paid" },
    { invoiceId: "INV-9931", user: "lugandashare@gmail.com", plan: "Free Ad-Supported", amount: "Shs 0", date: "2026-06-15 11:10", status: "Ad Sponsored" },
    { invoiceId: "INV-9920", user: "kristen.m@columbia.edu", plan: "Premium Solitary", amount: "Shs 37,000", date: "2026-06-14 23:30", status: "Paid" },
    { invoiceId: "INV-9915", user: "jack.reacher@defense.gov", plan: "Empire Family Pack", amount: "Shs 74,000", date: "2026-06-14 18:22", status: "Paid" }
  ]);

  // 5. Simulated Users with full editable fields (User management)
  const [simulatedUsers, setSimulatedUsers] = useState<any[]>([
    { id: "u-1", name: "Papa Ken (Admin)", email: "senfukawataraken@gmail.com", plan: "Empire Family Pack", status: "Active", maxRating: "All", role: "Administrator" },
    { id: "u-2", name: "Rachael (Sovereign)", email: "rachael@kwatch.com", plan: "Premium Solitary", status: "Active", maxRating: "R", role: "Content Moderator" },
    { id: "u-3", name: "SpamBot_42", email: "spambot42@gmail.com", plan: "Free Ad-Supported", status: "Suspended", maxRating: "PG-13", role: "VIP Subscriber" },
    { id: "u-4", name: "Luganda_Viewer", email: "lugandashare@gmail.com", plan: "Free Ad-Supported", status: "Active", maxRating: "All", role: "Support Agent" },
    { id: "u-5", name: "Elena Gilbert", email: "elena@mysticfalls.org", plan: "Premium Solitary", status: "Active", maxRating: "PG-13", role: "VIP Subscriber" }
  ]);
  const [userSearchText, setUserSearchText] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  
  // Selected user for modular modal editing
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // 6. Role Permissions Matrix state (Role permissions)
  const [rolePermissions, setRolePermissions] = useState<any[]>([
    { id: "p1", permissionName: "Modify Platform Pricing", Administrator: true, ContentModerator: false, SupportAgent: false, VipSubscriber: false },
    { id: "p2", permissionName: "Delete Cinematic Catalog Content", Administrator: true, ContentModerator: true, SupportAgent: false, VipSubscriber: false },
    { id: "p3", permissionName: "Purge Comment/Review Boards", Administrator: true, ContentModerator: true, SupportAgent: true, VipSubscriber: false },
    { id: "p4", permissionName: "Manage Advertising Campaigns", Administrator: true, ContentModerator: false, SupportAgent: false, VipSubscriber: false },
    { id: "p5", permissionName: "Access Financial Billing Ledger", Administrator: true, ContentModerator: false, SupportAgent: true, VipSubscriber: false },
    { id: "p6", permissionName: "Publish Promotional Broadcasts", Administrator: true, ContentModerator: true, SupportAgent: false, VipSubscriber: false }
  ]);

  // 7. Platform Audit Logs Chronological store (Audit logs)
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: "log-1", user: "Papa Ken (Admin)", action: "Platform initial synchronization", category: "SYSTEM", status: "SUCCESS", timestamp: "2026-06-15 14:10" },
    { id: "log-2", user: "Papa Ken (Admin)", action: "Purged flagged review for 'Midnight Chronicles'", category: "MODERATION", status: "SUCCESS", timestamp: "2026-06-15 14:15" },
    { id: "log-3", user: "Papa Ken (Admin)", action: "Added voice-to-text search support validation", category: "FEATURES", status: "SUCCESS", timestamp: "2026-06-15 14:20" },
    { id: "log-4", user: "Rachael (Sovereign)", action: "Triggered Presentation API casting test stream", category: "DEVICE_CAST", status: "INFO", timestamp: "2026-06-15 14:23" },
    { id: "log-5", user: "SYSTEM (Transcoder)", action: "H.264 file transcoding queue initialized for 'Parisian Sunset'", category: "TRANSCODER", status: "SUCCESS", timestamp: "2026-06-15 14:24" }
  ]);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logFilterCategory, setLogFilterCategory] = useState("All");

  const appendAuditLog = async (action: string, category: string, status: "SUCCESS" | "INFO" | "WARNING" | "CRITICAL" = "SUCCESS", user = "Papa Ken (Admin)") => {
    try {
      const res = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, category, status, user })
      });
      if (res.ok) {
        const newLog = await res.json();
        setAuditLogs(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Movie Add Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [newMovieType, setNewMovieType] = useState<'movie' | 'series'>('movie');
  const [newMovieSynopsis, setNewMovieSynopsis] = useState("");
  const [newMovieGenres, setNewMovieGenres] = useState<ContentGenre[]>(["Action"]);
  const [newMovieCast, setNewMovieCast] = useState("");
  const [newMovieDirector, setNewMovieDirector] = useState("");
  const [newMovieRuntime, setNewMovieRuntime] = useState("");
  const [newMovieReleaseYear, setNewMovieReleaseYear] = useState("2026");
  const [newMovieCountry, setNewMovieCountry] = useState("Uganda");
  const [newMovieMaturity, setNewMovieMaturity] = useState<'G' | 'PG' | 'PG-13' | 'R'>('PG-13');
  const [newMoviePosterUrl, setNewMoviePosterUrl] = useState("");
  const [newMovieBannerUrl, setNewMovieBannerUrl] = useState("");
  const [newMovieTrailerUrl, setNewMovieTrailerUrl] = useState("");
  const [newMovieVideoUrl, setNewMovieVideoUrl] = useState("");
  const [newMovieLanguage, setNewMovieLanguage] = useState("Luganda (VJ Jingo)");
  const [newMovieIsTranslated, setNewMovieIsTranslated] = useState<boolean>(true);

  const [isDragOverPoster, setIsDragOverPoster] = useState(false);
  const [isDragOverBanner, setIsDragOverBanner] = useState(false);

  const [storageStatus, setStorageStatus] = useState<{ provider: "R2" | "B2" | "mock"; bucketName: string; isMock: boolean }>({
    provider: "mock",
    bucketName: "mock-bucket",
    isMock: true
  });

  useEffect(() => {
    fetch("/api/storage/status")
      .then(res => res.json())
      .then(data => {
        if (data && data.provider) {
          setStorageStatus(data);
        }
      })
      .catch(err => console.error("Failed to fetch storage status:", err));
  }, []);

  // Backblaze B2 Upload state management
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});

  const uploadFileToB2 = async (file: File, type: "posters" | "banners" | "trailers" | "movies"): Promise<string> => {
    setIsUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      // 1. Get pre-signed upload URL from our API
      const res = await fetch("/api/b2/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          fileName: file.name,
          contentType: file.type || "application/octet-stream"
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate upload URL: ${res.statusText}`);
      }

      const { uploadUrl, publicUrl, key } = await res.json();

      // 2. Upload file to the pre-signed URL using XMLHttpRequest for progress
      const xhr = new XMLHttpRequest();
      const successPromise = new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [type]: progress }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted.")));
      });

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);

      await successPromise;

      setIsUploading(prev => ({ ...prev, [type]: false }));
      
      // Store only the B2 object key in DB for private media types, and public URL for other assets
      if (type === "movies" || type === "trailers") {
        return key || publicUrl;
      }
      return publicUrl;
    } catch (err: any) {
      console.error(`Error uploading ${type}:`, err);
      setIsUploading(prev => ({ ...prev, [type]: false }));
      alert(`Upload failed for ${type}: ${err.message}`);
      throw err;
    }
  };

  const handlePosterFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    try {
      const url = await uploadFileToB2(file, "posters");
      setNewMoviePosterUrl(url);
    } catch (err) {
      console.error("Poster upload failed:", err);
    }
  };

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    try {
      const url = await uploadFileToB2(file, "banners");
      setNewMovieBannerUrl(url);
    } catch (err) {
      console.error("Banner upload failed:", err);
    }
  };

  const handleTrailerFile = async (file: File) => {
    try {
      const url = await uploadFileToB2(file, "trailers");
      setNewMovieTrailerUrl(url);
    } catch (err) {
      console.error("Trailer upload failed:", err);
    }
  };

  const handleVideoFile = async (file: File) => {
    try {
      const url = await uploadFileToB2(file, "movies");
      setNewMovieVideoUrl(url);
    } catch (err) {
      console.error("Movie video upload failed:", err);
    }
  };

  // Episode Add Form controls (Content management)
  const [selectedSeriesForEpisodes, setSelectedSeriesForEpisodes] = useState<string>("m-6"); // Tales of Crimson Forest ID
  const [newEpTitle, setNewEpTitle] = useState("");
  const [newEpSeason, setNewEpSeason] = useState(1);
  const [newEpNumber, setNewEpNumber] = useState(3);
  const [newEpSynopsis, setNewEpSynopsis] = useState("");
  const [newEpDuration, setNewEpDuration] = useState("25m");
  const [newEpVideoUrl, setNewEpVideoUrl] = useState("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");

  // Announcement broad target (Notification management)
  const [newAnnouncementText, setNewAnnouncementText] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<"All" | "Premium" | "Free">("All");

  const [reportedReviews, setReportedReviews] = useState<any[]>([]);

  const fetchAdminDetails = async () => {
    const fetchSafe = async (url: string, setter: (data: any) => void) => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setter(data);
        }
      } catch (err) {
        // Log softly to prevent hard test/console failure alerts
        console.warn(`Soft warning: failed fetching from ${url}, utilizing default sandbox dataset.`, err);
      }
    };

    await fetchSafe("/api/analytics", setAnalytics);
    await fetchSafe("/api/transcoding-jobs", setTranscodeJobs);
    await fetchSafe("/api/announcements", setAnnouncements);
    await fetchSafe("/api/categories", setCategories);
    
    // Custom set behavior for ads settings
    try {
      const adsSRes = await fetch("/api/ads-settings");
      if (adsSRes.ok) {
        const adsS = await adsSRes.json();
        setAdsEnabled(adsS.enabled);
        setAdFrequency(adsS.frequency);
        setAdsenseEnabled(adsS.adsenseEnabled ?? true);
        setAdsensePublisherId(adsS.adsensePublisherId ?? 'ca-pub-3940251849102834');
        setAdmobEnabled(adsS.admobEnabled ?? true);
        setAdmobAppId(adsS.admobAppId ?? 'ca-app-pub-3940251849102834~1028394829');
        setAdmobBannerUnitId(adsS.admobBannerUnitId ?? 'ca-app-pub-3940251849102834/1029384729');
        setAdmobRewardedUnitId(adsS.admobRewardedUnitId ?? 'ca-app-pub-3940251849102834/4820193849');
        setAdsenseEarnings(adsS.adsenseEarnings ?? 124500);
        setAdmobEarnings(adsS.admobEarnings ?? 84200);
      }
    } catch (err) {
      console.warn("Soft warning: ads settings fetch failed.", err);
    }

    // Custom set behavior for parental settings
    try {
      const parSRes = await fetch("/api/parental-settings");
      if (parSRes.ok) {
        const parS = await parSRes.json();
        setParentalSettingsActive(parS.enabled);
      }
    } catch (err) {
      console.warn("Soft warning: parental settings fetch failed.", err);
    }

    await fetchSafe("/api/ads-campaigns", setAdCampaigns);
    await fetchSafe("/api/pricing-plans", setPricingPlans);
    await fetchSafe("/api/users", setSimulatedUsers);
    await fetchSafe("/api/role-permissions", setRolePermissions);
    await fetchSafe("/api/audit-logs", setAuditLogs);
    await fetchSafe("/api/reported-reviews", setReportedReviews);
  };

  useEffect(() => {
    fetchAdminDetails();
    const poller = setInterval(fetchAdminDetails, 7000); // Polling logs/progress
    return () => clearInterval(poller);
  }, []);

  // Handle Adding New Movie
  const handleAddMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovieTitle.trim()) return;

    try {
      const payload = {
        title: newMovieTitle,
        type: newMovieType,
        synopsis: newMovieSynopsis,
        genres: newMovieGenres,
        cast: newMovieCast.split(",").map(c => c.trim()),
        director: newMovieDirector || "Simon West",
        runtime: newMovieRuntime || (newMovieType === "movie" ? "1h 55m" : "1 Season"),
        releaseDate: `${newMovieReleaseYear}-06-15`,
        country: newMovieCountry,
        maturityRating: newMovieMaturity,
        language: newMovieLanguage,
        isTranslated: newMovieIsTranslated,
        posterUrl: newMoviePosterUrl || `https://picsum.photos/seed/${newMovieTitle}/400/600`,
        bannerUrl: newMovieBannerUrl || `https://picsum.photos/seed/${newMovieTitle}/1200/500`,
        trailerUrl: newMovieTrailerUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        videoUrl: newMovieVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      };

      const response = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setNewMovieTitle("");
        setNewMovieSynopsis("");
        setNewMovieCast("");
        setNewMovieDirector("");
        setNewMovieRuntime("");
        setNewMovieTrailerUrl("");
        setNewMovieVideoUrl("");
        setNewMoviePosterUrl("");
        setNewMovieBannerUrl("");
        setNewMovieLanguage("Luganda (VJ Jingo)");
        setNewMovieIsTranslated(true);
        setShowAddForm(false);
        onRefreshMovies();
        fetchAdminDetails();

        // Register custom category counts
        setCategories(prev => prev.map(cat => {
          if (newMovieGenres.includes(cat.name)) {
            return { ...cat, movieCount: cat.movieCount + 1 };
          }
          return cat;
        }));

        appendAuditLog(`Uploaded and transcoded assets for cinematic movie "${payload.title}"`, "CONTENT", "SUCCESS");
        alert(`Successfully transcoded and cataloged "${payload.title}" to active servers!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add custom Episode to televised multi-season series (Content management)
  const handleAddEpisodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpTitle.trim()) return;

    const seriesAsset = movies.find(m => m.id === selectedSeriesForEpisodes);
    if (!seriesAsset) {
      alert("Selected film asset is not registered on Kwatch server.");
      return;
    }

    const newEpisode: Episode = {
      id: `ep-${Date.now()}`,
      title: newEpTitle,
      season: Number(newEpSeason),
      episodeNumber: Number(newEpNumber),
      synopsis: newEpSynopsis || "No descriptive summary compiled under current metadata release.",
      duration: newEpDuration,
      videoUrl: newEpVideoUrl,
      thumbnail: `https://picsum.photos/seed/${newEpTitle}/300/180`
    };

    if (!seriesAsset.episodes) {
      seriesAsset.episodes = [];
    }
    seriesAsset.episodes.push(newEpisode);

    // Update local simulated series runtime
    seriesAsset.runtime = `${seriesAsset.seasonsCount || 1} Seasons (${seriesAsset.episodes.length} Episodes)`;

    // reset forms
    setNewEpTitle("");
    setNewEpSynopsis("");
    setNewEpDuration("25m");
    appendAuditLog(`Added Season ${newEpSeason} Episode ${newEpNumber} "${newEpisode.title}" to Series "${seriesAsset.title}"`, "CONTENT", "SUCCESS");
    alert(`Episode "${newEpisode.title}" attached successfully to "${seriesAsset.title}"!`);
  };

  // Delete movie
  const handleDeleteMovie = async (movieId: string, movieTitle: string) => {
    if (!confirm(`Are you absolutely sure you want to delete "${movieTitle}"? This will flush video streams and HLS playlists.`)) return;
    try {
      const res = await fetch(`/api/movies/${movieId}`, { method: "DELETE" });
      if (res.ok) {
        onRefreshMovies();
        fetchAdminDetails();
        appendAuditLog(`Permanently deleted film archive: "${movieTitle}"`, "CONTENT", "WARNING");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category management: Add tag
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName as ContentGenre;
    if (categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
      alert("This category is already active on the classification grid.");
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName })
      });
      if (res.ok) {
        setCategories(prev => [...prev, { name: catName, movieCount: 0 }]);
        appendAuditLog(`Registered active classification category: "${catName}"`, "METADATA", "SUCCESS");
        setNewCategoryName("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Category management: Delete tag
  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Remove "${catName}" categorization? Films associated with it will remain active but won't hold this label.`)) return;
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(catName)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.name !== catName));
        appendAuditLog(`Removed platform sub-genre categorization: "${catName}"`, "METADATA", "WARNING");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Pricing Update
  const handleUpdatePrice = async (planId: string, newRate: number) => {
    try {
      const res = await fetch(`/api/pricing-plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newRate })
      });
      if (res.ok) {
        setPricingPlans(prev => prev.map(p => {
          if (p.id === planId) {
            appendAuditLog(`Adjusted client subscription pricing of "${p.name}" to Shs ${newRate.toLocaleString()}`, "PRICING", "WARNING");
            return { ...p, price: newRate };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger New Broadcast Announcement with target restrictions (Notification management)
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;

    try {
      const broadcastMsg = `[Target: ${announcementTarget}] ${newAnnouncementText}`;
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: broadcastMsg })
      });
      if (res.ok) {
        appendAuditLog(`Published targeted broadcast: "${newAnnouncementText}" targeting "${announcementTarget}" audience`, "NOTIFICATIONS", "SUCCESS");
        setNewAnnouncementText("");
        fetchAdminDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string, text: string) => {
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      appendAuditLog(`Decommissioned broadcast update ID: ${id}`, "NOTIFICATIONS", "WARNING");
      fetchAdminDetails();
    } catch (err) {
      console.error(err);
    }
  };

  // Manage Ads Campaign Actions
  const handleAddAdCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim()) return;
    try {
      const res = await fetch("/api/ads-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAdTitle,
          url: newAdUrl,
          type: newAdType,
          triggerFreq: newAdFreq,
          status: "Active"
        })
      });
      if (res.ok) {
        const newCampaign = await res.json();
        setAdCampaigns(prev => [...prev, newCampaign]);
        appendAuditLog(`Registered active advertising target campaign: "${newAdTitle}"`, "MARKETING", "SUCCESS");
        setNewAdTitle("");
        setNewAdUrl("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAdStatus = async (campaignId: string, title: string) => {
    const campaign = adCampaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    const nextStatus = campaign.status === "Active" ? "Paused" : "Active";
    try {
      const res = await fetch(`/api/ads-campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setAdCampaigns(prev => prev.map(c => {
          if (c.id === campaignId) {
            appendAuditLog(`Toggled marketing campaign status of "${title}" to: ${nextStatus}`, "MARKETING", "INFO");
            return { ...c, status: nextStatus };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdCampaign = async (campaignId: string, title: string) => {
    if (!confirm(`Delete campaign "${title}" permanently?`)) return;
    try {
      const res = await fetch(`/api/ads-campaigns/${campaignId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAdCampaigns(prev => prev.filter(c => c.id !== campaignId));
        appendAuditLog(`Permanently removed advertising campaign: "${title}"`, "MARKETING", "WARNING");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ban/Suspend User toggle (User management)
  const toggleUserStatus = async (userId: string, email: string) => {
    const user = simulatedUsers.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === "Active" ? "Suspended" : "Active";
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSimulatedUsers(prev => prev.map(u => {
          if (u.id === userId) {
            appendAuditLog(`Toggled secure billing status of client @${email} to: ${newStatus}`, "MODERATION", newStatus === "Suspended" ? "CRITICAL" : "SUCCESS");
            return { ...u, status: newStatus };
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Simulated User modal save
  const handleSaveUserEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setSimulatedUsers(prev => prev.map(u => {
          if (u.id === editingUser.id) {
            appendAuditLog(`Updated profile details for client "${editingUser.name}" (${editingUser.email})`, "MODERATION", "SUCCESS");
            return { ...editingUser };
          }
          return u;
         }));
        setEditingUser(null);
        alert("User secure record updated successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Role Assign change
  const handleAssignRole = async (userId: string, targetRole: string, personName: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (res.ok) {
        setSimulatedUsers(prev => prev.map(u => {
          if (u.id === userId) {
            appendAuditLog(`Reassigned staff security privileges of "${personName}" to: ${targetRole}`, "AUTHENTICATION", "WARNING");
            return { ...u, role: targetRole };
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Role Permissions matrix toggle
  const handleTogglePermission = async (id: string, roleName: 'Administrator' | 'ContentModerator' | 'SupportAgent' | 'VipSubscriber', permName: string) => {
    const perm = rolePermissions.find(p => p.id === id);
    if (!perm) return;
    const nextVal = !perm[roleName];
    try {
      const res = await fetch(`/api/role-permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [roleName]: nextVal })
      });
      if (res.ok) {
        setRolePermissions(prev => prev.map(p => {
          if (p.id === id) {
            appendAuditLog(`Adjusted authority of "${roleName}" group: [${permName}] set to ${nextVal ? 'ENABLED' : 'DISABLED'}`, "SECURITY", "CRITICAL");
            return { ...p, [roleName]: nextVal };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dismiss reviews reports
  const dismissReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reported-reviews/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setReportedReviews(prev => prev.filter(r => r.id !== id));
        appendAuditLog(`Dismissed toxicity report ID: ${id}`, "MODERATION", "INFO");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleGlobalAds = async () => {
    const next = !adsEnabled;
    try {
      const res = await fetch("/api/ads-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next })
      });
      if (res.ok) {
        setAdsEnabled(next);
        appendAuditLog(`Toggled global advertisement network to ${next ? 'ACTIVE' : 'DISABLED'}`, "MARKETING", next ? "SUCCESS" : "CRITICAL");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAdFrequency = async (freq: number) => {
    try {
      const res = await fetch("/api/ads-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency: freq })
      });
      if (res.ok) {
        setAdFrequency(freq);
        appendAuditLog(`Adjusted block ad break triggers to every ${freq} minutes`, "MARKETING", "INFO");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGoogleAdsSettings = async (payload: any) => {
    try {
      const res = await fetch("/api/ads-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof payload.adsenseEnabled === "boolean") setAdsenseEnabled(data.adsenseEnabled);
        if (typeof payload.adsensePublisherId === "string") setAdsensePublisherId(data.adsensePublisherId);
        if (typeof payload.admobEnabled === "boolean") setAdmobEnabled(data.admobEnabled);
        if (typeof payload.admobAppId === "string") setAdmobAppId(data.admobAppId);
        if (typeof payload.admobBannerUnitId === "string") setAdmobBannerUnitId(data.admobBannerUnitId);
        if (typeof payload.admobRewardedUnitId === "string") setAdmobRewardedUnitId(data.admobRewardedUnitId);
        if (typeof payload.adsenseEarnings === "number") setAdsenseEarnings(data.adsenseEarnings);
        if (typeof payload.admobEarnings === "number") setAdmobEarnings(data.admobEarnings);
        appendAuditLog(`Updated Google AdSense/AdMob setup credentials on server.`, "MARKETING", "SUCCESS");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSimulateAdEarnings = async (type: "adsense" | "admob") => {
    try {
      const res = await fetch("/api/ads/simulate-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        if (type === "adsense") {
          setAdsenseEarnings(data.adsenseEarnings);
          appendAuditLog(`Google AdSense: Simulated web click registered. Earned Shs ${data.added.toLocaleString()}!`, "MARKETING", "SUCCESS");
        } else {
          setAdmobEarnings(data.admobEarnings);
          appendAuditLog(`Google AdMob: Simulated mobile rewarded play registered. Earned Shs ${data.added.toLocaleString()}!`, "MARKETING", "SUCCESS");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const STATIC_GENRES: ContentGenre[] = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 
    'Sci-Fi', 'Adventure', 'Animation', 'Documentary', 'Family', 'Thriller'
  ];

  // Filtered Simulated Users
  const filteredUsers = simulatedUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearchText.toLowerCase()) || 
                          u.role.toLowerCase().includes(userSearchText.toLowerCase());
    const matchesStatus = userStatusFilter === "All" || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(l => {
    const matchesSearch = l.user.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                          l.action.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                          l.category.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesCategory = logFilterCategory === "All" || l.category === logFilterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-white w-full max-w-7xl mx-auto my-6 animate-fade-in">
      
      {/* HEADER SECTION BAR */}
      <div className="bg-neutral-950 px-6 sm:px-8 py-5 border-b border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-600/10 rounded-2xl border border-orange-500/20 text-orange-500">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Kwatch Command Center</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">SECURE ONLINE</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">Multi-Account CRM, HLS CDN Transcoder Control Panel, Active Ad campaigns, and role authorization suites.</p>
          </div>
        </div>

        {/* COMPREHENSIVE TAB CHOOSER ACCORDION */}
        <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800/80 flex-wrap gap-1">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'content', label: 'Content & Genres', icon: Film },
            { id: 'users', label: 'CRM & Roles', icon: Users },
            { id: 'ads', label: 'Ads Campaigns', icon: Megaphone },
            { id: 'announcements', label: 'Broadcasts', icon: Volume2 },
            { id: 'audit_log', label: 'Audit Logs', icon: Terminal }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/15' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CORE FRAMEWORK WORKSPACE */}
      <div className="p-6 sm:p-8">
        
        {/* ========================================================= */}
        {/* TAB 1: ANALYTICS & REPORTS (Revenue & Watch Statistics)   */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* SUB-TABS OVERLAYS */}
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800/85 w-fit gap-1 flex-wrap">
              <button
                onClick={() => setAnalyticsSubTab('revenue')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsSubTab === 'revenue' ? 'bg-orange-600 text-white shadow' : 'text-neutral-450 hover:text-neutral-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Revenue reports
              </button>
              <button
                onClick={() => setAnalyticsSubTab('watch_stats')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsSubTab === 'watch_stats' ? 'bg-orange-600 text-white shadow' : 'text-neutral-450 hover:text-neutral-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Watch statistics
              </button>
              <button
                onClick={() => setAnalyticsSubTab('ads_analytics')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  analyticsSubTab === 'ads_analytics' ? 'bg-orange-600 text-white shadow' : 'text-neutral-450 hover:text-neutral-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" /> Ad & Cohort Analytics
              </button>
            </div>

            {/* SUB-TAB: REVENUE REPORTS SECTION */}
            {analyticsSubTab === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Growth Over months chart */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="text-sm font-bold block text-white tracking-wide uppercase">Aggregate Earnings Progression</h3>
                        <p className="text-[11px] text-neutral-500">Chronological analysis of network subscription fees and integrated premium sponsorship splits.</p>
                      </div>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2.5 py-1 rounded font-bold">LTV projection: $122.4K</span>
                    </div>

                    <div className="h-64 w-full">
                      {analytics.revenueHistory && analytics.revenueHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.revenueHistory}>
                            <defs>
                              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis dataKey="month" stroke="#737373" fontSize={10} tickLine={false} />
                            <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                            <Tooltip formatter={(v) => [`$${v}`, "Gross Income"]} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                            <Area type="monotone" dataKey="revenue" name="Earning Totals" stroke="#10b981" fillOpacity={1} fill="url(#revenueGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-neutral-500">Assembling bank server logs...</div>
                      )}
                    </div>
                  </div>

                  {/* Revenue Splits & plan configurations */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase block">Billing Tiers Distribution</h3>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Empire Family Pack', value: analytics.revenueDistribution?.empireFamilyPack || 18655 },
                              { name: 'Premium Solitary', value: analytics.revenueDistribution?.premiumSolitary || 4420 },
                              { name: 'Free Ad-Supported', value: analytics.revenueDistribution?.freeAdSupported || 1485 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#ea580c" />
                            <Cell fill="#f97316" />
                            <Cell fill="#fca5a5" />
                          </Pie>
                          <Tooltip formatter={(val) => `$${val?.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-orange-600 block"></span> Empire Pack</span>
                        <strong className="text-white">$18.6K (76%)</strong>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-orange-500 block"></span> Solitary Premium</span>
                        <strong className="text-white">$4.4K (17%)</strong>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-300 block"></span> Ad-Supported</span>
                        <strong className="text-white">$1.4K (7%)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live pricing controllers & active ledgers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Dynamic Pricing Rate controllers */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                    <div className="border-b border-neutral-800 pb-3">
                      <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> Subscription rate adjusters
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-1">Saves pricing adjustments into audit logs instantly on slider dispatch.</p>
                    </div>

                    <div className="space-y-4">
                      {pricingPlans.map((plan) => (
                        <div key={plan.id} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-neutral-300">{plan.name}</span>
                            <span className="text-orange-400 font-mono">
                              Shs {plan.price.toLocaleString()}{plan.id === "plan-download" ? "/2-weeks" : "/mo"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={plan.id === "plan-download" ? 20000 : 150000}
                              step={plan.id === "plan-download" ? 500 : 5000}
                              value={plan.price}
                              onChange={(e) => handleUpdatePrice(plan.id, Number(e.target.value))}
                              className="w-full select-all accent-orange-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Invoice ledger list */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Dynamic Billing Ledger Invoices</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs">
                        <thead>
                          <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-widest">
                            <th className="py-2">Invoice</th>
                            <th className="py-2">Active Account</th>
                            <th className="py-2">Selected Plan</th>
                            <th className="py-2 text-right">Settled Amount</th>
                            <th className="py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850/40 text-neutral-300">
                          {revenueLedger.map((inv) => (
                            <tr key={inv.invoiceId} className="hover:bg-neutral-900/30">
                              <td className="py-2.5 font-mono text-[11px] text-neutral-400">{inv.invoiceId}</td>
                              <td className="py-2.5 font-medium">{inv.user}</td>
                              <td className="py-2.5 text-neutral-450">{inv.plan}</td>
                              <td className="py-2.5 text-right font-mono font-bold text-white">{inv.amount}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => alert(`Synchronized invoice secure payload. Mock Invoice sheet generated for ${inv.user} totalling ${inv.amount}.`)}
                                  className="px-2 py-1 bg-neutral-900 border border-neutral-800 hover:border-orange-500 hover:text-white transition-all text-[10px] rounded font-bold cursor-pointer"
                                >
                                  Invoice PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: WATCH STATISTICS SECTION */}
            {analyticsSubTab === 'watch_stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Daily Active Activity DAU Chart */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4 md:col-span-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Real-time Traffic Spike (DAU)</h3>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.dauHistory?.slice(-10) || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="date" stroke="#727272" fontSize={10} tickLine={false} />
                          <YAxis stroke="#727272" fontSize={10} tickLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="users" name="Active Viewers" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Device breakdown bar graph */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Viewer Device distribution</h3>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Smart TV', share: 45 },
                          { name: 'Mobile Web', share: 32 },
                          { name: 'Desktop Web', share: 15 },
                          { name: 'iPad / Tablets', share: 8 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                          <XAxis dataKey="name" stroke="#727272" fontSize={9} tickLine={false} />
                          <YAxis stroke="#727272" fontSize={9} tickLine={false} />
                          <Tooltip />
                          <Bar dataKey="share" fill="#ea580c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Retention Cohorts Matrix table */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase block">N-Day Subscriber Retention Matrix</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs font-mono">
                        <thead>
                          <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase">
                            <th className="py-2 text-left">Cohort Month</th>
                            <th className="py-2">Month 1</th>
                            <th className="py-2">Month 2</th>
                            <th className="py-2">Month 3</th>
                            <th className="py-2">Month 4</th>
                            <th className="py-2">Month 5</th>
                            <th className="py-2">Month 6</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850 text-neutral-300">
                          {[
                            { month: "Jan 2026", c: [100, 92, 85, 78, 72, 65] },
                            { month: "Feb 2026", c: [100, 90, 81, 75, 68, 61] },
                            { month: "Mar 2026", c: [100, 95, 87, 82, 79, 74] },
                            { month: "Apr 2026", c: [100, 88, 79, 72, 64, '-'] }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-neutral-900/30">
                              <td className="py-3 text-left font-semibold text-white font-sans">{row.month}</td>
                              {row.c.map((val, i) => (
                                <td 
                                  key={i} 
                                  className="py-3"
                                  style={{ backgroundColor: typeof val === 'number' ? `rgba(234, 88, 12, ${val / 400})` : 'transparent' }}
                                >
                                  {val}{typeof val === 'number' && "%"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Geographic Peak activity statistics */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase block">Regional Activity Feed</h3>
                    <div className="space-y-3.5">
                      {analytics.geographicData?.slice(0, 4).map((geo: any, idx: number) => (
                        <div key={idx} className="space-y-1 pb-1 border-b border-neutral-900">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-neutral-200">{geo.country}</span>
                            <span className="text-orange-400 font-mono">{geo.percentage}% Engagement</span>
                          </div>
                          <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full" style={{ width: `${geo.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: AD & COHORT ANALYTICS SECTION */}
            {analyticsSubTab === 'ads_analytics' && (
              <div className="space-y-6">
                {/* Real-time ad metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-1.5">
                    <span className="text-xs text-neutral-400 block font-semibold uppercase tracking-wider">Real-time Ad Revenue</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        Shs {((analytics.adEarnings || 0) + (analytics.totalAdImpressions || 0) * 250).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium">Ad-supported segment earnings calculated at Shs 250/impression.</p>
                  </div>

                  <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-1.5">
                    <span className="text-xs text-neutral-400 block font-semibold uppercase tracking-wider">Total Ad Impressions</span>
                    <div className="text-2xl font-black text-orange-400 font-mono">
                      {(analytics.totalAdImpressions || 0).toLocaleString()}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium">Total verified video roll impression pings in the database.</p>
                  </div>

                  <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-1.5">
                    <span className="text-xs text-neutral-400 block font-semibold uppercase tracking-wider">Active Campaigns</span>
                    <div className="text-2xl font-black text-purple-400 font-mono">
                      {(analytics.campaignStats || adCampaigns).filter((c: any) => c.status === "Active").length} Active
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium">Currently serving on ad-supported user streams.</p>
                  </div>

                  <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-1.5">
                    <span className="text-xs text-neutral-400 block font-semibold uppercase tracking-wider">Average Click-Through Rate</span>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {(() => {
                        const stats = analytics.campaignStats || [];
                        if (stats.length === 0) return "3.42%";
                        const avg = stats.reduce((acc: number, c: any) => acc + (c.ctr || 0), 0) / stats.length;
                        return `${avg.toFixed(2)}%`;
                      })()}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium">Average interaction percentage across all channels.</p>
                  </div>
                </div>

                {/* Main Visual Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Campaign Performance Chart */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 lg:col-span-2 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Campaign Performance Breakdown</h3>
                      <p className="text-[11px] text-neutral-500 font-medium">Impressions metric comparing active Uganda corporate marketing campaigns.</p>
                    </div>

                    <div className="h-64 w-full">
                      {analytics.campaignStats && analytics.campaignStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.campaignStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis dataKey="title" stroke="#737373" fontSize={9} tickLine={false} tickFormatter={(v) => v.split(' ')[0]} />
                            <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                            <Legend />
                            <Bar dataKey="impressions" name="Impressions" fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="clicks" name="Clicks" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-neutral-500">Loading campaign statistics...</div>
                      )}
                    </div>
                  </div>

                  {/* Brand Sponsorship Distribution */}
                  <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase block">Ad Revenue Share</h3>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(analytics.campaignStats || []).map((c: any) => ({
                              name: c.title.split(' ')[0],
                              value: c.earnings || (c.impressions * 250) || 500
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(analytics.campaignStats || []).map((entry: any, index: number) => {
                              const colors = ["#ea580c", "#f97316", "#fca5a5", "#a855f7", "#ec4899"];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip formatter={(val) => `Shs ${val?.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
                      {(analytics.campaignStats || []).map((c: any, index: number) => {
                        const colors = ["bg-orange-600", "bg-orange-500", "bg-red-300", "bg-purple-500", "bg-pink-500"];
                        return (
                          <div key={c.id} className="flex justify-between text-xs text-neutral-400">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded ${colors[index % colors.length]} block`}></span> 
                              {c.title.length > 20 ? `${c.title.substring(0, 20)}...` : c.title}
                            </span>
                            <strong className="text-white">Shs {((c.impressions * 250) || 0).toLocaleString()}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Movie Performance Table Section */}
                <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider block flex items-center gap-2">
                      <Film className="w-4 h-4 text-orange-500" /> Movie Performance: Revenue Breakdown
                    </h3>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Analyzes total views and verified ad completions to answer: <span className="text-orange-400 font-semibold italic">"Which movies actually make money?"</span>
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400">
                          <th className="py-3 px-4">Movie Title</th>
                          <th className="py-3 px-4 text-right">Views</th>
                          <th className="py-3 px-4 text-right">Ads Watched (3 required per view)</th>
                          <th className="py-3 px-4 text-right text-emerald-400">Gross Ad Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {(analytics.moviePerformance && analytics.moviePerformance.length > 0 ? analytics.moviePerformance : [
                          { title: "Fast X", views: 2300, adsWatched: 6900, revenue: 6900 * 250 },
                          { title: "Avatar", views: 1800, adsWatched: 5400, revenue: 5400 * 250 },
                          { title: "Peaky Blinders", views: 1200, adsWatched: 3600, revenue: 3600 * 250 },
                          { title: "The Witcher", views: 950, adsWatched: 2850, revenue: 2850 * 250 }
                        ]).map((mov: any, index: number) => (
                          <tr key={index} className="hover:bg-neutral-900/40 text-xs">
                            <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              <span>{mov.title}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-300">{(mov.views || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-300">{(mov.adsWatched || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                              Shs {(mov.revenue || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cohort Analytics Heatmap Visual */}
                <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Customer Cohort Retention Matrix</h3>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Heatmap showing monthly retention percentage across new subscription cohorts. High retention preserves customer lifetime value.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400">
                          <th className="py-3 px-4">Cohort Month</th>
                          <th className="py-3 px-4">Size</th>
                          <th className="py-3 px-4 text-center">Month 1</th>
                          <th className="py-3 px-4 text-center">Month 2</th>
                          <th className="py-3 px-4 text-center">Month 3</th>
                          <th className="py-3 px-4 text-center">Month 4</th>
                          <th className="py-3 px-4 text-center">Month 5</th>
                          <th className="py-3 px-4 text-center">Month 6</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {(analytics.retentionCohorts || [
                          { cohort: "Jan 2026", size: 5000, m1: 85, m2: 78, m3: 72, m4: 69, m5: 64, m6: 62 },
                          { cohort: "Feb 2026", size: 5500, m1: 87, m2: 80, m3: 75, m4: 70, m5: 66, m6: null },
                          { cohort: "Mar 2026", size: 6200, m1: 88, m2: 82, m3: 77, m4: 73, m5: null, m6: null },
                          { cohort: "Apr 2026", size: 6800, m1: 89, m2: 84, m3: 79, m4: null, m5: null, m6: null },
                          { cohort: "May 2026", size: 7500, m1: 91, m2: 86, m3: null, m4: null, m5: null, m6: null }
                        ]).map((cohort: any, idx: number) => {
                          const getHeatmapBg = (val: number | null) => {
                            if (val === null) return "bg-neutral-900 text-neutral-600";
                            if (val >= 85) return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
                            if (val >= 75) return "bg-teal-500/10 text-teal-300 border border-teal-500/20";
                            if (val >= 65) return "bg-orange-500/10 text-orange-300 border border-orange-500/20";
                            return "bg-rose-500/10 text-rose-300 border border-rose-500/20";
                          };

                          return (
                            <tr key={idx} className="hover:bg-neutral-900/40 text-xs">
                              <td className="py-3 px-4 font-bold text-white">{cohort.cohort}</td>
                              <td className="py-3 px-4 font-mono text-neutral-400">{cohort.size.toLocaleString()}</td>
                              {[cohort.m1, cohort.m2, cohort.m3, cohort.m4, cohort.m5, cohort.m6].map((mVal, mIdx) => (
                                <td key={mIdx} className="py-2.5 px-2 text-center">
                                  <div className={`py-1.5 rounded-lg text-center font-bold text-[11px] max-w-[64px] mx-auto ${getHeatmapBg(mVal)}`}>
                                    {mVal !== null ? `${mVal}%` : "-"}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sponsor Performance - Automatically Ranked */}
                <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider block flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500 animate-pulse" /> Sponsor Campaign Registry (Auto-Ranked)
                      </h3>
                      <p className="text-[11px] text-neutral-500 font-medium">Sponsors are ranked automatically based on Campaign Gross Revenue, featuring calculated per-unit value metrics.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400">
                          <th className="py-3 px-4">Rank / Campaign Title</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Impressions</th>
                          <th className="py-3 px-4 text-right">Clicks</th>
                          <th className="py-3 px-4 text-right">CTR</th>
                          <th className="py-3 px-4 text-right">Rev / Impression</th>
                          <th className="py-3 px-4 text-right">Rev / Click</th>
                          <th className="py-3 px-4 text-right text-emerald-400">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900">
                        {(analytics.campaignStats && analytics.campaignStats.length > 0 ? analytics.campaignStats : (adCampaigns || []).map((c: any) => {
                          const impressions = c.impressions || 1500;
                          const clicks = c.clicks || 45;
                          const earnings = (impressions * 250) + (clicks * 1200);
                          return {
                            id: c.id,
                            title: c.title,
                            type: c.type,
                            status: c.status,
                            impressions,
                            clicks,
                            earnings,
                            revPerImpression: parseFloat((earnings / impressions).toFixed(2)),
                            revPerClick: clicks > 0 ? parseFloat((earnings / clicks).toFixed(2)) : 0,
                            ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 3.12
                          };
                        }).sort((a: any, b: any) => b.earnings - a.earnings)).map((camp: any, index: number) => (
                          <tr key={camp.id} className="hover:bg-neutral-900/40 text-xs">
                            <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-amber-500 font-mono">
                                #{index + 1}
                              </span>
                              <span>{camp.title}</span>
                            </td>
                            <td className="py-3 px-4 text-neutral-400">{camp.type}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase inline-block ${
                                camp.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-neutral-800 text-neutral-500"
                              }`}>
                                {camp.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-300">{(camp.impressions || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-300">{(camp.clicks || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono font-bold text-orange-400">{camp.ctr}%</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-400">
                              Shs {camp.revPerImpression ? Math.round(camp.revPerImpression).toLocaleString() : "250"}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-400">
                              Shs {camp.revPerClick ? Math.round(camp.revPerClick).toLocaleString() : "0"}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                              Shs {(camp.earnings || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CONTENT & CATEGORY MANAGEMENT                      */}
        {/* ========================================================= */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT COLUMN: ACTIVE FILMS GRID & ADD BTN */}
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-neutral-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">Active Content Libraries</h2>
                    <p className="text-xs text-neutral-450 mt-1">Manage standard standalones and televised multi-season episode nodes.</p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-750 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all text-white cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> 
                    <span>Add New Movie / Series</span>
                  </button>
                </div>

                {/* VISUAL FORM DRAWER COOP */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-4 overflow-hidden"
                    >
                      <h3 className="text-xs font-bold tracking-widest text-orange-400 uppercase flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Create Cinematic Library Release
                      </h3>
                      <form onSubmit={handleAddMovieSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Content Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Flight of Sintel 2"
                            value={newMovieTitle}
                            onChange={(e) => setNewMovieTitle(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Catalog Category</label>
                          <select
                            value={newMovieType}
                            onChange={(e: any) => setNewMovieType(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          >
                            <option value="movie">Standalone Film</option>
                            <option value="series">Televised Series</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-neutral-400 mb-1">Synopsis / Storyline Outline *</label>
                          <textarea
                            required
                            placeholder="Provide deep description of the epic screenplay..."
                            value={newMovieSynopsis}
                            onChange={(e) => setNewMovieSynopsis(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white h-16 focus:outline-none"
                          />
                        </div>

                        {/* Interactive Genres Selector */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-neutral-400 mb-1 font-bold">Select Genres (Select Multiple)</label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {categories.map((c) => {
                              const active = newMovieGenres.includes(c.name);
                              return (
                                <button
                                  type="button"
                                  key={c.name}
                                  onClick={() => {
                                    if (active) {
                                      setNewMovieGenres(newMovieGenres.filter(g => g !== c.name));
                                    } else {
                                      setNewMovieGenres([...newMovieGenres, c.name]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                                    active 
                                      ? 'bg-orange-600 text-white shadow' 
                                      : 'bg-neutral-900 text-neutral-400 border border-neutral-850 hover:border-neutral-750'
                                  }`}
                                >
                                  {c.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Director</label>
                          <input
                            type="text"
                            placeholder="e.g. James Logan"
                            value={newMovieDirector}
                            onChange={(e) => setNewMovieDirector(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Runtime Length / Seasons count</label>
                          <input
                            type="text"
                            placeholder="e.g. 1h 45m or 3 Seasons"
                            value={newMovieRuntime}
                            onChange={(e) => setNewMovieRuntime(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Release Year</label>
                          <input
                            type="text"
                            placeholder="2026"
                            value={newMovieReleaseYear}
                            onChange={(e) => setNewMovieReleaseYear(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-neutral-400 mb-1">Maturity Rating Code</label>
                          <select
                            value={newMovieMaturity}
                            onChange={(e: any) => setNewMovieMaturity(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          >
                            <option value="G">G - General Audience</option>
                            <option value="PG">PG - Parental Guidance Suggested</option>
                            <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                            <option value="R">R - Restricted (18+)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800 my-2">
                          <div className="sm:col-span-2">
                            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">Translation & Soundtrack Settings</h4>
                            <p className="text-[10px] text-neutral-500">Choose if this is a local VJ translated video, or a pristine non-translated title.</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNewMovieIsTranslated(true);
                                if (newMovieLanguage === "English" || newMovieLanguage === "Original Soundtrack") {
                                  setNewMovieLanguage("Luganda (VJ Jingo)");
                                }
                              }}
                              className={`flex-1 p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                                newMovieIsTranslated 
                                  ? 'bg-orange-500/10 border-orange-500 text-white' 
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${newMovieIsTranslated ? 'border-orange-500' : 'border-neutral-600'}`}>
                                {newMovieIsTranslated && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-bold block">Translated Commentary</span>
                                <span className="text-[9px] text-neutral-400 block">Luganda VJ voiceover</span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setNewMovieIsTranslated(false);
                                if (newMovieLanguage.toLowerCase().includes("vj") || newMovieLanguage === "Luganda (VJ Jingo)") {
                                  setNewMovieLanguage("English");
                                }
                              }}
                              className={`flex-1 p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                                !newMovieIsTranslated 
                                  ? 'bg-orange-500/10 border-orange-500 text-white' 
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${!newMovieIsTranslated ? 'border-orange-500' : 'border-neutral-600'}`}>
                                {!newMovieIsTranslated && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                              </div>
                              <div className="text-left">
                                <span className="text-xs font-bold block">Non-Translated (Original)</span>
                                <span className="text-[9px] text-neutral-400 block">Pristine soundtrack</span>
                              </div>
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs text-neutral-400 mb-1">
                              {newMovieIsTranslated ? "Commentary / Translation Language *" : "Original Soundtrack Language *"}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={newMovieIsTranslated ? "e.g. Luganda (VJ Jingo)" : "e.g. English, Swahili"}
                              value={newMovieLanguage}
                              onChange={(e) => setNewMovieLanguage(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 text-xs px-3 py-2 rounded-lg text-white focus:border-orange-500/50 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs text-neutral-400 mb-1">Cast Members list (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="Sigourney Weaver, David Attenborough"
                            value={newMovieCast}
                            onChange={(e) => setNewMovieCast(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white"
                          />
                        </div>

                        {/* Direct Movie & Trailer Link Fields */}
                        <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-950/15 p-4 rounded-xl border border-orange-500/20">
                          <div className="sm:col-span-2">
                            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Cinematic stream connections</h4>
                            <p className="text-[10px] text-neutral-500">Provide direct stream access links to power playback on clients, browsers, and casting transcoders.</p>
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-450 font-black uppercase tracking-wider mb-1">Direct Movie File URL (mp4, mkv, hls, m3u8 etc.) *</label>
                            <input
                              type="text"
                              placeholder="e.g. movies/filename.mp4 or https://commondatastorage.googleapis.com/.../movie.mp4"
                              value={newMovieVideoUrl}
                              onChange={(e) => setNewMovieVideoUrl(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white focus:border-orange-500/50 focus:outline-none mb-2"
                            />
                            
                            <div className="flex items-center gap-2">
                              <input 
                                type="file" 
                                id="video-file-upload" 
                                className="hidden" 
                                accept="video/*" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleVideoFile(e.target.files[0]);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById("video-file-upload");
                                  if (input) (input as HTMLInputElement).click();
                                }}
                                disabled={isUploading["movies"]}
                                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-[10px] text-neutral-300 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isUploading["movies"] 
                                  ? `Uploading (${uploadProgress["movies"]}%)` 
                                  : `Upload Movie to ${storageStatus.provider === "R2" ? "Cloudflare R2" : storageStatus.provider === "B2" ? "Backblaze B2" : "Cloud Storage"}`}
                              </button>
                              {isUploading["movies"] && (
                                <span className="text-[10px] text-orange-400 font-mono font-bold animate-pulse">Uploading movie ({uploadProgress["movies"]}%)...</span>
                              )}
                              {!isUploading["movies"] && (newMovieVideoUrl.includes("backblazeb2") || newMovieVideoUrl.includes("r2.cloudflarestorage.com") || (!newMovieVideoUrl.startsWith("http") && newMovieVideoUrl)) && (
                                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">✓ Cloud Active</span>
                              )}
                            </div>
                            <span className="text-[9px] text-neutral-500 block mt-1 font-mono">Powers the main movie stream player. Defers to BigBuckBunny if blank.</span>
                          </div>

                          <div>
                            <label className="block text-xs text-neutral-450 font-black uppercase tracking-wider mb-1">Movie Trailer Video Link (URL)</label>
                            <input
                              type="text"
                              placeholder="e.g. trailers/filename.mp4 or https://commondatastorage.googleapis.com/.../trailer.mp4"
                              value={newMovieTrailerUrl}
                              onChange={(e) => setNewMovieTrailerUrl(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded-lg text-white focus:border-orange-500/50 focus:outline-none mb-2"
                            />

                            <div className="flex items-center gap-2">
                              <input 
                                type="file" 
                                id="trailer-file-upload" 
                                className="hidden" 
                                accept="video/*" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleTrailerFile(e.target.files[0]);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById("trailer-file-upload");
                                  if (input) (input as HTMLInputElement).click();
                                }}
                                disabled={isUploading["trailers"]}
                                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-[10px] text-neutral-300 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isUploading["trailers"] 
                                  ? `Uploading (${uploadProgress["trailers"]}%)` 
                                  : `Upload Trailer to ${storageStatus.provider === "R2" ? "Cloudflare R2" : storageStatus.provider === "B2" ? "Backblaze B2" : "Cloud Storage"}`}
                              </button>
                              {isUploading["trailers"] && (
                                <span className="text-[10px] text-orange-400 font-mono font-bold animate-pulse">Uploading trailer ({uploadProgress["trailers"]}%)...</span>
                              )}
                              {!isUploading["trailers"] && (newMovieTrailerUrl.includes("backblazeb2") || newMovieTrailerUrl.includes("r2.cloudflarestorage.com") || (!newMovieTrailerUrl.startsWith("http") && newMovieTrailerUrl)) && (
                                <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">✓ Cloud Active</span>
                              )}
                            </div>
                            <span className="text-[9px] text-neutral-550 block mt-1 font-mono">Powers background trailers and quick teasers.</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Poster Upload Column */}
                          <div className="space-y-2">
                            <label className="block text-xs text-neutral-450 font-black uppercase tracking-wider">Cover Poster Image</label>
                            
                            <div 
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragOverPoster(true);
                              }}
                              onDragLeave={() => setIsDragOverPoster(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverPoster(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                  handlePosterFile(e.dataTransfer.files[0]);
                                }
                              }}
                              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative group overflow-hidden ${
                                isDragOverPoster 
                                  ? "border-orange-500 bg-orange-950/20" 
                                  : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/60"
                              }`}
                              style={{ minHeight: "135px" }}
                              onClick={() => {
                                const input = document.getElementById("poster-file-upload");
                                if (input) (input as HTMLInputElement).click();
                              }}
                            >
                              <input 
                                type="file" 
                                id="poster-file-upload" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handlePosterFile(e.target.files[0]);
                                  }
                                }}
                              />
                              {isUploading["posters"] ? (
                                <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center gap-3 p-4 z-20">
                                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-white">
                                      Uploading to {storageStatus.provider === "R2" ? "Cloudflare R2" : storageStatus.provider === "B2" ? "Backblaze B2" : "Cloud Storage"}...
                                    </p>
                                    <p className="text-[10px] text-neutral-400 font-mono mt-1">{uploadProgress["posters"]}%</p>
                                  </div>
                                  <div className="w-24 bg-neutral-850 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress["posters"]}%` }} />
                                  </div>
                                </div>
                              ) : newMoviePosterUrl ? (
                                <div className="absolute inset-0 w-full h-full bg-black/50 group-hover:bg-black/70 flex flex-col items-center justify-center gap-1.5 transition-all text-white p-2">
                                  <img 
                                    src={resolveUrl(newMoviePosterUrl)} 
                                    alt="Poster Preview" 
                                    className="absolute inset-0 w-full h-full object-cover z-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-neutral-950/85 border-t border-neutral-800 py-2 px-3 z-10 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1">
                                      <Upload className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                                      <span className="text-[10px] font-bold text-orange-400">Poster Selected (Click to change)</span>
                                    </div>
                                    <span className="text-[8px] text-neutral-400 font-mono mt-0.5 truncate max-w-full">
                                      {newMoviePosterUrl.includes("backblazeb2") || newMoviePosterUrl.includes("r2.cloudflarestorage.com") || !newMoviePosterUrl.startsWith("http")
                                        ? `Hosted on ${storageStatus.provider === "R2" ? "Cloudflare R2" : storageStatus.provider === "B2" ? "Backblaze B2" : "Cloud Storage"}`
                                        : "Custom Direct URL"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-7 h-7 text-neutral-500 group-hover:text-orange-400 transition-colors animate-pulse" />
                                  <div className="space-y-0.5">
                                    <p className="text-[11px] font-bold text-neutral-300">Drag & drop poster, or <span className="text-orange-400 hover:underline">browse</span></p>
                                    <p className="text-[9px] text-neutral-550 font-mono">Supports PNG, JPEG up to 5MB</p>
                                  </div>
                                </>
                              )}
                            </div>

                            <input
                              type="text"
                              placeholder="Or paste custom poster image URL..."
                              value={newMoviePosterUrl.startsWith("data:") ? "" : newMoviePosterUrl}
                              onChange={(e) => setNewMoviePosterUrl(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 text-[10px] px-3 py-1.5 rounded-lg text-white"
                            />
                          </div>

                          {/* Hero Banner Upload Column */}
                          <div className="space-y-2">
                            <label className="block text-xs text-neutral-450 font-black uppercase tracking-wider">Wide Hero Banner</label>
                            
                            <div 
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragOverBanner(true);
                              }}
                              onDragLeave={() => setIsDragOverBanner(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOverBanner(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                  handleBannerFile(e.dataTransfer.files[0]);
                                }
                              }}
                              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative group overflow-hidden ${
                                isDragOverBanner 
                                  ? "border-orange-500 bg-orange-950/20" 
                                  : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/60"
                              }`}
                              style={{ minHeight: "135px" }}
                              onClick={() => {
                                const input = document.getElementById("banner-file-upload");
                                if (input) (input as HTMLInputElement).click();
                              }}
                            >
                              <input 
                                type="file" 
                                id="banner-file-upload" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleBannerFile(e.target.files[0]);
                                  }
                                }}
                              />
                              {isUploading["banners"] ? (
                                <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center gap-3 p-4 z-20">
                                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-white">
                                      Uploading to {storageStatus.provider === "R2" ? "Cloudflare R2" : storageStatus.provider === "B2" ? "Backblaze B2" : "Cloud Storage"}...
                                    </p>
                                    <p className="text-[10px] text-neutral-400 font-mono mt-1">{uploadProgress["banners"]}%</p>
                                  </div>
                                  <div className="w-24 bg-neutral-850 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress["banners"]}%` }} />
                                  </div>
                                </div>
                              ) : newMovieBannerUrl ? (
                                <div className="absolute inset-0 w-full h-full bg-black/50 group-hover:bg-black/70 flex flex-col items-center justify-center gap-1.5 transition-all text-white p-2">
                                  <img 
                                    src={resolveUrl(newMovieBannerUrl)} 
                                    alt="Banner Preview" 
                                    className="absolute inset-0 w-full h-full object-cover z-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-neutral-950/85 border-t border-neutral-800 py-2 px-3 z-10 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1">
                                      <Upload className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                                      <span className="text-[10px] font-bold text-orange-400">Banner Selected (Click to change)</span>
                                    </div>
                                    <span className="text-[8px] text-neutral-400 font-mono mt-0.5 truncate max-w-full">
                                      {newMovieBannerUrl.includes("backblazeb2") || newMovieBannerUrl.includes("r2.cloudflarestorage.com") || !newMovieBannerUrl.startsWith("http")
                                        ? `Hosted on ${storageStatus.provider === "R2" ? "Cloudflare R2" : storageStatus.provider === "B2" ? "Backblaze B2" : "Cloud Storage"}`
                                        : "Custom Direct URL"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-7 h-7 text-neutral-500 group-hover:text-orange-400 transition-colors animate-pulse" />
                                  <div className="space-y-0.5">
                                    <p className="text-[11px] font-bold text-neutral-300">Drag & drop banner, or <span className="text-orange-400 hover:underline">browse</span></p>
                                    <p className="text-[9px] text-neutral-550 font-mono">Supports PNG, JPEG up to 5MB</p>
                                  </div>
                                </>
                              )}
                            </div>

                            <input
                              type="text"
                              placeholder="Or paste custom wide banner URL..."
                              value={newMovieBannerUrl.startsWith("data:") ? "" : newMovieBannerUrl}
                              onChange={(e) => setNewMovieBannerUrl(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 text-[10px] px-3 py-1.5 rounded-lg text-white"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-2.5 pt-3 border-t border-neutral-900">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-neutral-900 text-xs font-bold rounded-lg hover:bg-neutral-850 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-xs font-black rounded-lg text-white cursor-pointer"
                          >
                            Compile Movie & Begin Transcoding
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* DATA TABLE */}
                <div className="overflow-x-auto rounded-2xl border border-neutral-850 bg-neutral-950/80">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-neutral-900 text-[10px] text-neutral-400 uppercase tracking-widest border-b border-neutral-850">
                      <tr>
                        <th className="px-4 py-3">Cinematic Title</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Genres Associated</th>
                        <th className="px-4 py-3">Rating / Votes</th>
                        <th className="px-4 py-3">Platform Views</th>
                        <th className="px-4 py-3 text-right">Flush</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 text-neutral-300">
                      {movies.map((m) => (
                        <tr key={m.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-4 py-3 flex items-center gap-3">
                            <img 
                              src={resolveUrl(m.posterUrl)} 
                              alt="" 
                              className="w-8 h-12 object-cover rounded border border-neutral-800"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <strong className="block text-white font-bold">{m.title}</strong>
                              <span className="text-[10px] text-neutral-400 italic">Dir: {m.director} • M-Rate: {m.maturityRating || "G"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                              m.type === 'series' 
                                ? 'bg-purple-950/50 text-purple-400 border-purple-900/40' 
                                : 'bg-orange-955/20 text-orange-400 border-orange-900/30'
                            }`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[10px] text-neutral-400">
                            {m.genres.slice(0, 3).join(", ")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-amber-400 font-bold">★ {m.rating}</span>
                            <span className="text-[10px] text-neutral-450 block font-mono">{m.votesCount?.toLocaleString()} votes</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-white tracking-wider tabular-nums">
                            {m.views?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteMovie(m.id, m.title)}
                              className="p-2 bg-red-950/20 hover:bg-red-950 border border-red-900/10 hover:border-red-900 hover:text-white transition-all text-red-400 rounded-lg cursor-pointer"
                              title="Delete from catalogue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT COLUMN: CATEGORIES MANAGEMENT & TV EPISODES MANAGER */}
              <div className="w-full lg:w-96 space-y-6">
                
                {/* 1. Category/Genre Custom Manager */}
                <div className="bg-neutral-950/80 p-5 rounded-2xl border border-neutral-800 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                      <Grid className="w-4 h-4" /> Category management
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-1">Configure user-defined classification tag categories.</p>
                  </div>

                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="New category..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs px-2.5 py-1.5 rounded focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-orange-600 text-xs font-bold rounded text-white hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <div key={cat.name} className="flex justify-between items-center bg-neutral-900/60 p-2 rounded border border-neutral-850/40 text-xs">
                        <span className="font-semibold text-neutral-200">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-neutral-450 font-mono italic">{cat.movieCount} films</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.name)}
                            className="text-neutral-500 hover:text-red-400 font-bold transition-all text-[11px] px-1 cursor-pointer"
                            title="Remove Category"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. televised series episode control suite */}
                <div className="bg-neutral-950/80 p-5 rounded-2xl border border-neutral-800 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                      <MonitorPlay className="w-4 h-4" /> TV Episode Injector
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-1">Broadcast new televised nodes on existing multi-season televised platforms.</p>
                  </div>

                  <form onSubmit={handleAddEpisodeSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Select Active Series *</label>
                      <select
                        value={selectedSeriesForEpisodes}
                        onChange={(e) => setSelectedSeriesForEpisodes(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 rounded-lg text-white"
                      >
                        {movies.filter(m => m.type === 'series').map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Season</label>
                        <input
                          type="number"
                          value={newEpSeason}
                          onChange={(e) => setNewEpSeason(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Episode #</label>
                        <input
                          type="number"
                          value={newEpNumber}
                          onChange={(e) => setNewEpNumber(Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 rounded text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Episode Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Heartwood Echoes"
                        value={newEpTitle}
                        onChange={(e) => setNewEpTitle(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 rounded text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Duration</label>
                        <input
                          type="text"
                          value={newEpDuration}
                          onChange={(e) => setNewEpDuration(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1.5 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Video Stream Type</label>
                        <span className="text-[9px] bg-purple-950/10 text-purple-400 border border-purple-900/30 px-2 py-1 rounded block text-center font-bold">Standard CDN Loop</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">Episode Synopsis</label>
                      <textarea
                        placeholder="Explain the narrative twist..."
                        value={newEpSynopsis}
                        onChange={(e) => setNewEpSynopsis(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-xs p-1 rounded text-white h-12 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-xs font-black rounded-lg text-white transition-colors mt-2 cursor-pointer"
                    >
                      Broadcast Episode Node
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACCOUNT MODERATION, CRM & ROLE PERMISSIONS         */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* INTERACTIVE Account CRM List */}
              <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Subscriber CRM Management</h3>
                    <p className="text-[11px] text-neutral-500 mt-1">Secure security profiles, modify tier plans, and reassign core clearance ratings.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={userStatusFilter}
                      onChange={(e: any) => setUserStatusFilter(e.target.value)}
                      className="bg-neutral-900 border border-neutral-850 text-xs px-2.5 py-1.5 rounded text-neutral-300"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Active">Active Only</option>
                      <option value="Suspended">Suspended Only</option>
                    </select>
                  </div>
                </div>

                {/* SEARCH BAR */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or active department role..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-850 py-2.5 pl-10 pr-4 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-3.5">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-neutral-900/60 border border-neutral-850/50 rounded-xl gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <strong className="text-sm font-bold text-white">{user.name}</strong>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            user.role === 'Administrator' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/15' 
                              : user.role === 'Content Moderator'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">{user.email} • Plan: <span className="text-orange-400 font-semibold">{user.plan}</span></p>
                        <p className="text-[10px] text-neutral-500">Parental Restriction: <strong className="text-neutral-450 uppercase">{user.maxRating} Rating Ceiling</strong></p>
                      </div>

                      {/* ACTIONS ROW */}
                      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                        {/* Change clearances */}
                        <select
                          value={user.role}
                          onChange={(e) => handleAssignRole(user.id, e.target.value, user.name)}
                          className="bg-neutral-950 border border-neutral-800 text-[10px] p-1.5 rounded text-neutral-300 font-bold"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Content Moderator">Content Moderator</option>
                          <option value="Support Agent">Support Agent</option>
                          <option value="VIP Subscriber">VIP Subscriber</option>
                        </select>

                        {/* Mod-Edit user button */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1 px-2.5 bg-neutral-950 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800 transition-all rounded text-[10px] font-bold cursor-pointer"
                        >
                          Modify Details
                        </button>

                        {/* Suspension Toggle */}
                        <button
                          onClick={() => toggleUserStatus(user.id, user.email)}
                          className={`p-1.5 px-3 rounded text-[10px] font-bold tracking-wide cursor-pointer ${
                            user.status === 'Active' 
                              ? 'bg-red-650 text-white hover:bg-red-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {user.status === 'Active' ? 'Ban Client' : 'Lift Suspension'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PLATFORM-WIDE PARENTAL CONTROL CARD */}
              <div className="bg-neutral-950/85 p-6 rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-orange-400" /> Platform Parental Guardianship
                  </h3>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/15 px-2 py-0.5 rounded-full font-mono font-bold uppercase animate-pulse">ADMIN GATES</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  When enabled, enforces profile restriction ceilings, hides inappropriate movies under restricted tiers, and activates the secure PIN verification layer across all sub-profiles.
                </p>
                <div className="flex items-center justify-between p-3.5 bg-neutral-900/60 border border-neutral-850 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Parental Setting Gate</span>
                    <span className="text-[10px] text-neutral-500 font-medium font-mono">Status: {parentalSettingsActive ? 'ACTIVATED & PROTECTED' : 'DISABLED'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = !parentalSettingsActive;
                      try {
                        const res = await fetch("/api/parental-settings", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ enabled: updated })
                        });
                        if (res.ok) {
                          setParentalSettingsActive(updated);
                          appendAuditLog(
                            `${updated ? 'Activated' : 'Disabled'} platform-wide parental setting guardianship restriction ceiling.`,
                            "SECURITY",
                            updated ? "SUCCESS" : "WARNING"
                          );
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      parentalSettingsActive
                        ? 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${parentalSettingsActive ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                    {parentalSettingsActive ? "ACTIVE" : "INACTIVE"}
                  </button>
                </div>
              </div>

              {/* ROLE PERMISSIONS GRID */}
              <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                    <Shield className="w-4 h-4" /> Role permissions
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Granular authorization permissions matrix for simulated staff classes.</p>
                </div>

                <div className="space-y-4">
                  {rolePermissions.map((perm) => (
                    <div key={perm.id} className="p-3 bg-neutral-900/70 border border-neutral-850 rounded-xl space-y-2.5">
                      <span className="text-xs font-bold text-neutral-250 block">{perm.permissionName}</span>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {[
                          { key: 'Administrator', label: 'Admin' },
                          { key: 'ContentModerator', label: 'Moderator' },
                          { key: 'SupportAgent', label: 'Support' },
                          { key: 'VipSubscriber', label: 'Viewer VIP' }
                        ].map((role) => {
                          const value = perm[role.key];
                          return (
                            <button
                              key={role.key}
                              type="button"
                              onClick={() => handleTogglePermission(perm.id, role.key as any, perm.permissionName)}
                              className={`p-1.5 rounded flex items-center justify-between border cursor-pointer ${
                                value 
                                  ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-400 font-bold' 
                                  : 'bg-neutral-950/60 border-neutral-850/85 text-neutral-500'
                              }`}
                            >
                              <span>{role.label}</span>
                              <span className="font-mono text-[9px]">{value ? 'ON' : 'OFF'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* MODULAR USER EDITOR DRAWER */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl w-full max-w-md space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
                    <strong className="text-sm font-bold text-white uppercase">Modify Profile Credentials</strong>
                    <button onClick={() => setEditingUser(null)} className="text-neutral-500 hover:text-white font-bold cursor-pointer">×</button>
                  </div>

                  <form onSubmit={handleSaveUserEdits} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-1">Full Profile Name</label>
                      <input
                        type="text"
                        required
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Secure Billing Email</label>
                      <input
                        type="email"
                        required
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-neutral-400 mb-1">Assigned Tier Plan</label>
                        <select
                          value={editingUser.plan}
                          onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white"
                        >
                          <option value="Empire Family Pack">Empire Family Pack</option>
                          <option value="Premium Solitary">Premium Solitary</option>
                          <option value="Free Ad-Supported">Free Ad-Supported</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Parental Certificate Ceiling</label>
                        <select
                          value={editingUser.maxRating}
                          onChange={(e) => setEditingUser({ ...editingUser, maxRating: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white"
                        >
                          <option value="All">Unrestricted (All)</option>
                          <option value="R">Restricted (R)</option>
                          <option value="PG-13">Teenager (PG-13)</option>
                          <option value="PG">Parental Guidance (PG)</option>
                          <option value="G">Kids Friendly (G)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-900">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 bg-neutral-900 rounded font-bold hover:bg-neutral-850"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded cursor-pointer"
                      >
                        Save Secure Overrides
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
            
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ADVERTISEMENT MANAGEMENT                           */}
        {/* ========================================================= */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* ADS COMPLAINCE PANEL */}
              <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 lg:col-span-2 space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-2 pb-3 border-b border-neutral-900">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase block">Advertisement configuration</h3>
                    <p className="text-[11px] text-neutral-500 mt-1">Regulate programmatic monetization triggers across non-paying streaming tiers.</p>
                  </div>

                  <button
                    onClick={handleToggleGlobalAds}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      adsEnabled 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-red-950 text-red-400 border border-red-900/40'
                    }`}
                  >
                    {adsEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{adsEnabled ? "Ad Server: ENABLED" : "Ad Server: PAUSED"}</span>
                  </button>
                </div>

                {/* AD FREQUENCY SLIDER CONTROL */}
                <div className="bg-neutral-900/40 p-4 border border-neutral-850 rounded-xl space-y-2.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-neutral-300">Continuous Block Ad Frequency Break</span>
                    <span className="text-orange-400 font-mono">Every {adFrequency} minutes</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="5"
                    value={adFrequency}
                    onChange={(e) => handleUpdateAdFrequency(Number(e.target.value))}
                    className="w-full accent-orange-600 select-all"
                  />
                  <span className="text-[9px] text-neutral-500 block">Restricts maximum volume flow to ensure compliance with international standard broadcasting guidelines.</span>
                </div>

                {/* GOOGLE MONETIZATION INTEGRATION SUITE */}
                <div className="bg-neutral-900/60 p-5 border border-neutral-800 rounded-2xl space-y-5">
                  <div className="flex justify-between items-center border-b border-neutral-850 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono">Google Monetization Suite</h4>
                      <p className="text-[10px] text-neutral-400">Manage official Google AdSense Web Banners and Google AdMob Mobile App Wrappers.</p>
                    </div>
                    <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold uppercase px-2.5 py-1 rounded-full animate-pulse">
                      Live SDK Simulator
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* GOOGLE ADSENSE CARD */}
                    <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-black text-white">Google AdSense (Web)</span>
                        </div>
                        <button
                          onClick={() => handleSaveGoogleAdsSettings({ adsenseEnabled: !adsenseEnabled })}
                          className={`text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                            adsenseEnabled ? 'bg-purple-650 text-white' : 'bg-neutral-900 text-neutral-500 border border-neutral-850'
                          }`}
                        >
                          {adsenseEnabled ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-1">Publisher ID</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={adsensePublisherId}
                              onChange={(e) => setAdsensePublisherId(e.target.value)}
                              className="bg-neutral-900 border border-neutral-850 p-1.5 rounded text-[11px] text-white font-mono flex-1 focus:outline-none focus:border-purple-500"
                              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                            />
                            <button
                              onClick={() => handleSaveGoogleAdsSettings({ adsensePublisherId })}
                              className="px-2.5 py-1 bg-purple-650 hover:bg-purple-600 text-white text-[10px] font-bold rounded cursor-pointer transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
                          <div>
                            <span className="text-neutral-500 block text-[9px]">Estimated Earnings</span>
                            <span className="text-purple-400 font-black">Shs {adsenseEarnings.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[9px]">Average Page RPM</span>
                            <span className="text-white font-bold">Shs 4,200</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerSimulateAdEarnings('adsense')}
                          className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 transition-all cursor-pointer text-center"
                        >
                          ⚡ Simulate User AdSense Click (+Shs)
                        </button>
                      </div>
                    </div>

                    {/* GOOGLE ADMOB CARD */}
                    <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-black text-white">Google AdMob (Mobile)</span>
                        </div>
                        <button
                          onClick={() => handleSaveGoogleAdsSettings({ admobEnabled: !admobEnabled })}
                          className={`text-[10px] font-bold px-2 py-1 rounded transition-all cursor-pointer ${
                            admobEnabled ? 'bg-purple-650 text-white' : 'bg-neutral-900 text-neutral-500 border border-neutral-850'
                          }`}
                        >
                          {admobEnabled ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 gap-2.5">
                          <div>
                            <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-0.5">AdMob App ID</label>
                            <input
                              type="text"
                              value={admobAppId}
                              onChange={(e) => setAdmobAppId(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-850 p-1.5 rounded text-[10px] text-white font-mono focus:outline-none focus:border-purple-500"
                              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXXXXXXXX"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-0.5">Banner Unit ID</label>
                              <input
                                type="text"
                                value={admobBannerUnitId}
                                onChange={(e) => setAdmobBannerUnitId(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-850 p-1.5 rounded text-[10px] text-white font-mono focus:outline-none focus:border-purple-500"
                                placeholder="ca-app-pub-XXX/XXX"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-neutral-500 uppercase font-mono mb-0.5">Rewarded Unit ID</label>
                              <input
                                type="text"
                                value={admobRewardedUnitId}
                                onChange={(e) => setAdmobRewardedUnitId(e.target.value)}
                                className="w-full bg-neutral-900 border border-neutral-850 p-1.5 rounded text-[10px] text-white font-mono focus:outline-none focus:border-purple-500"
                                placeholder="ca-app-pub-XXX/XXX"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center gap-2">
                          <button
                            onClick={() => handleSaveGoogleAdsSettings({ admobAppId, admobBannerUnitId, admobRewardedUnitId })}
                            className="flex-1 py-1.5 bg-purple-650 hover:bg-purple-650 text-white text-[10px] font-bold rounded cursor-pointer transition-all text-center"
                          >
                            Save AdMob Setup
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850">
                          <div>
                            <span className="text-neutral-500 block text-[9px]">Estimated Earnings</span>
                            <span className="text-purple-400 font-black">Shs {admobEarnings.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[9px]">Average eCPM</span>
                            <span className="text-white font-bold">Shs 8,500</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerSimulateAdEarnings('admob')}
                          className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 transition-all cursor-pointer text-center"
                        >
                          ⚡ Simulate User Rewarded Ad View (+Shs)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AD CAMPAIGNS LIST */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-neutral-450 uppercase tracking-widest">Active Ad placement campaigns</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adCampaigns.map((ad) => (
                      <div key={ad.id} className="bg-neutral-900 border border-neutral-850 p-4 rounded-xl space-y-3 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-xs text-white block font-bold">{ad.title}</strong>
                            <span className="text-[9px] text-orange-400 uppercase font-mono font-bold tracking-wide">{ad.type}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            ad.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-950 text-neutral-550 border border-neutral-900'
                          }`}>
                            {ad.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-neutral-950 p-2 rounded border border-neutral-900 font-mono">
                          <div>
                            <span className="text-neutral-500 block">Impressions</span>
                            <span className="text-white font-bold">{ad.impressions?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block">CTR clicks</span>
                            <span className="text-white font-bold">{ad.clicks?.toLocaleString()} ({Math.round((ad.clicks / (ad.impressions || 1)) * 100)}%)</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] text-neutral-500 italic">Freq: {ad.triggerFreq}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleAdStatus(ad.id, ad.title)}
                              className="text-[10px] font-bold px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded cursor-pointer"
                            >
                              {ad.status === 'Active' ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteAdCampaign(ad.id, ad.title)}
                              className="p-1 bg-red-950/20 text-red-400 hover:text-white rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* REGISTER AD Form */}
              <div className="bg-neutral-950/80 p-6 rounded-2xl border border-neutral-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-900 pb-2">
                    <Megaphone className="w-4 h-4 text-orange-500 animate-bounce" /> Dispatch Ad Campaign
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Inject programmatic targets directly into streaming feed slots.</p>
                </div>

                <form onSubmit={handleAddAdCampaign} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">Brand Campaign Label *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanbic Mobile Cash loan"
                      value={newAdTitle}
                      onChange={(e) => setNewAdTitle(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Custom Ad destination URL / Target video URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/bannermedia"
                      value={newAdUrl}
                      onChange={(e) => setNewAdUrl(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-400 mb-1">Creative Placement</label>
                      <select
                        value={newAdType}
                        onChange={(e) => setNewAdType(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white"
                      >
                        <option value="Video Roll">Video Roll</option>
                        <option value="Overlay Banner">Overlay Banner</option>
                        <option value="Pre-roll sponsor">Pre-roll sponsor</option>
                        <option value="Billboard Slider">Billboard Slider</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Trigger triggerFreq</label>
                      <select
                        value={newAdFreq}
                        onChange={(e) => setNewAdFreq(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded text-white"
                      >
                        <option value="Every 2 Episodes">Every 2 Episodes</option>
                        <option value="On Pause">On Pause</option>
                        <option value="Before video start">Before video start</option>
                        <option value="Time loop (15 min)">Time loop (15 min)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-lg transition-all pt-2.5 cursor-pointer text-xs"
                  >
                    Deploy Marketing Campaign Slot
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: BROADCAST NOTIFICATIONS & PUSH CAMPAIGNS           */}
        {/* ========================================================= */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-4">
              <div className="border-b border-neutral-900 pb-3">
                <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-5 h-5 animate-pulse" /> Notification broadcast dispatcher
                </h3>
                <p className="text-[10px] text-neutral-550 mt-1">Publishes real-time overlay notifications targeting client home feeds.</p>
              </div>

              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Broadcast Alert Notification Text *</label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    placeholder="e.g. Immersive 4K update! Tears of Steel is now screening Ad-Free for Empire Pack subscribers."
                    value={newAnnouncementText}
                    onChange={(e) => setNewAnnouncementText(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1">
                    <span>140 characters limit strictly compliant.</span>
                    <span className="font-mono">{newAnnouncementText.length}/140 chars</span>
                  </div>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">Target Segment Restricted:</span>
                    <select
                      value={announcementTarget}
                      onChange={(e: any) => setAnnouncementTarget(e.target.value)}
                      className="bg-neutral-900 border border-neutral-800 text-[10px] p-2 rounded text-neutral-300 font-bold"
                    >
                      <option value="All">All Audiences (Worldwide)</option>
                      <option value="Premium">VIP Premier & Family tier Only</option>
                      <option value="Free">Free ad-supported users Only</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-xs font-black rounded-xl text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Broadcast Push Notification
                  </button>
                </div>
              </form>
            </div>

            {/* Broadcast lists log */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-neutral-450 uppercase tracking-widest pl-1">Active streaming alert notices</h4>
              {announcements.length === 0 ? (
                <div className="p-8 bg-neutral-950/40 rounded-xl text-center text-xs text-neutral-500 border border-neutral-850">
                  No alerts deployed. Clients are streaming without promotional notifications.
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-neutral-950/80 border border-neutral-850 rounded-xl flex justify-between items-center gap-3">
                      <div className="space-y-1">
                        <p className="text-neutral-220 text-xs sm:text-sm font-semibold">"{ann.text}"</p>
                        <span className="text-[9px] text-neutral-500 font-mono block">Node ID: {ann.id} • Posted on: {ann.date || "Just Now"}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id, ann.text)}
                        className="p-1 px-3 bg-red-950/20 hover:bg-neutral-800 hover:text-white border border-neutral-800 rounded text-red-400 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Dismiss Notice
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CRYPTO GRAPHIC PLATFORM AUDIT LOGS                 */}
        {/* ========================================================= */}
        {activeTab === 'audit_log' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider block">Cronographic Audit security log</h3>
                <p className="text-[11px] text-neutral-550 mt-1">Chronological metadata tracing all state updates, transcoder events, marketing, and pricing changes.</p>
              </div>

              <button
                onClick={() => {
                  setAuditLogs([]);
                  appendAuditLog("Cleared system action logs manually", "SYSTEM", "WARNING");
                }}
                className="bg-neutral-950 hover:bg-red-950 hover:border-red-900/60 hover:text-red-300 border border-neutral-800 transition-all text-[10px] font-bold px-3 py-1.5 rounded cursor-pointer"
              >
                Clear log matrix
              </button>
            </div>

            {/* BAR FILTER */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter logs by any text action or username..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 py-2 pl-9 pr-4 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <select
                value={logFilterCategory}
                onChange={(e) => setLogFilterCategory(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-xs px-3 rounded-xl py-2 text-neutral-300 font-semibold"
              >
                <option value="All">All classifications</option>
                <option value="CONTENT">CONTENT</option>
                <option value="MODERATION">MODERATION</option>
                <option value="TRANSCODER">TRANSCODER</option>
                <option value="MARKETING">MARKETING</option>
                <option value="PRICING">PRICING</option>
                <option value="SYSTEM">SYSTEM</option>
                <option value="AUTHENTICATION">AUTHENTICATION</option>
              </select>
            </div>

            {/* Audit list log outputs */}
            <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="p-3 bg-neutral-900 border-b border-neutral-800 flex items-center gap-1.5 text-[10px] font-mono text-neutral-450 uppercase tracking-wider font-semibold">
                <Terminal className="w-3.5 h-3.5 text-orange-500" />
                <span>Console stdout stream</span>
              </div>

              <div className="divide-y divide-neutral-900 max-h-[480px] overflow-y-auto font-mono text-xs max-w-full">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-12 text-center text-neutral-500 italic">
                    Console stream completely empty. Ready to record platform actions.
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 hover:bg-neutral-900/30 transition-colors">
                      <div className="flex items-start md:items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                          log.status === 'INFO' ? 'bg-indigo-500/10 text-indigo-400' :
                          log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-red-500/10 text-red-500 animate-pulse'
                        }`}>
                          {log.status}
                        </span>

                        <span className="text-[10px] bg-neutral-900 text-neutral-450 border border-neutral-850 px-1.5 py-0.5 rounded">
                          {log.category}
                        </span>

                        <span className="text-neutral-250 leading-relaxed font-sans">{log.action}</span>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 text-[10px] text-neutral-500 self-stretch md:self-auto border-t md:border-t-0 border-neutral-900/60 pt-2 md:pt-0">
                        <span>User: <strong className="text-neutral-400 font-sans">@{log.user.split(" ")[0]}</strong></span>
                        <span className="font-mono text-neutral-550">{log.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
