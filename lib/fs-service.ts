import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const ROOT_DIR = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isDir?: boolean;
  isVisible?: boolean;
}

export interface ProjectGitConfig {
  repoUrl: string;
  branch?: string;
  rootPath?: string;
  token?: string; // Encrypted token
  syncInterval?: number; // In minutes
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  mode?: 'git' | 'edit';
  group?: string;
  gitConfig?: ProjectGitConfig;
  isDeleted?: boolean;
}

export interface FileMetadata {
  isHidden?: boolean;
  sortOrder?: number;
  isDeleted?: boolean;
}

export interface ProjectConfig {
  description?: string;
  mode?: 'git' | 'edit';
  gitConfig?: ProjectGitConfig;
  createdAt?: string;
  files?: Record<string, FileMetadata>;
  isDeleted?: boolean;
}

// === Project Management ===

export async function getProjectConfig(projectId: string): Promise<ProjectConfig> {
    const configPath = path.join(ROOT_DIR, projectId, '.thinktank', 'config.json');
    try {
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return { files: {} };
    }
}

export async function updateProjectConfig(projectId: string, config: ProjectConfig): Promise<void> {
    const configDir = path.join(ROOT_DIR, projectId, '.thinktank');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(path.join(configDir, 'config.json'), JSON.stringify(config, null, 2));
}

export interface GroupConfig {
  name: string;
  projects: string[];
  isDeleted?: boolean;
}

export async function getProjectGroups(includeDeleted = false): Promise<GroupConfig[]> {
  const groupsPath = path.join(ROOT_DIR, '.thinktank', 'groups.json');
  try {
    const content = await fs.readFile(groupsPath, 'utf-8');
    const groups: GroupConfig[] = JSON.parse(content);
    if (includeDeleted) return groups;
    return groups.filter(g => !g.isDeleted);
  } catch {
    return [];
  }
}

export async function updateGroupConfig(groups: GroupConfig[]): Promise<void> {
    const groupsPath = path.join(ROOT_DIR, '.thinktank', 'groups.json');
    await fs.mkdir(path.dirname(groupsPath), { recursive: true });
    await fs.writeFile(groupsPath, JSON.stringify(groups, null, 2));
}

export async function createGroup(name: string): Promise<void> {
    const groups = await getProjectGroups(true); // Include deleted to reuse if exists
    const existingGroup = groups.find(g => g.name === name);
    
    if (existingGroup) {
        if (existingGroup.isDeleted) {
            existingGroup.isDeleted = false; // Restore
        } else {
            return; // Already exists and active
        }
    } else {
        groups.push({
            name,
            projects: []
        });
    }
    
    await updateGroupConfig(groups);
}

export async function deleteGroup(name: string, physical = false): Promise<void> {
    let groups = await getProjectGroups(true);
    
    if (physical) {
        groups = groups.filter(g => g.name !== name);
    } else {
        const group = groups.find(g => g.name === name);
        if (group && !group.isDeleted) {
            group.isDeleted = true;
        }
    }
    await updateGroupConfig(groups);
}

export async function deleteProject(id: string, physical = false): Promise<void> {
    const projectPath = path.join(ROOT_DIR, id);
    if (!path.resolve(projectPath).startsWith(path.resolve(ROOT_DIR))) {
        throw new Error('Access denied');
    }

    if (physical) {
        // Physical delete
        await fs.rm(projectPath, { recursive: true, force: true });
        
        // Also remove from groups
        const groups = await getProjectGroups(true);
        let changed = false;
        for (const g of groups) {
            if (g.projects.includes(id)) {
                g.projects = g.projects.filter(p => p !== id);
                changed = true;
            }
        }
        if (changed) {
            await updateGroupConfig(groups);
        }
    } else {
        // Logical delete
        const config = await getProjectConfig(id);
        config.isDeleted = true;
        await updateProjectConfig(id, config);
    }
}

