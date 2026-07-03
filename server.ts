import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Movie, Review, TranscodingJob } from "./src/types";
import { db } from "./src/db/index.ts";
import * as schema from "./src/db/schema.ts";
import { seedDatabase } from "./src/db/seed.ts";
import { INITIAL_MOVIES } from "./src/data/movies.ts";
import { eq, and, sql } from "drizzle-orm";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy-initialize Gemini API Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not defined or is placeholder. Falling back to rule-based parser.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// In-Memory Database containing simulated live states (transcoding, transient stats)
let transcodingJobs: TranscodingJob[] = [
  {
    id: "tx-1",
    movieTitle: "Cosmic Horizon: Chronicles of Sintel",
    progress: 100,
    status: "completed",
    resolution: "4K UHD (3840x2160)",
    startedAt: "2h ago"
  },
  {
    id: "tx-2",
    movieTitle: "Silent Horizon: Deep Sea Odyssey",
    progress: 100,
    status: "completed",
    resolution: "1080p FHD",
    startedAt: "1h ago"
  }
];

let visitorStats = {
  dailyUsers: 2450,
  monthlyUsers: 48900,
  watchTimeHours: 12450,
  totalSubscribers: 1840,
  totalRevenue: 24560,
  popularGenres: [
    { genre: "Sci-Fi", count: 42 },
    { genre: "Adventure", count: 35 },
    { genre: "Animation", count: 31 },
    { genre: "Comedy", count: 28 },
    { genre: "Drama", count: 25 },
    { genre: "Documentary", count: 18 }
  ],
  dauHistory: [
    { date: "06-02", users: 2180 },
    { date: "06-03", users: 2210 },
    { date: "06-04", users: 2290 },
    { date: "06-05", users: 2310 },
    { date: "06-06", users: 2450 },
    { date: "06-07", users: 2590 },
    { date: "06-08", users: 2610 },
    { date: "06-09", users: 2350 },
    { date: "06-10", users: 2400 },
    { date: "06-11", users: 2420 },
    { date: "06-12", users: 2510 },
    { date: "06-13", users: 2720 },
    { date: "06-14", users: 2850 },
    { date: "06-15", users: 2910 }
  ],
  mauHistory: [
    { month: "Jan", users: 38200 },
    { month: "Feb", users: 40500 },
    { month: "Mar", users: 42800 },
    { month: "Apr", users: 44100 },
    { month: "May", users: 46800 },
    { month: "Jun", users: 48900 }
  ],
  watchTimeHistory: [
    { date: "06-02", moviesHours: 420, seriesHours: 310 },
    { date: "06-03", moviesHours: 450, seriesHours: 290 },
    { date: "06-04", moviesHours: 490, seriesHours: 330 },
    { date: "06-05", moviesHours: 510, seriesHours: 350 },
    { date: "06-06", moviesHours: 620, seriesHours: 480 },
    { date: "06-07", moviesHours: 710, seriesHours: 590 },
    { date: "06-08", moviesHours: 680, seriesHours: 540 },
    { date: "06-09", moviesHours: 480, seriesHours: 320 },
    { date: "06-10", moviesHours: 500, seriesHours: 340 },
    { date: "06-11", moviesHours: 520, seriesHours: 360 },
    { date: "06-12", moviesHours: 590, seriesHours: 420 },
    { date: "06-13", moviesHours: 780, seriesHours: 610 },
    { date: "06-14", moviesHours: 850, seriesHours: 690 },
    { date: "06-15", moviesHours: 910, seriesHours: 720 }
  ],
  geographicData: [
    { country: "Uganda", users: 18400, percentage: 38 },
    { country: "Kenya", users: 12200, percentage: 25 },
    { country: "Tanzania", users: 8100, percentage: 17 },
    { country: "Rwanda", users: 5100, percentage: 10 },
    { country: "South Sudan", users: 2100, percentage: 4 },
    { country: "United States", users: 1800, percentage: 3 },
    { country: "Rest of World", users: 1200, percentage: 3 }
  ],
  retentionCohorts: [
    { cohort: "Jan 2026", size: 5000, m1: 85, m2: 78, m3: 72, m4: 69, m5: 64, m6: 62 },
    { cohort: "Feb 2026", size: 5500, m1: 87, m2: 80, m3: 75, m4: 70, m5: 66, m6: null },
    { cohort: "Mar 2026", size: 6200, m1: 88, m2: 82, m3: 77, m4: 73, m5: null, m6: null },
    { cohort: "Apr 2026", size: 6800, m1: 89, m2: 84, m3: 79, m4: null, m5: null, m6: null },
    { cohort: "May 2026", size: 7500, m1: 91, m2: 86, m3: null, m4: null, m5: null, m6: null }
  ],
  revenueDistribution: {
    empireFamilyPack: 18655,
    premiumSolitary: 4420,
    freeAdSupported: 1485
  },
  revenueHistory: [
    { month: "Jan", revenue: 18200 },
    { month: "Feb", revenue: 19500 },
    { month: "Mar", revenue: 21400 },
    { month: "Apr", revenue: 22800 },
    { month: "May", revenue: 23900 },
    { month: "Jun", revenue: 24560 }
  ]
};

