import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, Languages } from 'lucide-react';

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

  // Close dropdown when clicking outside
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

  // Compact variant for navbar
  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#093C5D] hover:text-[#072C44] bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-all active:scale-95 cursor-pointer"
          aria-label="Change language"
        >
          <Languages className="w-3.5 h-3.5 text-[#093C5D]" />
          <span className="uppercase tracking-wider">EN/HI</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50 animate-fade-in">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  currentLanguage.code === lang.code ? 'text-[#093C5D] bg-gray-50 font-medium' : 'text-gray-700'
                }`}
              >
                <span>{lang.nativeName}</span>
                {currentLanguage.code === lang.code && (
                  <Check className="w-4 h-4 text-[#093C5D]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant (not used anymore, but keeping for compatibility)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 px-3 h-9 text-sm font-medium text-gray-700 hover:text-[#093C5D] bg-white border border-gray-300 rounded-md transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <span className="uppercase">{currentLanguage.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-28 bg-white rounded-md border border-gray-200 py-1 z-50 animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                currentLanguage.code === lang.code ? 'text-[#093C5D] bg-gray-50 font-medium' : 'text-gray-700'
              } cursor-pointer`}
            >
              <span>{lang.nativeName}</span>
              {currentLanguage.code === lang.code && (
                <Check className="w-3.5 h-3.5 text-[#093C5D]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
