import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '~/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid: fidString } = await params;
    const fid = parseInt(fidString);
    
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    const player = await gameService.getPlayer(fid);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Player API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid: fidString } = await params;
    const fid = parseInt(fidString);
    
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    const playerData = await request.json();

    const player = await gameService.createOrUpdatePlayer({
      fid,
      ...playerData,
    });

    return NextResponse.json({ player });
  } catch (error) {
    console.error('Update player API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
