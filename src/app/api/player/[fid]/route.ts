import { NextRequest, NextResponse } from 'next/server';

import { gameService } from "~/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid } = await params;
  const numFid = parseInt(fid, 10);
  if (!Number.isFinite(numFid)) {
    return NextResponse.json({ error: "Invalid fid" }, { status: 400 });
  }
  const player = await gameService.getPlayer(numFid);
  return NextResponse.json({ player });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid } = await params;
  const numFid = parseInt(fid, 10);
  if (!Number.isFinite(numFid)) {
    return NextResponse.json({ error: "Invalid fid" }, { status: 400 });
  }
  const body = await request.json();
  const player = await gameService.createOrUpdatePlayer({
    fid: numFid,
    username: body.username,
    displayName: body.displayName,
    pfpUrl: body.pfpUrl,
  });
  return NextResponse.json({ player });
}
