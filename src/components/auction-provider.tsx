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

  const handleSetPlayers = useCallback((elite: Player[], normal: Player[]) => {
    const shuffledElite = shuffleArray(elite);
    const shuffledNormal = shuffleArray(normal);
    const allPlayers = [...shuffledElite, ...shuffledNormal].map(
      (p, i) => ({ ...p, id: i })
    );
    setPlayers(allPlayers);
  }, []);

  const assignPlayer = (teamId: number, bidAmount: number) => {
    const playerToAssign = players[currentPlayerIndex];
    if (!playerToAssign) return;

    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            purse: team.purse - bidAmount,
            players: [
              ...team.players,
              { ...playerToAssign, bidAmount },
            ],
          };
        }
        return team;
      })
    );
  };
  
  const nextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setStage('summary');
    }
  };

  const startAuction = () => {
    setStage('player-upload');
  };

  const restartAuction = () => {
    setTeams([]);
    setPlayers([]);
    setCurrentPlayerIndex(0);
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
        nextPlayer,
        startAuction,
        restartAuction,
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}
