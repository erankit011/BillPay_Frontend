/**
 * Universal Language Switcher Component
 * Supports compact navbar icon dropdown and full expanded pill dropdown
 * for toggling application locale between English and Hindi.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, Globe } from 'lucide-react';

/**
 * LanguageSwitcher Component
 */
const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsOpen(false);
  };

  /**
   * Click-Outside Dropdown Dismissal
   * Automatically closes flyout when user clicks outside boundaries
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Compact Navbar Variant
   * Icon-only trigger designed for tight navigation toolbars
   */
  if (variant === 'compact') {
    return (
      <div className="relative flex items-center justify-center" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-transparent hover:border-[#DCD3E0] rounded-full text-[#585272] hover:text-[#3A3550] bg-transparent active:bg-[#F4EFF3] hover:bg-[#F4EFF3] transition-colors duration-150 cursor-pointer shrink-0"
          aria-label="Change language"
        >
          <Globe className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#585272]" strokeWidth={1.75} />
        </button>

        {isOpen && (
          <div className="absolute right-0 sm:-right-2 top-[calc(100%+8px)] w-32 bg-white rounded-lg shadow-none border border-[#DCD3E0] py-1.5 z-50 animate-fade-in origin-top-right">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  currentLanguage.code === lang.code
                    ? 'text-[#3A3550] bg-[#DCD3E0] font-semibold'
                    : 'text-[#585272] hover:bg-[#F4EFF3] hover:text-[#3A3550]'
                }`}
              >
                <span>{lang.nativeName}</span>
                {currentLanguage.code === lang.code && (
                  <Check className="w-4 h-4 text-[#3A3550]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /**
   * Standard Dropdown Variant
   * Button with text label and chevron for broad placement
   */
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 px-3 h-9 text-sm font-semibold text-[#585272] hover:text-[#3A3550] bg-white border border-[#DCD3E0] rounded-md transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <span className="uppercase">{currentLanguage.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-28 bg-white rounded-md border border-[#DCD3E0] py-1 z-50 animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer ${
                currentLanguage.code === lang.code
                  ? 'text-[#3A3550] bg-[#DCD3E0] font-semibold'
                  : 'text-[#585272] hover:bg-[#F4EFF3] hover:text-[#3A3550]'
              }`}
            >
              <span>{lang.nativeName}</span>
              {currentLanguage.code === lang.code && (
                <Check className="w-3.5 h-3.5 text-[#3A3550]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
