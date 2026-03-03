import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

const ROOT_DIR = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const tempGitPath = path.join(ROOT_DIR, projectId, '.temp', 'repo');

    try {
        // Check if the git repo exists
        await fs.access(tempGitPath);
        const git = simpleGit(tempGitPath);

        if (!(await git.checkIsRepo())) {
            return NextResponse.json({ versions: [] });
        }

        const tags = await git.tags(['-l', '--sort=-v:refname']);
        
        return NextResponse.json({ versions: tags.all });

    } catch (error) {
        // If the directory or repo doesn't exist, or another git error occurs
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            // This is expected if a project is not a git project or hasn't been synced yet
            return NextResponse.json({ versions: [] });
        }
        console.error(`[API ERROR] GET /api/projects/${projectId}/versions:`, error);
        return NextResponse.json({ error: 'Failed to fetch project versions' }, { status: 500 });
    }
}
