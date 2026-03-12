import { useState, useEffect } from 'react';
import { Team } from '../models/Score';
import { loadScores, saveScores } from '../utils/storage';

export const useScoreStorage = (gameId: string) => {
  const [team1, setTeam1] = useState<Team>({ name: 'Team 1', score: 0 });
  const [team2, setTeam2] = useState<Team>({ name: 'Team 2', score: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeScores = async () => {
      const scores = await loadScores(gameId);
      setTeam1(scores.team1);
      setTeam2(scores.team2);
      setIsLoading(false);
    };

    initializeScores();
  }, [gameId]);

  useEffect(() => {
    if (!isLoading) {
      saveScores(gameId, team1, team2);
    }
  }, [team1, team2, isLoading, gameId]);

  const updateTeam1 = (updates: Partial<Team>) => {
    setTeam1((prev) => ({ ...prev, ...updates }));
  };

  const updateTeam2 = (updates: Partial<Team>) => {
    setTeam2((prev) => ({ ...prev, ...updates }));
  };

  const resetScores = () => {
    setTeam1((prev) => ({ ...prev, score: 0 }));
    setTeam2((prev) => ({ ...prev, score: 0 }));
  };

  return {
    team1,
    team2,
    isLoading,
    updateTeam1,
    updateTeam2,
    resetScores,
  };
};

