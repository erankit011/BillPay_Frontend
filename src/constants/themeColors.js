/**
 * UdharPay Modern SaaS UI/UX Design System
 * Palette:
 *   #F4EEFF - Ultra-soft Lavender Mist (Canvas / App background)
 *   #DCD6F7 - Soft Pastel Periwinkle (Card borders, dividers, subtle pills)
 *   #A6B1E1 - Slate Periwinkle (Chart curves, secondary accents, focus rings, hover highlights)
 *   #424874 - Deep Indigo Slate (Brand primary, headings, primary buttons, KPI metrics)
 */

export const THEME_PALETTE = {
  canvas: '#F4EEFF',        // App canvas / background
  border: '#DCD6F7',        // Crisp delicate borders & dividers
  accent: '#A6B1E1',        // Chart trend curves, focus rings, secondary bar
  primary: '#424874',       // Primary brand headings, buttons, active highlights
  primaryHover: '#323759',  // Deep button hover state
  surface: '#FFFFFF',       // Clean elevated white card surfaces
  textPrimary: '#424874',   // High-contrast primary text
  textSecondary: '#5B618A', // Balanced 80% secondary text for subtitles & labels
  textMuted: '#8F99C5',     // Muted helper text, timestamps, chart ticks
};

export const THEME_COLORS = THEME_PALETTE;

/**
 * Standardized reusable class combinations for pages, cards, and modals
 */
export const THEME_CLASSES = {
  // Surfaces & Layout
  canvas: 'bg-[#F4EEFF] text-[#424874]',
  card: 'bg-white border border-[#DCD6F7] shadow-none',
  cardHover: 'hover:border-[#A6B1E1] transition-all duration-200',

  // Typography
  heading: 'text-[#424874] font-semibold',
  subheading: 'text-[#5B618A] text-sm font-medium',
  textPrimary: 'text-[#424874]',
  textSecondary: 'text-[#5B618A]',
  textMuted: 'text-[#8F99C5]',

  // Borders & Dividers
  border: 'border-[#DCD6F7]',
  borderHover: 'border-[#A6B1E1]',
  divider: 'border-t border-[#DCD6F7]',

  // Buttons & Interactive
  btnPrimary: 'bg-[#424874] hover:bg-[#323759] text-white font-medium transition-colors duration-150 cursor-pointer shadow-none',
  btnSecondary: 'bg-[#F4EEFF] hover:bg-[#DCD6F7] text-[#424874] border border-[#DCD6F7] font-medium transition-colors duration-150 cursor-pointer',
  btnGhost: 'text-[#5B618A] hover:text-[#424874] hover:bg-[#F4EEFF] transition-colors duration-150 cursor-pointer',

  // Navigation Links & Tabs
  navActive: 'bg-[#F4EEFF] text-[#424874] border-[#DCD6F7] font-semibold shadow-none',
  navInactive: 'text-[#5B618A] hover:text-[#424874] hover:bg-[#F4EEFF] border-transparent font-medium transition-colors duration-150',

  // Form Controls
  input: 'bg-white border border-[#DCD6F7] text-[#424874] placeholder-[#8F99C5] focus:outline-none focus:ring-2 focus:ring-[#A6B1E1]/40 focus:border-[#424874] transition-all duration-150',

  // Modal Dialogs
  modalOverlay: 'fixed inset-0 bg-[#424874]/50 backdrop-blur-xs transition-opacity',
  modalContainer: 'bg-white border border-[#DCD6F7] shadow-none rounded-2xl overflow-hidden',
};

export default THEME_PALETTE;
