
import { getProjects, Project, getProjectConfig, ProjectConfig } from './fs-service';
import { decrypt } from './crypto';
import cron, { ScheduledTask } from 'node-cron';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

const ROOT_DIR = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');
const git = simpleGit();

declare global {
  var _scheduledJobs: Map<string, ScheduledTask> | undefined;
}

// Use global to preserve map across HMR in development
const scheduledJobs: Map<string, ScheduledTask> = global._scheduledJobs || (global._scheduledJobs = new Map<string, ScheduledTask>());
const syncingProjects = new Set<string>();

export async function syncProject(project: Project) {
  if (project.mode !== 'git' || !project.gitConfig) return;

  if (syncingProjects.has(project.id)) {
    console.log(`Sync for project ${project.id} is already in progress. Skipping this run.`);
    return;
  }

  try {
    syncingProjects.add(project.id);
    console.log(`Starting sync for ${project.id}. Lock acquired.`);

    const { repoUrl, branch = 'main', token, rootPath } = project.gitConfig;
    const projectPath = path.join(ROOT_DIR, project.id);
    const tempGitPath = path.join(projectPath, '.temp', 'repo'); // Persistent git repo

    let remoteUrl = repoUrl;

    if (token) {
        const decryptedToken = decrypt(token);
        remoteUrl = repoUrl.replace('https://', `https://${decryptedToken}@`);
    }

    // --- Part 1: Sync the persistent temp repo ---
    await fs.mkdir(tempGitPath, { recursive: true });
    const tempGit = simpleGit(tempGitPath);
    const isRepo = await tempGit.checkIsRepo().catch(() => false);
    let needsFreshClone = !isRepo;

    if (isRepo) {
        const remotes = await tempGit.getRemotes(true);
        const originUrl = remotes.find(r => r.name === 'origin')?.refs?.fetch;
        const normalize = (url: string | undefined) => url ? url.replace(/:\/\/[^@]+@/, '://') : '';

        if (normalize(originUrl) !== normalize(repoUrl)) {
            console.log(`Remote URL mismatch in temp repo for ${project.id}. Re-cloning.`);
            needsFreshClone = true;
        }
    }

    if (needsFreshClone) {
        console.log(`Cleaning and cloning into persistent temp path: ${tempGitPath}`);
        await fs.rm(tempGitPath, { recursive: true, force: true });
        await fs.mkdir(tempGitPath, { recursive: true });
        await git.clone(remoteUrl, tempGitPath, { '--branch': branch });
    } else {
        console.log(`Fetching updates and tags in persistent temp path: ${tempGitPath}`);
        await tempGit.fetch(['--tags']);
        await tempGit.pull(); // Pull from the configured remote
    }

    // --- Part 2: Copy content to final destination ---
    let sourcePath = tempGitPath;
    if (rootPath) {
        const potentialSourcePath = path.join(tempGitPath, rootPath);
        try {
            await fs.access(potentialSourcePath);
            sourcePath = potentialSourcePath;
            console.log(`Using rootPath. Source content is at: ${sourcePath}`);
        } catch (e) {
            throw new Error(`The specified rootPath '${rootPath}' does not exist in the repository.`);
        }
    }

    console.log(`Cleaning destination path: ${projectPath} (preserving .thinktank and .temp)`);
    const entries = await fs.readdir(projectPath);
    for (const entry of entries) {
        if (entry !== '.thinktank' && entry !== '.temp') {
            await fs.rm(path.join(projectPath, entry), { recursive: true, force: true });
        }
    }

    console.log(`Copying content from ${sourcePath} to ${projectPath}`);
    const sourceEntries = await fs.readdir(sourcePath);
    for (const entry of sourceEntries) {
        // Don't copy the .git directory from the temp repo
        if (entry === '.git') continue;
        await fs.cp(path.join(sourcePath, entry), path.join(projectPath, entry), { recursive: true });
    }
    console.log('Content successfully synced to destination.');

  } catch (error) {
    console.error(`Failed to sync project ${project.id}:`, error);
  } finally {
    syncingProjects.delete(project.id);
    console.log(`Sync finished for project ${project.id}. Lock released.`);
  }
}

function scheduleJob(project: Project) {
    if (project.mode !== 'git' || !project.gitConfig?.syncInterval) return;

    const { syncInterval } = project.gitConfig;
    if (syncInterval > 0) {
        const cronExpression = syncInterval < 1 ? `*/${Math.round(syncInterval * 60)} * * * * *` : `*/${syncInterval} * * * *`;
        const task = cron.schedule(cronExpression, async () => {
            console.log(`Cron job triggered for project: ${project.id}`);
            try {
                // Re-fetch the full, most up-to-date project details right before syncing
                const projects = await getProjects(true); // Get all projects with full config
                const latestProject = projects.find(p => p.id === project.id);
                
                if (latestProject) {
                    await syncProject(latestProject);
                } else {
                    console.error(`Project ${project.id} not found during scheduled sync. Stopping job.`);
                    scheduledJobs.get(project.id)?.stop();
                    scheduledJobs.delete(project.id);
                }
            } catch (error) {
                console.error(`Failed to sync project ${project.id} due to an error:`, error);
            }
        });
        scheduledJobs.set(project.id, task);
        console.log(`Scheduled sync for ${project.id} with expression: ${cronExpression}.`);
    }
}

export async function rescheduleSyncJob(projectId: string) {
    // Stop and remove existing job if it exists
    if (scheduledJobs.has(projectId)) {
        scheduledJobs.get(projectId)!.stop();
        scheduledJobs.delete(projectId);
        console.log(`Stopped existing sync schedule for project ${projectId}.`);
    }

    // Re-read the project's full configuration to get the new interval
    try {
        const allProjects = await getProjects(true);
        const projectToReschedule = allProjects.find(p => p.id === projectId);

        if (projectToReschedule) {
            console.log(`Rescheduling job for project ${projectId}.`);
            scheduleJob(projectToReschedule);
        } else {
            console.log(`Project ${projectId} not found. Cannot reschedule.`);
        }
    } catch (error) {
        console.error(`Failed to reschedule job for ${projectId}:`, error);
    }
}

export async function initializeGitSync() {
  console.log('Re-initializing Git sync service...');

  // Stop all previously scheduled jobs to prevent duplicates during HMR
  if (scheduledJobs.size > 0) {
      console.log(`Stopping ${scheduledJobs.size} existing cron jobs...`);
      for (const [projectId, task] of scheduledJobs.entries()) {
          task.stop();
      }
      scheduledJobs.clear();
      console.log('All cron jobs stopped and cleared.');
  }

  console.log('Initializing Git sync for all projects...');
  const projects = await getProjects(true);

  for (const project of projects) {
    scheduleJob(project);
  }
  console.log('Git sync initialization complete.');
}
