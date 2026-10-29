/**
 * Portal-Rendered Searchable Select Dropdown
 * Positions floating menu via createPortal with dynamic collision detection (renders above or below).
 */

import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import ReactDOM from 'react-dom';

/**
 * SearchableSelect Component
 */
const SearchableSelect = ({ options, value, onChange, placeholder, searchPlaceholder = "Search..." }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);

  const getDropdownStyle = () => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 240 && rect.top > 240;
    return {
      position: 'fixed',
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      zIndex: 99999,
      ...(showAbove
        ? { bottom: Math.round(window.innerHeight - rect.top + 4) }
        : { top: Math.round(rect.bottom + 4) }),
    };
  };

  const openDropdown = () => {
    setDropdownStyle(getDropdownStyle());
    setSearchTerm('');
    setIsOpen(true);
  };

  const closeDropdown = () => setIsOpen(false);

  /**
   * Viewport Repositioning Listener
   * Re-evaluates floating portal bounding rect upon window scroll or resize
   */
  useEffect(() => {
    if (!isOpen) return;
    const reposition = () => setDropdownStyle(getDropdownStyle());
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [isOpen]);

  /**
   * Click-Outside Dropdown Dismissal
   * Collapses portal popup when click event occurs outside trigger or dropdown bounds
   */
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        const dropdown = document.getElementById('searchable-select-dropdown');
        if (!dropdown || !dropdown.contains(e.target)) closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dropdown = isOpen ? (
    <div
      id="searchable-select-dropdown"
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden"
    >
      {/**
       * In-Menu Search Input
       * Filters dropdown items dynamically with instant keyword matching
       */}
      <div className="p-2 border-b border-gray-100 flex-shrink-0 relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#093C5D] focus:border-[#093C5D]"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      {/**
       * Filtered Options List
       * Scrollable list of matches with highlighted selection
       */}
      <div className="overflow-y-auto max-h-48">
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-sm text-center text-gray-500 font-medium">{t("No results found")}</div>
        ) : (
          filteredOptions.map(opt => (
            <div
              key={opt.value}
              className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${opt.value === value ? 'bg-[#093C5D]/5 text-[#093C5D] font-semibold' : 'text-gray-700 font-medium'}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                closeDropdown();
              }}
            >
              {opt.label}
            </div>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative w-full">
      {/**
       * Select Input Trigger
       * Visual button presenting current selection with toggle chevron
       */}
      <div
        ref={triggerRef}
        className="cursor-pointer w-full h-[42px] font-medium rounded-lg border border-gray-300 px-3 text-sm transition-all flex justify-between items-center bg-white hover:border-gray-400 select-none"
        onClick={() => isOpen ? closeDropdown() : openDropdown()}
      >
        <span className={`truncate pr-2 ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/**
       * Floating Portal Layer
       * Teleports dropdown to document body escaping parent CSS clipping contexts
       */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
};

export default SearchableSelect;
