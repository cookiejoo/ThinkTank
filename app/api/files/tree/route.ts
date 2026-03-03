import { NextRequest, NextResponse } from 'next/server';
import { getFileTree, TreeNode } from '@/lib/fs-service';
import simpleGit from 'simple-git';
import path from 'path';

const ROOT_DIR = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');

// Helper to build a tree from a flat list of git files
function buildTree(files: string[]): TreeNode[] {
    const rootNodes: TreeNode[] = [];
    // A map to keep track of directories and their direct children
    const dirMap = new Map<string, TreeNode[]>();
    dirMap.set('.', rootNodes); // Root directory

    files.forEach(filePath => {
        if (!filePath) return;
        const parts = filePath.split('/');
        
        parts.forEach((part, index) => {
            const isDir = index < parts.length - 1;
            const parentPath = index === 0 ? '.' : parts.slice(0, index).join('/');
            const currentPath = parts.slice(0, index + 1).join('/');

            const children = dirMap.get(parentPath);
            if (!children) return; // Should not happen if structured correctly

            let node = children.find(child => child.name === part);

            if (!node) {
                node = {
                    id: `/${currentPath}`,
                    name: part,
                    isDir: isDir,
                };
                if (isDir) {
                    node.children = [];
                    dirMap.set(currentPath, node.children);
                }
                children.push(node);
            }
        });
    });

    return rootNodes;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const version = searchParams.get('version');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    // "Virtual track" for historical versions
    if (version && version !== 'latest') {
        const tempGitPath = path.join(ROOT_DIR, projectId, '.temp', 'repo');
        const git = simpleGit(tempGitPath);

        if (!(await git.checkIsRepo())) {
            return NextResponse.json({ error: 'Git repository not found for this project' }, { status: 404 });
        }

        // Get all files from the specified tag/version
        const fileList = await git.raw('ls-tree', '-r', '--name-only', version);
        console.log("Raw file list from git:", fileList); // <-- DEBUG LOG
        const files = fileList.split('\n').filter(Boolean);
        
        // We need to get the project config to know the rootPath
        const { getProjectConfig } = await import('@/lib/fs-service');
        const config = await getProjectConfig(projectId);
        const rootPath = config.gitConfig?.rootPath;

        let finalFiles = files;
        if (rootPath) {
            const normalizedRootPath = rootPath.startsWith('/') ? rootPath.substring(1) : rootPath;
            finalFiles = files
                .filter(f => f.startsWith(normalizedRootPath))
                .map(f => path.relative(normalizedRootPath, f));
        }
        console.log("Files after rootPath filtering:", finalFiles); // <-- DEBUG LOG

        const tree = buildTree(finalFiles);
        console.log("Final tree structure:", JSON.stringify(tree, null, 2)); // <-- DEBUG LOG
        return NextResponse.json(tree);

    } else {
        // "Physical track" for the latest version
        const tree = await getFileTree(projectId);
        return NextResponse.json(tree);
    }
  } catch (error) {
    console.error(`[API ERROR] /api/files/tree for ${projectId}:`, error);
    return NextResponse.json({ error: 'Failed to load file tree' }, { status: 500 });
  }
}
