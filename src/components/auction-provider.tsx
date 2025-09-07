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

const getInitialState = (): AuctionState => {
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('auctionState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Basic validation to make sure it's not a completely invalid state
        if (parsedState.stage) {
          return parsedState;
        }
      } catch (e) {
        console.error("Failed to parse state from localStorage", e);
      }
    }
  }
  return {
    stage: 'team-setup',
    teams: [],
    players: [],
    currentPlayerIndex: 0,
    unsoldPlayers: [],
    lastTransaction: null,
  };
}

interface AuctionState {
  stage: AuctionStage;
  teams: Team[];
  players: PlayerWithId[];
  currentPlayerIndex: number;
  unsoldPlayers: PlayerWithId[];
  lastTransaction: { teamId: number, player: PlayerWithId & { bidAmount: number } } | null;
}

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [auctionState, setAuctionState] = useState<AuctionState>(getInitialState);

  useEffect(() => {
    localStorage.setItem('auctionState', JSON.stringify(auctionState));
  }, [auctionState]);

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

    updateState({
      teams: newTeams,
      lastTransaction: { teamId, player: assignedPlayer },
    });
  };

  const skipPlayer = () => {
    const newUnsold = [
      ...auctionState.unsoldPlayers,
      auctionState.players[auctionState.currentPlayerIndex],
    ];
    updateState({
      unsoldPlayers: newUnsold,
      lastTransaction: null, // Clear last transaction on skip
      currentPlayerIndex: auctionState.currentPlayerIndex + 1,
    });
    checkRoundEnd();
  };
  
  const nextPlayer = () => {
    updateState({
      lastTransaction: null,
      currentPlayerIndex: auctionState.currentPlayerIndex + 1,
    });
    checkRoundEnd();
  };
  
  const checkRoundEnd = () => {
    setAuctionState(prevState => {
      if (prevState.currentPlayerIndex +1 >= prevState.players.length) {
        if (prevState.unsoldPlayers.length > 0) {
          const shuffledUnsold = shuffleArray(prevState.unsoldPlayers);
          return {
            ...prevState,
            players: shuffledUnsold,
            unsoldPlayers: [],
            currentPlayerIndex: 0,
            lastTransaction: null,
          };
        } else {
          return { ...prevState, stage: 'summary' };
        }
      }
      return prevState;
    })
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
    
    updateState({
      teams: newTeams,
      lastTransaction: null,
    });
  };
  
  const startAuction = useCallback(() => {
    updateState({ stage: 'player-upload' });
  }, []);

  const restartAuction = useCallback(() => {
    localStorage.removeItem('auctionState');
    setAuctionState({
      stage: 'team-setup',
      teams: [],
      players: [],
      currentPlayerIndex: 0,
      unsoldPlayers: [],
      lastTransaction: null,
    });
  }, []);


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
