import { Redis } from '@upstash/redis';
import { Player, GameState, LeaderboardEntry, TagEvent, REDIS_KEYS } from './types';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis credentials');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Calculate points based on how long someone was tagged
function calculatePoints(durationMs: number): number {
  const seconds = durationMs / 1000;
  
  if (seconds <= 10) {
    return 100000; // Full points for under 10 seconds
  } else if (seconds <= 60) {
    return 50000; // Half points for 10-60 seconds
  } else if (seconds <= 300) { // 5 minutes
    return 25000;
  } else if (seconds <= 600) { // 10 minutes
    return 10000;
  } else if (seconds <= 1800) { // 30 minutes
    return 5000;
  } else {
    return 1000; // Minimum points for staying tagged too long
  }
}

// Get today's date as string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

export class GameService {
  // Player management
  async getPlayer(fid: number): Promise<Player | null> {
    const player = await redis.get<Player>(REDIS_KEYS.PLAYER(fid));
    return player;
  }

  async createOrUpdatePlayer(playerData: Partial<Player> & { fid: number }): Promise<Player> {
    const existingPlayer = await this.getPlayer(playerData.fid);
    const today = getTodayString();
    
    // Reset daily points if it's a new day
    const shouldResetDaily = existingPlayer?.lastPointsDate !== today;
    
    const player: Player = {
      fid: playerData.fid,
      username: playerData.username || existingPlayer?.username || '',
      displayName: playerData.displayName || existingPlayer?.displayName || '',
      pfpUrl: playerData.pfpUrl || existingPlayer?.pfpUrl,
      taggedAt: playerData.taggedAt !== undefined ? playerData.taggedAt : existingPlayer?.taggedAt,
      taggedBy: playerData.taggedBy !== undefined ? playerData.taggedBy : existingPlayer?.taggedBy,
      totalTimeTagged: playerData.totalTimeTagged || existingPlayer?.totalTimeTagged || 0,
      timesTagged: playerData.timesTagged || existingPlayer?.timesTagged || 0,
      timesTaggedOthers: playerData.timesTaggedOthers || existingPlayer?.timesTaggedOthers || 0,
      dailyPoints: shouldResetDaily ? (playerData.dailyPoints || 0) : (playerData.dailyPoints || existingPlayer?.dailyPoints || 0),
      lastPointsDate: playerData.lastPointsDate || (shouldResetDaily ? today : existingPlayer?.lastPointsDate || today),
      totalPoints: playerData.totalPoints || existingPlayer?.totalPoints || 0,
    };

    await redis.set(REDIS_KEYS.PLAYER(player.fid), player);
    return player;
  }

  // Game state management
  async getGameState(): Promise<GameState> {
    const state = await redis.get<GameState>(REDIS_KEYS.GAME_STATE);
    return state || {
      gameStartTime: Date.now(),
      lastResetTime: Date.now(),
      totalPlayers: 0,
    };
  }
  
  // Check if game needs to be reset (every 24 hours)
  async checkAndResetGame(): Promise<boolean> {
    const state = await this.getGameState();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Reset if it's been more than 24 hours since the last reset
    if (state.lastResetTime && now - state.lastResetTime > twentyFourHours) {
      // Reset the game
      await redis.del(REDIS_KEYS.CURRENTLY_TAGGED);
      await this.updateGameState({ lastResetTime: now });
      return true;
    }
    
    return false;
  }

  async updateGameState(updates: Partial<GameState>): Promise<GameState> {
    const currentState = await this.getGameState();
    const newState = { ...currentState, ...updates };
    await redis.set(REDIS_KEYS.GAME_STATE, newState);
    return newState;
  }

