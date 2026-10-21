import React from 'react';

const ToggleSwitch = ({ name, checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-b-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5 font-normal">{description}</p>}
    </div>
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
      className={`cursor-pointer relative inline-flex items-center shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-[#093C5D]' : 'bg-gray-300'
      }`}
      style={{ width: '36px', height: '20px', minWidth: '36px', minHeight: '20px', padding: 0 }}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white transition-transform duration-200 shadow-sm ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
        style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
      />
    </div>
  </div>
);

export default ToggleSwitch;
