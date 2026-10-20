import React from 'react';
import { Save, RefreshCw } from 'lucide-react';

const SettingSaveButton = ({
  isUpdating,
  label = 'Save Changes',
  loadingLabel = 'Saving Changes...',
}) => {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="submit"
        disabled={isUpdating}
        className="cursor-pointer h-10 px-5 rounded-lg bg-[#093C5D] hover:bg-[#072d46] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all active:scale-95 shadow-none disabled:opacity-50"
      >
        {isUpdating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SettingSaveButton;
