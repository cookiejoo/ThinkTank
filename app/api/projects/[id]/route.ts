import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getServerSession } from "next-auth";
import { getProjectRoot, getProjectConfig, updateProjectDescription, updateProjectGitConfig, getProjectGroups, deleteProject } from '@/lib/fs-service';
import { getUserConfig } from '@/lib/config-service';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    const projectId = decodeURIComponent(resolvedParams.id);
  
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const physical = searchParams.get('physical') === 'true';

  try {
      await deleteProject(projectId, physical);
      return NextResponse.json({ success: true });
  } catch (error) {
      console.error('Delete Project Error:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
    const projectId = decodeURIComponent(resolvedParams.id);

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const projectRoot = await getProjectRoot(projectId);
    
    // Read project config
    const config = await getProjectConfig(projectId);
    
    // Read user config if logged in
    let userConfig = { starred: [] as string[], recent: [] as string[] };
    if (session?.user?.id) {
      userConfig = await getUserConfig(projectRoot, session.user.id);
    }
    
    // Try to read README.md
    let readme = '';
    const readmeCandidates = ['README.md', 'readme.md', 'index.md'];
    for (const file of readmeCandidates) {
      try {
        const readmePath = path.join(projectRoot, file);
        const stats = await fs.stat(readmePath);
        if (stats.isFile()) {
          readme = await fs.readFile(readmePath, 'utf-8');
          break;
        }
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      readme,
      description: config.description || '',
      mode: config.mode || 'git',
      gitConfig: config.gitConfig,
      starred: userConfig.starred,
      recent: userConfig.recent
    });

  } catch (error) {
    console.error('Project Details API Error:', error);
    return NextResponse.json({ error: 'Failed to load project details' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const projectId = decodeURIComponent(resolvedParams.id);
  
  if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }
  
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      const body = await request.json();
      const { description, gitConfig, group } = body;
      
      if (description !== undefined) {
          if (typeof description !== 'string') {
              return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
          }
          await updateProjectDescription(projectId, description);
      }

      if (gitConfig !== undefined) {
          await updateProjectGitConfig(projectId, gitConfig);
      }

      if (group !== undefined) {
          const groups = await getProjectGroups();
          
          // Remove from old group
          for (const g of groups) {
              // Ensure projects array exists
              if (!g.projects) g.projects = [];
              
              if (g.projects.includes(projectId)) {
                  g.projects = g.projects.filter((p: string) => p !== projectId);
              }
          }
          
          // Add to new group
          if (group) {
              const newGroup = groups.find(g => g.name === group);
              if (newGroup) {
                  if (!newGroup.projects.includes(projectId)) {
                      newGroup.projects.push(projectId);
                  }
              } else {
                  // Allow creating new group via API for flexibility, 
                  // though UI might restrict it.
                  groups.push({
                      name: group,
                      projects: [projectId]
                  });
              }
          }
          
          // Save groups
          const docsRoot = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');
          const groupsPath = path.join(docsRoot, '.thinktank', 'groups.json');
          await fs.writeFile(groupsPath, JSON.stringify(groups, null, 2));
      }
      
      return NextResponse.json({ success: true });
  } catch (error) {
      console.error('Update Project Error:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}
