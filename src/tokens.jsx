// Design tokens for Lumio
// Single source of truth for colors, type, spacing, motion.
// Accents share chroma & lightness; only hue varies.

export const LumioTokens = {
  // Primary palette options (tweakable) — oklch, consistent chroma ~0.13 and L ~0.62
  primaries: {
    teal:   { name: 'Мятный',    hue: 175, swatch: 'oklch(0.62 0.13 175)' },
    indigo: { name: 'Индиго',    hue: 265, swatch: 'oklch(0.58 0.14 265)' },
    violet: { name: 'Сиреневый', hue: 305, swatch: 'oklch(0.60 0.14 305)' },
    amber:  { name: 'Янтарный',  hue: 65,  swatch: 'oklch(0.72 0.14 65)'  },
  },

  // Neutral warm-cool ramp
  neutral: {
    paper:      'oklch(0.985 0.004 85)',
    surface:    'oklch(1    0      0)',
    line:       'oklch(0.92 0.006 260)',
    lineStrong: 'oklch(0.86 0.008 260)',
    mute:       'oklch(0.55 0.01  260)',
    ink:        'oklch(0.22 0.02  260)',
    inkSoft:    'oklch(0.32 0.02  260)',
  },

  semantic: {
    danger:  'oklch(0.58 0.17 25)',
    dangerBg:'oklch(0.97 0.02 25)',
    success: 'oklch(0.62 0.13 155)',
  },

  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  shadow: {
    sm:  '0 1px 2px rgba(16, 24, 40, 0.04)',
    md:  '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.04)',
    lg:  '0 2px 4px rgba(16, 24, 40, 0.04), 0 12px 28px rgba(16, 24, 40, 0.06)',
    focus:'0 0 0 4px var(--primary-ring)',
  },
  motion: {
    fast:   '140ms cubic-bezier(.2,.7,.2,1)',
    base:   '220ms cubic-bezier(.2,.7,.2,1)',
    spring: '420ms cubic-bezier(.34,1.25,.5,1)',
  },
};

export function primaryVars(hue) {
  return {
    '--primary':       `oklch(0.60 0.13 ${hue})`,
    '--primary-ink':   `oklch(0.38 0.13 ${hue})`,
    '--primary-hover': `oklch(0.54 0.14 ${hue})`,
    '--primary-soft':  `oklch(0.96 0.03 ${hue})`,
    '--primary-soft-ink': `oklch(0.42 0.12 ${hue})`,
    '--primary-ring':  `oklch(0.72 0.13 ${hue} / 0.35)`,
    '--primary-edge':  `oklch(0.78 0.08 ${hue})`,
  };
}
