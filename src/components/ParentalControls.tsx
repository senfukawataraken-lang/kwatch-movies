import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, Lock, Unlock, Eye, EyeOff, Check, User, AlertCircle, Info, RefreshCw, Key,
  Tv, Compass, Heart, Bookmark, Languages, Play, Award, Zap, Smile, BookOpen, Star, Plus, Minus,
  CreditCard, FileText, Download, Printer, Receipt, Calendar, Palette
} from 'lucide-react';
import { UserProfile, Movie } from '../types';
import BillingSimulator from './BillingSimulator';
import { getProfileBadges, Badge } from '../utils/badges';
import { securePin, verifyPin, decryptPin } from '../utils/security';
import { THEME_PRESETS } from '../utils/theme';

interface ParentalControlsProps {
  currentProfile: UserProfile;
  profiles: UserProfile[];
  onUpdateProfiles: (updated: UserProfile[]) => void;
  onClose: () => void;
  movies: Movie[];
}

// Maturity ratings configuration list
const MATURITY_LEVELS = [
  { rating: 'G', label: 'G - General Audience', desc: 'Suitable for all ages. Animation and standard family blockbusters.' },
  { rating: 'PG', label: 'PG - Parental Guidance', desc: 'Some material may not be suitable for young kids.' },
  { rating: 'PG-13', label: 'PG-13 - Parents Strongly Cautioned', desc: 'Some material may be inappropriate for children under 13.' },
  { rating: 'R', label: 'R - Restricted / Mature Adults', desc: 'Under 17 requires accompanying parent or adult guardian.' },
  { rating: 'All', label: 'All Content Allowed', desc: 'No maturity classification restrictions applied.' },
];

