import { NextRequest, NextResponse } from 'next/server';
import { toggleFileVisibility } from '@/lib/fs-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, path, isVisible } = body;

    if (!projectId || !path || typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await toggleFileVisibility(projectId, path, isVisible);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update visibility:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