// Lazy-initialize Cloud Storage Client (preferring Cloudflare R2, then Backblaze B2)
const getStorageConfig = () => {
  // Cloudflare R2 configuration
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const r2BucketName = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_BUCKET_NAME;

  if (r2AccessKeyId && r2SecretAccessKey && r2AccountId && r2BucketName && !r2AccessKeyId.includes("your_")) {
    const client = new S3Client({
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
      region: "auto",
    });
    const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_PUBLIC_URL;
    return {
      client,
      bucketName: r2BucketName,
      provider: "R2" as const,
      getPublicUrl: (key: string) => {
        if (r2PublicUrl) {
          const base = r2PublicUrl.endsWith("/") ? r2PublicUrl.slice(0, -1) : r2PublicUrl;
          return `${base}/${key}`;
        }
        return `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${key}`;
      }
    };
  }

  // Backblaze B2 configuration
  const b2KeyId = process.env.B2_APPLICATION_KEY_ID;
  const b2AppKey = process.env.B2_APPLICATION_KEY;
  const b2BucketName = process.env.B2_BUCKET_NAME || "my-bucket";
  const b2Endpoint = process.env.B2_ENDPOINT || "s3.us-west-004.backblazeb2.com";

  if (b2KeyId && b2AppKey && !b2KeyId.includes("your_")) {
    const formattedEndpoint = b2Endpoint.startsWith("http") ? b2Endpoint : `https://${b2Endpoint}`;
    const region = b2Endpoint.split(".")[1] || "us-west-004";
    const client = new S3Client({
      endpoint: formattedEndpoint,
      credentials: {
        accessKeyId: b2KeyId,
        secretAccessKey: b2AppKey,
      },
      region: region,
      forcePathStyle: true,
    });
    return {
      client,
      bucketName: b2BucketName,
      provider: "B2" as const,
      getPublicUrl: (key: string) => `https://${b2BucketName}.${b2Endpoint}/${key}`
    };
  }

  return {
    client: null,
    bucketName: "mock-bucket",
    provider: "mock" as const,
    getPublicUrl: (key: string) => `/api/b2/mock-files/${key}`
  };
};

// Legacy support wrapper
const getB2Client = (): S3Client | null => {
  return getStorageConfig().client;
};

// API ENDPOINTS

// Get current Cloud Storage operational status
app.get("/api/storage/status", (req: Request, res: Response) => {
  const config = getStorageConfig();
  res.json({
    provider: config.provider,
    bucketName: config.bucketName,
    isMock: config.provider === "mock"
  });
});

// Cloud Storage Direct Upload Pre-signed URL endpoints (supports both B2 and R2)
app.post("/api/b2/upload-url", async (req: Request, res: Response) => {
  const { type, fileName, contentType } = req.body;

  if (!type || !fileName || !contentType) {
    res.status(400).json({ error: "Missing required parameters: type, fileName, contentType" });
    return;
  }

  const allowedTypes = ["posters", "banners", "trailers", "movies"];
  if (!allowedTypes.includes(type)) {
    res.status(400).json({ error: `Invalid upload type. Must be one of: ${allowedTypes.join(", ")}` });
    return;
  }

  const config = getStorageConfig();
  const s3Client = config.client;
  const bucketName = config.bucketName;
  const key = `${type}/${Date.now()}-${fileName}`;

  if (!s3Client) {
    // If not configured, we return a fallback response with simulated upload info
    console.warn(`Cloud storage credentials missing. Generating mock upload URL for type ${type}`);
    res.json({
      uploadUrl: `/api/b2/mock-upload?key=${encodeURIComponent(key)}`,
      publicUrl: `/api/b2/mock-files/${key}`,
      key: key,
      isMock: true,
      provider: "mock"
    });
    return;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = config.getPublicUrl(key);

    res.json({
      uploadUrl,
      publicUrl,
      key,
      isMock: false,
      provider: config.provider
    });
  } catch (error: any) {
    console.error("Failed to generate presigned upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL", details: error.message });
  }
});


// Mock upload PUT receiver to handle local test simulations gracefully
app.put("/api/b2/mock-upload", (req: Request, res: Response) => {
  res.status(200).send();
});

