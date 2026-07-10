import React from "react";
import {
  Check,
  ChevronRight,
  Film,
  MonitorPlay,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  Wifi,
} from "lucide-react";

import { Movie } from "../types";

interface LandingPageProps {
  onSignIn: () => void;
  movies: Movie[];
}

const previewMovies = movies
  .filter((movie) => movie.posterUrl && movie.posterUrl.trim() !== "")
  .slice(0, 8);

const plans = [
  {
    name: "Free",
    price: "Shs 0",
    description: "Watch movies with advertisements.",
    features: ["Movie access", "Ad-supported playback", "Watch on one device"],
  },
  {
    name: "Premium",
    price: "Shs 37,000",
    description: "A private plan for one viewer.",
    features: ["No platform ads", "Full HD streaming", "Watchlist and history"],
    featured: true,
  },
  {
    name: "Family",
    price: "Shs 74,000",
    description: "Entertainment for the whole household.",
    features: ["Multiple profiles", "Parental controls", "Watch on several devices"],
  },
];

export default function LandingPage({
  onSignIn,
  movies,
}: LandingPageProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07080c] text-white">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3"
            aria-label="Kwatch Movies home"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-950/40">
              <Film className="h-6 w-6" />
            </div>

            <div className="text-left">
              <span className="block text-lg font-black tracking-tight">
                Kwatch Movies
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Stream your world
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <a
              href="#plans"
              className="hidden text-sm font-semibold text-neutral-300 transition hover:text-white sm:block"
            >
              Plans
            </a>

            <button
              type="button"
              onClick={onSignIn}
              className="rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold backdrop-blur-md transition hover:bg-white hover:text-black"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[760px] items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2000&q=85"
            alt=""
            className="h-full w-full object-cover opacity-35"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#07080c] via-[#07080c]/90 to-[#07080c]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-transparent to-black/50" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-36 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-300">
              <Sparkles className="h-4 w-4" />
              Movies, series and local entertainment
            </div>

            <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Entertainment that
              <span className="block bg-gradient-to-r from-orange-400 via-amber-300 to-red-500 bg-clip-text text-transparent">
                moves with you.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
              Stream movies, series, trailers and translated entertainment on
              your phone, computer or television. Discover new stories and
              continue watching wherever you left off.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 px-7 py-4 text-sm font-black shadow-xl shadow-orange-950/40 transition hover:scale-[1.02]"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Watching
              </button>

              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold backdrop-blur-md transition hover:bg-white/10"
              >
                Create Account
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-neutral-400">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Secure streaming
              </span>

              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Multiple profiles
              </span>

              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                Mobile and web access
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-10 rounded-full bg-orange-600/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950/80 p-4 shadow-2xl backdrop-blur-xl">
              <div className="relative aspect-video overflow-hidden rounded-3xl">
                <img
                  src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=85"
                  alt="Kwatch Movies featured entertainment"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                <button
                  type="button"
                  onClick={onSignIn}
                  className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-xl transition hover:scale-110"
                  aria-label="Start watching"
                >
                  <Play className="ml-1 h-6 w-6 fill-current" />
                </button>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-400">
                    Featured tonight
                  </span>

                  <h2 className="mt-2 text-2xl font-black">
                    Stories worth watching
                  </h2>

                  <p className="mt-1 text-sm text-neutral-300">
                    Discover movies selected for your mood.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview movies */}
      <section className="border-y border-white/5 bg-neutral-950/40 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
                Discover
              </span>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Something for every mood
              </h2>
            </div>

            <button
              type="button"
              onClick={onSignIn}
              className="hidden items-center gap-1 text-sm font-bold text-neutral-300 hover:text-white sm:flex"
            >
              Explore all
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
           {previewMovies.map((movie) => (
  <button
    key={movie.id}
    type="button"
    onClick={onSignIn}
    className="group overflow-hidden rounded-2xl border border-white/5 bg-neutral-900 text-left transition hover:-translate-y-1 hover:border-orange-500/30"
  >
    <div className="aspect-[2/3] overflow-hidden">
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
    </div>

    <div className="p-4">
      <h3 className="font-bold text-white">{movie.title}</h3>
      <p className="mt-1 text-xs text-neutral-500">
        {movie.genres?.[0] || movie.type || "Movie"}
      </p>
    </div>
  </button>
))}

            <p className="mt-4 leading-7 text-neutral-400">
              One Kwatch account gives you access across supported devices,
              with personalized profiles and protected playback.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MonitorPlay,
                title: "High-quality streaming",
                text: "Enjoy clear movie playback with secure cloud delivery.",
              },
              {
                icon: Smartphone,
                title: "Mobile ready",
                text: "Use Kwatch Movies on Android phones, tablets and browsers.",
              },
              {
                icon: Tv,
                title: "Big-screen experience",
                text: "Enjoy a cinematic interface designed for larger displays.",
              },
              {
                icon: ShieldCheck,
                title: "Protected access",
                text: "Private media links and account controls help protect content.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/5 bg-neutral-950 p-6 transition hover:border-orange-500/20"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-black">{feature.title}</h3>

                <p className="mt-3 text-sm leading-6 text-neutral-400">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section
        id="plans"
        className="border-y border-white/5 bg-neutral-950/60 py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
              Membership
            </span>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Choose how you watch
            </h2>

            <p className="mt-4 text-neutral-400">
              Start with free access or upgrade to a premium viewing experience.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-7 ${
                  plan.featured
                    ? "border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-neutral-950 shadow-xl shadow-orange-950/20"
                    : "border-white/5 bg-neutral-950"
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Popular
                  </span>
                )}

                <h3 className="text-xl font-black">{plan.name}</h3>

                <div className="mt-5">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="ml-1 text-sm text-neutral-500">/month</span>
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-neutral-400">
                  {plan.description}
                </p>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm text-neutral-300"
                    >
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onSignIn}
                  className={`mt-8 w-full rounded-xl px-5 py-3 text-sm font-black transition ${
                    plan.featured
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "border border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-gradient-to-br from-orange-600/20 via-neutral-950 to-red-600/10 px-6 py-14 text-center sm:px-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />

            <Wifi className="relative mx-auto h-9 w-9 text-orange-400" />

            <h2 className="relative mt-5 text-3xl font-black sm:text-4xl">
              Your next movie night starts here
            </h2>

            <p className="relative mx-auto mt-4 max-w-xl leading-7 text-neutral-300">
              Sign in to explore the Kwatch Movies catalogue, create profiles
              and start streaming.
            </p>

            <button
              type="button"
              onClick={onSignIn}
              className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-black transition hover:scale-[1.02]"
            >
              Continue to Kwatch Movies
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-bold text-neutral-300">Kwatch Movies</p>
            <p className="mt-1 text-xs">
              Movies, series and entertainment for your screen.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs">
            <button type="button" onClick={onSignIn} className="hover:text-white">
              Sign In
            </button>
            <a href="#plans" className="hover:text-white">
              Plans
            </a>
            <span>© {new Date().getFullYear()} Kwatch Movies</span>
          </div>
        </div>
      </footer>
    </div>
  );
}