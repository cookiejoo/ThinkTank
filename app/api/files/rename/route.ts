import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { renameFile } from '@/lib/fs-service';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, oldPath, newPath } = body;

    if (!projectId || !oldPath || !newPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await renameFile(projectId, oldPath, newPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to rename file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
