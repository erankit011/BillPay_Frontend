/**
 * Invisible Infinite Scroll Viewport Observer
 * Emits page fetch requests via IntersectionObserver API when bottom sentinel enters viewport.
 */

import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * InfiniteScrollObserver Component
 */
const InfiniteScrollObserver = ({ hasNextPage, fetchNextPage, isFetchingNextPage }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage) return null;

  /**
   * Viewport Sentinel Element
   * Invisible target element triggering subsequent pagination queries
   */
  return <div ref={ref} className="h-4 w-full" />;
};

export default InfiniteScrollObserver;
