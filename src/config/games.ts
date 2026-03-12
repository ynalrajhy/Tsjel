export interface GameConfig {
  id: string;
  name: string;
  description?: string;
  scoringMode?: 'pointSelection' | 'manualInput' | 'hand';
  winCondition?: { targetScore: number };
  pointValues?: readonly number[];
  scoringRules?: {
    win: (points: number) => number;
    lose: (points: number) => number;
  };
}

export const GAMES: Record<string, GameConfig> = {
  kout: {
    id: 'kout',
    name: 'Kout',
    description: 'Classic Kout card game scoring',
    scoringMode: 'pointSelection',
    pointValues: [5, 6, 7, 8, 9] as const,
    scoringRules: {
      // For point 9, award 36 points; otherwise award selected points
      win: (points: number) => points === 9 ? 36 : points,
      // For point 9, opponent gets 18 points; otherwise opponent gets double the selected points
      lose: (points: number) => points === 9 ? 18 : points * 2,
    },
  },
  baloot: {
    id: 'baloot',
    name: 'Baloot',
    description: 'Baloot card game - first to 152 points wins',
    scoringMode: 'manualInput',
    winCondition: { targetScore: 152 },
    pointValues: [],
    scoringRules: {
      win: () => 0,
      lose: () => 0,
    },
  },
  hand: {
    id: 'hand',
    name: 'Hand',
    description: 'Saudi Hand card game - lowest score wins',
    scoringMode: 'hand',
    pointValues: [],
    scoringRules: {
      win: () => 0,
      lose: () => 0,
    },
  },
};

export const getGameConfig = (gameId: string): GameConfig | undefined => {
  return GAMES[gameId];
};

