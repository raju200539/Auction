'use client';

import { useState, type ReactNode, useCallback } from 'react';
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

export function AuctionProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<AuctionStage>('team-setup');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerWithId[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [unsoldPlayers, setUnsoldPlayers] = useState<PlayerWithId[]>([]);
  const [lastTransaction, setLastTransaction] = useState<{ teamId: number, player: PlayerWithId & { bidAmount: number } } | null>(null);

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
              return [...soldPlayers, ...shuffledUnsold];
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
    setTeams([]);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setUnsoldPlayers([]);
    setLastTransaction(null);
    setStage('team-setup');
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
