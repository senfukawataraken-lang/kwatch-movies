import { 
  Tv, Compass, Heart, Bookmark, Languages, Play, Award, Zap, Smile
} from 'lucide-react';
import { UserProfile, Movie } from '../types';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: 'Tv' | 'Compass' | 'Heart' | 'Bookmark' | 'Languages' | 'Play' | 'Award' | 'Zap' | 'Smile';
  criteria: string;
  isUnlocked: boolean;
  color: string; // Tailwind badge styling
  progress: number; // percentage
  progressText: string;
}

export function getProfileBadges(profile: UserProfile, movies: Movie[]): Badge[] {
  const watchHistory = profile.recentlyWatched || [];
  const favorites = profile.favorites || [];
  const watchlist = profile.watchlist || [];

  const watchedMovieIds = watchHistory.map(w => w.movieId);
  const watchedMovies = movies.filter(m => watchedMovieIds.includes(m.id));
  
  // Counts
  const watchCount = watchHistory.length;
  
  // Unique genres
  const genresSet = new Set<string>();
  watchedMovies.forEach(m => {
    if (m.genres) {
      m.genres.forEach(g => genresSet.add(g));
    }
  });
  const uniqueGenresCount = genresSet.size;

  // Luganda language watches
  const hasLuganda = watchedMovies.some(m => m.language?.toLowerCase().includes("luganda") || m.title?.toLowerCase().includes("vj") || m.director?.toLowerCase().includes("vj"));

  return [
    {
      id: "first_steps",
      name: "First Steps",
      description: "Achieved your first watch history milestone.",
      iconName: "Play",
      criteria: "Watch 1 movie or series",
      isUnlocked: watchCount >= 1,
      color: "from-emerald-600/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40",
      progress: Math.min(100, (watchCount / 1) * 100),
      progressText: `${Math.min(1, watchCount)}/1 watch`
    },
    {
      id: "binge_watcher",
      name: "Binge Watcher",
      description: "Powering through films like an unstoppable force.",
      iconName: "Tv",
      criteria: "Watch at least 3 movies or series",
      isUnlocked: watchCount >= 3,
      color: "from-purple-600/20 to-purple-500/5 border-purple-500/20 text-purple-400 group-hover:border-purple-500/40",
      progress: Math.min(100, (watchCount / 3) * 100),
      progressText: `${Math.min(3, watchCount)}/3 watches`
    },
    {
      id: "genre_explorer",
      name: "Genre Explorer",
      description: "Venture across 3+ unique content genres.",
      iconName: "Compass",
      criteria: "Watch 3+ distinct genres",
      isUnlocked: uniqueGenresCount >= 3,
      color: "from-amber-600/20 to-amber-500/5 border-amber-500/20 text-amber-400 group-hover:border-amber-500/40",
      progress: Math.min(100, (uniqueGenresCount / 3) * 100),
      progressText: `${Math.min(3, uniqueGenresCount)}/3 genres`
    },
    {
      id: "luganda_lover",
      name: "Luganda Enthusiast",
      description: "Tuned into authentic supreme Luganda sound commentary.",
      iconName: "Languages",
      criteria: "Watch 1+ movie with Luganda dub or commentary",
      isUnlocked: hasLuganda,
      color: "from-orange-600/20 to-orange-500/5 border-orange-500/20 text-orange-400 group-hover:border-orange-500/40",
      progress: hasLuganda ? 100 : 0,
      progressText: hasLuganda ? "1/1 watch" : "0/1 Luganda watch"
    },
    {
      id: "dedicated_fan",
      name: "Dedicated Fan",
      description: "Keeps premium titles close to the heart.",
      iconName: "Heart",
      criteria: "Add 2+ titles to Favorites",
      isUnlocked: favorites.length >= 2,
      color: "from-pink-600/20 to-pink-500/5 border-pink-500/20 text-pink-400 group-hover:border-pink-500/40",
      progress: Math.min(100, (favorites.length / 2) * 100),
      progressText: `${Math.min(2, favorites.length)}/2 favorites`
    },
    {
      id: "active_curator",
      name: "Active Curator",
      description: "Managing a robust cinematic collection.",
      iconName: "Bookmark",
      criteria: "Add 3+ titles to Watchlist",
      isUnlocked: watchlist.length >= 3,
      color: "from-blue-600/20 to-blue-500/5 border-blue-500/20 text-blue-400 group-hover:border-blue-500/40",
      progress: Math.min(100, (watchlist.length / 3) * 100),
      progressText: `${Math.min(3, watchlist.length)}/3 watchlist items`
    }
  ];
}
