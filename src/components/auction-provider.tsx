
'use client';

import { useState, type ReactNode, useCallback, useEffect } from 'react';
import type { AuctionStage, Player, PlayerWithId, Team } from '@/types';
import { AuctionContext } from '@/hooks/use-auction';
import { useToast } from '@/hooks/use-toast';
import { usePastAuctions } from '@/hooks/use-past-auctions';

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
  isSkippedRoundActive: false,
});

interface AuctionState {
  stage: AuctionStage | 'loading';
  teams: Team[];
  players: PlayerWithId[];
  currentPlayerIndex: number;
  unsoldPlayers: PlayerWithId[];
  lastTransaction: { teamId: number, player: PlayerWithId & { bidAmount: number } } | null;
  interstitialMessage: { title: string; description: string } | null;
  isSkippedRoundActive: boolean;
}

export function AuctionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { addPastAuction } = usePastAuctions();
  const [auctionState, setAuctionState] = useState<AuctionState>({ stage: 'loading', teams: [], players: [], currentPlayerIndex: 0, unsoldPlayers: [], lastTransaction: null, interstitialMessage: null, isSkippedRoundActive: false });
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
    if (stage === 'summary' && auctionState.teams.length > 0) {
      addPastAuction({
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        teams: auctionState.teams
      });
      // Clear current auction from local storage after saving it.
      localStorage.removeItem('auctionState');
    }
    updateState({ stage });
  }, [auctionState.teams, addPastAuction]);

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
      isSkippedRoundActive: false,
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

    setAuctionState(prevState => {
      // If we are in the skipped round, we need to remove the assigned player from the `players` list
      const newPlayers = prevState.isSkippedRoundActive
        ? prevState.players.filter(p => p.id !== playerToAssign.id)
        : prevState.players;

      // When assigning during skipped round, player index might need to be adjusted
      // but since we remove the element, the next element will shift to the current index.
      // so we don't increment it here. `nextPlayer` will handle moving forward.
      const newCurrentPlayerIndex = prevState.isSkippedRoundActive && newPlayers.length <= prevState.currentPlayerIndex
        ? newPlayers.length -1
        : prevState.currentPlayerIndex;


      return {
        ...prevState,
        teams: newTeams,
        lastTransaction: { teamId, player: assignedPlayer },
        players: newPlayers,
        currentPlayerIndex: newCurrentPlayerIndex,
        // We set unsold players to empty because a player from that list has now been sold.
        unsoldPlayers: prevState.isSkippedRoundActive ? [] : prevState.unsoldPlayers
      }
    });
  };

  const handleNextPlayer = (isSkip: boolean) => {
    setAuctionState(prevState => {
        const { players, currentPlayerIndex, unsoldPlayers, isSkippedRoundActive, lastTransaction } = prevState;
        const currentPlayer = players[currentPlayerIndex];

        let currentUnsold = unsoldPlayers;
        if (isSkip && currentPlayer) {
            currentUnsold = [...unsoldPlayers, currentPlayer];
        }

        const wasPlayerAssignedInSkippedRound = !isSkip && isSkippedRoundActive && lastTransaction;
        if (wasPlayerAssignedInSkippedRound && players.length === 0) {
            setStage('summary');
            return { ...prevState, lastTransaction: null };
        }

        const nextIndex = (isSkippedRoundActive && wasPlayerAssignedInSkippedRound)
          ? currentPlayerIndex
          : currentPlayerIndex + 1;
        
        const nextPlayer = players[nextIndex];

        const isTransitioningToNormal = currentPlayer?.isElite && nextPlayer && !nextPlayer.isElite;
        if (isTransitioningToNormal) {
            return {
                ...prevState,
                currentPlayerIndex: nextIndex,
                lastTransaction: null,
                unsoldPlayers: isSkip && currentPlayer ? [...unsoldPlayers, currentPlayer] : unsoldPlayers,
                interstitialMessage: {
                    title: 'Normal Players Round',
                    description: 'All elite players have been auctioned. The normal player list will now begin.',
                }
            };
        }

        const isTransitioningToSkippedRound = nextIndex >= players.length && currentUnsold.length > 0 && !isSkippedRoundActive;
        if (isTransitioningToSkippedRound) {
            const shuffledUnsold = shuffleArray(currentUnsold);
            return {
                ...prevState,
                players: shuffledUnsold,
                unsoldPlayers: [],
                currentPlayerIndex: 0,
                lastTransaction: null,
                isSkippedRoundActive: true,
                interstitialMessage: {
                    title: 'Skipped Players Round',
                    description: `All players have been auctioned. Re-auctioning ${shuffledUnsold.length} previously skipped players.`,
                }
            };
        }

        if (nextIndex >= players.length && (currentUnsold.length === 0 || isSkippedRoundActive)) {
            setStage('summary');
            return { ...prevState, lastTransaction: null };
        }

        return {
            ...prevState,
            lastTransaction: null,
            currentPlayerIndex: nextIndex,
            unsoldPlayers: isSkip && currentPlayer ? [...unsoldPlayers, currentPlayer] : unsoldPlayers,
        };
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

    setAuctionState(prevState => {
      // If we are in the skipped round, we need to add the player back to the players list
      // at the same index it was removed from.
      const newPlayers = prevState.isSkippedRoundActive
        ? [
            ...prevState.players.slice(0, prevState.currentPlayerIndex),
            player,
            ...prevState.players.slice(prevState.currentPlayerIndex)
          ]
        : prevState.players;
      
      return {
        ...prevState,
        teams: newTeams,
        lastTransaction: null,
        players: newPlayers,
        // We don't need to change `unsoldPlayers` on undo.
        // If it was a skipped round, the player is now back in the `players` list for that round.
      }
    });
  };
  
  const startAuction = useCallback(() => {
    updateState({ stage: 'player-upload' });
  }, []);

  const restartAuction = useCallback(() => {
    localStorage.removeItem('auctionState');
    setAuctionState(getInitialState());
  }, []);

  const clearInterstitial = useCallback(() => {
     setAuctionState(prevState => ({ ...prevState, interstitialMessage: null }));
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
