
'use client';

import { createContext, useContext } from 'react';
import type { PastAuction } from '@/types';

type PastAuctionsContextType = {
  pastAuctions: PastAuction[];
  addPastAuction: (auction: PastAuction) => void;
  getAuctionById: (id: string) => PastAuction | undefined;
};

export const PastAuctionsContext = createContext<PastAuctionsContextType | null>(null);

export const usePastAuctions = () => {
  const context = useContext(PastAuctionsContext);
  if (!context) {
    throw new Error('usePastAuctions must be used within a PastAuctionsProvider');
  }
  return context;
};
