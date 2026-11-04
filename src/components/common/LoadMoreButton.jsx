import React from 'react';
import { Loader2, ArrowDownCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Number Formatter Helper
 * Formats raw numbers with standard locale separators (e.g. 1001 -> '1,001')
 */
const formatNum = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  return Number(num).toLocaleString();
};

/**
 * Universal LoadMore & Pagination Component (DRY Architecture)
 * Supports both Infinite-Scroll query fetching and Traditional Page navigation.
 * Fully responsive: desktop horizontal bar and thumb-friendly mobile layout.
 *
 * @param {Object} props
 * @param {boolean} [props.hasNextPage] - Infinite Query: whether subsequent page exists
 * @param {boolean} [props.isFetchingNextPage] - Infinite Query: loader active status
 * @param {Function} [props.fetchNextPage] - Infinite Query: trigger function to fetch next page
 * @param {number} [props.currentCount=0] - Infinite Query: current count of records in view
 * @param {number} [props.page] - Pagination: current active page index (1-based)
 * @param {number} [props.currentPage] - Pagination alias for page
 * @param {number} [props.totalPages] - Pagination: total available pages count
 * @param {Function} [props.onPageChange] - Pagination: callback when page changes (newPage: number)
 * @param {boolean} [props.isLoading=false] - Pagination: query loading state
 * @param {number} [props.totalCount=0] - Total grand count of items across all pages
 * @param {number} [props.pageSize=15] - Threshold count per page
 * @param {string} [props.label='records'] - Entity noun (e.g. 'customers', 'bills', 'merchants')
 * @param {string} [props.className=''] - Additional custom wrapper classes
 * @param {'auto'|'infinite'|'pagination'} [props.mode='auto'] - Explicit mode override
 */
