
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getProjectConfig } from '@/lib/fs-service';
import { decrypt } from '@/lib/crypto';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const projectId = decodeURIComponent(id);

        const config = await getProjectConfig(projectId);
        
        if (!config.gitConfig?.token) {
            return NextResponse.json({ token: '' });
        }

        const decryptedToken = decrypt(config.gitConfig.token);
        return NextResponse.json({ token: decryptedToken });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`[API ERROR] GET /api/projects/.../token:`, errorMessage);
        return NextResponse.json({ error: `Failed to retrieve token: ${errorMessage}` }, { status: 500 });
    }
}
