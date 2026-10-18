import React from 'react';
import { Loader2, ArrowDownCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * LoadMoreButton
 * Clean, production-level pagination component styled to match the app theme (#093C5D).
 * Automatically hides when all data fits in a single page (totalCount <= pageSize && !hasNextPage).
 */
const LoadMoreButton = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  currentCount = 0,
  totalCount = 0,
  pageSize = 15,
  label = 'records',
  className = '',
}) => {
  const { t } = useTranslation();

  // 1. If no data exists, don't render anything
  if (!totalCount && !currentCount) return null;

  // 2. If there's only 1 page of data or total records <= pageSize, and no next page,
  // do NOT show any load more button or end footer (clean, uncluttered UI)
  if (!hasNextPage && (totalCount <= pageSize || currentCount <= pageSize)) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-gray-100 bg-white ${className}`}
    >
      {/* Record counter display */}
      <div className="text-xs sm:text-sm text-gray-500 font-medium">
        {hasNextPage ? (
          <>
            {t('Showing')}{' '}
            <span className="font-semibold text-gray-900">{currentCount}</span>{' '}
            {t('of')}{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span>{' '}
            {label}
          </>
        ) : (
          <>
            {t('Showing all')}{' '}
            <span className="font-semibold text-gray-900">{totalCount}</span>{' '}
            {label}
          </>
        )}
      </div>

      {/* Action button when more items available, or subtle completion badge */}
      <div className="flex items-center gap-2">
        {hasNextPage ? (
          <button
            type="button"
            onClick={() => !isFetchingNextPage && fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-lg 
                       bg-[#093C5D] hover:bg-[#082a42] text-white 
                       active:scale-95 transition-all duration-150 shadow-xs 
                       disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                <span>{t('Loading more...')}</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                <span>{t('Load More')}</span>
              </>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium py-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {t('All {{label}} loaded', { label })}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadMoreButton;
