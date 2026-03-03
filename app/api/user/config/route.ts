import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getUserConfig } from '@/lib/config-service';
import { getProjectRoot } from '@/lib/fs-service';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const projectRoot = await getProjectRoot(projectId);
    const config = await getUserConfig(projectRoot, session.user.id);

    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to get user config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
