import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Tag functionality temporarily disabled' },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json({ 
    currentlyTagged: null 
  });
}
