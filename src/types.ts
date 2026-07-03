/**
 * Types definition file for Kwatch Movies platform.
 */

export interface Episode {
  id: string;
  title: string;
  season: number;
  episodeNumber: number;
  synopsis: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
}

export type ContentGenre = 
  | 'Action' 
  | 'Comedy' 
  | 'Drama' 
  | 'Horror' 
  | 'Romance' 
  | 'Sci-Fi' 
  | 'Adventure' 
  | 'Animation' 
  | 'Documentary' 
  | 'Family'
  | 'Thriller'
  | 'Crime'
  | 'Fantasy';

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  timestamp: string;
  likes: number;
  dislikes: number;
}

export interface Movie {
  id: string;
  title: string;
  type: 'movie' | 'series';
  synopsis: string;
  posterUrl: string;
  bannerUrl: string;
  trailerUrl: string;
  videoUrl: string;
  genres: ContentGenre[];
  cast: string[];
  director: string;
  rating: number; // e.g. 4.8
  votesCount: number;
  releaseDate: string;
  runtime: string; // e.g., "2h 15m" or "3 Seasons"
  seasonsCount?: number;
  episodes?: Episode[];
  isTrending?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  views: number;
  reviews: Review[];
  maturityRating?: 'G' | 'PG' | 'PG-13' | 'R'; // e.g. G, PG, PG-13, R
  country?: string;
  language?: string; // language selection for the content
  isTranslated?: boolean; // indicates if translation/commentary (like Luganda VJ commentary) is included
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  isKids: boolean;
  pinCode?: string; // profile lock pin
  maxMaturityRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'All'; // maturity ceilings
  watchlist: string[]; // movie IDs
  favorites: string[]; // movie IDs
  recentlyWatched: { movieId: string; watchedAt: string; progress: number; timestamp?: number; duration?: number }[];
  isVerified?: boolean; // verified creator account indicator
  primaryColor?: string; // custom primary brand color theme (e.g. HEX or tailwind-friendly text code)
}

export interface UserAccount {
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  billingPeriod: string;
  benefits: string[];
  badgeColor: string;
}

export interface CommentMessage {
  id: string;
  userName: string;
  avatar: string;
  text: string;
  timestamp: string;
  isActivePartyMessage?: boolean;
}

export interface TranscodingJob {
  id: string;
  movieTitle: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resolution: string;
  startedAt: string;
}

export interface AnalyticsSummary {
  dailyUsers: number;
  monthlyUsers: number;
  watchTimeHours: number;
  totalSubscribers: number;
  totalRevenue: number;
  popularGenres: { genre: string; count: number }[];
  watchTimeHistory: { date: string; value: number }[];
  revenueHistory: { month: string; subscription: number; ads: number }[];
}

export interface DownloadTask {
  id: string; // Movie ID
  movieTitle: string;
  moviePosterUrl: string;
  sizeGB: number;
  progress: number;
  speedMBs: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
  addedAt: string;
}

