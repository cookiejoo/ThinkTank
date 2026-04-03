import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { emptyTrash, listTrashedItems, purgeTrashedItem, restoreTrashedItem } from '@/lib/fs-service';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const items = await listTrashedItems(projectId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to list trash:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, action, path } = body || {};

    if (!projectId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'empty') {
      await emptyTrash(projectId);
      return NextResponse.json({ success: true });
    }

    if (!path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'restore') {
      await restoreTrashedItem(projectId, path);
      return NextResponse.json({ success: true });
    }

    if (action === 'purge') {
      await purgeTrashedItem(projectId, path);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update trash:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

