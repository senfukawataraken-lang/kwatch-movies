import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { ContentGenre, Episode, Review } from '../types';

export const movies = pgTable('movies', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').$type<'movie' | 'series'>().notNull(),
  synopsis: text('synopsis').notNull(),
  posterUrl: text('poster_url').notNull(),
  bannerUrl: text('banner_url').notNull(),
  trailerUrl: text('trailer_url').notNull(),
  videoUrl: text('video_url').notNull(),
  genres: jsonb('genres').$type<ContentGenre[]>().notNull(),
  cast: jsonb('cast').$type<string[]>().notNull(),
  director: text('director').notNull(),
  rating: text('rating').notNull(), // represented as string/number
  votesCount: integer('votes_count').notNull(),
  releaseDate: text('release_date').notNull(),
  runtime: text('runtime').notNull(),
  seasonsCount: integer('seasons_count'),
  episodes: jsonb('episodes').$type<Episode[]>(),
  isTrending: boolean('is_trending').default(false),
  isFeatured: boolean('is_featured').default(false),
  isPopular: boolean('is_popular').default(false),
  views: integer('views').notNull().default(0),
  reviews: jsonb('reviews').$type<Review[]>().notNull().default([]),
  maturityRating: text('maturity_rating').$type<'G' | 'PG' | 'PG-13' | 'R'>(),
  country: text('country'),
  language: text('language'),
  isTranslated: boolean('is_translated').default(false),
  userAdCompletions: jsonb('user_ad_completions').$type<Record<string, string[]>>().notNull().default({}),
});

export const categories = pgTable('categories', {
  name: text('name').primaryKey(),
});

export const adsSettings = pgTable('ads_settings', {
  id: integer('id').primaryKey(), // We'll use 1 as single record
  enabled: boolean('enabled').notNull().default(true),
  frequency: integer('frequency').notNull().default(15),
  adsenseEnabled: boolean('adsense_enabled').notNull().default(true),
  adsensePublisherId: text('adsense_publisher_id').notNull().default('ca-pub-3940251849102834'),
  admobEnabled: boolean('admob_enabled').notNull().default(true),
  admobAppId: text('admob_app_id').notNull().default('ca-app-pub-3940251849102834~1028394829'),
  admobBannerUnitId: text('admob_banner_unit_id').notNull().default('ca-app-pub-3940251849102834/1029384729'),
  admobRewardedUnitId: text('admob_rewarded_unit_id').notNull().default('ca-app-pub-3940251849102834/4820193849'),
  adsenseEarnings: integer('adsense_earnings').notNull().default(124500),
  admobEarnings: integer('admob_earnings').notNull().default(84200),
});

export const parentalSettings = pgTable('parental_settings', {
  id: integer('id').primaryKey(), // We'll use 1 as single record
  enabled: boolean('enabled').notNull().default(true),
});

export const adsCampaigns = pgTable('ads_campaigns', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull(),
  triggerFreq: text('trigger_freq').notNull(),
  clicks: integer('clicks').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  status: text('status').notNull().default('Active'),
});

export const pricingPlans = pgTable('pricing_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  maxRating: text('max_rating').notNull(),
  role: text('role').notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey(),
  permissionName: text('permission_name').notNull(),
  Administrator: boolean('administrator').notNull().default(false),
  ContentModerator: boolean('content_moderator').notNull().default(false),
  SupportAgent: boolean('support_agent').notNull().default(false),
  VipSubscriber: boolean('vip_subscriber').notNull().default(false),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  user: text('user').notNull(),
  action: text('action').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull(),
  timestamp: text('timestamp').notNull(),
});

export const reportedReviews = pgTable('reported_reviews', {
  id: text('id').primaryKey(),
  movieTitle: text('movie_title').notNull(),
  userName: text('user_name').notNull(),
  comment: text('comment').notNull(),
  reason: text('reason').notNull(),
});

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  text: text('text').notNull(),
  date: text('date').notNull(),
});

export const adCompletions = pgTable('ad_completions', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  movieId: text('movie_id').notNull(),
  adId: text('ad_id').notNull(),
  timestamp: text('timestamp').notNull(),
});

