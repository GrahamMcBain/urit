import { NextRequest, NextResponse } from 'next/server';
import { gameService } from '~/lib/redis';
import { isSuperAdmin } from '~/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { taggerFid, taggedFid, taggedUser, isAdminOverride } = await request.json();

    if (!taggerFid || !taggedFid) {
      return NextResponse.json(
        { error: 'Missing taggerFid or taggedFid' },
        { status: 400 }
      );
    }

    // Check if this is a super admin override
    const isAdmin = isSuperAdmin(taggerFid);
    if (isAdminOverride && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }

    // Create or update the tagged user if user data is provided
    if (taggedUser) {
      await gameService.createOrUpdatePlayer({
        fid: taggedFid,
        username: taggedUser.username,
        displayName: taggedUser.display_name,
        pfpUrl: taggedUser.pfp_url,
      });
    }

    const result = await gameService.tagPlayer(taggerFid, taggedFid, isAdminOverride);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      tagEvent: result.tagEvent,
    });

  } catch (error) {
    console.error('Tag API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const currentlyTagged = await gameService.getCurrentlyTagged();
    return NextResponse.json({ currentlyTagged });
  } catch (error) {
    console.error('Get currently tagged error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
