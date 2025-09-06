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
            const currentPlayers = players.slice(0, nextIndex);
            const shuffledUnsold = shuffleArray(unsoldPlayers);
            // Rebuild the player list, keeping sold players and adding the shuffled unsold ones.
            setPlayers([...currentPlayers, ...shuffledUnsold]);
            setUnsoldPlayers([]);
            setCurrentPlayerIndex(nextIndex);
        } else {
            setStage('summary');
        }
    }
};

  const startAuction = () => {
    setStage('player-upload');
  };

  const restartAuction = () => {
    setTeams([]);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setUnsoldPlayers([]);
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
      }}
    >
      {children}
    </AuctionContext.Provider>
  );
}
