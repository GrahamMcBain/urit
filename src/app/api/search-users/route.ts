import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

        // Use Neynar SDK to search for users
    const { getNeynarClient } = await import('~/lib/neynar');
    const client = getNeynarClient();
    const data = await client.searchUser({ q: query, limit: 10 });

    // Transform the response to a simpler format
    type SearchedUser = { fid: number; username: string; display_name: string; pfp_url?: string; follower_count?: number };
    const users = (data.result?.users as SearchedUser[] | undefined)?.map((user) => ({
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
