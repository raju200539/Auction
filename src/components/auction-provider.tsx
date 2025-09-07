'use client';

import { useState, type ReactNode, useCallback, useEffect } from 'react';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AuctionStage, Player, PlayerWithId, Team } from '@/types';
import { AuctionContext } from '@/hooks/use-auction';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const AUCTION_DOC_ID = "current-auction";

interface AuctionState {
  stage: AuctionStage;
  teams: Team[];
  players: PlayerWithId[];
  currentPlayerIndex: number;
  unsoldPlayers: PlayerWithId[];
  lastTransaction: { teamId: number, player: PlayerWithId & { bidAmount: number } } | null;
}

const initialState: AuctionState = {
  stage: 'team-setup',
  teams: [],
  players: [],
  currentPlayerIndex: 0,
  unsoldPlayers: [],
  lastTransaction: null,
};

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);

  // Subscribe to Firestore document
  useEffect(() => {
    const docRef = doc(db, 'auctions', AUCTION_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAuctionState(docSnap.data() as AuctionState);
      } else {
        // If doc doesn't exist, create it with initial state
        setDoc(docRef, initialState).then(() => setAuctionState(initialState));
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const updateState = async (updates: Partial<AuctionState>) => {
    const docRef = doc(db, 'auctions', AUCTION_DOC_ID);
    const currentState = auctionState ?? (await getDoc(docRef)).data() as AuctionState ?? initialState;
    const newState = { ...currentState, ...updates };
    await setDoc(docRef, newState);
  };

  const handleSetTeams = useCallback(async (teams: Team[]) => {
    await updateState({ teams, stage: 'player-upload' });
  }, []);

  const setStage = useCallback(async (stage: AuctionStage) => {
    await updateState({ stage });
  }, []);

  const handleSetPlayers = useCallback(async (elite: Player[], normal: Player[]) => {
    const shuffledElite = shuffleArray(elite);
    const shuffledNormal = shuffleArray(normal);
    const allPlayers = [...shuffledElite, ...shuffledNormal].map(
      (p, i) => ({ ...p, id: i })
    );
    await updateState({
      players: allPlayers,
      unsoldPlayers: [],
      currentPlayerIndex: 0,
      stage: 'auction',
      lastTransaction: null,
    });
  }, []);

  const assignPlayer = async (teamId: number, bidAmount: number) => {
    if (!auctionState) return;
    const { players, currentPlayerIndex } = auctionState;
    
    const playerToAssign = players[currentPlayerIndex];
    if (!playerToAssign) return;

    const assignedPlayer = { ...playerToAssign, bidAmount };

    const newTeams = auctionState.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          purse: team.purse - bidAmount,
          players: [...team.players, assignedPlayer],
        };
      }
      return team;
    });

    const newPlayers = [...players];
    newPlayers.splice(currentPlayerIndex, 1);
    
    await updateState({
      teams: newTeams,
      players: newPlayers,
      lastTransaction: { teamId, player: assignedPlayer },
    });
  };

  const skipPlayer = async () => {
    if (!auctionState) return;
    const { players, currentPlayerIndex, unsoldPlayers } = auctionState;

    const playerToSkip = players[currentPlayerIndex];
    const newUnsold = playerToSkip ? [...unsoldPlayers, playerToSkip] : unsoldPlayers;

    const newPlayers = [...players];
    newPlayers.splice(currentPlayerIndex, 1);

    await updateState({
      players: newPlayers,
      unsoldPlayers: newUnsold,
      lastTransaction: null,
    });
    checkRoundEnd({ ...auctionState, players: newPlayers, unsoldPlayers: newUnsold });
  };
  
  const nextPlayer = async () => {
    if (!auctionState) return;
    await updateState({ lastTransaction: null });
    checkRoundEnd(auctionState);
  };
  
  const checkRoundEnd = async (state: AuctionState) => {
    if (state.currentPlayerIndex >= state.players.length) {
      if (state.unsoldPlayers.length > 0) {
        const shuffledUnsold = shuffleArray(state.unsoldPlayers);
        await updateState({
          players: shuffledUnsold,
          unsoldPlayers: [],
          currentPlayerIndex: 0,
        });
      } else {
        await updateState({ stage: 'summary' });
      }
    }
  };

  const undoLastAssignment = async () => {
    if (!auctionState || !auctionState.lastTransaction) return;

    const { teamId, player } = auctionState.lastTransaction;

    const newTeams = auctionState.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          purse: team.purse + player.bidAmount,
          players: team.players.filter(p => p.id !== player.id),
        };
      }
      return team;
    });

    const newPlayers = [...auctionState.players];
    newPlayers.splice(auctionState.currentPlayerIndex, 0, player);

    await updateState({
      teams: newTeams,
      players: newPlayers,
      lastTransaction: null,
    });
  };
  
  const startAuction = useCallback(async () => {
    await updateState({ stage: 'player-upload' });
  }, []);

  const restartAuction = useCallback(async () => {
    await updateState(initialState);
  }, []);

  if (!auctionState) {
    return null; // Or a loading spinner
  }

  return (
    <AuctionContext.Provider
      value={{
        ...auctionState,
        setTeams: handleSetTeams,
        setStage,
        setPlayers: handleSetPlayers,
        assignPlayer,
        skipPlayer,
        nextPlayer,
        startAuction,
        restartAuction,
        undoLastAssignment,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}
