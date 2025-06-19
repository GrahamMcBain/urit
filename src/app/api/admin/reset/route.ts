import { NextRequest, NextResponse } from 'next/server';
import { gameService, redis } from '~/lib/redis';
import { REDIS_KEYS } from '~/lib/types';
import { isSuperAdmin } from '~/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { adminFid } = await request.json();

    if (!adminFid || !isSuperAdmin(adminFid)) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    // Clear currently tagged player
    await redis.del(REDIS_KEYS.CURRENTLY_TAGGED);
    
    // Reset game state
    await gameService.updateGameState({
      currentlyTagged: undefined,
      lastTagTime: undefined,
      gameStartTime: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Game state reset successfully',
    });

  } catch (error) {
    console.error('Reset game API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
