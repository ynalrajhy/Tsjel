import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player } from '../models/Score';

const DEFAULT_PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

const getStorageKeys = (gameId: string) => ({
  PLAYER_NAMES: `@scoreboard:${gameId}:player_names`,
  PLAYER_SCORES: `@scoreboard:${gameId}:player_scores`,
});

export const loadHandScores = async (gameId: string): Promise<Player[]> => {
  try {
    const keys = getStorageKeys(gameId);
    const [namesJson, scoresJson] = await Promise.all([
      AsyncStorage.getItem(keys.PLAYER_NAMES),
      AsyncStorage.getItem(keys.PLAYER_SCORES),
    ]);

    const names = namesJson ? JSON.parse(namesJson) : DEFAULT_PLAYER_NAMES;
    const scores = scoresJson ? JSON.parse(scoresJson) : [0, 0, 0, 0];

    return names.map((name: string, index: number) => ({
      name: name || DEFAULT_PLAYER_NAMES[index],
      score: scores[index] || 0,
    }));
  } catch (error) {
    console.error('Error loading hand scores:', error);
    return DEFAULT_PLAYER_NAMES.map((name) => ({ name, score: 0 }));
  }
};

export const saveHandScores = async (gameId: string, players: Player[]): Promise<void> => {
  try {
    const keys = getStorageKeys(gameId);
    const names = players.map((p) => p.name);
    const scores = players.map((p) => p.score);
    await Promise.all([
      AsyncStorage.setItem(keys.PLAYER_NAMES, JSON.stringify(names)),
      AsyncStorage.setItem(keys.PLAYER_SCORES, JSON.stringify(scores)),
    ]);
  } catch (error) {
    console.error('Error saving hand scores:', error);
  }
};