// Mock files server to serve placeholders for simulation when B2 keys are missing
app.get("/api/b2/mock-files/*", (req: Request, res: Response) => {
  const filePath = req.params[0] || "";
  if (filePath.startsWith("posters")) {
    res.redirect("https://picsum.photos/seed/poster-mock/400/600");
  } else if (filePath.startsWith("banners")) {
    res.redirect("https://picsum.photos/seed/banner-mock/1200/500");
  } else {
    res.redirect("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
  }
});

// Record ad completion in PostgreSQL
app.post("/api/ads/record", async (req: Request, res: Response) => {
  const { email, movieId, adId } = req.body;
  if (!email || !movieId || !adId) {
    res.status(400).json({ error: "Missing required fields: email, movieId, adId" });
    return;
  }
  try {
    const id = `adc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newCompletion = {
      id,
      email,
      movieId,
      adId,
      timestamp: new Date().toISOString()
    };
    await db.insert(schema.adCompletions).values(newCompletion);
    
    // Update userAdCompletions on the movie record to track ad completion status
    const movieRes = await db.select().from(schema.movies).where(eq(schema.movies.id, movieId));
    if (movieRes.length > 0) {
      const movie = movieRes[0];
      const completionsMap = (movie.userAdCompletions || {}) as Record<string, string[]>;
      if (!completionsMap[email]) {
        completionsMap[email] = [];
      }
      completionsMap[email].push(newCompletion.timestamp);
      await db.update(schema.movies)
        .set({ userAdCompletions: completionsMap })
        .where(eq(schema.movies.id, movieId));
    }

    // Increment impressions in adsCampaigns if matches
    await db.update(schema.adsCampaigns)
      .set({ impressions: sql`${schema.adsCampaigns.impressions} + 1` })
      .where(eq(schema.adsCampaigns.id, adId));

    res.status(201).json({ success: true, completion: newCompletion });
  } catch (error: any) {
    console.error("Failed to record ad completion:", error);
    res.status(500).json({ error: "Failed to record ad completion" });
  }
});

// Helper to extract the object key from a full Backblaze B2 S3 URL (backwards compatible if full URL is stored)
function getB2Key(value: string): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      return key;
    } catch {
      return null;
    }
  }
  return value; // Already the object key
}

// Helper to ensure a movie exists in the database. Dynamically inserts from seed list if missing.
async function ensureMovieExists(id: string): Promise<any> {
  const existing = await db.select().from(schema.movies).where(eq(schema.movies.id, id));
  if (existing.length > 0) {
    return existing[0];
  }

  console.warn(`Movie with ID ${id} not found in database. Inserting fallback model.`);
  const found = INITIAL_MOVIES.find((m) => m.id === id);
  const movieToInsert = {
    id,
    title: found?.title || "Custom Sandbox Feature",
    type: (found?.type === "series" ? "series" : "movie") as "movie" | "series",
    synopsis: found?.synopsis || "Graceful fallback stream for newly added/custom sandbox metadata titles.",
    posterUrl: found?.posterUrl || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400&h=600&fit=crop",
    bannerUrl: found?.bannerUrl || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200&h=500&fit=crop",
    trailerUrl: found?.trailerUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoUrl: found?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    genres: found?.genres || ["Drama"],
    cast: found?.cast || ["Anonymous Creator"],
    director: found?.director || "Kwatch Sandbox",
    rating: String(found?.rating || 4.5),
    votesCount: found?.votesCount || 1,
    releaseDate: found?.releaseDate || new Date().toISOString().split("T")[0],
    runtime: found?.runtime || "2h 00m",
    views: found?.views || 0,
    reviews: found?.reviews || [],
    maturityRating: found?.maturityRating || "PG-13",
    country: found?.country || "Uganda",
    language: found?.language || "English",
    isTranslated: found?.isTranslated !== undefined ? found.isTranslated : true,
    userAdCompletions: {},
  };

  await db.insert(schema.movies).values(movieToInsert);
  return movieToInsert;
}

// Authenticated private media streaming endpoint
app.get("/api/movies/:id/play", async (req: Request, res: Response) => {
  const { id } = req.params;
  const email = req.query.email as string;
  const type = req.query.type as string || "video"; // "video" or "trailer"

  try {
    // 1. Verify user exists and has an Active status
    if (!email) {
      res.status(401).json({ error: "Authentication required: No user email provided." });
      return;
    }

    const userRes = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (userRes.length === 0) {
      res.status(403).json({ error: "Access denied: User account not found." });
      return;
    }

    const user = userRes[0];
    if (user.status !== "Active") {
      res.status(403).json({ error: `Access denied: User account status is ${user.status}.` });
      return;
    }

    // 2. Fetch movie (dynamically creating if missing)
    const movie = await ensureMovieExists(id);

    // ADS INTEGRATION: Check if user is Free Ad-Supported and if type is video (not trailer)
    // We require three verified ad completion timestamps in the movie's own userAdCompletions column.
    if (type !== "trailer" && user.plan === "Free Ad-Supported") {
      const completionsMap = (movie.userAdCompletions || {}) as Record<string, string[]>;
      const userTimestamps = completionsMap[email] || [];
      
      if (userTimestamps.length < 3) {
        res.status(403).json({ 
          error: "Required ads not completed", 
          code: "ADS_REQUIRED",
          completedCount: userTimestamps.length,
          requiredCount: 3
        });
        return;
      }
    }

    const rawUrl = type === "trailer" ? movie.trailerUrl : movie.videoUrl;
    
    if (!rawUrl) {
      res.status(404).json({ error: "Requested media URL/key is empty" });
      return;
    }

    // Get the object key (resolving from full URL or directly)
    const key = getB2Key(rawUrl);
    if (!key) {
      res.status(400).json({ error: "Invalid media key or URL" });
      return;
    }

    const config = getStorageConfig();
    const s3Client = config.client;
    const bucketName = config.bucketName;

    // Check if the URL/key belongs to our active storage client
    const isLocalAsset = !rawUrl.startsWith("http");
    const isStorageAsset = 
      rawUrl.includes("backblazeb2") || 
      rawUrl.includes("r2.cloudflarestorage.com") || 
      (process.env.R2_PUBLIC_URL && rawUrl.includes(process.env.R2_PUBLIC_URL)) || 
      (process.env.CLOUDFLARE_PUBLIC_URL && rawUrl.includes(process.env.CLOUDFLARE_PUBLIC_URL));

    // Fallback if s3 credentials are not configured or it's a non-cloud external static URL
    if (!s3Client || (!isLocalAsset && !isStorageAsset)) {
      if (rawUrl.startsWith("http")) {
        res.json({ playUrl: rawUrl, isMock: !s3Client });
      } else {
        res.json({ 
          playUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
          isMock: true 
        });
      }
      return;
    }

    // Generate short-lived signed URL (expires in 5 minutes = 300 seconds)
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const playUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    res.json({
      playUrl,
      isMock: false
    });
  } catch (error: any) {
    console.error("Failed to generate presigned play URL:", error);
    res.status(500).json({ error: "Failed to generate play URL", details: error.message });
  }
});

// 1. Get all movies
app.get("/api/movies", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.movies);
    const formatted = list.map(m => ({
      ...m,
      rating: parseFloat(m.rating),
    }));
    res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch movies from database:", error);
    res.status(500).json({ error: "Failed to fetch movies from database" });
  }
});

// 2. Add movie (CMS Admin feature)
app.post("/api/movies", async (req: Request, res: Response) => {
  const { title, type, synopsis, posterUrl, bannerUrl, trailerUrl, videoUrl, genres, cast, director, rating, runtime, language, isTranslated, maturityRating, country } = req.body;
  if (!title || !type || !synopsis) {
    res.status(400).json({ error: "Missing required movie elements." });
    return;
  }

  const movieId = `m-${Date.now()}`;
  const newMovie = {
    id: movieId,
    title,
    type,
    synopsis,
    posterUrl: posterUrl || "https://picsum.photos/seed/movie-new/400/600",
    bannerUrl: bannerUrl || "https://picsum.photos/seed/movie-new-banner/1200/500",
    trailerUrl: trailerUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    videoUrl: videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    genres: genres || ["Drama"],
    cast: cast || ["Unknown Actor"],
    director: director || "Unknown Director",
    rating: String(parseFloat(rating) || 4.5),
    votesCount: 1,
    releaseDate: new Date().toISOString().split("T")[0],
    runtime: runtime || "2h 00m",
    views: 0,
    reviews: [],
    language: language || "English",
    isTranslated: isTranslated !== undefined ? isTranslated : true,
    maturityRating: maturityRating || 'PG-13',
    country: country || 'Uganda'
  };

  try {
    await db.insert(schema.movies).values(newMovie);

    // Trigger simulated transcoding job for this movie
    const jobID = `tx-${Date.now()}`;
    transcodingJobs.unshift({
      id: jobID,
      movieTitle: newMovie.title,
      progress: 0,
      status: "processing",
      resolution: "1080p FHD",
      startedAt: "Just now"
    });

    // Background transcoding loop simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      const job = transcodingJobs.find(j => j.id === jobID);
      if (job) {
        job.progress = progress;
        if (progress >= 100) {
          job.status = "completed";
          clearInterval(interval);
        }
      } else {
        clearInterval(interval);
      }
    }, 4000);

    res.status(201).json({
      ...newMovie,
      rating: parseFloat(newMovie.rating),
    });
  } catch (error) {
    console.error("Failed to add movie:", error);
    res.status(500).json({ error: "Failed to save movie to database" });
  }
});

// 3. Delete movie (CMS Admin feature)
app.delete("/api/movies/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleted = await db.delete(schema.movies).where(eq(schema.movies.id, id)).returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Movie not found" });
    } else {
      res.json({ success: true, message: "Movie deleted successfully" });
    }
  } catch (error) {
    console.error("Failed to delete movie:", error);
    res.status(500).json({ error: "Failed to delete movie from database" });
  }
});

// 4. Update movie details
app.put("/api/movies/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatePayload = { ...req.body };
    if (updatePayload.rating !== undefined) {
      updatePayload.rating = String(updatePayload.rating);
    }
    delete updatePayload.id;

    const result = await db.update(schema.movies)
      .set(updatePayload)
      .where(eq(schema.movies.id, id))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "Movie not found" });
    } else {
      res.json({
        ...result[0],
        rating: parseFloat(result[0].rating),
      });
    }
  } catch (error) {
    console.error("Failed to update movie details:", error);
    res.status(500).json({ error: "Failed to update movie details" });
  }
});

// 5. Submit user review
app.post("/api/movies/:id/reviews", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userName, rating, comment } = req.body;

  try {
    const movie = await ensureMovieExists(id);
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      userName: userName || "Kwatcher",
      userAvatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userName || "Kwatcher"}`,
      rating: parseInt(rating) || 5,
      comment: comment || "",
      timestamp: "Just now",
      likes: 0,
      dislikes: 0
    };

    const reviews = movie.reviews || [];
    reviews.unshift(newReview);

    const totalRating = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const newRating = parseFloat((totalRating / reviews.length).toFixed(1));
    const votesCount = movie.votesCount + 1;

    await db.update(schema.movies)
      .set({
        reviews,
        rating: String(newRating),
        votesCount,
      })
      .where(eq(schema.movies.id, id));

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Failed to save review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Increment Movie Views counter on active visual selection
app.post("/api/movies/:id/view", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const movie = await ensureMovieExists(id);
    const newViews = movie.views + 1;
    await db.update(schema.movies).set({ views: newViews }).where(eq(schema.movies.id, id));
    visitorStats.watchTimeHours += 1;
    res.json({ success: true, views: newViews });
  } catch (error) {
    console.error("Failed to increment views:", error);
    res.status(500).json({ error: "Failed to update views count" });
  }
});

// 6. Transcoding Jobs listing
app.get("/api/transcoding-jobs", (req: Request, res: Response) => {
  res.json(transcodingJobs);
});

// 7. Analytics Data
app.get("/api/analytics", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.movies);
    const sortedMovies = [...list]
      .sort((a, b) => b.views - a.views)
      .map(m => ({
        id: m.id,
        title: m.title,
        posterUrl: m.posterUrl,
        director: m.director,
        views: m.views,
        genres: m.genres,
        rating: parseFloat(m.rating),
        votesCount: m.votesCount
      }));

    // Fetch live ad completions & campaigns
    const allAdCompletions = await db.select().from(schema.adCompletions);
    const allAdCampaigns = await db.select().from(schema.adsCampaigns);

    // Aggregate campaign performance with metrics: Revenue per Campaign, Revenue per Impression, Revenue per Click
    const campaignStats = allAdCampaigns.map(c => {
      const completionsForCampaign = allAdCompletions.filter(ac => ac.adId === c.id);
      const totalImpressions = (c.impressions || 0) + completionsForCampaign.length;
      const clicksCount = c.clicks || 0;
      
      // Revenue formula: impressions earn Shs 250, clicks earn Shs 1200 premium sponsor bonus
      const revenue = (totalImpressions * 250) + (clicksCount * 1200);
      const revPerImpression = totalImpressions > 0 ? parseFloat((revenue / totalImpressions).toFixed(2)) : 0;
      const revPerClick = clicksCount > 0 ? parseFloat((revenue / clicksCount).toFixed(2)) : 0;

      return {
        id: c.id,
        title: c.title,
        type: c.type,
        status: c.status,
        impressions: totalImpressions,
        clicks: clicksCount,
        earnings: revenue, // Revenue per Campaign
        revPerImpression,  // Revenue per Impression
        revPerClick,       // Revenue per Click
        ctr: totalImpressions > 0 ? parseFloat((((clicksCount) / totalImpressions) * 100).toFixed(2)) : 0
      };
    }).sort((a, b) => b.earnings - a.earnings); // Rank sponsors automatically by Gross Revenue

    // Compute Movie Performance: Movie, Views, Ads Watched, Revenue
    const moviePerformance = list.map(m => {
      const completionsForMovie = allAdCompletions.filter(ac => ac.movieId === m.id).length;
      // High fidelity real-time tracking combined with 3x view-to-ads ratio
      const adsWatched = (m.views * 3) + completionsForMovie;
      const revenue = adsWatched * 250;
      return {
        id: m.id,
        title: m.title,
        views: m.views,
        adsWatched,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Calculate total ad-supported earnings
    const totalAdEarnings = campaignStats.reduce((acc, c) => acc + c.earnings, 0);

    res.json({
      ...visitorStats,
      moviesCount: list.length,
      activeTranscodes: transcodingJobs.filter(j => j.status === 'processing').length,
      popularContent: sortedMovies,
      totalAdImpressions: allAdCompletions.length + allAdCampaigns.reduce((acc, c) => acc + (c.impressions || 0), 0),
      adEarnings: totalAdEarnings,
      campaignStats,
      moviePerformance
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

// 8. Broadcast announcements admin tool
app.get("/api/announcements", async (req: Request, res: Response) => {
  try {
    const anns = await db.select().from(schema.announcements);
    res.json(anns);
  } catch (error) {
    console.error("Failed to get announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

app.post("/api/announcements", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: "Announcement body required" });
    return;
  }
  const newAnn = {
    id: `${Date.now()}`,
    text,
    date: "Just now"
  };
  try {
    await db.insert(schema.announcements).values(newAnn);
    res.status(201).json(newAnn);
  } catch (error) {
    console.error("Failed to publish announcement:", error);
    res.status(500).json({ error: "Failed to publish announcement" });
  }
});

app.delete("/api/announcements/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(schema.announcements).where(eq(schema.announcements.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// A. Categories
app.get("/api/categories", async (req: Request, res: Response) => {
  try {
    const cats = await db.select().from(schema.categories);
    const movieList = await db.select().from(schema.movies);
    const list = cats.map(cat => {
      const name = cat.name;
      const movieCount = movieList.filter(m => m.genres && m.genres.some(g => g.toLowerCase() === name.toLowerCase())).length;
      return { name, movieCount };
    });
    res.json(list);
  } catch (error) {
    console.error("Failed to get categories:", error);
    res.status(500).json({ error: "Failed to fetch categories list" });
  }
});

app.post("/api/categories", async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "Category name required" });
    return;
  }
  try {
    await db.insert(schema.categories).values({ name }).onConflictDoNothing();
    res.status(201).json({ success: true, name });
  } catch (error) {
    console.error("Failed to add category:", error);
    res.status(500).json({ error: "Failed to insert category" });
  }
});

app.delete("/api/categories/:name", async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    await db.delete(schema.categories).where(eq(schema.categories.name, name));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// B. Ads & Campaigns
app.get("/api/ads-settings", async (req: Request, res: Response) => {
  try {
    const settings = await db.select().from(schema.adsSettings).where(eq(schema.adsSettings.id, 1));
    if (settings.length > 0) {
      res.json(settings[0]);
    } else {
      res.json({ id: 1, enabled: true, frequency: 15 });
    }
  } catch (error) {
    console.error("Failed to get ads settings:", error);
    res.status(500).json({ error: "Failed to fetch ads settings" });
  }
});

app.put("/api/ads-settings", async (req: Request, res: Response) => {
  const { 
    enabled, 
    frequency, 
    adsenseEnabled, 
    adsensePublisherId, 
    admobEnabled, 
    admobAppId, 
    admobBannerUnitId, 
    admobRewardedUnitId,
    adsenseEarnings,
    admobEarnings
  } = req.body;
  try {
    const updatePayload: any = {};
    if (typeof enabled === "boolean") updatePayload.enabled = enabled;
    if (typeof frequency === "number") updatePayload.frequency = frequency;
    if (typeof adsenseEnabled === "boolean") updatePayload.adsenseEnabled = adsenseEnabled;
    if (typeof adsensePublisherId === "string") updatePayload.adsensePublisherId = adsensePublisherId;
    if (typeof admobEnabled === "boolean") updatePayload.admobEnabled = admobEnabled;
    if (typeof admobAppId === "string") updatePayload.admobAppId = admobAppId;
    if (typeof admobBannerUnitId === "string") updatePayload.admobBannerUnitId = admobBannerUnitId;
    if (typeof admobRewardedUnitId === "string") updatePayload.admobRewardedUnitId = admobRewardedUnitId;
    if (typeof adsenseEarnings === "number") updatePayload.adsenseEarnings = adsenseEarnings;
    if (typeof admobEarnings === "number") updatePayload.admobEarnings = admobEarnings;

    const result = await db.update(schema.adsSettings)
      .set(updatePayload)
      .where(eq(schema.adsSettings.id, 1))
      .returning();

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "Settings not found" });
    }
  } catch (error) {
    console.error("Failed to update ads settings:", error);
    res.status(500).json({ error: "Failed to update ads settings" });
  }
});

// B1. Simulate Ad Click Earnings
app.post("/api/ads/simulate-click", async (req: Request, res: Response) => {
  const { type } = req.body; // "adsense" or "admob"
  try {
    const settings = await db.select().from(schema.adsSettings).where(eq(schema.adsSettings.id, 1));
    if (settings.length > 0) {
      const current = settings[0];
      const adsenseBonus = Math.floor(Math.random() * 800) + 300;
      const admobBonus = Math.floor(Math.random() * 1500) + 500;
      const nextAdsense = (current.adsenseEarnings || 0) + adsenseBonus;
      const nextAdmob = (current.admobEarnings || 0) + admobBonus;
      
      const payload: any = {};
      if (type === "adsense") {
        payload.adsenseEarnings = nextAdsense;
      } else {
        payload.admobEarnings = nextAdmob;
      }
      
      const updated = await db.update(schema.adsSettings)
        .set(payload)
        .where(eq(schema.adsSettings.id, 1))
        .returning();
      
      res.json({
        success: true,
        adsenseEarnings: updated[0].adsenseEarnings,
        admobEarnings: updated[0].admobEarnings,
        added: type === "adsense" ? adsenseBonus : admobBonus
      });
    } else {
      res.status(404).json({ error: "Settings not found" });
    }
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Failed to simulate ad click" });
  }
});

// B2. Parental Controls Settings
app.get("/api/parental-settings", async (req: Request, res: Response) => {
  try {
    const settings = await db.select().from(schema.parentalSettings).where(eq(schema.parentalSettings.id, 1));
    if (settings.length > 0) {
      res.json(settings[0]);
    } else {
      res.json({ id: 1, enabled: true });
    }
  } catch (error) {
    console.error("Failed to get parental settings:", error);
    res.status(500).json({ error: "Failed to fetch parental settings" });
  }
});

app.put("/api/parental-settings", async (req: Request, res: Response) => {
  const { enabled } = req.body;
  try {
    const updatePayload: any = {};
    if (typeof enabled === "boolean") updatePayload.enabled = enabled;

    const result = await db.update(schema.parentalSettings)
      .set(updatePayload)
      .where(eq(schema.parentalSettings.id, 1))
      .returning();

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "Settings not found" });
    }
  } catch (error) {
    console.error("Failed to update parental settings:", error);
    res.status(500).json({ error: "Failed to update parental settings" });
  }
});

