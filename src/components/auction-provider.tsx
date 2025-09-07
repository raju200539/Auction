
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
  interstitialMessage: null,
});

interface AuctionState {
  stage: AuctionStage | 'loading';
  teams: Team[];
  players: PlayerWithId[];
  currentPlayerIndex: number;
  unsoldPlayers: PlayerWithId[];
  lastTransaction: { teamId: number, player: PlayerWithId & { bidAmount: number } } | null;
  interstitialMessage: { title: string; description: string } | null;
}

export function AuctionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [auctionState, setAuctionState] = useState<AuctionState>({ stage: 'loading', teams: [], players: [], currentPlayerIndex: 0, unsoldPlayers: [], lastTransaction: null, interstitialMessage: null });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('auctionState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Reset interstitial message on load
        parsedState.interstitialMessage = null; 
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
    
    let interstitialMessage = null;
    if (elitePlayers.length > 0) {
      interstitialMessage = {
        title: 'Elite Players Round',
        description: `The auction will begin with ${elitePlayers.length} elite players.`,
      };
    } else if (normalPlayers.length > 0) {
       interstitialMessage = {
        title: 'Normal Players Round',
        description: `The auction will begin with ${normalPlayers.length} normal players.`,
      };
    }

    updateState({
      players: allPlayers,
      unsoldPlayers: [],
      currentPlayerIndex: 0,
      stage: 'auction',
      lastTransaction: null,
      interstitialMessage: interstitialMessage,
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

  const handleNextPlayer = (isSkip: boolean) => {
    const { players, currentPlayerIndex, unsoldPlayers } = auctionState;
    const currentPlayer = players[currentPlayerIndex];
    
    if (isSkip && currentPlayer) {
      const newUnsoldPlayers = [...unsoldPlayers, currentPlayer];
      updateState({ unsoldPlayers: newUnsoldPlayers });
    }

    const nextIndex = currentPlayerIndex + 1;
    const nextPlayer = players[nextIndex];

    const isTransitioningToNormal = currentPlayer?.isElite && nextPlayer && !nextPlayer.isElite;
    if (isTransitioningToNormal) {
      updateState({ 
        interstitialMessage: {
          title: 'Normal Players Round',
          description: 'All elite players have been auctioned. The normal player list will now begin.',
        }
      });
      return;
    }

    const isTransitioningToSkippedRound = nextIndex >= players.length && auctionState.unsoldPlayers.length > 0;
    if (isTransitioningToSkippedRound) {
        const finalUnsoldCount = isSkip ? auctionState.unsoldPlayers.length + 1 : auctionState.unsoldPlayers.length;
        const shuffledUnsold = shuffleArray(isSkip ? [...auctionState.unsoldPlayers, currentPlayer] : auctionState.unsoldPlayers);
        
        setAuctionState(prevState => ({
          ...prevState,
          players: shuffledUnsold,
          unsoldPlayers: [],
          currentPlayerIndex: 0,
          lastTransaction: null,
          interstitialMessage: {
            title: 'Skipped Players Round',
            description: `All players have been auctioned. Re-auctioning ${finalUnsoldCount} previously skipped players.`,
          }
        }));
      return;
    }

    if (nextIndex >= players.length && auctionState.unsoldPlayers.length === 0) {
      updateState({ stage: 'summary' });
      return;
    }
    
    updateState({ 
      lastTransaction: null,
      currentPlayerIndex: nextIndex,
    });
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

  const clearInterstitial = useCallback(() => {
     setAuctionState(prevState => {
      const { players, currentPlayerIndex, lastTransaction } = prevState;
      let nextIndex = currentPlayerIndex;
      
      // If we are coming from the player upload screen, the index is 0 and we haven't assigned yet.
      // This is the start of the first round.
      if (lastTransaction === null && currentPlayerIndex === 0) {
         // Do nothing, we want to show player 0
      } else {
        // This is a mid-auction transition, so we move to the next player.
        nextIndex = currentPlayerIndex + 1;
      }
      
      const isTransitioningToSkippedRound = nextIndex >= players.length;

      // In the case of skipped players, the provider has already reset the list.
      // So we just clear the message.
      if (isTransitioningToSkippedRound) {
         return { ...prevState, interstitialMessage: null };
      }

      return {
        ...prevState,
        interstitialMessage: null,
        currentPlayerIndex: nextIndex,
        lastTransaction: null,
      };
    });
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
        clearInterstitial,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}
