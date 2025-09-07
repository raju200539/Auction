
'use client';

import { useState, type ReactNode, useCallback, useEffect } from 'react';
import type { AuctionStage, Player, PlayerWithId, Team } from '@/types';
import { AuctionContext } from '@/hooks/use-auction';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
    if (isLoaded && auctionState.stage !== 'loading') {
      localStorage.setItem('auctionState', JSON.stringify(auctionState));
    }
  }, [auctionState, isLoaded]);

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
    
    const elitePlayers = shuffledElite.map((p, i) => ({ ...p, id: i, isElite: true }));
    const normalPlayers = shuffledNormal.map((p, i) => ({ ...p, id: elite.length + i, isElite: false }));

    const allPlayers = [...elitePlayers, ...normalPlayers];

    if (elitePlayers.length > 0) {
      toast({
        title: 'Elite Players Round',
        description: 'The auction will begin with the elite players list.',
      });
    } else if (normalPlayers.length > 0) {
       toast({
        title: 'Normal Players Round',
        description: 'The auction will begin with the normal players list.',
      });
    }

    updateState({
      players: allPlayers,
      unsoldPlayers: [],
      currentPlayerIndex: 0,
      stage: 'auction',
      lastTransaction: null,
    });
  }, [toast]);

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

  const handleNextPlayer = (isSkip: boolean) => {
    const { players, currentPlayerIndex, unsoldPlayers } = auctionState;
    const currentPlayer = players[currentPlayerIndex];
    const nextIndex = currentPlayerIndex + 1;
    const nextPlayer = players[nextIndex];

    // Check for transitions before updating state
    const isTransitioningToNormal = currentPlayer?.isElite && nextPlayer && !nextPlayer.isElite;
    const isTransitioningToSkippedRound = nextIndex >= players.length && unsoldPlayers.length > 0;

    setAuctionState(prevState => {
      let newUnsold = [...prevState.unsoldPlayers];
      if (isSkip && currentPlayer) {
        newUnsold.push(currentPlayer);
      }
      
      let newState: Partial<AuctionState> = { 
        lastTransaction: null,
        currentPlayerIndex: nextIndex,
        unsoldPlayers: newUnsold,
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

    // Show toasts after state update
    if (isTransitioningToNormal) {
      toast({
        title: 'Normal Players Round',
        description: 'All elite players have been auctioned. The normal player list will now begin.',
      });
    }
    if (isTransitioningToSkippedRound) {
        const skippedCount = isSkip ? unsoldPlayers.length + 1 : unsoldPlayers.length;
         toast({
            title: "Skipped Players Round",
            description: `Re-auctioning ${skippedCount} previously skipped players.`,
        });
    }
  }

  const skipPlayer = () => {
    handleNextPlayer(true);
  };
  
  const nextPlayer = () => {
    handleNextPlayer(false);
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
