import { NextRequest, NextResponse } from 'next/server';
import { updateBatchSorting } from '@/lib/fs-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, updates } = body;

    if (!projectId || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await updateBatchSorting(projectId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update sorting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
