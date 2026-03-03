import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getUsers, addUser, updateUser, User } from '@/lib/user-service';
import { authOptions } from '../auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await getUsers();
  // Don't return passwords
  const safeUsers = users.map(({ passwordHash, ...u }) => u);
  return NextResponse.json(safeUsers);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      const body = await request.json();
      // Simple validation
      if (!body.username || !body.password) {
          return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(body.password, 10);

      const newUser: Omit<User, 'id'> = {
          username: body.username,
          passwordHash: hashedPassword,
          role: body.role || 'user',
          accessibleProjects: body.accessibleProjects || []
      };

      await addUser(newUser);
      return NextResponse.json({ success: true });
  } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
        const body = await request.json();
        const users = await getUsers();
        const existingUser = users.find(u => u.id === body.id);
        
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updatedUser: User = {
            ...existingUser,
            role: body.role !== undefined ? body.role : existingUser.role,
            accessibleProjects: body.accessibleProjects !== undefined ? body.accessibleProjects : existingUser.accessibleProjects
        };

        // Only hash and update password if a new one is provided
      if (body.password) {
        updatedUser.passwordHash = await bcrypt.hash(body.password, 10);
      }

        await updateUser(updatedUser);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
