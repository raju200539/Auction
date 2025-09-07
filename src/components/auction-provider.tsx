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

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
        stage: 'team-setup' as AuctionStage,
        teams: [] as Team[],
        players: [] as PlayerWithId[],
        currentPlayerIndex: 0,
        unsoldPlayers: [] as PlayerWithId[],
        lastTransaction: null as { teamId: number, player: PlayerWithId & { bidAmount: number } } | null,
    };
  }

  try {
    const storedState = localStorage.getItem('auction-state');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      // Basic validation to ensure we don't crash on malformed data
      if (parsedState && typeof parsedState === 'object') {
        return {
          stage: parsedState.stage || 'team-setup',
          teams: parsedState.teams || [],
          players: parsedState.players || [],
          currentPlayerIndex: parsedState.currentPlayerIndex || 0,
          unsoldPlayers: parsedState.unsoldPlayers || [],
          lastTransaction: parsedState.lastTransaction || null,
        };
      }
    }
  } catch (error) {
    console.error("Failed to parse auction state from localStorage", error);
  }

  return {
    stage: 'team-setup' as AuctionStage,
    teams: [] as Team[],
    players: [] as PlayerWithId[],
    currentPlayerIndex: 0,
    unsoldPlayers: [] as PlayerWithId[],
    lastTransaction: null as { teamId: number, player: PlayerWithId & { bidAmount: number } } | null,
  };
};


export function AuctionProvider({ children }: { children: ReactNode }) {
  const [initialStateLoaded, setInitialStateLoaded] = useState(false);
  const [stage, setStage] = useState<AuctionStage>('team-setup');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [unsoldPlayers, setUnsoldPlayers] = useState<PlayerWithId[]>([]);
  const [lastTransaction, setLastTransaction] = useState<{ teamId: number, player: PlayerWithId & { bidAmount: number } } | null>(null);

  useEffect(() => {
    const state = getInitialState();
    setStage(state.stage);
    setTeams(state.teams);
    setPlayers(state.players);
    setCurrentPlayerIndex(state.currentPlayerIndex);
    setUnsoldPlayers(state.unsoldPlayers);
    setLastTransaction(state.lastTransaction);
    setInitialStateLoaded(true);
  }, []);

  useEffect(() => {
    if (!initialStateLoaded) return;
    try {
      const stateToSave = {
        stage,
        teams,
        players,
        currentPlayerIndex,
        unsoldPlayers,
        lastTransaction,
      };
      localStorage.setItem('auction-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Could not save auction state to localStorage", error);
    }
  }, [stage, teams, players, currentPlayerIndex, unsoldPlayers, lastTransaction, initialStateLoaded]);


  const handleSetPlayers = useCallback((elite: Player[], normal: Player[]) => {
    const shuffledElite = shuffleArray(elite);
    const shuffledNormal = shuffleArray(normal);
    const allPlayers = [...shuffledElite, ...shuffledNormal].map(
      (p, i) => ({ ...p, id: i })
    );
    setPlayers(allPlayers);
    setUnsoldPlayers([]);
  }, []);

  const assignPlayer = (teamId: number, bidAmount: number) => {
    const playerToAssign = players[currentPlayerIndex];
    if (!playerToAssign) return;
    
    const assignedPlayer = { ...playerToAssign, bidAmount };
    
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            purse: team.purse - bidAmount,
            players: [
              ...team.players,
              assignedPlayer,
            ],
          };
        }
        return team;
      })
    );
    // Remove player from the list of players to be auctioned
    const newPlayers = [...players];
    newPlayers.splice(currentPlayerIndex, 1);
    setPlayers(newPlayers);
    setLastTransaction({ teamId, player: assignedPlayer });
  };
  
  const skipPlayer = () => {
    const playerToSkip = players[currentPlayerIndex];
    if (playerToSkip) {
      setUnsoldPlayers(prev => [...prev, playerToSkip]);
    }

    const newPlayers = [...players];
    newPlayers.splice(currentPlayerIndex, 1);
    setPlayers(newPlayers);
    
    setLastTransaction(null);
    checkRoundEnd();
  };

  const nextPlayer = () => {
    setLastTransaction(null);
    checkRoundEnd();
  };
  
  const checkRoundEnd = () => {
      if (currentPlayerIndex >= players.length) {
        if (unsoldPlayers.length > 0) {
            const shuffledUnsold = shuffleArray(unsoldPlayers);
            setPlayers(shuffledUnsold);
            setUnsoldPlayers([]);
            setCurrentPlayerIndex(0);
        } else {
            setStage('summary');
        }
    }
  }

  const undoLastAssignment = () => {
    if (!lastTransaction) return;

    const { teamId, player } = lastTransaction;

    setTeams(prevTeams => prevTeams.map(team => {
        if (team.id === teamId) {
            return {
                ...team,
                purse: team.purse + player.bidAmount,
                players: team.players.filter(p => p.id !== player.id)
            };
        }
        return team;
    }));
    
    // Add the player back to the start of the players array
    setPlayers(prevPlayers => {
        const newPlayers = [...prevPlayers];
        newPlayers.splice(currentPlayerIndex, 0, player);
        return newPlayers;
    });

    setLastTransaction(null);
  };

  const startAuction = () => {
    setStage('player-upload');
  };

  const restartAuction = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auction-state');
    }
    setStage('team-setup');
    setTeams([]);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setUnsoldPlayers([]);
    setLastTransaction(null);
  };

  if (!initialStateLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <AuctionContext.Provider
      value={{
        stage,
        teams,
        players,
        currentPlayerIndex,
        lastTransaction,
        setTeams,
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