app.get("/api/ads-campaigns", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.adsCampaigns);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch ads campaigns:", error);
    res.status(500).json({ error: "Failed to fetch ads campaigns" });
  }
});

app.post("/api/ads-campaigns", async (req: Request, res: Response) => {
  const campaign = {
    id: `ad-${Date.now()}`,
    title: req.body.title || "Untitled Ad Campaign",
    url: req.body.url || "https://example.com/advertisement",
    type: req.body.type || "Video Roll",
    triggerFreq: req.body.triggerFreq || "Every 2 Episodes",
    clicks: 0,
    impressions: 0,
    status: req.body.status || "Active"
  };
  try {
    await db.insert(schema.adsCampaigns).values(campaign);
    res.status(201).json(campaign);
  } catch (error) {
    console.error("Failed to create ads campaign:", error);
    res.status(500).json({ error: "Failed to save campaign" });
  }
});

app.put("/api/ads-campaigns/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatePayload: any = {};
    if (status) updatePayload.status = status;

    const result = await db.update(schema.adsCampaigns)
      .set(updatePayload)
      .where(eq(schema.adsCampaigns.id, id))
      .returning();

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "Campaign not found" });
    }
  } catch (error) {
    console.error("Failed to update ads campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

app.delete("/api/ads-campaigns/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.delete(schema.adsCampaigns).where(eq(schema.adsCampaigns.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// C. Pricing Plans
app.get("/api/pricing-plans", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.pricingPlans);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch pricing plans:", error);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

app.put("/api/pricing-plans/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { price } = req.body;
  try {
    const updatePayload: any = {};
    if (typeof price === "number") updatePayload.price = price;

    const result = await db.update(schema.pricingPlans)
      .set(updatePayload)
      .where(eq(schema.pricingPlans.id, id))
      .returning();

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "Plan not found" });
    }
  } catch (error) {
    console.error("Failed to update pricing plan:", error);
    res.status(500).json({ error: "Failed to update price limit" });
  }
});

