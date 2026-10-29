/**
 * Sticky Settings Form Submission Bar
 * Provides persistent save button with dirty-state indicator and asynchronous loading animation.
 */

import React from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * SettingSaveButton Component
 */
const SettingSaveButton = ({
  isUpdating,
  hasChanges = true,
  label = 'Save Settings',
  loadingLabel = 'Saving...',
}) => {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-16 lg:bottom-4 z-20 mt-8 pt-4 pb-4 lg:pb-0">
      <div className="bg-white border border-gray-200 p-2 sm:px-4 sm:py-2.5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full shadow-none">
        <div className="hidden sm:flex items-center gap-2 text-sm ml-1">
          <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className={hasChanges ? 'text-amber-700 font-medium' : 'text-gray-500 font-medium'}>
            {hasChanges ? t('You have unsaved changes') : t('All changes saved')}
          </span>
        </div>
        <button
          type="submit"
          disabled={!hasChanges || isUpdating}
          className={`cursor-pointer bg-[#093C5D] text-white px-8 py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm w-full sm:w-auto active:scale-[0.98] transition-colors duration-300 ${
            (!hasChanges || isUpdating) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#072d46]'
          }`}
        >
          <Save className="w-4 h-4 shrink-0" />
          <span className="tracking-wide">{isUpdating ? t(loadingLabel) : t(label)}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingSaveButton;
