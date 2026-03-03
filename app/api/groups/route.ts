import { NextResponse } from 'next/server';
import { getProjectGroups, createGroup, deleteGroup } from '@/lib/fs-service';

export async function GET() {
  const groups = await getProjectGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
  }
  
  await createGroup(name);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const physical = searchParams.get('physical') === 'true';
  
  if (!name) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
  }
  
  await deleteGroup(name, physical);
  return NextResponse.json({ success: true });
}
