import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Admin functionality temporarily disabled' },
    { status: 503 }
  );
}
