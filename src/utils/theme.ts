export interface ColorTheme {
  id: string;
  name: string;
  primaryColor: string; // Hex color
  hoverColor: string; // Hex hover
}

export const THEME_PRESETS: ColorTheme[] = [
  {
    id: 'purple',
    name: 'Royal Purple',
    primaryColor: '#8b5cf6',
    hoverColor: '#7c3aed'
  },
  {
    id: 'cyan',
    name: 'Cyberpunk Cyan',
    primaryColor: '#06b6d4',
    hoverColor: '#0891b2'
  },
  {
    id: 'red',
    name: 'Sovereign Red',
    primaryColor: '#db242d',
    hoverColor: '#be123c'
  },
  {
    id: 'green',
    name: 'Emerald Green',
    primaryColor: '#10b981',
    hoverColor: '#059669'
  },
  {
    id: 'amber',
    name: 'Amber Sunset',
    primaryColor: '#f59e0b',
    hoverColor: '#d97706'
  },
  {
    id: 'pink',
    name: 'Flamingo Pink',
    primaryColor: '#ec4899',
    hoverColor: '#db2777'
  }
];

export function getProfileTheme(primaryColorHex?: string): ColorTheme {
  if (!primaryColorHex) return THEME_PRESETS[0];
  const found = THEME_PRESETS.find(t => t.primaryColor.toLowerCase() === primaryColorHex.toLowerCase());
  if (found) return found;
  
  // Dynamic fallback if any other color hex is passed
  return {
    id: 'custom',
    name: 'Custom Brand',
    primaryColor: primaryColorHex,
    hoverColor: primaryColorHex // Fallback same color
  };
}
