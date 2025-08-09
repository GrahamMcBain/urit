import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.NEYNAR_API_KEY;
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Neynar API key is not configured. Please add NEYNAR_API_KEY to your environment variables.' },
      { status: 500 }
    );
  }

  if (!fid) {
    return NextResponse.json(
      { error: 'FID parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Use REST endpoint for best friends; Neynar SDK doesn't expose this
    const resp = await fetch(
      `https://api.neynar.com/v2/farcaster/user/best_friends?fid=${encodeURIComponent(fid)}&limit=3`,
      {
        headers: {
          'x-api-key': apiKey,
          'accept': 'application/json',
        },
      }
    );
    if (!resp.ok) {
      throw new Error(`Neynar API error: ${resp.status}`);
    }
    const data: { users: { user: { fid: number; username: string } }[] } = await resp.json();
    return NextResponse.json({ bestFriends: data.users });
  } catch (error) {
    console.error('Failed to fetch best friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch best friends. Please check your Neynar API key and try again.' },
      { status: 500 }
    );
  }
} 