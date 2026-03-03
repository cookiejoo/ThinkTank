
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initializeGitSync } = await import('./lib/git-sync-service');
        initializeGitSync();
    }
}
