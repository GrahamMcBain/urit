// Game state types for the Tag mini app

export interface Player {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  taggedAt?: number; // timestamp when player was tagged
  taggedBy?: number; // fid of player who tagged them
  totalTimeTagged: number; // total milliseconds spent being tagged
  timesTagged: number; // number of times they've been tagged
  timesTaggedOthers: number; // number of times they've tagged others
  dailyPoints: number; // points earned today (up to 100k per day)
  lastPointsDate: string; // date string (YYYY-MM-DD) when points were last earned
  totalPoints: number; // lifetime total points
}

export interface GameState {
  currentlyTagged?: number; // fid of currently tagged player
  lastTagTime?: number; // timestamp of last tag
  gameStartTime: number; // when the game started
  totalPlayers: number;
}

export interface LeaderboardEntry {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  averageTagTime: number; // average time spent tagged (lower is better)
  totalTimeTagged: number;
  timesTagged: number;
  timesTaggedOthers: number;
  dailyPoints: number; // points earned today
  totalPoints: number; // lifetime total points
  score: number; // calculated score for leaderboard ranking (daily points)
}

export interface TagEvent {
  id: string;
  taggerFid: number;
  taggedFid: number;
  timestamp: number;
  previousTagDuration?: number; // how long the previous person was tagged
}

// Redis key patterns
export const REDIS_KEYS = {
  PLAYER: (fid: number) => `player:${fid}`,
  GAME_STATE: 'game:state',
  LEADERBOARD: 'leaderboard',
  TAG_EVENTS: 'tag:events',
  CURRENTLY_TAGGED: 'currently:tagged',
} as const;
