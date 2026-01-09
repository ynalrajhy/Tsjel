import { useState, useEffect } from 'react';
import { Player } from '../models/Score';
import { loadHandScores, saveHandScores } from '../utils/handStorage';

export const useHandStorage = (gameId: string) => {
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Player 1', score: 0 },
    { name: 'Player 2', score: 0 },
    { name: 'Player 3', score: 0 },
    { name: 'Player 4', score: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeScores = async () => {
      const loadedPlayers = await loadHandScores(gameId);
      setPlayers(loadedPlayers);
      setIsLoading(false);
    };

    initializeScores();
  }, [gameId]);

  useEffect(() => {
    if (!isLoading) {
      saveHandScores(gameId, players);
    }
  }, [players, isLoading, gameId]);

  const updatePlayer = (index: number, updates: Partial<Player>) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], ...updates };
      return newPlayers;
    });
  };

  const resetScores = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
  };

  return {
    players,
    isLoading,
    updatePlayer,
    resetScores,
  };
};
