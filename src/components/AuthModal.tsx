import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Plus, ShieldAlert, ArrowRight, ArrowLeft, Eye, EyeOff, RotateCw, Check, Shield, Palette
} from 'lucide-react';
import { UserProfile, UserAccount } from '../types';
import KwatchLogo from './KwatchLogo';
import { securePin, verifyPin } from '../utils/security';
import { THEME_PRESETS } from '../utils/theme';

interface AuthModalProps {
  onSelectProfile: (profile: UserProfile) => void;
  currentProfile: UserProfile | null;
  onLogout: () => void;
  profiles: UserProfile[];
  onUpdateProfiles: (updated: UserProfile[]) => void;
  currentAccount: UserAccount | null;
  onLoginAccount: (account: UserAccount) => void;
  onLogoutAccount: () => void;
  isNewDevice: boolean;
  setIsNewDevice: (isNew: boolean) => void;
}

export default function AuthModal({ 
  onSelectProfile, 
  currentProfile, 
  onLogout,
  profiles,
  onUpdateProfiles,
  currentAccount,
  onLoginAccount,
  onLogoutAccount,
  isNewDevice,
  setIsNewDevice
}: AuthModalProps) {
  // Navigation states
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  
  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotQuestion, setForgotQuestion] = useState<string>("");
  const [forgotAnswerInput, setForgotAnswerInput] = useState<string>("");
  const [forgotNewPassword, setForgotNewPassword] = useState<string>("");
  const [forgotStep, setForgotStep] = useState<'email' | 'question' | 'reset'>('email');

  // Login input states
  const [emailLogin, setEmailLogin] = useState<string>("");
  const [passLogin, setPassLogin] = useState<string>("");
  const [showPasswordRaw, setShowPasswordRaw] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Sign up inputs
  const [signUpName, setSignUpName] = useState<string>("");
  const [signUpEmail, setSignUpEmail] = useState<string>("");
  const [signUpPassword, setSignUpPassword] = useState<string>("");
  const [signUpQuestion, setSignUpQuestion] = useState<string>("What is your favorite movie of all time?");
  const [signUpAnswer, setSignUpAnswer] = useState<string>("Interstellar");

  // Profiles states
  const [selectedProfileCandidate, setSelectedProfileCandidate] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [newProfileIsKids, setNewProfileIsKids] = useState<boolean>(false);
  const [newProfilePin, setNewProfilePin] = useState<string>("");
  const [newProfileColor, setNewProfileColor] = useState<string>("#8b5cf6");
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState<string>(() => Math.random().toString(36).substring(3, 8));
  const [profileCreationError, setProfileCreationError] = useState<string>("");

  // Default admin and test accounts fallback list with predefined security options
  const defaultAccounts = [
    { email: "admin@kwatch.com", name: "Papa Ken (Admin)", password: "41823", isAdmin: true, securityQuestion: "What is your favorite movie of all time?", securityAnswer: "Interstellar" },
    { email: "senfukawataraken@gmail.com", name: "Ken", password: "41823", isAdmin: true, securityQuestion: "What is your favorite movie of all time?", securityAnswer: "Interstellar" }
  ];

  const getRegisteredAccounts = (): { email: string; name: string; password?: string; isAdmin: boolean; securityQuestion?: string; securityAnswer?: string }[] => {
    let list: any[] = [];
    try {
      const saved = localStorage.getItem("kwatch_registered_accounts");
      if (saved) list = JSON.parse(saved);
    } catch {}

    defaultAccounts.forEach(account => {
      const exists = list.find(a => a.email.toLowerCase() === account.email.toLowerCase());
      if (!exists) {
        list.push(account);
      } else {
        exists.password = account.password;
        exists.isAdmin = account.isAdmin;
        if (!exists.securityQuestion) {
          exists.securityQuestion = account.securityQuestion;
          exists.securityAnswer = account.securityAnswer;
        }
      }
    });

    try {
      localStorage.setItem("kwatch_registered_accounts", JSON.stringify(list));
    } catch {}

    return list;
  };

  const saveRegisteredAccount = (account: { email: string; name: string; password?: string; isAdmin: boolean; securityQuestion?: string; securityAnswer?: string }) => {
    try {
      const list = getRegisteredAccounts();
      const existingIdx = list.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
      if (existingIdx === -1) {
        list.push(account);
      } else {
        list[existingIdx] = { ...list[existingIdx], ...account };
      }
      localStorage.setItem("kwatch_registered_accounts", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const email = emailLogin.trim().toLowerCase();
    const password = passLogin.trim();

    if (!email || !password) {
      setLocalError("Please fill out all fields.");
      return;
    }

    setIsAuthenticating(true);

    // Simulate standard professional responsive delay
    setTimeout(() => {
      const isSeedAdmin = email === "admin@kwatch.com" || email === "senfukawataraken@gmail.com";
      const isAdmin = isSeedAdmin || email.includes("admin");

      const localAccounts = getRegisteredAccounts();
      const found = localAccounts.find(a => a.email.toLowerCase() === email);

      if (!found) {
        setIsAuthenticating(false);
        if (isSeedAdmin && password === "41823") {
          const newAdmin = { 
            email, 
            name: email === "admin@kwatch.com" ? "Papa Ken" : "Ken", 
            password: "41823", 
            isAdmin: true,
            securityQuestion: "What is your favorite movie of all time?",
            securityAnswer: "Interstellar"
          };
          saveRegisteredAccount(newAdmin);
          onLoginAccount({ email, name: newAdmin.name, isAdmin: true });
          return;
        }
        setLocalError("We couldn't find an account associated with that email.");
        return;
      }

      if (found.password && found.password !== password) {
        setIsAuthenticating(false);
        const hint = isSeedAdmin ? "41823" : "1234";
        setLocalError(`Incorrect password. (Hint: Use '${hint}' for testing or click forgot password)`);
        return;
      }

      setIsAuthenticating(false);
      onLoginAccount({
        email: found.email,
        name: found.name,
        isAdmin: found.isAdmin
      });
    }, 900);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const name = signUpName.trim();
    const email = signUpEmail.trim().toLowerCase();
    const password = signUpPassword.trim();
    const sQuestion = signUpQuestion.trim();
    const sAnswer = signUpAnswer.trim();

    if (!name || !email || !password || !sAnswer) {
      setLocalError("All fields, including security answer, are required.");
      return;
    }

    setIsAuthenticating(true);

    setTimeout(() => {
      const accounts = getRegisteredAccounts();
      const exists = accounts.find(a => a.email.toLowerCase() === email);

      if (exists) {
        setIsAuthenticating(false);
        setLocalError("An account with that email address already exists.");
        return;
      }

      const isAdmin = email === "admin@kwatch.com" || email === "senfukawataraken@gmail.com" || email.includes("admin");
      saveRegisteredAccount({ 
        email, 
        name, 
        password, 
        isAdmin, 
        securityQuestion: sQuestion, 
        securityAnswer: sAnswer 
      });
      setIsAuthenticating(false);
      onLoginAccount({ email, name, isAdmin });
    }, 900);
  };
  
  // Forgot Password Action Handlers
  const handleForgotEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setLocalError("Please enter your email.");
      return;
    }

    const accounts = getRegisteredAccounts();
    const found = accounts.find(a => a.email.toLowerCase() === email);

    if (!found) {
      setLocalError("We couldn't find an account associated with that email.");
      return;
    }

    setForgotQuestion(found.securityQuestion || "What is your favorite movie of all time?");
    setForgotStep('question');
  };

  const handleForgotQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const email = forgotEmail.trim().toLowerCase();
    const answerInput = forgotAnswerInput.trim().toLowerCase();

    if (!answerInput) {
      setLocalError("Please enter the security answer.");
      return;
    }

    const accounts = getRegisteredAccounts();
    const found = accounts.find(a => a.email.toLowerCase() === email);

    if (!found) {
      setLocalError("Error locating account. Please try again.");
      setForgotStep('email');
      return;
    }

    const correctAnswer = (found.securityAnswer || "Interstellar").trim().toLowerCase();
    if (answerInput !== correctAnswer) {
      setLocalError("Incorrect answer to the security question.");
      return;
    }

    setForgotStep('reset');
  };

  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const email = forgotEmail.trim().toLowerCase();
    const newPass = forgotNewPassword.trim();

    if (!newPass) {
      setLocalError("Please enter a new password.");
      return;
    }

    const accounts = getRegisteredAccounts();
    const found = accounts.find(a => a.email.toLowerCase() === email);

    if (!found) {
      setLocalError("Error resetting password. Account not found.");
      return;
    }

    // Save with the new password
    saveRegisteredAccount({
      ...found,
      password: newPass
    });

    // Reset forgot state & return to signin!
    setIsForgotPassword(false);
    setForgotEmail("");
    setForgotQuestion("");
    setForgotAnswerInput("");
    setForgotNewPassword("");
    setForgotStep('email');
    
    // Auto populate the login email for convenience!
    setEmailLogin(email);
    setPassLogin(newPass);
    setLocalError("Your password has been successfully reset! You can now sign in with your new password.");
  };

  // Profiles handling
  const handleProfileClick = (profile: UserProfile) => {
    if (profile.pinCode) {
      setSelectedProfileCandidate(profile);
      setPinInput("");
      setPinError(false);
    } else {
      onSelectProfile(profile);
    }
  };

  const submitPinMatch = () => {
    if (selectedProfileCandidate) {
      const correctPin = selectedProfileCandidate.pinCode || "41823";
      if (verifyPin(pinInput, correctPin)) {
        onSelectProfile(selectedProfileCandidate);
        setSelectedProfileCandidate(null);
        setPinInput("");
        setPinError(false);
      } else {
        setPinError(true);
        setPinInput("");
      }
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const pin = newProfilePin.trim();
    if (pin.length !== 4) {
      setProfileCreationError("Security PIN must be exactly 4 digits.");
      return;
    }

    const newProfile: UserProfile = {
      id: `p-${Date.now()}`,
      name: newProfileName,
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(selectedAvatarSeed)}`,
      isKids: newProfileIsKids,
      maxMaturityRating: newProfileIsKids ? 'G' : 'All',
      pinCode: securePin(pin),
      primaryColor: newProfileColor,
      watchlist: [],
      favorites: [],
      recentlyWatched: []
    };

    onUpdateProfiles([...profiles, newProfile]);
    setNewProfileName("");
    setNewProfileIsKids(false);
    setNewProfilePin("");
    setNewProfileColor("#8b5cf6");
    setProfileCreationError("");
    setShowCreateForm(false);
  };

  const handleSocialClick = (platformName: string) => {
    // Fill details with test accounts instantly and friendly notification
    if (platformName === "Google") {
      setEmailLogin("senfukawataraken@gmail.com");
      setPassLogin("41823");
      setLocalError("Pre-filled Google credential pathway (admin@kwatch.com / senfukawataraken@gmail.com is loaded). Click 'Sign in' below.");
    } else if (platformName === "GitHub") {
      setEmailLogin("admin@kwatch.com");
      setPassLogin("41823");
      setLocalError("Pre-filled GitHub administrator gateway loaded. Click 'Sign in' below.");
    } else {
      setEmailLogin("customer@kwatch.com");
      setPassLogin("1234");
      // Create user if not existing
      const accounts = getRegisteredAccounts();
      if (!accounts.find(a => a.email === "customer@kwatch.com")) {
        saveRegisteredAccount({ email: "customer@kwatch.com", name: "Guest Watcher", password: "1234", isAdmin: false });
      }
      setLocalError("Pre-filled social pathway loaded (customer@kwatch.com with password '1234'). Click 'Sign in'.");
    }
  };

  const hasSignedIn = currentAccount !== null;

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-[90vh] text-white p-4 sm:p-12 transition-all duration-700 w-full rounded-3xl overflow-hidden select-none shadow-[inset_0_0_120px_rgba(0,100,255,0.15)] bg-slate-950"
      style={{
        background: 'linear-gradient(135deg, #02081d 0%, #030a21 50%, #0c1c4e 100%)'
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* ABSTRACT 3D FLUID SHAPES BACKDROP ARTWORK (MATCHING THE UPLOADED SPEC) */}
      {/* ------------------------------------------------------------- */}
      
      {/* Dynamic Floating Radiant Light Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[140px] mix-blend-screen pointer-events-none animate-pulse duration-[10000ms]" />

      {/* 3D Cyan Curved Ring (Top Left) */}
      <svg className="absolute top-[8%] left-[10%] w-44 h-44 opacity-80 pointer-events-none select-none filter drop-shadow-[0_15px_25px_rgba(6,182,212,0.4)]" viewBox="0 0 100 100" fill="none">
        <path 
          d="M 20,50 A 30,30 0 1,1 80,50" 
          stroke="url(#neon-blue-grad-1)" 
          strokeWidth="12" 
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="neon-blue-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>

      {/* 3D Blue Floating Crescent Helix (Right-Center Background) */}
      <svg className="absolute right-[5%] top-[18%] w-60 h-60 opacity-60 pointer-events-none select-none filter drop-shadow-[0_20px_40px_rgba(29,78,216,0.5)]" viewBox="0 0 100 100" fill="none">
        <path 
          d="M 30,15 C 65,5 95,40 75,75 C 60,100 20,85 15,60 C 10,40 45,35 60,50" 
          stroke="url(#grad-helix)" 
          strokeWidth="10" 
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad-helix" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
      </svg>

      {/* White-to-Cyan Wavy Noodles / Squiggles (Bottom Left & Right) */}
      <svg className="absolute bottom-[10%] left-[6%] w-32 h-20 opacity-70 pointer-events-none filter drop-shadow-[0_10px_15px_rgba(6,182,212,0.3)]" viewBox="0 0 100 60" fill="none">
        <path 
          d="M 5,25 Q 25,5 45,25 T 85,25" 
          stroke="url(#grad-squiggle)" 
          strokeWidth="10" 
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad-squiggle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>

      <svg className="absolute bottom-[16%] right-[10%] w-28 h-16 opacity-75 pointer-events-none filter drop-shadow-[0_10px_15px_rgba(59,130,246,0.3)]" viewBox="0 0 100 60" fill="none">
        <path 
          d="M 90,40 Q 70,5 50,40 T 10,40" 
          stroke="url(#grad-squiggle-2)" 
          strokeWidth="10" 
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad-squiggle-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Stylized 3D Pill/Tube shapes */}
      <div 
        className="absolute top-[35%] left-[5%] w-16 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full rotate-[35deg] opacity-75 blur-[0.5px] shadow-[0_8px_20px_rgba(6,182,212,0.4)] pointer-events-none" 
        style={{ transformStyle: 'preserve-3d' }}
      />
      <div 
        className="absolute bottom-[28%] left-[12%] w-12 h-6 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full -rotate-[15deg] opacity-60 blur-[0.5px] shadow-[0_8px_16px_rgba(37,99,235,0.4)] pointer-events-none" 
      />
      <div 
        className="absolute bottom-[20%] right-[4%] w-20 h-10 bg-gradient-to-r from-blue-500/80 to-purple-600/80 rounded-full rotate-[45deg] opacity-80 blur-[1px] shadow-[0_12px_24px_rgba(147,51,234,0.3)] pointer-events-none" 
      />

      {/* Main glass-morphic interface container */}
      <AnimatePresence mode="wait">
        {selectedProfileCandidate ? (
          /* ==================================== */
          /* PROFILE PIN UNLOCK GRID              */
          /* ==================================== */
          <motion.div
            key="profile-pin"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm text-center space-y-6 bg-white/10 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
          >
            <div className="flex flex-col items-center space-y-3">
              <img 
                src={selectedProfileCandidate.avatarUrl} 
                alt="Profile Avatar" 
                className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400/40 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <h2 className="text-xl font-bold tracking-tight text-white">{selectedProfileCandidate.name}</h2>
              <p className="text-xs text-cyan-400 uppercase tracking-widest font-mono">Profile Locked</p>
            </div>

            <div className="space-y-4">
              <div className="relative max-w-[180px] mx-auto">
                <input
                  type="password"
                  maxLength={5}
                  required
                  placeholder="PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 bg-white border-none rounded-xl text-center text-xl font-bold font-mono tracking-widest text-slate-900 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              {pinError && (
                <p className="text-red-400 text-xs font-semibold animate-pulse">Incorrect security PIN. (Default override: '41823')</p>
              )}

              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfileCandidate(null);
                    setPinInput("");
                    setPinError(false);
                  }}
                  className="px-4 py-2 text-xs text-neutral-300 hover:text-white uppercase tracking-wider font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitPinMatch}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-wider shadow-lg"
                >
                  Unlock
                </button>
              </div>
            </div>
          </motion.div>
        ) : hasSignedIn ? (
          /* ==================================== */
          /* PROFILE SELECTION "WHO'S WATCHING" */
          /* ==================================== */
          <motion.div
            key="who-watching"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl text-center space-y-8 py-4 z-10"
          >
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-200">
                Who's watching today?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium tracking-wide">
                Choose or create an audio-visual stream partition.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4 py-4 max-w-2xl mx-auto items-start justify-center">
              {profiles.map((profile) => (
                <motion.div 
                  key={profile.id}
                  whileHover={{ scale: 1.05 }}
                  className="group flex flex-col items-center cursor-pointer"
                  onClick={() => handleProfileClick(profile)}
                >
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/10 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 shadow-2xl">
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    {profile.pinCode && (
                      <div className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-lg border border-white/10">
                        <Lock className="w-3 h-3 text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-sm font-semibold text-neutral-300 group-hover:text-cyan-300 transition-colors">
                    {profile.name}
                  </span>
                </motion.div>
              ))}

              {!showCreateForm && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="group flex flex-col items-center cursor-pointer"
                  onClick={() => {
                    setShowCreateForm(true);
                    setSelectedAvatarSeed(Math.random().toString(36).substring(3, 8));
                  }}
                >
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/20 group-hover:border-cyan-400/60 bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 group-hover:text-cyan-400 transition-all duration-300 shadow-xl">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="mt-3 text-sm font-semibold text-neutral-400 group-hover:text-cyan-400 transition-colors">
                    Add Profile
                  </span>
                </motion.div>
              )}
            </div>

            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-3xl border border-white/20 p-6 rounded-2xl text-left shadow-2xl space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Initialize Profile</span>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    className="text-xs text-neutral-300 hover:text-white uppercase font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateProfile} className="space-y-4">
                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/10">
                    <img 
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${selectedAvatarSeed}`} 
                      alt="avatar" 
                      className="w-12 h-12 bg-neutral-900 rounded-lg border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Visual Variant</p>
                      <button 
                        type="button"
                        onClick={() => setSelectedAvatarSeed(Math.random().toString(36).substring(3, 8))}
                        className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 mt-0.5"
                      >
                        <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>Shuffle Seed</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-300 uppercase font-mono tracking-wider">Profile Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ken Jr"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 placeholder-neutral-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-neutral-300 uppercase font-mono tracking-wider">Lock PIN (Mandatory - 4 digits) <span className="text-red-400 text-[9px] font-bold">*</span></label>
                    <input 
                      type="password" 
                      required
                      maxLength={4}
                      minLength={4}
                      placeholder="Enter a 4-digit security PIN"
                      value={newProfilePin}
                      onChange={(e) => setNewProfilePin(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono placeholder-neutral-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-neutral-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-cyan-400" /> Primary Color Theme
                    </label>
                    <div className="flex gap-3 py-1 flex-wrap">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setNewProfileColor(preset.primaryColor)}
                          title={preset.name}
                          className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all relative cursor-pointer ${
                            newProfileColor.toLowerCase() === preset.primaryColor.toLowerCase() 
                              ? 'scale-110 border-white ring-2 ring-cyan-400' 
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          style={{ backgroundColor: preset.primaryColor }}
                        >
                          {newProfileColor.toLowerCase() === preset.primaryColor.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3px]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {profileCreationError && (
                    <p className="text-xs text-red-400 font-bold tracking-wide animate-pulse">{profileCreationError}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id="kidscheck"
                      checked={newProfileIsKids}
                      onChange={(e) => setNewProfileIsKids(e.target.checked)}
                      className="w-4 h-4 bg-zinc-950 border border-white/10 rounded accent-cyan-400"
                    />
                    <label htmlFor="kidscheck" className="text-xs text-neutral-300 font-medium cursor-pointer">Family / Kids Category Curation</label>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full h-10 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-white font-extrabold text-xs tracking-wider uppercase rounded-lg shadow-lg active:scale-95 transition-all"
                  >
                    Save & Create Profile
                  </button>
                </form>
              </motion.div>
            )}

            <div className="pt-6 border-t border-white/10">
              <button 
                onClick={onLogoutAccount}
                className="px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs text-neutral-300 hover:text-white transition-all uppercase tracking-wider font-semibold shadow-md active:scale-95"
              >
                Sign out of account
              </button>
            </div>
          </motion.div>
        ) : (
          /* ========================================================== */
          /* GLORIOUS COBALT GLASSMOPRHISM SIGN-IN/SIGN-UP SCREEN       */
          /* ========================================================== */
          <motion.div
            key="login-box-panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-[420px] bg-white/10 backdrop-blur-xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] relative z-10 flex flex-col justify-between"
          >
            {/* Interactive Device Identity Simulator Badge */}
            <div className="absolute top-4 right-4 z-50">
              <button
                type="button"
                onClick={() => {
                  if (isNewDevice) {
                    localStorage.setItem("kwatch_authorized_device_flag", "true");
                    setIsNewDevice(false);
                  } else {
                    localStorage.removeItem("kwatch_authorized_device_flag");
                    setIsNewDevice(true);
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all tracking-wider cursor-pointer ${
                  !isNewDevice 
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25" 
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 animate-pulse"
                }`}
                title="Simulate accessing from a physical new device to test authentication guard rules"
              >
                {!isNewDevice ? "🛡️ Device Authorized" : "⚠️ New Device detected"}
              </button>
            </div>

            {/* Center Dynamic Brand Logo */}
            <div className="flex flex-col items-center justify-center mb-6">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-cyan-400/90 font-bold mb-3">Welcome to</span>
              <KwatchLogo size={72} includeText={true} layout="vertical" />
            </div>

            {/* Unrecognized Device Enforced Security Alert Notice */}
            {isNewDevice && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3 bg-cyan-950/40 border border-cyan-500/20 rounded-2xl text-xs flex items-start gap-2.5 shadow-md backdrop-blur-md"
              >
                <Shield className="w-5 h-5 text-cyan-450 flex-shrink-0 mt-0.5" />
                <div className="text-left leading-relaxed">
                  <p className="font-extrabold text-cyan-300">New / Unrecognized Device</p>
                  <p className="text-neutral-450 text-[10px] mt-0.5">Please sign in to register and authorize this device for streaming.</p>
                </div>
              </motion.div>
            )}

            {/* Error notifications */}
            {localError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-yellow-300 text-xs text-center flex items-start gap-2.5 shadow-md"
              >
                <ShieldAlert className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-left leading-relaxed font-medium">{localError}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                /* ========================================================== */
                /* HIGH FIDELITY SECURITY PASSCODE RESET GATEWAY              */
                /* ========================================================== */
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="space-y-4 text-left"
                >
                  <h3 className="text-2xl font-bold text-white tracking-wide mb-1">Reset Password</h3>
                  <p className="text-neutral-300 text-xs leading-relaxed mb-4">
                    Complete the secondary authentication parameters to securely update your credentials.
                  </p>

                  <AnimatePresence mode="wait">
                    {forgotStep === 'email' && (
                      <motion.form
                        key="forgot-email"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleForgotEmailSubmit}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Account Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="username@gmail.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-sm rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-2 active:scale-95 cursor-pointer"
                        >
                          Verify Account Email
                        </button>
                      </motion.form>
                    )}

                    {forgotStep === 'question' && (
                      <motion.form
                        key="forgot-question"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleForgotQuestionSubmit}
                        className="space-y-4"
                      >
                        <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/20 rounded-2xl text-xs text-cyan-200 font-medium leading-relaxed mb-4">
                          <p className="text-neutral-400 text-[9px] uppercase font-mono tracking-wider mb-1">Your Selected Security Question</p>
                          <p className="text-sm font-semibold text-white">{forgotQuestion}</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Your Response</label>
                          <input
                            type="text"
                            required
                            placeholder="Type security answer here"
                            value={forgotAnswerInput}
                            onChange={(e) => setForgotAnswerInput(e.target.value)}
                            className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setForgotStep('email');
                              setLocalError("");
                            }}
                            className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-sm font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="flex-grow h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-sm rounded-lg transition-all shadow-lg cursor-pointer"
                          >
                            Verify Answer
                          </button>
                        </div>
                      </motion.form>
                    )}

                    {forgotStep === 'reset' && (
                      <motion.form
                        key="forgot-reset"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleForgotResetSubmit}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Define New Password</label>
                          <input
                            type="password"
                            required
                            placeholder="At least 4 characters"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-sm rounded-lg transition-all shadow-lg active:scale-95 cursor-pointer"
                        >
                          Save New Password & Continue
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="text-center pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setLocalError("");
                      }}
                      className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 mx-auto font-medium transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Cancel & Back to Sign In</span>
                    </button>
                  </div>
                </motion.div>
              ) : isSignUp ? (
                /* ==================================== */
                /* REGISTRATION PANEL                   */
                /* ==================================== */
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSignUpSubmit}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-bold text-white text-left tracking-wide mb-1">Create Account</h3>
                  
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Full Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Ken Senfukawa"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Email Address</label>
                      <input 
                        type="email"
                        required
                        placeholder="username@gmail.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Password</label>
                      <input 
                        type="password"
                        required
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-100 mb-1 ml-0.5">Security Recovery Question</label>
                      <select
                        value={signUpQuestion}
                        onChange={(e) => setSignUpQuestion(e.target.value)}
                        className="h-10 w-full px-3 rounded-lg bg-white text-slate-850 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-md"
                      >
                        <option value="What is your favorite movie of all time?">What is your favorite movie of all time?</option>
                        <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                        <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                        <option value="What city were you born in?">What city were you born in?</option>
                        <option value="What was the name of your first school?">What was the name of your first school?</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-100 mb-1 ml-0.5">Security Question Answer</label>
                      <input 
                        type="text"
                        required
                        placeholder="Recovery Answer"
                        value={signUpAnswer}
                        onChange={(e) => setSignUpAnswer(e.target.value)}
                        className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-md"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-sm rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-6 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isAuthenticating ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Register Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setLocalError("");
                      }}
                      className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 mx-auto font-medium transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* ========================================================== */
                /* HIGH FIDELITY UNIFIED SIGN-IN GATES                        */
                /* ========================================================== */
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-bold text-white text-left tracking-wide mb-1">Login</h3>

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-200 mb-1 ml-0.5">Email</label>
                      <input
                        type="email"
                        required
                        value={emailLogin}
                        placeholder="username@gmail.com"
                        onChange={(e) => setEmailLogin(e.target.value)}
                        className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 shadow-xl transition-all"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-neutral-200 ml-0.5">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setForgotStep('email');
                            setLocalError("");
                            if (emailLogin) {
                              setForgotEmail(emailLogin);
                            }
                          }}
                          className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type={showPasswordRaw ? "text" : "password"}
                          required
                          value={passLogin}
                          placeholder="Password"
                          onChange={(e) => setPassLogin(e.target.value)}
                          className="h-10 w-full px-4 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-neutral-400 pr-10 shadow-xl transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordRaw(prev => !prev)}
                          className="absolute right-3 text-slate-400 hover:text-slate-700"
                        >
                          {showPasswordRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full h-11 bg-[#0B3A64] hover:bg-[#07243f] text-white font-bold text-sm rounded-lg transition-all shadow-xl flex items-center justify-center gap-2 mt-5 active:scale-95 disabled:opacity-50"
                  >
                    {isAuthenticating ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Sign in</span>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center my-4">
                    <div className="flex-grow h-[1px] bg-white/10" />
                    <span className="px-3 text-[10px] text-neutral-300 uppercase tracking-widest font-semibold">or continue with</span>
                    <div className="flex-grow h-[1px] bg-white/10" />
                  </div>

                  {/* Social sign ins (Google, Github, Facebook) as requested by screenshot style */}
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      type="button"
                      onClick={() => handleSocialClick("Google")}
                      className="h-10 flex items-center justify-center bg-white hover:bg-neutral-100 rounded-lg shadow-md transition-all active:scale-95 text-xs text-neutral-600"
                      title="Google One-Click Fast Login"
                    >
                      {/* Social colored G icon */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.62-.01 3.19.57 4.38 1.63L20 3.1C17.75 1.07 14.94-.03 12 0 7.24-.03 3.1 3.1 1.45 7.55L5.4 10.6c.8-2.35 2.97-4.14 5.6-5.56z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.19-2.3H12v4.51h6.47c-.29 1.5-.1.8-1.57 2.66l3.9 3.03c2.28-2.1 3.69-5.18 3.69-7.9z" />
                        <path fill="#FBBC05" d="M5.4 10.6c-.4 1.1-.6 2.2-.6 3.4s.2 2.3.6 3.4l-3.95 3.05C.53 17.55 0 14.85 0 12s.53-5.55 1.45-8.45l3.95 3.05z" />
                        <path fill="#34A853" d="M12 23.97c3.24 0 5.97-1.07 7.96-2.91l-3.9-3.03c-1.12.75-2.54 1.19-4.06 1.19-2.63 0-4.81-1.79-5.6-4.14L1.45 18.13C3.1 22.58 7.24 25.7 12 25.7v-1.73z" />
                      </svg>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleSocialClick("GitHub")}
                      className="h-10 flex items-center justify-center bg-white hover:bg-neutral-100 rounded-lg shadow-md transition-all active:scale-95"
                      title="GitHub One-Click Fast Login"
                    >
                      {/* White-dark git icon */}
                      <svg className="w-5 h-5 fill-slate-800" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.024A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.293 2.747-1.024 2.747-1.024.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleSocialClick("Facebook")}
                      className="h-10 flex items-center justify-center bg-white hover:bg-neutral-100 rounded-lg shadow-md transition-all active:scale-95"
                      title="Facebook One-Click Fast Login"
                    >
                      <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-center pt-5 text-xs text-neutral-300">
                    <span>Don't have an account yet? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setLocalError("");
                      }}
                      className="text-cyan-300 hover:underline font-bold transition-all"
                    >
                      Register for free
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
