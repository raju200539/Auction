
'use client';

import { useState, useEffect, type ReactNode, useCallback } from 'react';
import { PastAuctionsContext } from '@/hooks/use-past-auctions';
import type { PastAuction } from '@/types';

const PAST_AUCTIONS_STORAGE_KEY = 'pastAuctions';

export function PastAuctionsProvider({ children }: { children: ReactNode }) {
  const [pastAuctions, setPastAuctions] = useState<PastAuction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedAuctions = localStorage.getItem(PAST_AUCTIONS_STORAGE_KEY);
    if (savedAuctions) {
      try {
        setPastAuctions(JSON.parse(savedAuctions));
      } catch (e) {
        console.error("Failed to parse past auctions from localStorage", e);
        setPastAuctions([]);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(PAST_AUCTIONS_STORAGE_KEY, JSON.stringify(pastAuctions));
    }
  }, [pastAuctions, isLoaded]);

  const addPastAuction = useCallback((auction: PastAuction) => {
    setPastAuctions(prevAuctions => [auction, ...prevAuctions]);
  }, []);

  const getAuctionById = useCallback((id: string) => {
    return pastAuctions.find(auction => auction.id === id);
  }, [pastAuctions]);

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <PastAuctionsContext.Provider
      value={{
        pastAuctions,
        addPastAuction,
        getAuctionById,
      }}
    >
      {children}
    </PastAuctionsContext.Provider>
  );
}
