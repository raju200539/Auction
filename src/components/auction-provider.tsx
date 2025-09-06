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
      return JSON.parse(storedState);
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
  const [initialState] = useState(getInitialState);

  const [stage, setStage] = useState<AuctionStage>(initialState.stage);
  const [teams, setTeams] = useState<Team[]>(initialState.teams);
  const [players, setPlayers] = useState<PlayerWithId[]>(initialState.players);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(initialState.currentPlayerIndex);
  const [unsoldPlayers, setUnsoldPlayers] = useState<PlayerWithId[]>(initialState.unsoldPlayers);
  const [lastTransaction, setLastTransaction] = useState<{ teamId: number, player: PlayerWithId & { bidAmount: number } } | null>(initialState.lastTransaction);

  useEffect(() => {
    const stateToSave = {
      stage,
      teams,
      players,
      currentPlayerIndex,
      unsoldPlayers,
      lastTransaction,
    };
    localStorage.setItem('auction-state', JSON.stringify(stateToSave));
  }, [stage, teams, players, currentPlayerIndex, unsoldPlayers, lastTransaction]);


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
    nextPlayer(true);
  };

  const nextPlayer = (isSkip = false) => {
    const nextIndex = currentPlayerIndex + 1;
    
    if (nextIndex < players.length) {
        setCurrentPlayerIndex(nextIndex);
    } else {
        if (unsoldPlayers.length > 0) {
            setPlayers(prevPlayers => {
              const soldPlayers = prevPlayers.slice(0, nextIndex).filter(p => teams.some(t => t.players.some(tp => tp.id === p.id)));
              const shuffledUnsold = shuffleArray(unsoldPlayers);
              const newPlayerList = [...soldPlayers, ...shuffledUnsold];
              // Re-assign IDs to keep them unique and sequential in the new list
              return newPlayerList.map((p, i) => ({ ...p, id: i }));
            });
            setCurrentPlayerIndex(teams.flatMap(t => t.players).length);
            setUnsoldPlayers([]);
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
    localStorage.removeItem('auction-state');
    setStage('team-setup');
    setTeams([]);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setUnsoldPlayers([]);
    setLastTransaction(null);
  };

  return (
    <AuctionContext.Provider
      value={{
        stage,
        teams,
        players,
        currentPlayerIndex,
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
