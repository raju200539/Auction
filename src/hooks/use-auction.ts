
'use client';

import type { AuctionStage, Player, PlayerWithId, Team } from '@/types';
import { createContext, useContext } from 'react';

type AuctionContextType = {
  stage: AuctionStage;
  teams: Team[];
  players: PlayerWithId[];
  currentPlayerIndex: number;
  lastTransaction: { teamId: number, player: PlayerWithId & { bidAmount: number } } | null;
  interstitialMessage: { title: string; description: string } | null;
  setTeams: (teams: Team[]) => void;
  setStage: (stage: AuctionStage) => void;
  setPlayers: (elite: Player[], normal: Player[]) => void;
  assignPlayer: (teamId: number, bidAmount: number) => void;
  skipPlayer: () => void;
  nextPlayer: () => void;
  startAuction: () => void;
  restartAuction: () => void;
  undoLastAssignment: () => void;
  clearInterstitial: () => void;
};

export const AuctionContext = createContext<AuctionContextType | null>(null);

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within an AuctionProvider');
  }
  return context;
};
