import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getProjects } from '@/lib/fs-service';
import { authOptions } from '../../auth/[...nextauth]/route';

// This endpoint is specifically for the admin console
export async function GET() {
  const session = await getServerSession(authOptions);

  // This is a protected route, user must be logged in.
  if (!session?.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allProjects = await getProjects(true); // Fetch all, including soft-deleted for admin view

  // Admins see everything
  if (session.user.role === 'admin') {
      return NextResponse.json(allProjects);
  }
  
  // Logged-in non-admin users see only projects they have explicit access to
  const userProjects = allProjects.filter(p => session.user.accessibleProjects?.includes(p.id));
  return NextResponse.json(userProjects);
}
