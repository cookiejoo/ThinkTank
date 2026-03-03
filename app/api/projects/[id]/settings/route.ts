
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { getProjectConfig, updateProjectConfig, ProjectGitConfig, getProjectGroups, updateGroupConfig } from '@/lib/fs-service';
import { encrypt } from '@/lib/crypto';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { rescheduleSyncJob } from '@/lib/git-sync-service';

async function handleGroupUpdate(projectId: string, newGroupName: string) {
    if (!newGroupName) return; // Do nothing if group name is empty

    const allGroups = await getProjectGroups(true);
    let projectFoundAndMoved = false;

    // Remove project from any old group
    allGroups.forEach(group => {
        const projectIndex = group.projects.indexOf(projectId);
        if (projectIndex > -1) {
            group.projects.splice(projectIndex, 1);
        }
    });

    // Add project to the new group
    const targetGroup = allGroups.find(g => g.name === newGroupName);
    if (targetGroup) {
        if (!targetGroup.projects.includes(projectId)) {
            targetGroup.projects.push(projectId);
        }
        if (targetGroup.isDeleted) {
            targetGroup.isDeleted = false; // Undelete group if project is added to it
        }
    } else {
        // If group doesn't exist, create it
        allGroups.push({ name: newGroupName, projects: [projectId], isDeleted: false });
    }

    // Save the updated groups configuration
    const groupsPath = 'docs/.thinktank/groups.json'; // This needs to be a consistent path
    await updateGroupConfig(allGroups);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const id = decodeURIComponent((await params).id);

    const hasAccess = session?.user?.role === 'admin' ||
                      (session?.user?.accessibleProjects && session.user.accessibleProjects.includes(id));

    if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const config = await getProjectConfig(id);
        if (!config.mode) {
            throw new Error(`Project with ID '${id}' not found or its config is empty.`);
        }
        if (config.gitConfig?.token) {
            config.gitConfig.token = ''; // Never send encrypted token to the client
        }
        return NextResponse.json(config);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`[API ERROR] GET /api/projects/${id}/settings:`, errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    const id = decodeURIComponent((await params).id);

    const hasAccess = session?.user?.role === 'admin' ||
                      (session?.user?.accessibleProjects && session.user.accessibleProjects.includes(id));

    if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { description, group, gitConfig }: { description?: string, group?: string, gitConfig?: ProjectGitConfig } = body;

        const currentConfig = await getProjectConfig(id);
        if (!currentConfig.mode) {
             throw new Error(`Project with ID '${id}' not found. Cannot update.`);
        }

        const updatedConfig = { ...currentConfig };
        updatedConfig.description = description;

        if (updatedConfig.mode === 'git') {
            const newGitConfig = gitConfig;
            const oldGitConfig = currentConfig.gitConfig;
            const isNewTokenProvided = newGitConfig?.token && newGitConfig.token !== '********';

            if (isNewTokenProvided) {
                newGitConfig.token = encrypt(newGitConfig.token!);
            } else if (newGitConfig) {
                // If token is the placeholder, keep the old one
                newGitConfig.token = oldGitConfig?.token;
            }
            updatedConfig.gitConfig = newGitConfig;
        }

        await updateProjectConfig(id, updatedConfig);
        
        // Handle group update separately to ensure atomicity
        if (group) {
            await handleGroupUpdate(id, group);
        }

        // After saving, reschedule the sync job to apply changes immediately
        if (updatedConfig.mode === 'git') {
            // Fire and forget, no need to await
            rescheduleSyncJob(id).catch(err => {
                console.error(`[NON-BLOCKING ERROR] Failed to reschedule sync job for project ${id}:`, err);
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`[API ERROR] PUT /api/projects/${id}/settings:`, errorMessage);
        return NextResponse.json({ error: `Failed to update project settings: ${errorMessage}` }, { status: 500 });
    }
}
