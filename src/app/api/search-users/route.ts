import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Use Neynar API to search for users
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          'Accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to a simpler format
    const users = data.result?.users?.map((user: {
      fid: number;
      username: string;
      display_name: string;
      pfp_url?: string;
      follower_count?: number;
    }) => ({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
      follower_count: user.follower_count,
    })) || [];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users API error:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
