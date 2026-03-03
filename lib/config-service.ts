import fs from 'fs/promises';
import path from 'path';
import { getCurrentUser } from './identity-service';

interface UserConfig {
  starred: string[];
  recent: string[];
}

const USERS_DIR = '.thinktank/users';

// Helper to get absolute path to user config file
const getUserConfigPath = async (projectPath: string, userId?: string) => {
  const finalUserId = userId || await getCurrentUser();
  return path.join(projectPath, USERS_DIR, `${finalUserId}.json`);
};

export async function getUserConfig(projectPath: string, userId?: string): Promise<UserConfig> {
  try {
    const configPath = await getUserConfigPath(projectPath, userId);
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return default
    return { starred: [], recent: [] };
  }
}

export async function saveUserConfig(projectPath: string, config: UserConfig, userId?: string): Promise<void> {
  try {
    const configPath = await getUserConfigPath(projectPath, userId);
    const dirPath = path.dirname(configPath);
    
    // Ensure .thinktank/users directory exists
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save user config:', error);
    throw error;
  }
}

export async function toggleStar(projectPath: string, filePath: string, userId?: string): Promise<boolean> {
  const config = await getUserConfig(projectPath, userId);
  const isStarred = config.starred.includes(filePath);
  
  if (isStarred) {
    config.starred = config.starred.filter(p => p !== filePath);
  } else {
    config.starred.push(filePath);
  }
  
  await saveUserConfig(projectPath, config, userId);
  return !isStarred;
}

export async function addRecent(projectPath: string, filePath: string, userId?: string): Promise<void> {
  const config = await getUserConfig(projectPath, userId);
  // Remove if exists to move to top
  config.recent = config.recent.filter(p => p !== filePath);
  // Add to beginning
  config.recent.unshift(filePath);
  // Limit to 20
  if (config.recent.length > 20) {
    config.recent = config.recent.slice(0, 20);
  }
  
  await saveUserConfig(projectPath, config, userId);
}