export default function ParentalControls({
  currentProfile,
  profiles,
  onUpdateProfiles,
  onClose,
  movies = []
}: ParentalControlsProps) {
  // Step workflow: PIN check if a parent profile already has a PIN.
  // This ensures a kids/restricted account cannot edit the controls without the parent PIN!
  const parentProfile = profiles.find(p => p.pinCode && !p.isKids) || profiles.find(p => p.pinCode) || currentProfile;
  const isSecurityVerificationNeeded = !!parentProfile.pinCode;

  const [verifiedSecured, setVerifiedSecured] = useState<boolean>(!isSecurityVerificationNeeded);
  const [securityPinInput, setSecurityPinInput] = useState<string>('');
  const [securityPinError, setSecurityPinError] = useState<boolean>(false);

  // Active profile being edited in parental settings panel
  const [editingProfileId, setEditingProfileId] = useState<string>(currentProfile.id);

  // Local values for editing active sub-profile
  const activeEditingProfile = profiles.find(p => p.id === editingProfileId) || currentProfile;

  // New local settings states
  const [showPinCode, setShowPinCode] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'billingHistory'>('profile');

  // Load active subscription plan name
  const [activeSubscription] = useState<string>(() => {
    try {
      return localStorage.getItem("kwatch_user_subscription") || "Premium Solitary";
    } catch {
      return "Premium Solitary";
    }
  });

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const getSubscriptionPrice = (plan: string) => {
    if (plan.includes("Free")) return 0;
    if (plan.includes("Family")) return 19.99;
    return 9.99;
  };

  const currentPrice = getSubscriptionPrice(activeSubscription);
  const formattedPrice = `$${currentPrice.toFixed(2)}`;

  const mockPayments = [
    { id: 'INV-2026-004', date: 'June 15, 2026', description: `${activeSubscription} - Monthly`, amount: formattedPrice, status: 'Succeeded', method: 'Visa ending in 4242' },
    { id: 'INV-2026-003', date: 'May 15, 2026', description: `${activeSubscription} - Monthly`, amount: formattedPrice, status: 'Succeeded', method: 'Visa ending in 4242' },
    { id: 'INV-2026-002', date: 'April 15, 2026', description: 'Premium Solitary - Monthly', amount: '$9.99', status: 'Succeeded', method: 'Visa ending in 4242' },
    { id: 'INV-2026-001', date: 'March 15, 2026', description: 'Premium Solitary - Monthly', amount: '$9.99', status: 'Succeeded', method: 'Visa ending in 4242' },
  ];

  const handleDownloadInvoice = (invoice: any) => {
    setDownloadingInvoiceId(invoice.id);
    setDownloadProgress(0);
    
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingInvoiceId(null);
            triggerSuccess(`Successfully exported invoice ${invoice.id} to downloads folder!`);
            
            // Initiate browser-native text receipt download
            try {
              const fileContent = `========================================
             KWATCH CINEMA INC.
              INVOICE RECEIPT
========================================
Invoice ID:   ${invoice.id}
Billing Date: ${invoice.date}
Recipient:    senfukawataraken@gmail.com
Plan Detail:  ${invoice.description}
Total Amount: ${invoice.amount}
Status:       ${invoice.status}
Processed:    ${invoice.method}
========================================
Thank you for streaming with Kwatch!
========================================`;
              const blob = new Blob([fileContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${invoice.id}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error(err);
            }
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handleVerifySecuredPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(securityPinInput, parentProfile.pinCode)) {
      setVerifiedSecured(true);
      setSecurityPinError(false);
    } else {
      setSecurityPinError(true);
      setSecurityPinInput('');
    }
  };

  const handleUpdateRating = (rating: 'G' | 'PG' | 'PG-13' | 'R' | 'All') => {
    const updated = profiles.map(p => {
      if (p.id === editingProfileId) {
        return {
          ...p,
          maxMaturityRating: rating,
          // If rating is set to general audience G, optionally sync isKids
          isKids: rating === 'G' ? p.isKids : p.isKids
        };
      }
      return p;
    });
    onUpdateProfiles(updated);
    triggerSuccess("Content maturity rating ceiling updated!");
  };

  const handleToggleKids = (isKids: boolean) => {
    const updated = profiles.map(p => {
      if (p.id === editingProfileId) {
        return {
          ...p,
          isKids,
          // Limit kids always to G by default for supreme safety
          maxMaturityRating: isKids ? 'G' : p.maxMaturityRating || 'All'
        };
      }
      return p;
    });
    onUpdateProfiles(updated);
    triggerSuccess(isKids ? "Restricted Kids mode enabled!" : "Standard mode enabled.");
  };

  const handleSavePin = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').substring(0, 4);
    const updated = profiles.map(p => {
      if (p.id === editingProfileId) {
        return {
          ...p,
          pinCode: cleanPin ? securePin(cleanPin) : undefined
        };
      }
      return p;
    });
    onUpdateProfiles(updated);
    triggerSuccess(cleanPin ? "Individual Profile lock PIN secured successfully!" : "Profile lock PIN completely removed.");
  };

  const handleUpdateColorTheme = (colorHex: string) => {
    const updated = profiles.map(p => {
      if (p.id === editingProfileId) {
        return {
          ...p,
          primaryColor: colorHex
        };
      }
      return p;
    });
    onUpdateProfiles(updated);
    triggerSuccess("Profile signature brand color theme updated!");
  };

  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-neutral-950 border border-neutral-850 rounded-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden shadow-2xl relative"
      >
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600/10 text-purple-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Parental Gate Controls</h3>
              <p className="text-[11px] text-neutral-500 font-mono tracking-wide uppercase">Configure Content Restraints & locks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-800 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY BARRIER: REQUIRE PARENT PIN BEFORE EDITING */}
        {!verifiedSecured ? (
          <div className="p-12 flex-1 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
            <div className="w-14 h-14 bg-red-600/10 border border-red-500/20 text-purple-500 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-white">Security Credentials Required</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Parental configurations are guarded. Please provide the security PIN for the account manager <span className="text-white font-semibold">({parentProfile.name})</span> to unlock editing privileges.
              </p>
            </div>

            <form onSubmit={handleVerifySecuredPin} className="w-full space-y-4">
              <input
                type="password"
                maxLength={4}
                value={securityPinInput}
                onChange={(e) => setSecurityPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="○ ○ ○ ○"
                className="w-full tracking-widest text-center text-3xl font-mono py-3 bg-neutral-900 border border-neutral-800 rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-purple-400 font-bold"
                autoFocus
              />

              {securityPinError && (
                <p className="text-red-500 text-xs flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Invalid lock PIN. Please try again!
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold rounded-xl text-neutral-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600/10 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Verify Pin
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* UNLOCKED PARENT CONTROL HUB */
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* SUB-HEADER TABS FOR ACCESS CONTROL VS BILLING SIMULATOR */}
            <div className="flex bg-neutral-900/40 border-b border-neutral-900 px-6 py-0.5 gap-5 shrink-0 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-3 text-xs font-bold relative transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'text-purple-400 border-b-2 border-purple-500'
                    : 'text-neutral-450 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Profile & Parental Controls
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('billing')}
                className={`py-3 text-xs font-bold relative transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'billing'
                    ? 'text-purple-400 border-b-2 border-purple-500'
                    : 'text-neutral-450 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Billing Simulator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('billingHistory')}
                className={`py-3 text-xs font-bold relative transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'billingHistory'
                    ? 'text-purple-400 border-b-2 border-purple-500'
                    : 'text-neutral-450 hover:text-white border-b-2 border-transparent'
                }`}
              >
                Billing History
              </button>
            </div>

            {activeTab === 'profile' ? (
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* PROFILE SELECTION SIDEBAR OR RAIL */}
            <div className="w-full md:w-56 bg-neutral-950/80 border-r border-neutral-900 p-4 space-y-3 shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-3 md:gap-0">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest hidden md:block pb-1">
                Select Profile
              </span>
              
              {profiles.map((p) => {
                const isActive = p.id === editingProfileId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setEditingProfileId(p.id)}
                    className={`flex items-center gap-2.5 w-full p-2 rounded-xl transition-all text-left whitespace-nowrap md:whitespace-normal cursor-pointer border ${
                      isActive 
                        ? 'bg-neutral-905 border-neutral-800 text-white' 
                        : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                    }`}
                  >
                    <img 
                      src={p.avatarUrl} 
                      alt="Avatar" 
                      className={`w-7 h-7 rounded-lg border ${isActive ? 'border-purple-500' : 'border-neutral-800'}`} 
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block truncate leading-tight">{p.name}</span>
                      <span className="text-[9px] text-neutral-500 block leading-none mt-0.5 font-mono">
                        {p.isKids ? 'Kids Restricted' : 'Full Access'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* EDITING INTERFACES PANEL */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* SUCCESS TOAST AND FEEDBACK */}
              <AnimatePresence>
                {successToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-xs font-semibold"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    {successToast}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ACTIVE PROFILE SUMMARY HEADER */}
              <div className="flex items-center justify-between p-4 bg-neutral-900/30 rounded-xl border border-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={activeEditingProfile.avatarUrl} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-xl border border-neutral-800"
                      referrerPolicy="no-referrer"
                    />
                    {activeEditingProfile.pinCode && (
                      <span className="absolute -top-1.5 -right-1.5 bg-purple-650 text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black text-white">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeEditingProfile.name}</h4>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5 uppercase tracking-wide">
                      Maturity limit: <span className="text-purple-400 font-bold">{activeEditingProfile.maxMaturityRating || 'All'}</span>
                    </p>
                  </div>
                </div>

                {/* CONVERT KIDS FLIP */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase hidden sm:inline">Restricted Kids Mode:</span>
                  <button
                    onClick={() => handleToggleKids(!activeEditingProfile.isKids)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                      activeEditingProfile.isKids
                        ? 'bg-purple-650/15 border-purple-500/25 text-purple-400'
                        : 'bg-neutral-905 hover:bg-neutral-800 border-neutral-850 text-neutral-400'
                    }`}
                  >
                    {activeEditingProfile.isKids ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* SECTOR 1: PIN LOCK MANAGEMENT */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Individual Profile PIN Lock</h4>
                </div>

                <p className="text-xs text-neutral-450 leading-relaxed">
                  Require a 4-digit password code to open this profile. This keeps children and younger family members from accessing mature catalog selections on standard profiles.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type={showPinCode ? "text" : "password"}
                    maxLength={4}
                    placeholder={activeEditingProfile.pinCode ? "**** LOCKED ****" : "No lock set. Create a 4-digit PIN"}
                    value={decryptPin(activeEditingProfile.pinCode)}
                    onChange={(e) => handleSavePin(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 max-w-sm px-3.5 py-2 bg-neutral-950 border border-neutral-850 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500 transition-colors uppercase tracking-widest text-center"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPinCode(!showPinCode)}
                      className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showPinCode ? 'Hide' : 'Show'}</span>
                    </button>
                    {activeEditingProfile.pinCode && (
                      <button
                        type="button"
                        onClick={() => handleSavePin('')}
                        className="px-3 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/20 text-red-400 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Clear PIN
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTOR 1.5: PROFILE PORTAL COLOR THEME */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <Palette className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Primary Color Theme Selection</h4>
                </div>

                <p className="text-xs text-neutral-450 leading-relaxed">
                  Choose a signature color tone to personalize this profile's specific cinematic experience. The chosen theme will instantly colorize buttons, progress counters, badges, and background highlights of the movie player is running under this profile.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEME_PRESETS.map((themePreset) => {
                    const isSelected = (activeEditingProfile.primaryColor || '#8B5CF6').toLowerCase() === themePreset.primaryColor.toLowerCase();
                    return (
                      <button
                        key={themePreset.id}
                        type="button"
                        onClick={() => handleUpdateColorTheme(themePreset.primaryColor)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-neutral-900 border-purple-500 text-white shadow-lg shadow-purple-900/10' 
                            : 'bg-neutral-950/60 border-neutral-900 text-neutral-400 hover:border-neutral-850 hover:bg-neutral-900/40'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full shadow-inner border border-white/10" 
                          style={{ backgroundColor: themePreset.primaryColor }}
                        />
                        <span className="text-xs font-semibold tracking-wide">{themePreset.name}</span>
                        {isSelected && (
                          <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Active Choice</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EDIT SECTOR 2: CONTENT MATURITY RATINGS LIMITS */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Maturity Rating Filter Ceiling</h4>
                </div>

                <p className="text-xs text-neutral-450 leading-relaxed">
                  Restrict movies and series based on target rating classifications. Restricted entries will be instantly hidden from recommendations, search results, and streams.
                </p>

                {activeEditingProfile.isKids ? (
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-purple-400 leading-relaxed font-semibold">
                      Kids restriction is actively locked on this page. Kids Profiles are strictly locked to G-rated general audiences. To enable PG or PG-13 classifications, disable <strong>Restricted Kids Mode</strong> toggled above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {MATURITY_LEVELS.map((level) => {
                      const isSelected = activeEditingProfile.maxMaturityRating === level.rating || 
                                        (!activeEditingProfile.maxMaturityRating && level.rating === 'All');
                      
                      return (
                        <button
                          key={level.rating}
                          onClick={() => handleUpdateRating(level.rating as any)}
                          className={`w-full p-3.5 text-left rounded-xl transition-all border block cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600/10 border-purple-500 text-white'
                              : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-900/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-bold block">{level.label}</strong>
                            {isSelected && <span className="bg-purple-650 text-[9px] font-bold text-white px-2 py-0.5 rounded uppercase font-mono">Selected Limit</span>}
                          </div>
                          <span className="text-[11px] text-neutral-500 block mt-1 leading-snug">{level.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTOR 3: 'MOVIE LOVER' ACHIEVEMENT BADGES */}
              <div className="space-y-4 pt-4 border-t border-neutral-900/60">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-400 animate-pulse" />
                    <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">'Movie Lover' Achievement Badges</h4>
                  </div>
                  {/* Badge count indicator */}
                  <span className="text-[10px] bg-purple-650/20 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {getProfileBadges(activeEditingProfile, movies).filter(b => b.isUnlocked).length} of 6 Unlocked
                  </span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Earn premium collectible badges by expanding your watch history, setting favorites, and exploring foreign and local translation commentaries.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getProfileBadges(activeEditingProfile, movies).map((badge) => {
                    const BADGE_ICONS: Record<string, React.ComponentType<any>> = {
                      Tv, Compass, Heart, Bookmark, Languages, Play, Award, Zap, Smile
                    };
                    const IconComponent = BADGE_ICONS[badge.iconName] || Award;
                    return (
                      <div 
                        key={badge.id}
                        className={`relative rounded-2xl border p-4 transition-all duration-300 flex gap-3.5 bg-neutral-950/40 select-none group ${
                          badge.isUnlocked 
                            ? 'border-purple-500/25 shadow-lg shadow-purple-500/[0.02] hover:border-purple-500/40 hover:bg-neutral-950/60' 
                            : 'border-neutral-900 opacity-60 hover:opacity-85 hover:border-neutral-800'
                        }`}
                      >
                        {/* Status Icon Indicator */}
                        {badge.isUnlocked && (
                          <div className="absolute top-2.5 right-2.5 bg-purple-650 text-white p-0.5 rounded-full border border-black" title="Badge Unlocked">
                            <Check className="w-2.5 h-2.5 font-bold" />
                          </div>
                        )}

                        {/* Left Side: Avatar/Icon frame with gradient fallback */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 bg-gradient-to-br ${
                          badge.isUnlocked 
                            ? 'from-purple-600/20 to-purple-500/5 text-purple-400 border-purple-500/20' 
                            : 'from-neutral-900/40 to-neutral-800/10 text-neutral-500 border-neutral-850'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>

                        {/* Right Side: Text & Progress */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-black text-white flex items-center gap-1.5 leading-tight">
                            {badge.name}
                          </h5>
                          <p className="text-[10px] text-neutral-400 leading-snug mt-1 line-clamp-2">
                            {badge.description}
                          </p>

                          {/* Progress indicator */}
                          <div className="mt-2.5 space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-mono tracking-wide">
                              <span className="text-neutral-500 uppercase">{badge.criteria}</span>
                              <span className={`font-bold uppercase ${badge.isUnlocked ? 'text-purple-400' : 'text-neutral-500'}`}>
                                {badge.progressText}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                              <div 
                                className={`h-full rounded-full transition-all duration-550 ${
                                  badge.isUnlocked ? 'bg-purple-600' : 'bg-neutral-700'
                                }`} 
                                style={{ width: `${badge.progress}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTOR 4: DEMO WATCH LOG HISTORY SIMULATOR */}
              <div className="space-y-4 pt-4 border-t border-neutral-900/60">
                <div className="flex items-center gap-2 border-b border-neutral-900 pb-2">
                  <RefreshCw className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Demo Watch History Simulator</h4>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Directly inject simulated watch event packets to test automated badge calculations instantly without sitting through hours of streams.
                </p>

                <div className="bg-neutral-950/60 border border-neutral-900 rounded-2xl p-4 space-y-3.5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <select 
                        id="watch-simulator-movie-select"
                        className="w-full bg-neutral-900 border border-neutral-800 text-xs px-3.5 py-2.5 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">-- Choose a title from the catalog --</option>
                        {movies.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.title} ({m.genres ? m.genres.join('/') : 'General'} • {m.language || 'English'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const selectEl = document.getElementById('watch-simulator-movie-select') as HTMLSelectElement;
                        const movieId = selectEl?.value;
                        if (!movieId) {
                          alert("Please select a title from the dropdown first.");
                          return;
                        }
                        
                        // Add movie log
                        const existHistory = activeEditingProfile.recentlyWatched || [];
                        if (existHistory.some(w => w.movieId === movieId)) {
                          alert(`"${movies.find(m => m.id === movieId)?.title}" is already present in your watch history.`);
                          return;
                        }

                        const targetMovie = movies.find(m => m.id === movieId);
                        const cleanTitle = targetMovie ? targetMovie.title : 'Movie';

                        const newLog = {
                          movieId,
                          watchedAt: new Date().toISOString(),
                          progress: 100
                        };

                        const updatedProfiles = profiles.map(p => {
                          if (p.id === activeEditingProfile.id) {
                            return {
                              ...p,
                              recentlyWatched: [newLog, ...(p.recentlyWatched || [])]
                            };
                          }
                          return p;
                        });

                        onUpdateProfiles(updatedProfiles);
                        triggerSuccess(`Added simulated watch log packet for "${cleanTitle}"!`);
                        if (selectEl) selectEl.value = "";
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 border border-orange-500/20 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer select-none"
                    >
                      <Plus className="w-4 h-4" /> Simulate 100% Watch
                    </button>
                  </div>

                  {/* Watched Titles List inside settings */}
                  {activeEditingProfile.recentlyWatched && activeEditingProfile.recentlyWatched.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-900 pb-1">
                        <span>Simulated Watch History ({activeEditingProfile.recentlyWatched.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Reset watch history list coordinates for this profile? Badges will lock again.")) {
                              const updatedProfiles = profiles.map(p => {
                                if (p.id === activeEditingProfile.id) {
                                  return { ...p, recentlyWatched: [] };
                                }
                                return p;
                              });
                              onUpdateProfiles(updatedProfiles);
                              triggerSuccess("Watch history cleared cleanly.");
                            }
                          }}
                          className="text-red-400 hover:text-red-300 font-bold tracking-normal uppercase text-[9px] cursor-pointer"
                        >
                          Clear All Logs
                        </button>
                      </div>

                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {activeEditingProfile.recentlyWatched.map(w => {
                          const movie = movies.find(m => m.id === w.movieId);
                          if (!movie) return null;
                          return (
                            <div key={w.movieId} className="flex justify-between items-center px-2.5 py-1.5 bg-neutral-900/60 rounded-lg text-[11px] hover:bg-neutral-900 transition-colors">
                              <span className="text-white font-semibold truncate max-w-[280px]">
                                {movie.title} <span className="text-[9px] text-neutral-500 font-normal font-mono">({movie.language || 'English'})</span>
                              </span>
                              <div className="flex items-center gap-4 text-[10px] text-neutral-500 font-mono">
                                <span>{movie.genres ? movie.genres[0] : 'General'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedProfiles = profiles.map(p => {
                                      if (p.id === activeEditingProfile.id) {
                                        return {
                                          ...p,
                                          recentlyWatched: (p.recentlyWatched || []).filter(item => item.movieId !== w.movieId)
                                        };
                                      }
                                      return p;
                                    });
                                    onUpdateProfiles(updatedProfiles);
                                    triggerSuccess(`Removed watchlog payload for "${movie.title}".`);
                                  }}
                                  className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                                  title="Remove log entry"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-500 text-xs italic">
                      No watch history coordinates simulated yet for this profile. Select a movie above to start!
                    </div>
                  )}
                </div>
              </div>

              </div>
            </div>
          ) : activeTab === 'billing' ? (
            <div className="flex-1 overflow-y-auto p-6 md:px-8">
              <BillingSimulator onSubscriptionApplied={(newPlan) => triggerSuccess(`Upgraded membership to ${newPlan} in real-time!`)} />
            </div>
          ) : (
            /* BILLING HISTORY SYSTEM VIEW */
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* METRIC BADGE BLOCKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* PLAN DETAIL CARD */}
                <div className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/20 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
                  <div className="flex items-center gap-2 text-neutral-400 uppercase font-mono text-[9px] tracking-wider mb-2">
                    <Zap className="w-3.5 h-3.5 text-purple-400 font-bold" />
                    Subscription Plan
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white leading-tight">{activeSubscription}</h4>
                    <span className="text-[10px] text-purple-400 font-mono font-black mt-1 inline-block bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {formattedPrice} / Mo
                    </span>
                  </div>
                  <div className="border-t border-neutral-900 mt-3 pt-2 text-[10px] text-neutral-500 flex justify-between items-center">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                    </span>
                  </div>
                </div>

                {/* VIRTUAL CREDIT CARD */}
                <div className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/20 transition-all">
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-neutral-400 uppercase font-mono text-[9px] tracking-wider">
                      <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                      Payment Method
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-neutral-500 font-bold">VISA</span>
                  </div>
                  <div className="mt-2.5">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-400 select-none">
                      <span>••••</span> <span>••••</span> <span>••••</span> <span className="text-white font-extrabold font-sans">4242</span>
                    </div>
                    <p className="text-[8px] text-neutral-600 font-mono mt-1 uppercase tracking-wide">Primary Account Owner</p>
                  </div>
                  <div className="border-t border-neutral-900 mt-2.5 pt-2 text-[10px] text-neutral-500 flex justify-between items-center font-mono">
                    <span>Expiry:</span>
                    <span className="text-neutral-400 font-bold">12 / 29</span>
                  </div>
                </div>

                {/* NEXT RENEWAL DETAILS */}
                <div className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/20 transition-all sm:col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                  <div className="flex items-center gap-2 text-neutral-400 uppercase font-mono text-[9px] tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Next Renewal Date
                  </div>
                  <div>
                    <h5 className="text-[10px] text-neutral-500 font-bold font-mono leading-none">Auto-Bill Enabled</h5>
                    <p className="text-sm font-bold text-white mt-1">July 15, 2026</p>
                  </div>
                  <div className="border-t border-neutral-900 mt-3 pt-2 text-[10px] text-neutral-500 flex justify-between items-center">
                    <span>Estimated Total:</span>
                    <span className="text-neutral-300 font-bold font-mono">{formattedPrice}</span>
                  </div>
                </div>
              </div>

              {/* STATEMENTS LEDGER TABLE */}
              <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 px-5 border-b border-neutral-900 bg-neutral-900/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-neutral-300 uppercase tracking-widest font-mono">Invoice Ledger</h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Simulated real-time tracking of subscription charges</p>
                  </div>
                  <div className="p-1 px-2.5 bg-neutral-900 rounded-lg text-neutral-400 text-[10px] font-mono border border-neutral-850">
                    4 Payments Logged
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-neutral-900 bg-neutral-950 text-neutral-500 font-bold font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-4 px-5">Invoice</th>
                        <th className="p-4">Paid Date</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Receipt Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/70">
                      {mockPayments.map((p) => {
                        const isDownloading = downloadingInvoiceId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-neutral-900/10 transition-colors group">
                            <td className="p-4 px-5 font-mono text-cyan-400 font-bold text-[11px] tracking-wide">
                              {p.id}
                            </td>
                            <td className="p-4 text-neutral-300 font-mono text-[11px]">
                              {p.date}
                            </td>
                            <td className="p-4 text-neutral-400 font-medium">
                              {p.description}
                            </td>
                            <td className="p-4 font-mono text-white font-extrabold">
                              {p.amount}
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" /> {p.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(p)}
                                className="px-2.5 py-1 text-[10px] font-bold hover:text-white text-neutral-400 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 rounded-lg transition-all cursor-pointer"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleDownloadInvoice(p)}
                                className={`px-2.5 py-1 text-[10px] font-bold inline-flex items-center gap-1 rounded-lg transition-all border cursor-pointer ${
                                  isDownloading
                                    ? 'bg-purple-950/30 text-purple-400 border-purple-500/30'
                                    : 'bg-purple-600/10 text-purple-400 hover:text-white border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-600/25'
                                }`}
                              >
                                {isDownloading ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    {downloadProgress}%
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3 h-3" />
                                    PDF
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DETAILED RECEIPT MODAL DRAWER INSIDE WINDOW */}
              <AnimatePresence>
                {selectedInvoice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="p-5 border border-neutral-850 bg-neutral-900/60 rounded-2xl relative block shadow-2xl overflow-hidden mt-4 backdrop-blur-md"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-amber-500" />
                    
                    {/* DRAWER HEADER ACTIONS */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-900 pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">Invoice Receipt Preview</h4>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">TRANSACTION REF ID: #{selectedInvoice.id}-SIMULATED</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(selectedInvoice)}
                          className="flex-1 sm:flex-none px-2.5 py-1.5 text-[10px] inline-flex items-center justify-center gap-1 bg-purple-650 text-white hover:bg-purple-600 rounded-lg font-bold transition-all cursor-pointer shadow-md"
                        >
                          <Download className="w-3.5 h-3.5" /> Download (.txt)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(null)}
                          className="flex-1 sm:flex-none px-2.5 py-1.5 text-[10px] bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                        >
                          Hide Preview
                        </button>
                      </div>
                    </div>

                    {/* PHYSICAL RECEIPT FORMATTING CONTAINER */}
                    <div className="bg-black/80 border border-neutral-900 p-5 rounded-xl font-mono text-[11px] leading-relaxed text-neutral-400 font-normal relative">
                      <div className="absolute top-6 right-6 text-right font-black tracking-widest text-[13px] text-cyan-500/20 uppercase select-none pointer-events-none rotate-6">
                        PAID SUCCESS
                      </div>

                      <div className="flex justify-between items-start border-b border-neutral-900 pb-3 mb-3">
                        <div>
                          <p className="text-white font-black tracking-widest uppercase text-[12px]">KWATCH CINEMA INC.</p>
                          <p className="text-[10px] text-neutral-500">Global Digital Cinema Division</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-white">Invoice No: {selectedInvoice.id}</p>
                          <p className="text-[10px] text-neutral-500">Date: {selectedInvoice.date}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-neutral-900 pb-3 mb-3 text-left">
                        <div>
                          <p className="text-neutral-500 uppercase text-[8px] font-black tracking-widest">Subscriber Identity:</p>
                          <p className="text-neutral-300 font-bold mt-0.5 truncate">senfukawataraken@gmail.com</p>
                          <p className="text-[10px] text-neutral-500 italic">Sandbox Account Status</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-neutral-500 uppercase text-[8px] font-black tracking-widest">Card Used:</p>
                          <p className="text-neutral-300 font-bold mt-0.5">{selectedInvoice.method}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold italic mt-0.5">Authorization complete</p>
                        </div>
                      </div>

                      {/* ITEM DETAILS */}
                      <div className="space-y-1.5 border-b border-neutral-900 pb-3 mb-3 text-left">
                        <p className="text-neutral-500 uppercase text-[8px] font-black tracking-widest">Subtotal Breakdown:</p>
                        <div className="flex justify-between text-neutral-300">
                          <span>1x {selectedInvoice.description}</span>
                          <span className="text-white font-bold">{selectedInvoice.amount}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500 text-[10px]">
                          <span>↳ Local Sales Tax Allowance (Included)</span>
                          <span>$0.00</span>
                        </div>
                      </div>

                      {/* CONCLUDING RECONCILIATION */}
                      <div className="flex justify-between items-center bg-neutral-950 p-3 rounded-lg border border-neutral-900 text-left">
                        <div>
                          <p className="text-neutral-450 uppercase text-[8px] font-black tracking-widest">Total Succeeded charge</p>
                          <p className="text-neutral-500 text-[9px] mt-0.5">No additional service commissions assessed.</p>
                        </div>
                        <span className="text-[15px] text-purple-400 font-bold font-sans">{selectedInvoice.amount}</span>
                      </div>

                      {/* WATERMARK BARCODE */}
                      <div className="flex flex-col items-center justify-center pt-4 opacity-40 hover:opacity-80 transition-opacity">
                        <div className="text-[14px] text-neutral-300 font-mono tracking-[0.24em] leading-tight select-none select-none">
                          |||||| || | | |||| | ||| | ||| | || | |
                        </div>
                        <p className="text-[8px] text-neutral-500 tracking-wider text-center mt-1 uppercase font-semibold">SECURE DIGITAL STREAMING RECEIPT</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        )}

        {/* SECURITY CACHE ACKNOWLEDGEMENT FOOTER */}
        <div className="p-4 px-6 bg-neutral-950 border-t border-neutral-900 text-[10px] sm:text-xs text-neutral-500 flex items-center justify-between bg-neutral-900/10">
          <span className="flex items-center gap-1.5 font-semibold">
            <Lock className="w-4 h-4 text-purple-400" />
            Locked Sandbox Parental Control Safe-Zone
          </span>
          <span className="font-mono text-[9px] text-neutral-600">ESA Safe Stream Controls</span>
        </div>
      </motion.div>
    </div>
  );
}
