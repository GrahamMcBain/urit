import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '~/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Check if game should be reset (24 hour cycle)
    await gameService.checkAndResetGame();
    
    // Get leaderboard
    const leaderboard = await gameService.getLeaderboard(20);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return NextResponse.json({ 
      leaderboard: [],
      error: 'Failed to get leaderboard'
    });
  }
}
