import React from "react";

interface LandingPageProps {
  onSignIn: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#07080c] text-white">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-6xl font-extrabold text-red-600">
          Kwatch Movies
        </h1>

        <p className="mt-6 max-w-2xl text-xl text-neutral-300">
          Watch thousands of movies and TV shows anytime, anywhere.
          Stream in HD with a beautiful cinematic experience.
        </p>

        <div className="mt-10 flex gap-4">
          <button
            onClick={onSignIn}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition"
          >
            Sign In
          </button>

          <button
            onClick={onSignIn}
            className="px-8 py-3 border border-white rounded-xl hover:bg-white hover:text-black transition"
          >
            Create Account
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6 py-20">
        <div className="bg-neutral-900 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            🎬 Unlimited Movies
          </h2>
          <p className="text-neutral-400">
            Enjoy action, comedy, horror, romance, documentaries and more.
          </p>
        </div>

        <div className="bg-neutral-900 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            ☁️ Cloud Streaming
          </h2>
          <p className="text-neutral-400">
            Fast streaming powered by Cloudflare R2.
          </p>
        </div>

        <div className="bg-neutral-900 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            📱 Watch Anywhere
          </h2>
          <p className="text-neutral-400">
            Watch on desktop, Android, Smart TVs and more.
          </p>
        </div>
      </section>
    </div>
  );
}