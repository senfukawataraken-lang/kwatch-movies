import React from 'react';

interface KwatchLogoProps {
  /** Size of the logo mark (width/height of the symbol in px) */
  size?: number;
  /** Whether to include the "Kwatch Movies" wordmark */
  includeText?: boolean;
  /** Layout orientation of the logo + title. 'horizontal' (nav-bar) or 'vertical' (splash/login) */
  layout?: 'horizontal' | 'vertical';
  /** Additional styling classes */
  className?: string;
  /** Custom color for the "Movies" subtitle badge */
  subtitleClass?: string;
}

export default function KwatchLogo({
  size = 40,
  includeText = true,
  layout = 'horizontal',
  className = '',
  subtitleClass = ''
}: KwatchLogoProps) {
  
  // Custom SVG path for the filmstrip crescent "C"
  // This draws a hollow stylized ring/crescent starting from top-right to bottom-right,
  // matching the uploaded logo's exact geometry and play-button center.
  const symbol = (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 hover:scale-105"
    >
      <defs>
        {/* Deep, metallic purple to violet-indigo gradient */}
        <linearGradient id="kwatch-symbol-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" /> {/* Purple 500 */}
          <stop offset="35%" stopColor="#7c3aed" /> {/* Violet 600 */}
          <stop offset="70%" stopColor="#6d28d9" /> {/* Violet 700 */}
          <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet 500 */}
        </linearGradient>

        <linearGradient id="kwatch-play-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8b4fe" /> {/* Light Purple */}
          <stop offset="100%" stopColor="#7c3aed" /> {/* Violet 600 */}
        </linearGradient>

        {/* Drop shadow filter for that three-dimensional cinematic floating vibe */}
        <filter id="kwatch-shadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Main Stylized Crescent C Shape */}
      <g filter="url(#kwatch-shadow)">
        <path 
          d="M 78 28
             C 65 14, 40 12, 26 26
             C 10 42, 10 68, 26 84
             C 42 100, 68 96, 78 82" 
          stroke="url(#kwatch-symbol-grad)" 
          strokeWidth="15" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* Filmstrip perforations cutout on the left curved arc */}
        {/* Hole 1: Top Left */}
        <rect x="24" y="28" width="6" height="6" rx="1.5" transform="rotate(-40, 27, 31)" fill="#05051a" />
        {/* Hole 2: Upper Mid-Left */}
        <rect x="15" y="41" width="6" height="6" rx="1.5" transform="rotate(-15, 18, 44)" fill="#05051a" />
        {/* Hole 3: Lower Mid-Left */}
        <rect x="15" y="55" width="6" height="6" rx="1.5" transform="rotate(15, 18, 58)" fill="#05051a" />
        {/* Hole 4: Bottom Left */}
        <rect x="24" y="68" width="6" height="6" rx="1.5" transform="rotate(40, 27, 71)" fill="#05051a" />
        
        {/* Centered gloss highlight play-button triangle */}
        <polygon 
          points="46,36 46,64 71,50" 
          fill="url(#kwatch-play-grad)" 
          className="animate-pulse"
        />
      </g>
    </svg>
  );

  if (!includeText) {
    return symbol;
  }

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        {/* Central emblem */}
        <div className="relative mb-5 scale-110">
          <div className="absolute inset-0 bg-purple-600/20 blur-2xl rounded-full scale-125" />
          {symbol}
        </div>

        {/* Brand Typographic Marks exactly like the logo graphic */}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-200 to-white font-sans uppercase pl-3">
            Kwatch
          </h1>
          
          {/* Subtitle with custom horizontal divider matching lines in the logo */}
          <div className="flex items-center justify-center gap-3.5 w-full max-w-sm px-6 pt-1">
            <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent to-purple-600/60" />
            <span className="text-xs font-black uppercase text-purple-400 tracking-[0.4em] pl-1 font-mono">
              Movies
            </span>
            <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent to-purple-600/60" />
          </div>
        </div>
      </div>
    );
  }

  // Compact horizontal layout (suited for Navbar)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon logo mark bounded by a subtle glow */}
      <div className="relative p-1 bg-neutral-900/30 border border-neutral-850 rounded-xl shadow-lg hover:shadow-purple-900/10 transition-all">
        {symbol}
      </div>

      {/* Brand Text block */}
      <div className="select-none">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
            Kwatch
          </span>
          <span className={`text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-md tracking-wider ${subtitleClass}`}>
            Movies
          </span>
        </div>
        <span className="text-[9px] text-neutral-500 block font-mono tracking-wide">STREAMS WITH COGNITIVE SEARCH</span>
      </div>
    </div>
  );
}
