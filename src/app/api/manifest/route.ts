import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const manifestPath = join(process.cwd(), 'public', 'farcaster.json');
    const manifestContent = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to read manifest:', error);
    return NextResponse.json(
      { error: 'Manifest not found' },
      { status: 404 }
    );
  }
}
