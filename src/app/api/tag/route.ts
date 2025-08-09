import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '~/lib/redis';


export async function POST(request: NextRequest) {
  try {
    const { taggerFid, taggedFid, taggedUser, isAdminOverride } = await request.json();

    if (!taggerFid || !taggedFid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the tagged player if they don't exist
    if (taggedUser) {
      await gameService.createOrUpdatePlayer({
        fid: taggedFid,
        username: taggedUser.username,
        displayName: taggedUser.display_name,
        pfpUrl: taggedUser.pfp_url,
        timesTagged: 0,
        timesTaggedOthers: 0,
        totalTimeTagged: 0,
        dailyPoints: 0,
        lastPointsDate: new Date().toISOString().split('T')[0],
        totalPoints: 0,
      });
    }

    // Check if game should be reset (24 hour cycle)
    await gameService.checkAndResetGame();

    // Tag the player
    const result = await gameService.tagPlayer(taggerFid, taggedFid, isAdminOverride);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error tagging player:', error);
    return NextResponse.json(
      { error: 'Failed to tag player' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if game should be reset (24 hour cycle)
    const wasReset = await gameService.checkAndResetGame();
    
    // Get currently tagged player
    const currentlyTagged = await gameService.getCurrentlyTagged();
    return NextResponse.json({ currentlyTagged, wasReset });
  } catch (error) {
    console.error('Error getting tag status:', error);
    return NextResponse.json({ 
      currentlyTagged: null,
      error: 'Failed to get tag status'
    });
  }
}
