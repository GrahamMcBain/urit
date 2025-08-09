import { NextResponse } from 'next/server';

// Deprecated: use /.well-known/farcaster.json
export async function GET() {
  return NextResponse.json(
    { error: 'Deprecated: use /.well-known/farcaster.json' },
    { status: 410 }
  );
}
