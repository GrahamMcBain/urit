import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '@/lib/redis';
import { isSuperAdmin } from '@/lib/config';
import { redis, REDIS_KEYS } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { adminFid } = await request.json();

    if (!adminFid || !isSuperAdmin(adminFid)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Reset the game
    await redis.del(REDIS_KEYS.CURRENTLY_TAGGED);
    await gameService.updateGameState({ lastResetTime: Date.now() });

    return NextResponse.json({ success: true, message: 'Game reset successfully' });
  } catch (error) {
    console.error('Error resetting game:', error);
    return NextResponse.json(
      { error: 'Failed to reset game' },
      { status: 500 }
    );
  }
}
