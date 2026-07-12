import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';

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

  return (
    <div ref={ref} className="w-full">
      {isFetchingNextPage ? (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-[#093C5D]" />
        </div>
      ) : (
        <div className="h-1" />
      )}
    </div>
  );
};

export default InfiniteScrollObserver;
