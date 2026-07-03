import React from 'react';
import { UserProfile } from '../types';
import { getProfileTheme } from '../utils/theme';

interface ThemeInjectorProps {
  currentProfile: UserProfile | null;
}

export default function ThemeInjector({ currentProfile }: ThemeInjectorProps) {
  if (!currentProfile) return null;
  
  const theme = getProfileTheme(currentProfile.primaryColor);
  const primary = theme.primaryColor;
  const hover = theme.hoverColor;

  return (
    <style>{`
      :root {
        --brand-primary: ${primary};
        --brand-hover: ${hover};
      }
      
      /* Overrides for text highlights */
      .text-purple-400,
      .text-purple-300 {
        color: ${primary} !important;
      }
      
      /* Overrides for background elements */
      .bg-purple-650,
      .bg-purple-600 {
        background-color: ${primary} !important;
      }
      
      /* Overrides for border elements */
      .border-purple-500,
      .border-purple-500\\/40,
      .border-purple-500\\/30,
      .border-purple-500\\/25,
      .border-purple-500\\/20 {
        border-color: ${primary} !important;
      }
      
      /* Alpha transparency modifiers */
      .bg-purple-600\\/10 {
        background-color: color-mix(in srgb, ${primary} 10%, transparent) !important;
      }
      
      .bg-purple-600\\/20 {
        background-color: color-mix(in srgb, ${primary} 20%, transparent) !important;
      }
      
      .bg-purple-600\\/25 {
        background-color: color-mix(in srgb, ${primary} 25%, transparent) !important;
      }
      
      .bg-purple-950\\/20 {
        background-color: color-mix(in srgb, ${primary} 20%, transparent) !important;
      }
      
      .bg-purple-950\\/40 {
        background-color: color-mix(in srgb, ${primary} 40%, transparent) !important;
      }
      
      .bg-purple-950\\/95 {
        background-color: ${primary}ee !important;
      }
      
      /* Gradients overrides */
      .from-purple-600,
      .from-purple-650 {
        --tw-gradient-from: ${primary} !important;
        --tw-gradient-to: ${hover} !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }
      
      /* Hover highlights overrides */
      .hover\\:bg-purple-600\\/25:hover,
      .hover\\:bg-purple-650\\/25:hover {
        background-color: color-mix(in srgb, ${primary} 25%, transparent) !important;
      }
      
      .hover\\:bg-purple-600\\/20:hover {
        background-color: color-mix(in srgb, ${primary} 20%, transparent) !important;
      }
      
      .hover\\:bg-purple-650:hover {
        background-color: ${hover} !important;
      }
      
      .hover\\:border-purple-500\\/40:hover {
        border-color: color-mix(in srgb, ${primary} 40%, transparent) !important;
      }
      
      .shadow-purple-900\\/30 {
        --tw-shadow-color: color-mix(in srgb, ${primary} 30%, transparent) !important;
      }

      /* Glow effect overrides */
      .bg-gradient-to-r.from-purple-600.to-indigo-600 {
        background-image: linear-gradient(to right, ${primary}, ${hover}) !important;
      }
      
      .shadow-indigo-900\\/30 {
        --tw-shadow-color: color-mix(in srgb, ${hover} 30%, transparent) !important;
      }
    `}</style>
  );
}
