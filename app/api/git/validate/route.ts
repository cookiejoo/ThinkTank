
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import simpleGit, { SimpleGitOptions } from 'simple-git';
import { getProjectConfig } from '@/lib/fs-service';
import { decrypt } from '@/lib/crypto';

const gitOptions: Partial<SimpleGitOptions> = {
    maxConcurrentProcesses: 1,
    timeout: { block: 15000 },
};

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { repoUrl, token, projectId } = await request.json();

        if (!repoUrl) {
            return NextResponse.json({ error: 'Repository URL is required.' }, { status: 400 });
        }

        let effectiveToken = token;

        if (token === '********' && projectId) {
            try {
                const config = await getProjectConfig(projectId);
                if (config.gitConfig?.token) {
                    effectiveToken = decrypt(config.gitConfig.token);
                } else {
                    return NextResponse.json({ error: 'No token configured for this project.' }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: 'Could not retrieve existing token.' }, { status: 500 });
            }
        }

        const git = simpleGit(gitOptions);
        let remoteUrl = repoUrl;

        if (repoUrl.startsWith('https://')) {
            if (!effectiveToken) {
                 return NextResponse.json({ error: 'A Personal Access Token is required for HTTPS repositories.' }, { status: 400 });
            }
            const url = new URL(repoUrl);
            url.username = effectiveToken;
            remoteUrl = url.toString();
        } 
        else if (!repoUrl.startsWith('ssh://') && !repoUrl.startsWith('git@')) {
            return NextResponse.json({ error: 'Invalid Git URL format. Please use HTTPS, SSH, or git@ format.' }, { status: 400 });
        }
        
        await git.listRemote([remoteUrl]);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[Git Validate API] Error:", error);
        const errorMessage = error instanceof Error && error.message.includes('timeout') 
            ? 'Connection timed out. The server may be unreachable or behind a firewall.' 
            : 'Connection failed. Please check the repository URL and ensure your credentials (Token or SSH Key) are correct.';

        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
}
