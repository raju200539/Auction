'use client';

import { useState, type ReactNode, useCallback, useEffect } from 'react';
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

const getInitialState = (): AuctionState => ({
  stage: 'team-setup',
  teams: [],
  players: [],
  currentPlayerIndex: 0,
  unsoldPlayers: [],
  lastTransaction: null,
});

interface AuctionState {
  stage: AuctionStage | 'loading';
  teams: Team[];
  players: PlayerWithId[];
  currentPlayerIndex: number;
  unsoldPlayers: PlayerWithId[];
  lastTransaction: { teamId: number, player: PlayerWithId & { bidAmount: number } } | null;
}

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [auctionState, setAuctionState] = useState<AuctionState>({ stage: 'loading', teams: [], players: [], currentPlayerIndex: 0, unsoldPlayers: [], lastTransaction: null });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('auctionState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.stage) {
          setAuctionState(parsedState);
        } else {
          setAuctionState(getInitialState());
        }
      } catch (e) {
        console.error("Failed to parse state from localStorage", e);
        setAuctionState(getInitialState());
      }
    } else {
      setAuctionState(getInitialState());
    }
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (isLoaded) {
      // Only save to localStorage on stage changes to avoid performance issues with large state.
      localStorage.setItem('auctionState', JSON.stringify(auctionState));
    }
  }, [auctionState.stage, isLoaded]);

  const updateState = (updates: Partial<AuctionState>) => {
    setAuctionState(prevState => ({ ...prevState, ...updates }));
  };

  const handleSetTeams = useCallback((teams: Team[]) => {
    updateState({ teams, stage: 'player-upload' });
  }, []);

  const setStage = useCallback((stage: AuctionStage) => {
    updateState({ stage });
  }, []);

  const handleSetPlayers = useCallback((elite: Player[], normal: Player[]) => {
    const shuffledElite = shuffleArray(elite);
    const shuffledNormal = shuffleArray(normal);
    const allPlayers = [...shuffledElite, ...shuffledNormal].map(
      (p, i) => ({ ...p, id: i })
    );
    updateState({
      players: allPlayers,
      unsoldPlayers: [],
      currentPlayerIndex: 0,
      stage: 'auction',
      lastTransaction: null,
    });
  }, []);

  const assignPlayer = (teamId: number, bidAmount: number) => {
    const playerToAssign = auctionState.players[auctionState.currentPlayerIndex];
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

    setAuctionState(prevState => ({
      ...prevState,
      teams: newTeams,
      lastTransaction: { teamId, player: assignedPlayer },
    }));
  };

  const skipPlayer = () => {
    setAuctionState(prevState => {
      const newUnsold = [
        ...prevState.unsoldPlayers,
        prevState.players[prevState.currentPlayerIndex],
      ];
      const nextIndex = prevState.currentPlayerIndex + 1;
      
      let newState: Partial<AuctionState> = {
        unsoldPlayers: newUnsold,
        lastTransaction: null, // Clear last transaction on skip
        currentPlayerIndex: nextIndex,
      };

      if (nextIndex >= prevState.players.length) {
        if (newUnsold.length > 0) {
          const shuffledUnsold = shuffleArray(newUnsold);
          newState = {
            ...newState,
            players: shuffledUnsold,
            unsoldPlayers: [],
            currentPlayerIndex: 0,
          };
        } else {
          newState = { ...newState, stage: 'summary' };
        }
      }
      return { ...prevState, ...newState };
    });
  };
  
  const nextPlayer = () => {
     setAuctionState(prevState => {
      const nextIndex = prevState.currentPlayerIndex + 1;
      let newState: Partial<AuctionState> = { 
        lastTransaction: null,
        currentPlayerIndex: nextIndex 
      };

      if (nextIndex >= prevState.players.length) {
        if (prevState.unsoldPlayers.length > 0) {
          const shuffledUnsold = shuffleArray(prevState.unsoldPlayers);
          newState = {
            ...newState,
            players: shuffledUnsold,
            unsoldPlayers: [],
            currentPlayerIndex: 0,
          };
        } else {
          newState = { ...newState, stage: 'summary' };
        }
      }
       return { ...prevState, ...newState };
    });
  };

  const undoLastAssignment = () => {
    if (!auctionState.lastTransaction) return;

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
    
    // Put the player back into the auction queue at the current position
    setAuctionState(prevState => ({
      ...prevState,
      teams: newTeams,
      lastTransaction: null,
    }));
  };
  
  const startAuction = useCallback(() => {
    updateState({ stage: 'player-upload' });
  }, []);

  const restartAuction = useCallback(() => {
    localStorage.removeItem('auctionState');
    setAuctionState(getInitialState());
  }, []);

  if (!isLoaded || auctionState.stage === 'loading') {
    return null; // Or a loading spinner
  }

  return (
    <AuctionContext.Provider
      value={{
        ...auctionState,
        stage: auctionState.stage as AuctionStage,
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
