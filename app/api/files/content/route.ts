import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getFileContent, saveFileContent, getProjectConfig } from '@/lib/fs-service';
import { authOptions } from '../../auth/[...nextauth]/route';
import simpleGit from 'simple-git';
import path from 'path';

const ROOT_DIR = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const filePath = searchParams.get('path');
  const version = searchParams.get('version');
  
  if (!projectId || !filePath) {
    return NextResponse.json({ error: 'Project ID and Path are required' }, { status: 400 });
  }

  try {
    // "Virtual track" for historical versions
    if (version && version !== 'latest') {
        const tempGitPath = path.join(ROOT_DIR, projectId, '.temp', 'repo');
        const git = simpleGit(tempGitPath);

        if (!(await git.checkIsRepo())) {
            return NextResponse.json({ error: 'Git repository not found for this project' }, { status: 404 });
        }

        const config = await getProjectConfig(projectId);
        const rootPath = config.gitConfig?.rootPath;
        
        let finalPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        if (rootPath) {
            const normalizedRootPath = rootPath.startsWith('/') ? rootPath.substring(1) : rootPath;
            finalPath = path.join(normalizedRootPath, finalPath);
        }

        const content = await git.show(`${version}:${finalPath}`);
        return NextResponse.json({ content });

    } else {
        // "Physical track" for the latest version
        const content = await getFileContent(projectId, filePath);
        return NextResponse.json({ content });
    }
  } catch (error) {
    // Git 'show' throws an error for not found files, which is expected.
    if (error instanceof Error && error.message.includes('exists on disk, but not in')) {
        return NextResponse.json({ error: 'File not found in this version' }, { status: 404 });
    }
    console.error(`[API ERROR] /api/files/content for ${projectId}:`, error);
    return NextResponse.json({ error: 'File not found or failed to read' }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, path, content } = body;

  if (!projectId || !path || content === undefined) {
    return NextResponse.json({ error: 'Project ID, Path and content are required' }, { status: 400 });
  }

  try {
    await saveFileContent(projectId, path, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}
