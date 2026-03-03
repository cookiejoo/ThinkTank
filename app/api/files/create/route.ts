import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { createFile } from '@/lib/fs-service';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, path, isDir } = body;

    if (!projectId || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await createFile(projectId, path, isDir || false);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
