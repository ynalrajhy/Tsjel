import AsyncStorage from '@react-native-async-storage/async-storage';
import { Team } from '../models/Score';
import { DEFAULT_TEAM_NAMES } from '../objects/constants';

const getStorageKeys = (gameId: string) => ({
  TEAM1_NAME: `@scoreboard:${gameId}:team1_name`,
  TEAM2_NAME: `@scoreboard:${gameId}:team2_name`,
  TEAM1_SCORE: `@scoreboard:${gameId}:team1_score`,
  TEAM2_SCORE: `@scoreboard:${gameId}:team2_score`,
});

export const loadScores = async (gameId: string): Promise<{ team1: Team; team2: Team }> => {
  try {
    const keys = getStorageKeys(gameId);
    const [team1Name, team2Name, team1Score, team2Score] = await Promise.all([
      AsyncStorage.getItem(keys.TEAM1_NAME),
      AsyncStorage.getItem(keys.TEAM2_NAME),
      AsyncStorage.getItem(keys.TEAM1_SCORE),
      AsyncStorage.getItem(keys.TEAM2_SCORE),
    ]);

    return {
      team1: {
        name: team1Name || DEFAULT_TEAM_NAMES.TEAM1,
        score: team1Score ? parseInt(team1Score, 10) : 0,
      },
      team2: {
        name: team2Name || DEFAULT_TEAM_NAMES.TEAM2,
        score: team2Score ? parseInt(team2Score, 10) : 0,
      },
    };
  } catch (error) {
    console.error('Error loading scores:', error);
    return {
      team1: {
        name: DEFAULT_TEAM_NAMES.TEAM1,
        score: 0,
      },
      team2: {
        name: DEFAULT_TEAM_NAMES.TEAM2,
        score: 0,
      },
    };
  }
};

export const saveScores = async (gameId: string, team1: Team, team2: Team): Promise<void> => {
  try {
    const keys = getStorageKeys(gameId);
    await Promise.all([
      AsyncStorage.setItem(keys.TEAM1_NAME, team1.name),
      AsyncStorage.setItem(keys.TEAM2_NAME, team2.name),
      AsyncStorage.setItem(keys.TEAM1_SCORE, team1.score.toString()),
      AsyncStorage.setItem(keys.TEAM2_SCORE, team2.score.toString()),
    ]);
  } catch (error) {
    console.error('Error saving scores:', error);
  }
};

