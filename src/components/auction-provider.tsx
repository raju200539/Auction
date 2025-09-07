
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
    try {
      const savedState = localStorage.getItem('auctionState');
      if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Reset interstitial message on load
          parsedState.interstitialMessage = null; 
          if (parsedState.stage) {
            setAuctionState(parsedState);
          } else {
            setAuctionState(getInitialState());
          }
      } else {
        setAuctionState(getInitialState());
      }
    } catch (e) {
      console.error("Failed to parse state from localStorage", e);
      setAuctionState(getInitialState());
    }
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (isLoaded && auctionState.stage !== 'loading') {
      try {
        localStorage.setItem('auctionState', JSON.stringify(auctionState));
      } catch (e) {
        console.error("Failed to save state to localStorage", e);
      }
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
        const currentAuctionId = new Date().toISOString();
        const pastAuctionData = {
          id: currentAuctionId,
          date: currentAuctionId,
          teams: auctionState.teams
        };
        addPastAuction(pastAuctionData);
    }
    updateState({ stage });
  }, [auctionState.teams, addPastAuction]);


  const handleSetPlayers = useCallback((elite: Player[], normal: Player[]) => {
    const elitePlayers = elite.map(p => ({ ...p, isElite: true }));
    const normalPlayers = normal.map(p => ({ ...p, isElite: false }));
  
    // Combine and shuffle each list individually
    const shuffledElite = shuffleArray(elitePlayers);
    const shuffledNormal = shuffleArray(normalPlayers);
  
    // Assign unique IDs to all players
    const allPlayers = [...shuffledElite, ...shuffledNormal].map((p, i) => ({
      ...p,
      id: i,
    }));
  
    let interstitialMessage = null;
    if (allPlayers.some(p => p.isElite)) {
      interstitialMessage = {
        title: 'Elite Players Round',
        description: `The auction will begin with ${shuffledElite.length} elite players.`,
      };
    } else if (allPlayers.length > 0) {
      interstitialMessage = {
        title: 'Normal Players Round',
        description: `The auction will begin with ${shuffledNormal.length} normal players.`,
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

    setAuctionState(prevState => {
      // Keep a reference to the assigned player for the transaction
      const lastTransactionPlayer = { ...prevState.players[prevState.currentPlayerIndex], bidAmount };
      
      // Remove the assigned player from the list for the next turn
      const newPlayers = prevState.players.filter(p => p.id !== playerToAssign.id);

      // If we were in the skipped round, the index might need to be adjusted
      // If we assigned the last player in the list, the index should not go out of bounds
      const newPlayerIndex = Math.min(prevState.currentPlayerIndex, newPlayers.length - 1);
      
      return {
        ...prevState,
        teams: newTeams,
        players: newPlayers,
        currentPlayerIndex: newPlayerIndex,
        lastTransaction: { teamId, player: lastTransactionPlayer },
      };
    });
  };
  
  const handleNextPlayer = () => {
    setAuctionState(prevState => {
        const { players, currentPlayerIndex, isSkippedRoundActive, unsoldPlayers } = prevState;

        // If there are no more players in any round, go to summary
        if (players.length === 0) {
            if (unsoldPlayers.length > 0) {
                const shuffledUnsold = shuffleArray(unsoldPlayers);
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
            setStage('summary');
            return { ...prevState, lastTransaction: null };
        }

        const currentPlayer = players[currentPlayerIndex];
        const nextPlayer = players[currentPlayerIndex + 1];

        // Transition from Elite to Normal players
        if (!isSkippedRoundActive && currentPlayer?.isElite && nextPlayer && !nextPlayer.isElite) {
            return {
                ...prevState,
                lastTransaction: null,
                interstitialMessage: {
                    title: 'Normal Players Round',
                    description: 'All elite players have been auctioned. The normal player list will now begin.',
                }
            };
        }
        
        return {
            ...prevState,
            lastTransaction: null,
        };
    });
  }

 const skipPlayer = () => {
    setAuctionState(prevState => {
        const { players, currentPlayerIndex, unsoldPlayers, isSkippedRoundActive } = prevState;
        const playerToSkip = players[currentPlayerIndex];
        if (!playerToSkip) return prevState;

        // ALWAYS clear last transaction on skip
        const baseUpdate: Partial<AuctionState> = { lastTransaction: null };

        if (isSkippedRoundActive) {
            // In skipped round, move player to end of queue
            const newPlayers = [
                ...players.slice(0, currentPlayerIndex),
                ...players.slice(currentPlayerIndex + 1),
                playerToSkip
            ];
            // Index stays the same, but points to a new player
            const newPlayerIndex = Math.min(currentPlayerIndex, newPlayers.length - 1);
            
            return { 
                ...prevState, 
                ...baseUpdate,
                players: newPlayers, 
                currentPlayerIndex: newPlayerIndex 
            };
        }

        // --- In Main Round ---
        const newUnsoldPlayers = [...unsoldPlayers, playerToSkip];
        const newPlayers = players.filter(p => p.id !== playerToSkip.id);

        const isLastPlayerInList = newPlayers.length === 0;

        if (isLastPlayerInList) {
            if (newUnsoldPlayers.length > 0) {
                // Transition to skipped round
                const shuffledUnsold = shuffleArray(newUnsoldPlayers);
                return {
                    ...prevState,
                    ...baseUpdate,
                    players: shuffledUnsold,
                    unsoldPlayers: [],
                    currentPlayerIndex: 0,
                    isSkippedRoundActive: true,
                    interstitialMessage: {
                        title: 'Skipped Players Round',
                        description: `All players have been auctioned. Re-auctioning ${shuffledUnsold.length} previously skipped players.`,
                    }
                };
            } else {
                // No players left at all, end auction
                setStage('summary');
                return { ...prevState, ...baseUpdate };
            }
        }
        
        // Default case: just skip to the next player
        const newIndex = Math.min(currentPlayerIndex, newPlayers.length - 1);
        return {
            ...prevState,
            ...baseUpdate,
            players: newPlayers,
            unsoldPlayers: newUnsoldPlayers,
            currentPlayerIndex: newIndex,
        };
    });
};

  
  const nextPlayer = () => {
     handleNextPlayer();
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
      let newPlayers = [...prevState.players];
      
      // Re-insert the player into the list at the current index
      // to ensure it's the next one up for auction.
      if (!newPlayers.some(p => p.id === player.id)) {
        newPlayers.splice(prevState.currentPlayerIndex, 0, player);
      }
      
      return {
        ...prevState,
        teams: newTeams,
        players: newPlayers,
        // The index does not need to change, as we inserted the player at the current position.
        currentPlayerIndex: prevState.currentPlayerIndex, 
        lastTransaction: null,
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
