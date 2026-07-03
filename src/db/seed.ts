import { db } from './index.ts';
import * as schema from './schema.ts';
import { INITIAL_MOVIES } from '../data/movies.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    console.log("Checking if database needs seeding...");
    
    // 1. Movies
    const existingMovies = await db.select({ id: schema.movies.id }).from(schema.movies).limit(1);
    if (existingMovies.length === 0) {
      console.log("Seeding movies...");
      for (const movie of INITIAL_MOVIES) {
        await db.insert(schema.movies).values({
          id: movie.id,
          title: movie.title,
          type: movie.type,
          synopsis: movie.synopsis,
          posterUrl: movie.posterUrl,
          bannerUrl: movie.bannerUrl,
          trailerUrl: movie.trailerUrl,
          videoUrl: movie.videoUrl,
          genres: movie.genres,
          cast: movie.cast,
          director: movie.director,
          rating: String(movie.rating),
          votesCount: movie.votesCount,
          releaseDate: movie.releaseDate,
          runtime: movie.runtime,
          seasonsCount: movie.seasonsCount || null,
          episodes: movie.episodes || [],
          isTrending: movie.isTrending || false,
          isFeatured: movie.isFeatured || false,
          isPopular: movie.isPopular || false,
          views: movie.views || 0,
          reviews: movie.reviews || [],
          maturityRating: movie.maturityRating || 'PG-13',
          country: movie.country || '',
          language: movie.language || 'English',
          isTranslated: movie.isTranslated || false,
        });
      }
    }

    // Ensure "Fast X" and "Avatar" are seeded
    const fastXCheck = await db.select().from(schema.movies).where(eq(schema.movies.id, "m-fastx")).limit(1);
    if (fastXCheck.length === 0) {
      await db.insert(schema.movies).values({
        id: "m-fastx",
        title: "Fast X",
        type: "movie",
        synopsis: "Dom Toretto and his family are targeted by the vengeful son of drug kingpin Hernan Reyes.",
        posterUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200&h=500&fit=crop",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        genres: ["Action", "Thriller"],
        cast: ["Vin Diesel", "Michelle Rodriguez", "Jason Momoa"],
        director: "Louis Leterrier",
        rating: "4.5",
        votesCount: 89000,
        releaseDate: "2023-05-19",
        runtime: "2h 21m",
        views: 2300,
        maturityRating: "PG-13",
        country: "United States",
        language: "English"
      });
    }

    const avatarCheck = await db.select().from(schema.movies).where(eq(schema.movies.id, "m-avatar")).limit(1);
    if (avatarCheck.length === 0) {
      await db.insert(schema.movies).values({
        id: "m-avatar",
        title: "Avatar",
        type: "movie",
        synopsis: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home.",
        posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&h=600&fit=crop",
        bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&h=500&fit=crop",
        trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        genres: ["Sci-Fi", "Adventure", "Action"],
        cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver"],
        director: "James Cameron",
        rating: "4.8",
        votesCount: 310000,
        releaseDate: "2009-12-18",
        runtime: "2h 42m",
        views: 1800,
        maturityRating: "PG-13",
        country: "United States",
        language: "English"
      });
    }

    // 2. Categories
    const existingCategories = await db.select().from(schema.categories).limit(1);
    if (existingCategories.length === 0) {
      console.log("Seeding categories...");
      const initialCategories = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Adventure', 'Animation', 'Documentary', 'Family', 'VJ Translation'];
      await db.insert(schema.categories).values(
        initialCategories.map(name => ({ name }))
      );
    }

    // 3. Ads Settings
    const existingAdsSettings = await db.select().from(schema.adsSettings).where(eq(schema.adsSettings.id, 1));
    if (existingAdsSettings.length === 0) {
      console.log("Seeding ads settings...");
      await db.insert(schema.adsSettings).values({ id: 1, enabled: true, frequency: 15 });
    }

    // 4. Parental Settings
    const existingParentalSettings = await db.select().from(schema.parentalSettings).where(eq(schema.parentalSettings.id, 1));
    if (existingParentalSettings.length === 0) {
      console.log("Seeding parental settings...");
      await db.insert(schema.parentalSettings).values({ id: 1, enabled: true });
    }

    // 5. Ads Campaigns
    const existingCampaigns = await db.select().from(schema.adsCampaigns).limit(1);
    if (existingCampaigns.length === 0) {
      console.log("Seeding ads campaigns...");
      const initialCampaigns = [
        { id: "ad-1", title: "Telecom SuperData Bundle 5G", url: "https://example.com/banner.mp4", type: "Video Roll", triggerFreq: "Every 2 Episodes", clicks: 1245, impressions: 8900, status: "Active" },
        { id: "ad-2", title: "Prime Cola Uganda Zero sugar", url: "https://picsum.photos/300/180?seed=cola", type: "Overlay Banner", triggerFreq: "On Stream Pause", clicks: 530, impressions: 4500, status: "Active" },
        { id: "ad-3", title: "Global Express Airlines flight special", url: "https://example.com/airlines", type: "Pre-roll sponsor", triggerFreq: "Before Stream Starts", clicks: 812, impressions: 6100, status: "Paused" }
      ];
      await db.insert(schema.adsCampaigns).values(initialCampaigns);
    }

    // 6. Pricing Plans
    const existingPricingPlans = await db.select().from(schema.pricingPlans).limit(1);
    if (existingPricingPlans.length === 0) {
      console.log("Seeding pricing plans...");
      const initialPricingPlans = [
        { id: "plan-free", name: "Free Ad-Supported", price: 0 },
        { id: "plan-premium", name: "Premium Solitary", price: 37000 },
        { id: "plan-family", name: "Empire Family Pack", price: 74000 },
        { id: "plan-download", name: "Local Device Download (2 Weeks)", price: 5000 }
      ];
      await db.insert(schema.pricingPlans).values(initialPricingPlans);
    }

    // 7. Users
    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      const initialUsers = [
        { id: "u-1", name: "Papa Ken (Admin)", email: "senfukawataraken@gmail.com", plan: "Empire Family Pack", status: "Active", maxRating: "All", role: "Administrator" },
        { id: "u-2", name: "Rachael (Sovereign)", email: "rachael@kwatch.com", plan: "Premium Solitary", status: "Active", maxRating: "R", role: "Content Moderator" },
        { id: "u-3", name: "SpamBot_42", email: "spambot42@gmail.com", plan: "Free Ad-Supported", status: "Suspended", maxRating: "PG-13", role: "VIP Subscriber" },
        { id: "u-4", name: "Luganda_Viewer", email: "lugandashare@gmail.com", plan: "Free Ad-Supported", status: "Active", maxRating: "All", role: "Support Agent" },
        { id: "u-5", name: "Elena Gilbert", email: "elena@mysticfalls.org", plan: "Premium Solitary", status: "Active", maxRating: "PG-13", role: "VIP Subscriber" }
      ];
      await db.insert(schema.users).values(initialUsers);
    }

    // 8. Role Permissions
    const existingRolePermissions = await db.select().from(schema.rolePermissions).limit(1);
    if (existingRolePermissions.length === 0) {
      console.log("Seeding role permissions...");
      const initialRolePermissions = [
        { id: "p1", permissionName: "Modify Platform Pricing", Administrator: true, ContentModerator: false, SupportAgent: false, VipSubscriber: false },
        { id: "p2", permissionName: "Delete Cinematic Catalog Content", Administrator: true, ContentModerator: true, SupportAgent: false, VipSubscriber: false },
        { id: "p3", permissionName: "Purge Comment/Review Boards", Administrator: true, ContentModerator: true, SupportAgent: true, VipSubscriber: false },
        { id: "p4", permissionName: "Manage Advertising Campaigns", Administrator: true, ContentModerator: false, SupportAgent: false, VipSubscriber: false },
        { id: "p5", permissionName: "Access Financial Billing Ledger", Administrator: true, ContentModerator: false, SupportAgent: true, VipSubscriber: false },
        { id: "p6", permissionName: "Publish Promotional Broadcasts", Administrator: true, ContentModerator: true, SupportAgent: false, VipSubscriber: false }
      ];
      await db.insert(schema.rolePermissions).values(initialRolePermissions);
    }

    // 9. Audit Logs
    const existingAuditLogs = await db.select().from(schema.auditLogs).limit(1);
    if (existingAuditLogs.length === 0) {
      console.log("Seeding audit logs...");
      const initialAuditLogs = [
        { id: "log-1", user: "Papa Ken (Admin)", action: "Platform initial synchronization", category: "SYSTEM", status: "SUCCESS", timestamp: "2026-06-15 14:10" },
        { id: "log-2", user: "Papa Ken (Admin)", action: "Purged flagged review for 'Midnight Chronicles'", category: "MODERATION", status: "SUCCESS", timestamp: "2026-06-15 14:15" },
        { id: "log-3", user: "Papa Ken (Admin)", action: "Added voice-to-text search support validation", category: "FEATURES", status: "SUCCESS", timestamp: "2026-06-15 14:20" },
        { id: "log-4", user: "Rachael (Sovereign)", action: "Triggered Presentation API casting test stream", category: "DEVICE_CAST", status: "INFO", timestamp: "2026-06-15 14:23" },
        { id: "log-5", user: "SYSTEM (Transcoder)", action: "H.264 file transcoding queue initialized for 'Parisian Sunset'", category: "TRANSCODER", status: "SUCCESS", timestamp: "2026-06-15 14:24" }
      ];
      await db.insert(schema.auditLogs).values(initialAuditLogs);
    }

    // 10. Reported Reviews
    const existingReportedReviews = await db.select().from(schema.reportedReviews).limit(1);
    if (existingReportedReviews.length === 0) {
      console.log("Seeding reported reviews...");
      const initialReportedReviews = [
        { id: "rep-1", movieTitle: "Midnight Chronicles: The Haunting", userName: "TrollMaster", comment: "This is completely garbage, movie is black screen throughout don't waste time", reason: "Spam / False Reviews" },
        { id: "rep-2", movieTitle: "Cosmic Horizon: Chronicles of Sintel", userName: "AngryUser", comment: "Spoiler alert: they don't find the baby dragon at all, total failure in script writing!", reason: "Script Spoilers" }
      ];
      await db.insert(schema.reportedReviews).values(initialReportedReviews);
    }
    
    console.log("Database seed check completed.");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
}
