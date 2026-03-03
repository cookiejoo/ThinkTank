import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { toggleStar } from '@/lib/config-service';
import { getProjectRoot } from '@/lib/fs-service';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, path } = body;

    if (!projectId || !path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const projectRoot = await getProjectRoot(projectId);
    await toggleStar(projectRoot, path, session.user.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to toggle star:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