  // Tag functionality
  async tagPlayer(taggerFid: number, taggedFid: number, isAdminOverride = false): Promise<{
    success: boolean;
    message: string;
    tagEvent?: TagEvent;
  }> {
    if (taggerFid === taggedFid) {
      return { success: false, message: "You can't tag yourself!" };
    }

    const currentlyTagged = await redis.get<number>(REDIS_KEYS.CURRENTLY_TAGGED);
    
    // Only the currently tagged player can tag someone else (unless admin override)
    if (!isAdminOverride && currentlyTagged && currentlyTagged !== taggerFid) {
      const taggedPlayer = await this.getPlayer(currentlyTagged);
      return { 
        success: false, 
        message: `Only ${taggedPlayer?.displayName || 'the currently tagged player'} can tag someone right now!` 
      };
    }
    
    // Check if the player being tagged has already been tagged today
    const taggedPlayer = await this.getPlayer(taggedFid);
    const today = getTodayString();
    if (taggedPlayer?.lastTaggedDate === today && !isAdminOverride) {
      return {
        success: false,
        message: `${taggedPlayer.displayName} has already been tagged today! Try someone else.`
      };
    }

    const now = Date.now();
    let previousTagDuration: number | undefined;

    // If someone was previously tagged, calculate their tag duration and award points
    if (currentlyTagged) {
      const previousPlayer = await this.getPlayer(currentlyTagged);
      if (previousPlayer?.taggedAt) {
        previousTagDuration = now - previousPlayer.taggedAt;
        
        // Calculate points earned for this tag session
        const pointsEarned = calculatePoints(previousTagDuration);
        const today = getTodayString();
        
        // Only award points if it's the same day and they haven't maxed out
        const canEarnPoints = previousPlayer.lastPointsDate === today && previousPlayer.dailyPoints < 100000;
        const newDailyPoints = canEarnPoints 
          ? Math.min(100000, previousPlayer.dailyPoints + pointsEarned)
          : (previousPlayer.lastPointsDate === today ? previousPlayer.dailyPoints : pointsEarned);
        
        const newTotalPoints = canEarnPoints || previousPlayer.lastPointsDate !== today
          ? previousPlayer.totalPoints + pointsEarned
          : previousPlayer.totalPoints;
        
        // Update the previous player's stats
        await this.createOrUpdatePlayer({
          fid: currentlyTagged,
          totalTimeTagged: previousPlayer.totalTimeTagged + previousTagDuration,
          taggedAt: undefined, // They're no longer tagged
          taggedBy: undefined,
          dailyPoints: newDailyPoints,
          totalPoints: newTotalPoints,
          lastPointsDate: today,
        });
      }
    }

    // Update tagger stats
    const tagger = await this.getPlayer(taggerFid);
    if (tagger) {
      await this.createOrUpdatePlayer({
        fid: taggerFid,
        timesTaggedOthers: tagger.timesTaggedOthers + 1,
      });
    }

    // Update tagged player
    const tagged = await this.getPlayer(taggedFid);
    await this.createOrUpdatePlayer({
      fid: taggedFid,
      taggedAt: now,
      taggedBy: taggerFid,
      timesTagged: (tagged?.timesTagged || 0) + 1,
      lastTaggedDate: getTodayString(), // Add the date they were tagged
    });

    // Update currently tagged
    await redis.set(REDIS_KEYS.CURRENTLY_TAGGED, taggedFid);

    // Create tag event
    const tagEvent: TagEvent = {
      id: `${taggerFid}-${taggedFid}-${now}`,
      taggerFid,
      taggedFid,
      timestamp: now,
      previousTagDuration,
    };

    await redis.lpush(REDIS_KEYS.TAG_EVENTS, tagEvent);

    return {
      success: true,
      message: 'Tag successful!',
      tagEvent,
    };
  }

  // Get currently tagged player
  async getCurrentlyTagged(): Promise<Player | null> {
    const fid = await redis.get<number>(REDIS_KEYS.CURRENTLY_TAGGED);
    if (!fid) return null;
    return this.getPlayer(fid);
  }

  // Leaderboard
  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    // Get all players
    const keys = await redis.keys(REDIS_KEYS.PLAYER('*'));
    const players: Player[] = [];
    
    for (const key of keys) {
      const player = await redis.get<Player>(key);
      if (player) players.push(player);
    }

    const today = getTodayString();

    // Calculate leaderboard entries
    const entries: LeaderboardEntry[] = players
      .filter(player => player.timesTagged > 0) // Only include players who have been tagged
      .map(player => {
        const averageTagTime = player.totalTimeTagged / player.timesTagged;
        
        // Reset daily points if it's a new day (handle missing fields for existing players)
        const dailyPoints = player.lastPointsDate === today ? (player.dailyPoints || 0) : 0;
        
        return {
          fid: player.fid,
          username: player.username,
          displayName: player.displayName,
          pfpUrl: player.pfpUrl,
          averageTagTime,
          totalTimeTagged: player.totalTimeTagged,
          timesTagged: player.timesTagged,
          timesTaggedOthers: player.timesTaggedOthers,
          dailyPoints,
          totalPoints: player.totalPoints || 0,
          score: dailyPoints, // Score is simply daily points
        };
      })
      .sort((a, b) => b.score - a.score) // Higher daily points is better
      .slice(0, limit);

    return entries;
  }

  // Get recent tag events
  async getRecentTagEvents(limit = 20): Promise<TagEvent[]> {
    const events = await redis.lrange<TagEvent>(REDIS_KEYS.TAG_EVENTS, 0, limit - 1);
    return events || [];
  }
}

export const gameService = new GameService();
