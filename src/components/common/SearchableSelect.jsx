import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, searchPlaceholder = "Search..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="cursor-pointer w-full font-medium rounded-xl border border-gray-300 px-4 py-2.5 md:py-3 text-sm md:text-base focus-within:ring-1 focus-within:ring-[#093C5D] focus-within:border-[#093C5D] transition-all flex justify-between items-center bg-white hover:border-gray-400"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm(''); // Reset search on open
        }}
      >
        <span className={`truncate pr-2 ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg shadow-black/5 max-h-60 flex flex-col overflow-hidden animate-fade-in">
          <div className="p-2.5 border-b border-gray-100 flex-shrink-0 relative">
            <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              className="w-full pl-9 pr-3 py-2 text-sm md:text-base bg-gray-50 border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-[#093C5D]"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-sm text-center text-gray-500 font-medium">No results found</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  className={`px-4 py-2.5 text-sm md:text-base cursor-pointer hover:bg-gray-50 transition-colors ${opt.value === value ? 'bg-[#093C5D]/5 text-[#093C5D] font-semibold' : 'text-gray-700 font-medium'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
