import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveBroadcasts } from '../../api/adminApi';
import BroadcastBanner from './BroadcastBanner';

const DISMISSED_KEY = 'udharpay_dismissed_broadcasts';

const ActiveBroadcastBanner = () => {
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['activeBroadcasts'],
    queryFn: getActiveBroadcasts,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
    } catch {
      // Safe fallback if localStorage is disabled or restricted
    }
  };

  // Filter out dismissed broadcasts unless marked non-dismissible
  const visibleBroadcasts = broadcasts.filter(
    (b) => b && b._id && (!b.dismissible ? true : !dismissedIds.includes(b._id))
  );

  if (visibleBroadcasts.length === 0) return null;

  return (
    <div className="space-y-3 mb-5 sm:mb-6">
      {visibleBroadcasts.map((broadcast) => (
        <BroadcastBanner
          key={broadcast._id}
          broadcast={broadcast}
          onDismiss={() => handleDismiss(broadcast._id)}
          isPreview={false}
        />
      ))}
    </div>
  );
};

export default ActiveBroadcastBanner;
