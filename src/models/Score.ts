export interface Team {
  name: string;
  score: number;
}

export interface GameState {
  team1: Team;
  team2: Team;
}

export interface Player {
  name: string;
  score: number;
}

export interface HandGameState {
  players: Player[];
}

