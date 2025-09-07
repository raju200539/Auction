
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
    const { players, currentPlayerIndex, isSkippedRoundActive } = auctionState;
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

    if (isSkippedRoundActive) {
      const newPlayers = players.filter(p => p.id !== playerToAssign.id);
      if (newPlayers.length === 0) {
        // This is the final assignment, end the auction.
        setAuctionState(prevState => ({
          ...prevState,
          teams: newTeams,
          players: [], // Empty the players list
          lastTransaction: { teamId, player: assignedPlayer },
          stage: 'summary'
        }));
        // Since we are setting the stage directly, we don't need to do anything else.
        return;
      }
       setAuctionState(prevState => {
        // Make sure index is not out of bounds after removal
        const newPlayerIndex = Math.min(prevState.currentPlayerIndex, newPlayers.length - 1);
        return {
          ...prevState,
          teams: newTeams,
          players: newPlayers,
          currentPlayerIndex: newPlayerIndex,
          lastTransaction: { teamId, player: assignedPlayer },
        };
      });
    } else {
       setAuctionState(prevState => ({
        ...prevState,
        teams: newTeams,
        lastTransaction: { teamId, player: assignedPlayer },
      }));
    }
  };
  
  const handleNextPlayer = () => {
    setAuctionState(prevState => {
        const { players, currentPlayerIndex, isSkippedRoundActive, unsoldPlayers } = prevState;

        const nextIndex = currentPlayerIndex + 1;
        const currentPlayer = players[currentPlayerIndex];
        
        // This is only for the main round. Skipped round has its own logic.
        if (isSkippedRoundActive) {
             return {
                ...prevState,
                lastTransaction: null,
                // The list shrinks, so the index might not need to change
                currentPlayerIndex: Math.min(currentPlayerIndex, players.length -1),
            };
        }

        const isAuctionOver = !isSkippedRoundActive && nextIndex >= players.length && unsoldPlayers.length === 0;
        if(isAuctionOver) {
           setStage('summary');
           return prevState;
        }

        // Transition from Elite to Normal
        const isTransitioningToNormal = currentPlayer?.isElite && players[nextIndex] && !players[nextIndex].isElite;
        if (isTransitioningToNormal) {
            return {
                ...prevState,
                currentPlayerIndex: nextIndex,
                lastTransaction: null,
                interstitialMessage: {
                    title: 'Normal Players Round',
                    description: 'All elite players have been auctioned. The normal player list will now begin.',
                }
            };
        }

        // Transition to Skipped Round
        const isTransitioningToSkippedRound = !isSkippedRoundActive && nextIndex >= players.length && unsoldPlayers.length > 0;
        if (isTransitioningToSkippedRound) {
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
        
        return {
            ...prevState,
            lastTransaction: null,
            currentPlayerIndex: nextIndex,
        };
    });
  }

  const skipPlayer = () => {
    const { players, currentPlayerIndex, unsoldPlayers, isSkippedRoundActive } = auctionState;
    const playerToSkip = players[currentPlayerIndex];
    if (!playerToSkip) return;

    // Main round logic
    if (!isSkippedRoundActive) {
        const newUnsoldPlayers = [...unsoldPlayers, playerToSkip];
        const isLastPlayerInMainRound = currentPlayerIndex + 1 >= players.length;
        
        if (isLastPlayerInMainRound) {
          if (newUnsoldPlayers.length > 0) {
            // Transition to skipped round
             const shuffledUnsold = shuffleArray(newUnsoldPlayers);
              updateState({
                  players: shuffledUnsold,
                  unsoldPlayers: [],
                  currentPlayerIndex: 0,
                  lastTransaction: null,
                  isSkippedRoundActive: true,
                  interstitialMessage: {
                      title: 'Skipped Players Round',
                      description: `All players have been auctioned. Re-auctioning ${shuffledUnsold.length} previously skipped players.`,
                  }
              });
          } else {
            // End of auction, no players were ever skipped.
            setStage('summary');
          }
        } else {
          // Just go to the next player
          updateState({
              unsoldPlayers: newUnsoldPlayers,
              currentPlayerIndex: currentPlayerIndex + 1,
              lastTransaction: null,
          });
        }
        return;
    }
    
    // Skipped round logic
    // Re-queue the player to the end of the list and move to the next one
    const newPlayers = [...players.slice(0, currentPlayerIndex), ...players.slice(currentPlayerIndex + 1), playerToSkip];
    
    setAuctionState(prevState => {
        const newPlayerIndex = Math.min(prevState.currentPlayerIndex, newPlayers.length - 1);
        return {
            ...prevState,
            players: newPlayers,
            currentPlayerIndex: newPlayerIndex,
            lastTransaction: null,
        }
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
      let newPlayers = prevState.players;
      // If we are in the skipped round, we need to add the player back to the list
      if (prevState.isSkippedRoundActive) {
          newPlayers = [
              ...prevState.players.slice(0, prevState.currentPlayerIndex),
              player,
              ...prevState.players.slice(prevState.currentPlayerIndex)
          ]
      }
      // If not in skipped round, the player is already in the list at currentPlayerIndex, so no change needed.
      
      return {
        ...prevState,
        teams: newTeams,
        players: newPlayers,
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