export async function getProjects(includeDeleted = false): Promise<Project[]> {
  try {
    await fs.access(ROOT_DIR);
  } catch {
    await fs.mkdir(ROOT_DIR, { recursive: true });
  }

  const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true });
  const projects: Project[] = [];
  const groups = await getProjectGroups();

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const config = await getProjectConfig(entry.name);
      
      if (!includeDeleted && config.isDeleted) continue;

      const group = groups.find(g => g.projects.includes(entry.name));

      projects.push({
        id: entry.name,
        name: entry.name, // For now name is dir name
        description: config.description || '',
        mode: config.mode || 'edit',
        group: group?.name || '其他项目',
        gitConfig: config.gitConfig,
        isDeleted: config.isDeleted
      });
    }
  }

  // Sort projects: Groups order first, then others, then by name
  projects.sort((a, b) => {
    const groupIndexA = groups.findIndex(g => g.name === a.group);
    const groupIndexB = groups.findIndex(g => g.name === b.group);
    
    if (groupIndexA !== -1 && groupIndexB !== -1) {
      return groupIndexA - groupIndexB;
    }
    if (groupIndexA !== -1) return -1;
    if (groupIndexB !== -1) return 1;
    
    // If both are "Other" or unknown, sort by group name then project name
    if (a.group !== b.group) {
        return (a.group || '').localeCompare(b.group || '');
    }
    return a.name.localeCompare(b.name);
  });

  return projects;
}

export async function createProject(
    id: string, 
    description: string = '', 
    group: string = '',
    mode: 'git' | 'edit' = 'edit', 
    gitConfig?: ProjectGitConfig
): Promise<void> {
    const projectPath = path.join(ROOT_DIR, id);
    await fs.mkdir(projectPath, { recursive: true });
    
    const existingConfig = await getProjectConfig(id);
    
    const config: ProjectConfig = {
        description,
        mode,
        gitConfig,
        createdAt: new Date().toISOString(),
        files: existingConfig.files || {},
        isDeleted: false // Ensure it's active
    };
    
    await updateProjectConfig(id, config);

    if (group) {
        const groups = await getProjectGroups(true);
        const existingGroup = groups.find(g => g.name === group);
        
        if (existingGroup) {
            if (!existingGroup.projects.includes(id)) {
                existingGroup.projects.push(id);
            }
        } else {
            groups.push({ name: group, projects: [id] });
        }
        
        await updateGroupConfig(groups);
    }
}

export async function getProjectRoot(projectId: string): Promise<string> {
    const projectPath = path.join(ROOT_DIR, projectId);
    try {
        await fs.access(projectPath);
        return projectPath;
    } catch {
        throw new Error(`Project ${projectId} not found`);
    }
}

// === File Management ===

export async function getFileTree(projectId: string): Promise<TreeNode[]> {
  const projectDir = path.join(ROOT_DIR, projectId);
  const config = await getProjectConfig(projectId);
  const filesConfig = config.files || {};

  const baseDirForRelativePath = projectDir;

  const scan = async (dir: string): Promise<TreeNode[]> => {
      try {
        await fs.access(dir);
      } catch {
        return [];
      }

      const entries = await fs.readdir(dir, { withFileTypes: true });
      const nodes: TreeNode[] = [];

      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        const relativePath = '/' + path.relative(baseDirForRelativePath, fullPath);

        let fileMeta = filesConfig[relativePath] || {};
        
        if (fileMeta.isDeleted) continue;
        
        if (entry.name.endsWith('.md')) {
            try {
                const fileContent = await fs.readFile(fullPath, 'utf-8');
                const { data } = matter(fileContent);
                
                if (data.isHidden !== undefined) {
                    fileMeta = { ...fileMeta, isHidden: data.isHidden };
                }
                if (data.sortOrder !== undefined) {
                    fileMeta = { ...fileMeta, sortOrder: data.sortOrder };
                }
            } catch {
                // ignore error reading file
            }
        }

        const isVisible = fileMeta.isHidden === undefined ? true : !fileMeta.isHidden;
        
        if (entry.isDirectory()) {
          nodes.push({
            id: relativePath,
            name: entry.name,
            isDir: true,
            isVisible,
            children: await scan(fullPath),
          });
        } else {
          nodes.push({
            id: relativePath,
            name: entry.name,
            isDir: false,
            isVisible,
          });
        }
      }
      
      return nodes.sort((a, b) => {
          const metaA = filesConfig[a.id] || {};
          const metaB = filesConfig[b.id] || {};
          
          const orderA = metaA.sortOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = metaB.sortOrder ?? Number.MAX_SAFE_INTEGER;
          
          if (orderA !== orderB) {
              return orderA - orderB;
          }
          
          if (a.isDir !== b.isDir) {
              return a.isDir ? -1 : 1;
          }
          
          return a.name.localeCompare(b.name);
      });
  };

  return scan(projectDir);
}

export async function getFileContent(projectId: string, filePath: string): Promise<string> {
  const projectDir = path.join(ROOT_DIR, projectId);
  const fullPath = path.join(projectDir, filePath);
  
  if (!path.resolve(fullPath).startsWith(path.resolve(projectDir))) {
    throw new Error('Access denied');
  }
  return fs.readFile(fullPath, 'utf-8');
}

