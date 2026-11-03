/**
 * UdharPay Storm ("Гроза") Color System
 * Centralized theme constants and utility classes for seamless app-wide styling.
 */

export const STORM_PALETTE = {
  midnight: '#12141F',  // 950 - Deepest black/navy, high-contrast headings & overlays
  navy: '#232739',      // 900 - Brand primary, dark buttons, logo boxes, active states
  slate: '#383E5C',     // 800 - Secondary text, inactive nav, icon default
  indigo: '#4F5580',    // 700 - Primary accents, chart trend curves, active hover borders
  lavender: '#7B81A8',  // 500 - Muted subtitles, timestamps, placeholder text, axis labels
  softSlate: '#AFB4CE', // 300 - Clean borders, dividers, guide lines
  iceMist: '#E4E6F0',   // 100 - App canvas background, light icon boxes, active pill backgrounds
};

/**
 * Standard reusable class combinations for pages, modals, and feature components
 */
export const THEME_CLASSES = {
  // Layout & Surfaces
  canvas: 'bg-[#E4E6F0] text-[#12141F]',
  card: 'bg-white border border-[#AFB4CE]/60',
  cardHover: 'hover:border-[#4F5580] transition-colors duration-150',
  
  // Typography
  heading: 'text-[#232739] font-semibold',
  subheading: 'text-[#383E5C] text-sm',
  textPrimary: 'text-[#12141F]',
  textSecondary: 'text-[#383E5C]',
  textMuted: 'text-[#7B81A8]',

  // Borders & Dividers
  border: 'border-[#AFB4CE]/60',
  borderHighlight: 'border-[#4F5580]',
  divider: 'border-t border-[#AFB4CE]/60',

  // Buttons
  btnPrimary: 'bg-[#232739] hover:bg-[#383E5C] text-white font-medium transition-colors duration-150 cursor-pointer',
  btnSecondary: 'bg-[#E4E6F0] hover:bg-[#AFB4CE]/60 text-[#232739] border border-[#AFB4CE]/60 font-medium transition-colors duration-150 cursor-pointer',
  btnGhost: 'text-[#383E5C] hover:text-[#232739] hover:bg-[#E4E6F0] transition-colors duration-150 cursor-pointer',

  // Form Inputs
  input: 'bg-white border border-[#AFB4CE]/60 text-[#232739] placeholder-[#7B81A8] focus:outline-none focus:ring-1 focus:ring-[#232739] focus:border-[#232739] transition-colors duration-150',

  // Navigation & Pills
  navActive: 'bg-[#E4E6F0] text-[#232739] border-[#AFB4CE]/80 font-semibold',
  navInactive: 'text-[#383E5C] hover:text-[#232739] hover:bg-[#E4E6F0] border-transparent font-medium',

  // Modal Dialogs
  modalOverlay: 'fixed inset-0 bg-[#12141F]/60 backdrop-blur-xs transition-opacity',
  modalContainer: 'bg-white border border-[#AFB4CE]/60 shadow-2xl shadow-[#12141F]/15 rounded-xl overflow-hidden',
};

export default STORM_PALETTE;