// D. Users Moderation CRM
app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.users);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    res.status(500).json({ error: "Failed to fetch users catalog" });
  }
});

app.post("/api/users", async (req: Request, res: Response) => {
  const newUser = {
    id: `u-${Date.now()}`,
    name: req.body.name || "Anonymous",
    email: req.body.email || "anon@kwatch.com",
    plan: req.body.plan || "Free Ad-Supported",
    status: req.body.status || "Active",
    maxRating: req.body.maxRating || "PG-13",
    role: req.body.role || "VIP Subscriber"
  };
  try {
    await db.insert(schema.users).values(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Failed to add user:", error);
    res.status(500).json({ error: "Failed to save user" });
  }
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatePayload = { ...req.body };
    delete updatePayload.id;

    const result = await db.update(schema.users)
      .set(updatePayload)
      .where(eq(schema.users.id, id))
      .returning();

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Failed to update user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.delete(schema.users).where(eq(schema.users.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Failed to delete user profile" });
  }
});

// E. Role Permissions Matrix
app.get("/api/role-permissions", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.rolePermissions);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch role permissions:", error);
    res.status(500).json({ error: "Failed to fetch roles permissions matrix" });
  }
});

app.put("/api/role-permissions/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatePayload = { ...req.body };
    delete updatePayload.id;

    const result = await db.update(schema.rolePermissions)
      .set(updatePayload)
      .where(eq(schema.rolePermissions.id, id))
      .returning();

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ error: "Permission setting not found" });
    }
  } catch (error) {
    console.error("Failed to update role permissions matrix:", error);
    res.status(500).json({ error: "Failed to update permission matrix" });
  }
});

