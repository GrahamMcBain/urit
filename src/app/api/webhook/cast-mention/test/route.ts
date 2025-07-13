import { NextRequest, NextResponse } from 'next/server';

// Test endpoint for cast mention webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/webhook/cast-mention',
    description: 'Webhook endpoint for handling @tag mentions in casts',
    supportedFormats: [
      '@tag @username',
      '@tag username'
    ],
    timestamp: new Date().toISOString()
  });
}

// Test webhook with sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      received: true,
      payload: body,
      message: 'Test webhook payload received successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse JSON payload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}
