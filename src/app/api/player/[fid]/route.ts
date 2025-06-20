import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  return NextResponse.json(
    { error: 'Player API temporarily disabled' },
    { status: 503 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  return NextResponse.json(
    { player: null }
  );
}
