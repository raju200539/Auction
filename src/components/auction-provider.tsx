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
    setLastTransaction({ teamId, player: assignedPlayer });

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
  };
  
  const skipPlayer = () => {
    const playerToSkip = players[currentPlayerIndex];
    if (playerToSkip) {
      setUnsoldPlayers(prev => [...prev, playerToSkip]);
    }
    setLastTransaction(null); // Skipping clears the last transaction
    nextPlayer(true);
  };

  const nextPlayer = (isSkip = false) => {
    const nextIndex = currentPlayerIndex + 1;
    
    if (nextIndex < players.length) {
        setCurrentPlayerIndex(nextIndex);
    } else {
        if (unsoldPlayers.length > 0) {
            setPlayers(prevPlayers => {
              const soldPlayers = teams.flatMap(t => t.players);
              const soldPlayerIds = new Set(soldPlayers.map(p => p.id));
              const allUnsold = [...prevPlayers.filter(p => !soldPlayerIds.has(p.id)), ...unsoldPlayers];
              const uniqueUnsold = Array.from(new Set(allUnsold.map(p => p.id))).map(id => allUnsold.find(p => p.id === id)!);
              
              const shuffledUnsold = shuffleArray(uniqueUnsold);
              
              // Re-ID all players to maintain list integrity
              const newPlayerList = [...soldPlayers, ...shuffledUnsold].map((p, i) => ({...p, id: i}));
              
              setPlayers(newPlayerList);
              setCurrentPlayerIndex(soldPlayers.length);
              setUnsoldPlayers([]);
              return newPlayerList;
            });
        } else {
            setStage('summary');
        }
    }
  };

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
