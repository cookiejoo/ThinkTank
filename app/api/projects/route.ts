
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getProjects, createProject, ProjectGitConfig, updateProjectConfig } from '@/lib/fs-service';
import { encrypt } from '@/lib/crypto';
import { authOptions } from '../auth/[...nextauth]/route';
import { syncProject } from '@/lib/git-sync-service';

export async function GET() {
  // This public endpoint always returns all active (not soft-deleted) projects.
  const allProjects = await getProjects(false);
  return NextResponse.json(allProjects);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, description, group, mode, gitConfig }: { id: string, description?: string, group: string, mode: 'edit' | 'git', gitConfig?: ProjectGitConfig } = body;

    if (!id || !group) {
      return NextResponse.json({ error: 'Project ID and Group are required' }, { status: 400 });
    }

    let finalGitConfig = gitConfig;
    if (finalGitConfig?.token) {
      finalGitConfig.token = encrypt(finalGitConfig.token);
    }

    // Create the project structure and its config file
    await createProject(id, description, group, mode, finalGitConfig);

    // If it's a git project, trigger an initial sync immediately
    if (mode === 'git' && finalGitConfig) {
      // We don't need to await this, let it run in the background
      syncProject({ id, name: id, mode, gitConfig: finalGitConfig });
    }

    return NextResponse.json({ success: true, id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("[API ERROR] POST /api/projects:", errorMessage);
    return NextResponse.json({ error: `Failed to create project: ${errorMessage}` }, { status: 500 });
  }
}
