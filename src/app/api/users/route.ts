import { NextResponse } from 'next/server';
import { getNeynarClient } from '~/lib/neynar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fids = searchParams.get('fids');
  
  if (!fids) {
    return NextResponse.json(
      { error: 'FIDs parameter is required' },
      { status: 400 }
    );
  }

  try {
    const neynar = getNeynarClient();
    const fidsArray = fids.split(',').map(fid => parseInt(fid.trim(), 10));
    const { users } = await neynar.fetchBulkUsers({ fids: fidsArray });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users. Please check your Neynar API key and try again.' },
      { status: 500 }
    );
  }
}