// F. Platform Audit Logs
app.get("/api/audit-logs", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.auditLogs);
    const sorted = [...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    res.json(sorted);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

app.post("/api/audit-logs", async (req: Request, res: Response) => {
  const log = {
    id: `aud-${Date.now()}`,
    user: req.body.user || "Papa Ken (Admin)",
    action: req.body.action || "Generic operation log detail",
    category: req.body.category || "SYSTEM",
    status: req.body.status || "SUCCESS",
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  try {
    await db.insert(schema.auditLogs).values(log);
    res.status(201).json(log);
  } catch (error) {
    console.error("Failed to add audit log:", error);
    res.status(500).json({ error: "Failed to save operation log" });
  }
});

app.delete("/api/audit-logs", async (req: Request, res: Response) => {
  try {
    await db.delete(schema.auditLogs);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to flush audit logs:", error);
    res.status(500).json({ error: "Failed to flush platform audit ledger" });
  }
});

// G. Reported Reviews
app.get("/api/reported-reviews", async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(schema.reportedReviews);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch reported reviews:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.delete("/api/reported-reviews/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.delete(schema.reportedReviews).where(eq(schema.reportedReviews.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete reported review:", error);
    res.status(500).json({ error: "Failed to clear flagged comment" });
  }
});

// 9. AI Smart assistant Powered by Gemini
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Please provide a chat message." });
    return;
  }

  try {
    const list = await db.select().from(schema.movies);
    const listMoviesContext = list.map(m => `ID: "${m.id}", Title: "${m.title}", Genres: ${JSON.stringify(m.genres)}, Synopsis: "${m.synopsis}"`).join("\n");

    const prompt = `You are the Kwatch Movies AI Assistant. A premium friendly chatbot guiding film enthusiasts.
Here is the complete catalog of movies currently available on our platform:
${listMoviesContext}

Analyze the user's input: "${message}".
Return a highly professional user-friendly recommendation or conversation answer.
You MUST also specify any recommendedMovieIds from the list above that directly answer or align with their description, interests, mood (such as funny, scary, action-packed, romantic, scientific), or genres they are looking for.

Return your response strictly in JSON format matching this schema:
{
  "text": "Your helpful response text (can include markdown list or tips, keep it around 3-4 sentences)",
  "recommendedMovieIds": ["list", "of", "matching", "ids", "or", "empty", "array"]
}`;

    const client = getGeminiClient();

    if (client) {
      try {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "The AI reply message detailing suggestions and chatting naturally."
                },
                recommendedMovieIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of cinema IDs from the catalog that match the query or mood."
                }
              },
              required: ["text", "recommendedMovieIds"]
            }
          }
        });

        const responseText = response.text ? response.text.trim() : "";
        const resultObj = JSON.parse(responseText);
        res.json(resultObj);
        return;
      } catch (err: any) {
        console.error("Gemini API call failed:", err);
        // Fallback below
      }
    }

    // Pure Rule-Based Semantic Matching Fallback (if API key is missing or model fails)
    const queryLower = message.toLowerCase();
    const matchedIds: string[] = [];

    // Match genres or key terms
    list.forEach(movie => {
      const isGenreMatch = movie.genres.some(g => queryLower.includes(g.toLowerCase()));
      const titleMatch = queryLower.includes(movie.title.toLowerCase());
      const isKeywordMatch = queryLower.includes("funny") && movie.genres.includes("Comedy") ||
                            queryLower.includes("joke") && movie.genres.includes("Comedy") ||
                            queryLower.includes("scary") && movie.genres.includes("Horror") ||
                            queryLower.includes("spooky") && movie.genres.includes("Horror") ||
                            queryLower.includes("cyber") && movie.genres.includes("Sci-Fi") ||
                            queryLower.includes("space") && movie.genres.includes("Sci-Fi") ||
                            queryLower.includes("future") && movie.genres.includes("Sci-Fi") ||
                            queryLower.includes("romantic") && movie.genres.includes("Romance") ||
                            queryLower.includes("love") && movie.genres.includes("Romance") ||
                            queryLower.includes("documentary") && movie.genres.includes("Documentary") ||
                            queryLower.includes("kids") && movie.genres.includes("Family") ||
                            queryLower.includes("children") && movie.genres.includes("Family") ||
                            queryLower.includes("cartoon") && movie.genres.includes("Animation") ||
                            queryLower.includes("action") && movie.genres.includes("Action");

      if (isGenreMatch || titleMatch || isKeywordMatch) {
        matchedIds.push(movie.id);
      }
    });

    // Limit fallback match
    const selectedIds = matchedIds.slice(0, 3);
    let replyText = "I parsed your query through our movie library index. ";
    if (selectedIds.length > 0) {
      const titles = selectedIds.map(id => list.find(m => m.id === id)?.title).join(", ");
      replyText += `I highly recommend looking at: ${titles}! These perfectly match the mood or genre you describe. Let me know if you would like me to summarize any other title!`;
    } else {
      replyText += `I couldn't find an exact movie match in our catalog for that description. Try searching for genres like 'Sci-Fi', 'Comedy', 'Adventure', or 'Horror', and I'll find spectacular titles for you!`;
    }

    res.json({
      text: replyText,
      recommendedMovieIds: selectedIds
    });
  } catch (error) {
    console.error("AI Search request failed:", error);
    res.status(500).json({ error: "AI Assistant system encounter error" });
  }
});

// START VITE MIDDLEWARE OR STANDALONE SERVER serving client code
async function run() {
  console.log("Initializing database connections & seeding defaults...");
  await seedDatabase();

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express + Vite server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express + Vite server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Kwatch Movies full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

run().catch(err => {
  console.error("Failed to start server:", err);
});