const LoadMoreButton = ({
  // Infinite query mode props
  hasNextPage,
  isFetchingNextPage = false,
  fetchNextPage,
  currentCount = 0,

  // Pagination mode props
  page,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,

  // Shared metrics & display props
  totalCount = 0,
  pageSize = 15,
  label = 'records',
  className = '',
  mode = 'auto',
}) => {
  const { t } = useTranslation();

  /**
   * Determine Component Operational Mode
   * Auto-detects whether the host view operates via Infinite Query or Page Indexing
   */
  const activeMode =
    mode !== 'auto'
      ? mode
      : totalPages !== undefined || onPageChange !== undefined
      ? 'pagination'
      : 'infinite';

  // ==========================================
  // MODE 1: PAGINATION (Used by Admin Pages)
  // ==========================================
  if (activeMode === 'pagination') {
    const activePage = Number(page || currentPage || 1);
    const maxPages = Number(totalPages || 1);
    const resolvedTotal = totalCount || 0;

    /**
     * Conceal pagination bar when dataset is empty or fits within a single page
     */
    if (maxPages <= 1 && resolvedTotal <= pageSize) {
      return null;
    }

    return (
      <div
        className={`w-full border-t border-[#DCE1EA] bg-[#FBFBFC] px-4 py-3 sm:px-6 sm:py-3.5 transition-all duration-150 select-none ${className}`}
      >
        {/**
         * Desktop Pagination View (sm and up)
         * Spread layout: page summary on left, previous/next pill triggers on right
         */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-[#4E5668] font-medium">
            {t('Showing page')}{' '}
            <span className="font-semibold text-[#191E2B]">{formatNum(activePage)}</span>{' '}
            {t('of')}{' '}
            <span className="font-semibold text-[#191E2B]">{formatNum(maxPages)}</span>
            {resolvedTotal > 0 && (
              <span className="text-[#757F94] ml-1">
                ({formatNum(resolvedTotal)} {t('total')} {label})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(Math.max(1, activePage - 1))}
              disabled={activePage <= 1 || isLoading}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4E5668] bg-[#FFFFFF] border border-[#DCE1EA] rounded-lg hover:bg-[#F0F2F6] hover:text-[#191E2B] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t('Previous')}</span>
            </button>

            <span className="text-xs font-semibold px-2.5 py-1 text-[#191E2B] bg-[#EEF0FB] border border-[#D8DCF5] rounded-md">
              {activePage} / {maxPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange && onPageChange(Math.min(maxPages, activePage + 1))}
              disabled={activePage >= maxPages || isLoading}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4E5668] bg-[#FFFFFF] border border-[#DCE1EA] rounded-lg hover:bg-[#F0F2F6] hover:text-[#191E2B] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-none"
            >
              <span>{t('Next')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/**
         * Mobile Pagination View (phones < sm)
         * Stacked layout: summary header and equal-width thumb-friendly touch targets
         */}
        <div className="sm:hidden flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-[#4E5668] font-medium">
            <span>
              {t('Page')}{' '}
              <span className="font-semibold text-[#191E2B]">{activePage}</span> / {maxPages}
            </span>
            {resolvedTotal > 0 && (
              <span className="text-[#757F94] text-[11px] font-semibold">
                {formatNum(resolvedTotal)} {label}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(Math.max(1, activePage - 1))}
              disabled={activePage <= 1 || isLoading}
              className="cursor-pointer min-h-[40px] inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#4E5668] bg-[#FFFFFF] border border-[#DCE1EA] rounded-lg hover:bg-[#F0F2F6] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('Previous')}</span>
            </button>

            <button
              type="button"
              onClick={() => onPageChange && onPageChange(Math.min(maxPages, activePage + 1))}
              disabled={activePage >= maxPages || isLoading}
              className="cursor-pointer min-h-[40px] inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#4E5668] bg-[#FFFFFF] border border-[#DCE1EA] rounded-lg hover:bg-[#F0F2F6] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-none"
            >
              <span>{t('Next')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 2: INFINITE QUERY LOAD MORE (Shopkeeper)
  // ==========================================

  /**
   * Empty State Check
   * Avoids rendering footer when dataset has no records
   */
  if (!totalCount && !currentCount) return null;

  /**
   * Single-Page Clean View Check
   * Conceals pagination footer when all records fit comfortably on current screen
   */
  if (!hasNextPage && (totalCount <= pageSize || currentCount <= pageSize)) {
    return null;
  }

  const progressPercent =
    totalCount > 0 ? Math.min(100, Math.round((currentCount / totalCount) * 100)) : 100;

  return (
    <div
      className={`w-full border-t border-[#DCE1EA] bg-[#FBFBFC] px-4 py-3 sm:px-6 sm:py-3.5 transition-all duration-150 select-none ${className}`}
    >
      {/**
       * Desktop Infinite Load View (sm and up)
       * Clean horizontal bar: Record count on left, Load More button on right (Matches Shopkeeper UI 1:1)
       */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        {/* Left: Metrics counter */}
        <p className="text-xs sm:text-sm text-[#4E5668] font-medium truncate">
          {hasNextPage ? (
            <>
              {t('Showing')}{' '}
              <span className="font-semibold text-[#191E2B]">{formatNum(currentCount)}</span>{' '}
              {t('of')}{' '}
              <span className="font-semibold text-[#191E2B]">{formatNum(totalCount)}</span>{' '}
              {label}
            </>
          ) : (
            <>
              {t('Showing all')}{' '}
              <span className="font-semibold text-[#191E2B]">{formatNum(totalCount)}</span>{' '}
              {label}
            </>
          )}
        </p>

        {/* Right: Load trigger or completion indicator badge */}
        <div className="flex items-center gap-2 shrink-0">
          {hasNextPage ? (
            <button
              type="button"
              onClick={() => !isFetchingNextPage && fetchNextPage && fetchNextPage()}
              disabled={isFetchingNextPage}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg 
                         bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] text-white 
                         transition-all duration-150 shadow-none
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{t('Loading more...')}</span>
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-4 h-4 text-white" />
                  <span>{t('Load More')}</span>
                </>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#0D7A57] text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0D7A57]" />
              {t('All {{label}} loaded', { label })}
            </span>
          )}
        </div>
      </div>

      {/**
       * Mobile Infinite Load View (phones < sm)
       * Fully responsive, thumb-friendly tap target and clean count
       */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {/* Mobile Top Row: Metric count */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#4E5668] font-medium truncate">
            {hasNextPage ? (
              <>
                {t('Showing')}{' '}
                <span className="font-semibold text-[#191E2B]">{formatNum(currentCount)}</span>{' '}
                {t('of')}{' '}
                <span className="font-semibold text-[#191E2B]">{formatNum(totalCount)}</span>{' '}
                {label}
              </>
            ) : (
              <>
                {t('Showing all')}{' '}
                <span className="font-semibold text-[#191E2B]">{formatNum(totalCount)}</span>{' '}
                {label}
              </>
            )}
          </p>
        </div>

        {/* Mobile Action Button */}
        {hasNextPage ? (
          <button
            type="button"
            onClick={() => !isFetchingNextPage && fetchNextPage && fetchNextPage()}
            disabled={isFetchingNextPage}
            className="cursor-pointer w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg 
                       bg-[#4338CA] hover:bg-[#3730A3] active:scale-[0.98] text-white 
                       transition-all duration-150 shadow-none
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{t('Loading more...')}</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4 text-white" />
                <span>{t('Load More')}</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-full py-2 px-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#0D7A57] text-xs font-semibold flex items-center justify-center gap-1.5 text-center">
            <CheckCircle2 className="w-4 h-4 text-[#0D7A57] shrink-0" />
            <span>{t('All {{label}} loaded', { label })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadMoreButton;
