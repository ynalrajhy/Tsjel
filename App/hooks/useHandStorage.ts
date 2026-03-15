import { useState, useEffect } from "react";
import { Player } from "../models/Score";
import { loadHandScores, saveHandScores } from "../utils/handStorage";

export const useHandStorage = (
  gameId: string,
  playerCount: number = 4,
  initialNames?: string[],
) => {
  // Build initial players from the setup names and count
  const buildInitialPlayers = (): Player[] => {
    const result: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      result.push({
        name: initialNames?.[i] || `Player ${i + 1}`,
        score: 0,
      });
    }
    return result;
  };

  const [players, setPlayers] = useState<Player[]>(buildInitialPlayers);
  const [isLoading, setIsLoading] = useState(false);

  // No longer load from AsyncStorage on mount — setup names are the source of truth
  // We only use storage for saving during gameplay
  useEffect(() => {
    setIsLoading(false);
  }, [gameId]);

  useEffect(() => {
    if (!isLoading && gameId !== "dummy") {
      saveHandScores(gameId, players);
    }
  }, [players, isLoading, gameId]);

  const updatePlayer = (index: number, updates: Partial<Player>) => {
    setPlayers((prev) => {
      if (index < 0 || index >= prev.length) return prev;
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