export async function saveFileContent(projectId: string, filePath: string, content: string): Promise<void> {
    const projectDir = path.join(ROOT_DIR, projectId);
    const fullPath = path.join(projectDir, filePath);
    
    if (!path.resolve(fullPath).startsWith(path.resolve(projectDir))) {
        throw new Error('Access denied');
    }
    await fs.writeFile(fullPath, content, 'utf-8');
}

export async function toggleFileVisibility(projectId: string, filePath: string, isVisible: boolean): Promise<void> {
    const config = await getProjectConfig(projectId);
    
    if (!config.files) config.files = {};
    if (!config.files[filePath]) config.files[filePath] = {};
    
    config.files[filePath].isHidden = !isVisible;
    
    await updateProjectConfig(projectId, config);
}

export async function updateFileSorting(projectId: string, filePath: string, sortOrder: number): Promise<void> {
    const config = await getProjectConfig(projectId);
    
    if (!config.files) config.files = {};
    if (!config.files[filePath]) config.files[filePath] = {};
    
    config.files[filePath].sortOrder = sortOrder;
    
    await updateProjectConfig(projectId, config);
}

export async function updateBatchSorting(projectId: string, updates: { path: string, sortOrder: number }[]): Promise<void> {
    const config = await getProjectConfig(projectId);
    
    if (!config.files) config.files = {};
    
    updates.forEach(update => {
        if (!config.files![update.path]) config.files![update.path] = {};
        config.files![update.path].sortOrder = update.sortOrder;
    });
    
    await updateProjectConfig(projectId, config);
}

export async function updateProjectDescription(projectId: string, description: string): Promise<void> {
    const config = await getProjectConfig(projectId);
    config.description = description;
    await updateProjectConfig(projectId, config);
}

export async function updateProjectGitConfig(projectId: string, gitConfig?: ProjectGitConfig): Promise<void> {
    const config = await getProjectConfig(projectId);
    config.gitConfig = gitConfig;
    await updateProjectConfig(projectId, config);
}

export async function createFile(projectId: string, filePath: string, isDir: boolean): Promise<void> {
    const projectDir = path.join(ROOT_DIR, projectId);
    const fullPath = path.join(projectDir, filePath);
    
    if (!path.resolve(fullPath).startsWith(path.resolve(projectDir))) {
        throw new Error('Access denied');
    }

    if (isDir) {
        await fs.mkdir(fullPath, { recursive: true });
    } else {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, '', 'utf-8');
    }

    const config = await getProjectConfig(projectId);
    const relativePath = filePath.startsWith('/') ? filePath : '/' + filePath;
    if (config.files && config.files[relativePath] && config.files[relativePath].isDeleted) {
        config.files[relativePath].isDeleted = false;
        await updateProjectConfig(projectId, config);
    }
}

export async function deleteFile(projectId: string, filePath: string, physical = false): Promise<void> {
    const projectDir = path.join(ROOT_DIR, projectId);
    const fullPath = path.join(projectDir, filePath);
    
    if (!path.resolve(fullPath).startsWith(path.resolve(projectDir))) {
        throw new Error('Access denied');
    }

    if (physical) {
        await fs.rm(fullPath, { recursive: true, force: true });
    } else {
        const config = await getProjectConfig(projectId);
        if (!config.files) config.files = {};
        
        const relativePath = filePath.startsWith('/') ? filePath : '/' + filePath;
        
        if (!config.files[relativePath]) config.files[relativePath] = {};
        config.files[relativePath].isDeleted = true;
        
        await updateProjectConfig(projectId, config);
    }
}

export async function getAbsoluteFilePath(projectId: string, filePath: string): Promise<string> {
    const projectDir = path.join(ROOT_DIR, projectId);
    const fullPath = path.join(projectDir, filePath);
    
    if (!path.resolve(fullPath).startsWith(path.resolve(projectDir))) {
        throw new Error('Access denied');
    }
    await fs.access(fullPath);
    return fullPath;
}

export async function renameFile(projectId: string, oldPath: string, newPath: string): Promise<void> {
    const projectDir = path.join(ROOT_DIR, projectId);
    const fullOldPath = path.join(projectDir, oldPath);
    const fullNewPath = path.join(projectDir, newPath);
    
    if (!path.resolve(fullOldPath).startsWith(path.resolve(projectDir)) || 
        !path.resolve(fullNewPath).startsWith(path.resolve(projectDir))) {
        throw new Error('Access denied');
    }

    await fs.rename(fullOldPath, fullNewPath);
}
