import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

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

  // Only an invisible trigger div - no spinner rendered here
  return <div ref={ref} className="h-4 w-full" />;
};

export default InfiniteScrollObserver;
