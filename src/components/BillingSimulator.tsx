import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, HelpCircle, ArrowRight, ShieldCheck, 
  Tv, Volume2, Globe, Laptop, HelpCircle as InfoIcon, CreditCard, Receipt, Flame,
  TrendingUp, BarChart2, CalendarDays
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  LineChart, 
  Line 
} from 'recharts';

interface BillingSimulatorProps {
  onSubscriptionApplied?: (newPlan: string) => void;
}

interface Currency {
  code: string;
  symbol: string;
  rate: number; // exchange rate relative to USD
  name: string;
}

const CURRENCIES: Currency[] = [
  { code: 'UGX', symbol: 'Shs', rate: 3750, name: 'Ugandan Shilling' },
  { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro' },
  { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound' }
];

interface PlanDetails {
  id: string;
  name: string;
  baseMonthlyUSD: number;
  baseAnnualUSD: number;
  badge: string;
  description: string;
  features: { name: string; included: boolean; label?: string }[];
  accentColor: string;
}

const PLANS: PlanDetails[] = [
  {
    id: 'plan-free',
    name: 'Free Ad-Supported',
    baseMonthlyUSD: 0,
    baseAnnualUSD: 0,
    badge: 'Standard Free',
    description: 'Basic access to cinema archives with regular standard breaks.',
    accentColor: 'border-zinc-800 text-zinc-400 bg-zinc-950/40',
    features: [
      { name: 'Access to full standard catalog', included: true },
      { name: 'Streaming quality up to 720p HD', included: true },
      { name: 'Periodic short standard video ads', included: true },
      { name: 'Full access to AI Mood Assistant', included: true, label: 'Limited Questions' },
      { name: 'Multi-screen synchronous streams', included: false },
      { name: 'Continuous travel offline downloads', included: false },
      { name: 'Immersive Dolby Atmos audio profiles', included: false },
      { name: 'Proactive Kids Safe parental controls', included: false },
    ]
  },
  {
    id: 'plan-premium',
    name: 'Premium Solitary',
    baseMonthlyUSD: 9.99,
    baseAnnualUSD: 89.99, // ~25% off monthly ($120)
    badge: 'Most Popular',
    description: 'Breathtaking high definition streaming with infinite AI search and zero interruptions.',
    accentColor: 'border-purple-500/40 text-purple-450 bg-purple-950/10',
    features: [
      { name: 'Access to full standard catalog', included: true },
      { name: 'Streaming quality up to 1080p FHD & 4K Ultra HD', included: true },
      { name: 'Periodic short standard video ads', included: false },
      { name: 'Full access to AI Mood Assistant', included: true, label: 'Unlimited' },
      { name: 'Multi-screen synchronous streams', included: true, label: '2 screens' },
      { name: 'Continuous travel offline downloads', included: true },
      { name: 'Immersive Dolby Atmos audio profiles', included: false },
      { name: 'Proactive Kids Safe parental controls', included: true },
    ]
  },
  {
    id: 'plan-family',
    name: 'Empire Family Pack',
    baseMonthlyUSD: 19.99,
    baseAnnualUSD: 179.99, // ~25% off monthly ($240)
    badge: 'Supreme Value',
    description: 'Ultimate family leisure package. Dolby Sound, 5 streaming profiles, and kid blocks.',
    accentColor: 'border-amber-500/40 text-amber-500 bg-amber-950/10',
    features: [
      { name: 'Access to full standard catalog', included: true },
      { name: 'Streaming quality up to 1080p FHD & 4K Ultra HD', included: true },
      { name: 'Periodic short standard video ads', included: false },
      { name: 'Full access to AI Mood Assistant', included: true, label: 'Unlimited' },
      { name: 'Multi-screen synchronous streams', included: true, label: '5 screens' },
      { name: 'Continuous travel offline downloads', included: true, label: 'Unlimited' },
      { name: 'Immersive Dolby Atmos audio profiles', included: true },
      { name: 'Proactive Kids Safe parental controls', included: true, label: 'Individual Locks' },
    ]
  }
];

interface Addon {
  id: string;
  name: string;
  priceMonthlyUSD: number;
  description: string;
  icon: React.ReactNode;
}

export default function BillingSimulator({ onSubscriptionApplied }: BillingSimulatorProps) {
  // Simulator states
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]);
  
  // Interactive addon enhancements
  const [addons, setAddons] = useState<Record<string, boolean>>({
    'addon-uhd': false,
    'addon-dolby': false,
    'addon-offline': false
  });

  const ADDONS: Addon[] = [
    {
      id: 'addon-uhd',
      name: 'Super Resolution Ultra HD Enhancer',
      priceMonthlyUSD: 2.99,
      description: 'AI-upscaling engine unlocks 4K HDR detailing level.',
      icon: <Tv className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'addon-dolby',
      name: 'Dolby Atmos Spatial Sound Upgrade',
      priceMonthlyUSD: 1.99,
      description: 'Optimizes dynamic spatial panning sound on headphones.',
      icon: <Volume2 className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'addon-offline',
      name: 'Offline Travel Pack Unlimited',
      priceMonthlyUSD: 3.49,
      description: 'Allows continuous local caching with zero storage limits.',
      icon: <Globe className="w-4 h-4 text-purple-400" />
    }
  ];

  // Feedback notifications
  const [applyingPlan, setApplyingPlan] = useState<boolean>(false);
  const [activePlanName, setActivePlanName] = useState<string>('');
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  useEffect(() => {
    try {
      const active = localStorage.getItem("kwatch_user_subscription") || "Free Ad-Supported";
      setActivePlanName(active);
      // Map loaded plan to simulator default selection on mount
      const foundPlan = PLANS.find(p => p.name === active);
      if (foundPlan) {
        setSelectedPlanId(foundPlan.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const activePlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

  // Math conversions
  const exchangeRate = selectedCurrency.rate;
  const currencySymbol = selectedCurrency.symbol;

  const getBasePriceUSD = (plan: PlanDetails) => {
    return billingCycle === 'monthly' ? plan.baseMonthlyUSD : plan.baseAnnualUSD;
  };

  const getAddonPriceUSD = (add: Addon) => {
    return billingCycle === 'monthly' ? add.priceMonthlyUSD : add.priceMonthlyUSD * 10; // Annual package gets 2 months free!
  };

  // Pricing calculations
  const baseUSD = getBasePriceUSD(activePlan);
  const basePriceConverted = baseUSD * exchangeRate;
  
  const addonsUSD = ADDONS.reduce((total, addon) => {
    if (addons[addon.id] && activePlan.id !== 'plan-free') {
      return total + getAddonPriceUSD(addon);
    }
    return total;
  }, 0);
  const addonsConverted = addonsUSD * exchangeRate;

  const totalUSD = baseUSD + addonsUSD;
  const totalConverted = totalUSD * exchangeRate;

  // Chart view selector state
  const [chartView, setChartView] = useState<'cumulative' | 'comparison'>('cumulative');

  // Interactive dynamic chart calculations
  const activePlanMonthlyBaseUSD = activePlan.baseMonthlyUSD;
  const activePlanMonthlyAddonsUSD = ADDONS.reduce((acc, cur) => acc + (addons[cur.id] ? cur.priceMonthlyUSD : 0), 0);
  
  const activePlanAnnualBaseUSD = activePlan.baseAnnualUSD;
  const activePlanAnnualAddonsUSD = ADDONS.reduce((acc, cur) => acc + (addons[cur.id] ? cur.priceMonthlyUSD * 10 : 0), 0);

  // 12-Month Projected dataset (Cumulative spend comparison)
  const projectionChartData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const cumulativeMonthly = (activePlanMonthlyBaseUSD + activePlanMonthlyAddonsUSD) * m;
    const cumulativeAnnual = activePlanAnnualBaseUSD + activePlanAnnualAddonsUSD;

    return {
      monthLabel: `Mo ${m}`,
      monthFull: `Month ${m}`,
      'Monthly Config Spend': Number((cumulativeMonthly * exchangeRate).toLocaleString('en', {useGrouping: false, maximumFractionDigits: 0})),
      'Annual Config Spend': Number((cumulativeAnnual * exchangeRate).toLocaleString('en', {useGrouping: false, maximumFractionDigits: 0})),
    };
  });

  // Tiers comparison (Base + Upgrades amortized monthly)
  const tiersComparisonData = PLANS.map(plan => {
    const addonsForPlanUSD = plan.id === 'plan-free'
      ? 0
      : ADDONS.reduce((acc, cur) => acc + (addons[cur.id] ? cur.priceMonthlyUSD : 0), 0);

    const baseForPlanUSD = billingCycle === 'monthly' ? plan.baseMonthlyUSD : plan.baseAnnualUSD;
    
    // Convert bases & addons to amortized monthly numbers
    const amortizedBase = billingCycle === 'monthly' ? baseForPlanUSD : baseForPlanUSD / 12;
    const amortizedAddons = billingCycle === 'monthly' ? addonsForPlanUSD : (addonsForPlanUSD * 10) / 12;

    return {
      name: plan.name,
      'Base': Number((amortizedBase * exchangeRate).toFixed(1)),
      'Upgrades': Number((amortizedAddons * exchangeRate).toFixed(1)),
    };
  });

  // Annual vs Monthly Savings Calculations 
  const annualSavingsUSDOverYear = ((activePlanMonthlyBaseUSD + activePlanMonthlyAddonsUSD) * 12) - (activePlanAnnualBaseUSD + activePlanAnnualAddonsUSD);
  const annualSavingsConverted = annualSavingsUSDOverYear * exchangeRate;

  const toggleAddon = (id: string) => {
    if (activePlan.id === 'plan-free') return; // Free plan cannot equip premium addons
    setAddons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Reset addons if user flips to Free plan
  useEffect(() => {
    if (selectedPlanId === 'plan-free') {
      setAddons({
        'addon-uhd': false,
        'addon-dolby': false,
        'addon-offline': false
      });
    }
  }, [selectedPlanId]);

  const handleApplyPlan = () => {
    setApplyingPlan(true);
    setTimeout(() => {
      try {
        localStorage.setItem("kwatch_user_subscription", activePlan.name);
        
        // Dispatch custom global stream update events
        const event = new CustomEvent("kwatch_subscription_update", { detail: activePlan.name });
        window.dispatchEvent(event);
        
        setActivePlanName(activePlan.name);
        if (onSubscriptionApplied) {
          onSubscriptionApplied(activePlan.name);
        }

        // Generate synthetic receipt number
        setInvoiceNumber(`KW-${Math.floor(100000 + Math.random() * 900000)}`);
        setShowInvoice(true);
      } catch (err) {
        console.error(err);
      } finally {
        setApplyingPlan(false);
      }
    }, 1500);
  };

  const formattedCurrency = (value: number) => {
    if (selectedCurrency.code === 'UGX') {
      return `${currencySymbol} ${Math.round(value).toLocaleString()}`;
    }
    return `${currencySymbol}${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* EXPLANATORY INTRO BANNER */}
      <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-neutral-200">Interactive Membership Simulation Engine</h4>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Customize streaming tier structures, currency conversions, billing cycle schedules, and optional auxiliary modules. Applying changes updates your client sandbox instantly!
          </p>
        </div>
      </div>

      {/* QUICK STATUS COMPACT BADGE */}
      <div className="flex items-center justify-between p-3.5 bg-neutral-900/30 rounded-xl border border-neutral-900">
        <span className="text-[11px] text-neutral-400 font-mono uppercase tracking-wide">Current Active Status:</span>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full block animate-ping" />
          <strong className="text-xs font-bold text-white uppercase font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            {activePlanName || 'Free Ad-Supported'}
          </strong>
        </div>
      </div>

      {/* THREE-COLUMN CONTROLLER AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CYCLE SELECTOR CONTROL & CURRENCY */}
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-4">
          <h5 className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">1. Cycle & Currency</h5>
          
          <div className="space-y-3.5">
            {/* Cycle Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-500 font-semibold block">Billing Cycle Duration:</label>
              <div className="grid grid-cols-2 bg-neutral-900/80 p-1 border border-neutral-850 rounded-xl">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-purple-600/20 border border-purple-500/30 text-white shadow'
                      : 'text-neutral-400 hover:text-white border border-transparent'
                  }`}
                >
                  Monthly billing
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all relative flex items-center justify-center gap-1 cursor-pointer ${
                    billingCycle === 'annual'
                      ? 'bg-purple-600/20 border border-purple-500/30 text-white shadow'
                      : 'text-neutral-400 hover:text-white border border-transparent'
                  }`}
                >
                  Annual (25% Off)
                  <span className="bg-amber-500 text-neutral-950 font-black text-[8px] px-1 rounded absolute -top-1 -right-0.5 animate-bounce">
                    BEST
                  </span>
                </button>
              </div>
            </div>

            {/* Currency Pill Grid */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-neutral-500 font-semibold block">System Billing Currency:</label>
              <div className="grid grid-cols-4 gap-2">
                {CURRENCIES.map((cur) => {
                  const isActive = selectedCurrency.code === cur.code;
                  return (
                    <button
                      key={cur.code}
                      onClick={() => setSelectedCurrency(cur)}
                      className={`py-2 px-1 rounded-xl text-center transition-all border block cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/10 border-purple-500 text-white font-black'
                          : 'bg-neutral-900 border-neutral-850 text-neutral-450 text-xs hover:text-white hover:bg-neutral-900/60'
                      }`}
                    >
                      <span className="font-mono text-xs block font-bold">{cur.code}</span>
                      <span className="text-[9px] text-neutral-400 block font-mono">{cur.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE PREMIUM ADDONS LIST */}
        <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-3.5">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">2. Auxiliary Upgrades</h5>
            {selectedPlanId === 'plan-free' && (
              <span className="text-[9px] bg-red-950/20 text-red-400 border border-red-900/10 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">
                Unavailable on Free
              </span>
            )}
          </div>

          <div className="space-y-2">
            {ADDONS.map((add) => {
              const isSelected = addons[add.id];
              const isFreePlan = selectedPlanId === 'plan-free';
              
              const calculatedUSD = getAddonPriceUSD(add);
              const calculatedPrice = calculatedUSD * exchangeRate;
              
              return (
                <button
                  key={add.id}
                  disabled={isFreePlan}
                  onClick={() => toggleAddon(add.id)}
                  className={`w-full p-2.5 text-left rounded-xl transition-all border flex items-center gap-2.5 ${
                    isFreePlan 
                      ? 'opacity-40 cursor-not-allowed bg-neutral-900/10 border-neutral-950'
                      : isSelected
                        ? 'bg-purple-600/10 border-purple-500/80 text-white'
                        : 'bg-neutral-900/30 border-neutral-900 text-neutral-400 hover:bg-neutral-900/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-purple-600/20 text-purple-400' : 'bg-neutral-900 text-neutral-500'}`}>
                    {add.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold block truncate leading-tight">{add.name}</span>
                    <span className="text-[9px] text-neutral-500 block truncate font-mono">{add.description}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-purple-400 block">
                      +{formattedCurrency(calculatedPrice)}
                    </span>
                    <span className="text-[8px] text-neutral-500 block uppercase font-bold">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* SUBSCRIPTION PLAN SELECTION GRID */}
      <div className="space-y-3">
        <h5 className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider block">3. Select Streaming Plan Tier</h5>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const cyclePriceUSD = getBasePriceUSD(plan);
            const cyclePriceConverted = cyclePriceUSD * exchangeRate;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 border rounded-xl text-left transition-all cursor-pointer relative flex flex-col justify-between h-48 ${
                  isSelected 
                    ? `bg-purple-950/20 border-purple-500 ring-1 ring-purple-500` 
                    : `bg-neutral-950 border-neutral-900 hover:border-neutral-800`
                }`}
              >
                {/* Active Indicator Stamp badge */}
                <div className="flex items-start justify-between w-full">
                  <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-neutral-900 text-neutral-400'
                  }`}>
                    {plan.badge}
                  </span>
                  {activePlanName === plan.name && (
                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-1.5 py-0.5 rounded tracking-wide uppercase">
                      Current Plan
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 my-3">
                  <h4 className="text-xs font-bold text-white transition-all">{plan.name}</h4>
                  <p className="text-[10px] text-neutral-500 leading-snug line-clamp-2">{plan.description}</p>
                </div>

                {/* Pricing summary tag */}
                <div className="border-t border-neutral-900 pt-2 w-full flex items-baseline justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                    Estimate:
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-white font-mono leading-none">
                      {formattedCurrency(cyclePriceConverted)}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE FEATURE CHECKLIST DIFFERENCES EXPANSION */}
      <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-3">
        <div className="flex items-center gap-1.5 border-b border-neutral-900 pb-2">
          <Check className="w-4 h-4 text-purple-400" />
          <h5 className="text-[11px] text-neutral-300 font-bold uppercase tracking-wider">Features Included in {activePlan.name}</h5>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {activePlan.features.map((feat, index) => {
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between text-[11px] p-1.5 px-2 rounded-lg transition-all ${
                  feat.included 
                    ? 'text-neutral-205 bg-purple-950/5' 
                    : 'text-neutral-600 line-through opacity-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                    feat.included ? 'bg-purple-600/15 text-purple-400' : 'bg-neutral-900 text-neutral-750'
                  }`}>
                    {feat.included ? '✓' : '×'}
                  </span>
                  <span>{feat.name}</span>
                </span>
                {feat.label && feat.included && (
                  <span className="text-[9px] bg-purple-600/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold tracking-wide uppercase">
                    {feat.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* COST PROJECTIONS INTERACTIVE CHART SECTION */}
      <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-900 pb-3">
          <div className="space-y-0.5 text-left">
            <h5 className="text-xs font-bold text-neutral-200 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Dynamic Cost Forecast Projections
            </h5>
            <p className="text-[10px] text-neutral-500">
              Interactive calculations in {selectedCurrency.code} ({selectedCurrency.symbol}) for active enhancements
            </p>
          </div>
          <div className="bg-neutral-900/80 border border-neutral-850 p-1 rounded-xl flex self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setChartView('cumulative')}
              className={`px-3 py-1.5 rounded-lg text-[10px] tracking-wide font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartView === 'cumulative'
                  ? 'bg-purple-600/20 border border-purple-500/25 text-white'
                  : 'text-neutral-450 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              12mo Cumulative
            </button>
            <button
              onClick={() => setChartView('comparison')}
              className={`px-3 py-1.5 rounded-lg text-[10px] tracking-wide font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                chartView === 'comparison'
                  ? 'bg-purple-600/20 border border-purple-500/25 text-white'
                  : 'text-neutral-450 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Tiers Amortized
            </button>
          </div>
        </div>

        {/* Dynamic info badge/card regarding cycle selection */}
        {chartView === 'cumulative' && annualSavingsConverted > 0 && selectedPlanId !== 'plan-free' ? (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-emerald-450 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Switching from Monthly to Annual saves you:</span>
            </div>
            <strong className="font-mono text-emerald-400 text-xs font-black">
              {formattedCurrency(annualSavingsConverted)} / yr ({Math.round((annualSavingsConverted / ((activePlanMonthlyBaseUSD + activePlanMonthlyAddonsUSD) * 12 * exchangeRate)) * 100)}% savings)
            </strong>
          </div>
        ) : null}

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'cumulative' ? (
              <AreaChart data={projectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorAnnual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="monthLabel" tick={{ fill: '#737373', fontSize: 10 }} stroke="#404040" />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} stroke="#404040" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0e1017] border border-white/[0.08] p-3 rounded-xl shadow-2xl relative z-50 text-left">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase font-mono tracking-wider mb-2">Month {label.replace('Mo ', '')}</p>
                          <div className="space-y-1.5">
                            {payload.map((pld: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-6 text-xs">
                                <span className="flex items-center gap-1.5 text-neutral-300">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
                                  {pld.name}:
                                </span>
                                <span className="font-mono font-bold text-white">
                                  {formattedCurrency(pld.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  name="Monthly Plan Cumulative" 
                  dataKey="Monthly Config Spend" 
                  stroke="#c084fc" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMonthly)" 
                />
                {selectedPlanId !== 'plan-free' && (
                  <Area 
                    type="monotone" 
                    name="Annual Plan Upfront" 
                    dataKey="Annual Config Spend" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAnnual)" 
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={tiersComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} stroke="#404040" />
                <YAxis tick={{ fill: '#737373', fontSize: 10 }} stroke="#404040" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const totalVal = payload.reduce((sum: number, p: any) => sum + Number(p.value), 0);
                      return (
                        <div className="bg-[#0e1017] border border-white/[0.08] p-3 rounded-xl shadow-2xl relative z-50 text-left">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase font-mono tracking-wider mb-2">{label}</p>
                          <div className="space-y-1.5">
                            {payload.map((pld: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-6 text-xs font-mono">
                                <span className="flex items-center gap-1.5 text-neutral-400">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
                                  {pld.name}:
                                </span>
                                <span className="font-bold text-white">
                                  {formattedCurrency(pld.value)}
                                </span>
                              </div>
                            ))}
                            <div className="border-t border-white/[0.08] pt-1.5 mt-1 flex items-center justify-between gap-6 text-xs font-bold">
                              <span className="text-purple-450 uppercase tracking-wider text-[9px]">Monthly Amortized:</span>
                              <span className="text-white font-mono">{formattedCurrency(totalVal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar name="Base Subscription" dataKey="Base" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
                <Bar name="Selected Upgrades" dataKey="Upgrades" stackId="a" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETAILED COST BREAKDOWN AND SUBMIT INVOICE PREVIEW */}
      <div className="p-5 bg-neutral-950 border border-purple-900/30 focus-within:border-purple-500 rounded-2xl bg-gradient-to-b from-neutral-950 to-neutral-950/40 relative overflow-hidden">
        
        {/* Glow decoration */}
        <div className="w-16 h-16 bg-purple-600/10 blur-xl rounded-full absolute -right-6 -bottom-6 animate-pulse" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Prices Summary details */}
          <div className="text-center sm:text-left space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest font-mono">
              Simulator Live Total Bill Preview
            </span>
            <div className="flex items-baseline justify-center sm:justify-start gap-1.5">
              <span className="text-3xl font-black font-mono text-purple-400 tracking-tight glow">
                {formattedCurrency(totalConverted)}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            
            {/* Split breakdown */}
            <p className="text-[10px] text-neutral-500 font-mono">
              Base: {formattedCurrency(basePriceConverted)} {addonsUSD > 0 && `+ Upgrades: ${formattedCurrency(addonsConverted)}`}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* APPLY TO SIMULATION PLATFORM */}
            <button
              onClick={handleApplyPlan}
              disabled={applyingPlan}
              className="flex-1 sm:flex-initial px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {applyingPlan ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sealing Ledger...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Apply Upgrade</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* SYNTHETIC INVOICE MODAL BACKUP POPUP */}
      <AnimatePresence>
        {showInvoice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-3xl text-left"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                <Receipt className="w-5 h-5 text-purple-400" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase font-mono">Simulated Settlement</h4>
                  <p className="text-[9px] text-neutral-500 font-mono uppercase">Invoiced via sandbox wallet key</p>
                </div>
              </div>

              <div className="space-y-2 mt-4 bg-black/40 p-3.5 rounded-xl border border-neutral-950 font-mono text-[10px] space-y-2 leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Invoice ID:</span>
                  <span className="text-white font-bold">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Plan Selected:</span>
                  <span className="text-purple-400 font-bold">{activePlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Billing Cycle:</span>
                  <span className="text-white font-bold uppercase">{billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Settled Currency:</span>
                  <span className="text-white font-bold">{selectedCurrency.code} ({selectedCurrency.name})</span>
                </div>

                <div className="border-t border-neutral-800 my-2 pt-2 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Base Cost:</span>
                    <span className="text-neutral-350">{formattedCurrency(basePriceConverted)}</span>
                  </div>
                  {addonsConverted > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Auxiliary Upgrades:</span>
                      <span className="text-neutral-350">+{formattedCurrency(addonsConverted)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold border-t border-neutral-900 pt-1.5 mt-1">
                    <span className="text-white">Amount Paid:</span>
                    <span className="text-purple-400">{formattedCurrency(totalConverted)}</span>
                  </div>
                </div>

                <div className="text-center text-[8px] text-neutral-600 bg-neutral-950/40 p-1 rounded mt-2 border border-neutral-900 uppercase">
                  ✓ Ledger Verified Sandbox Auth Token
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
