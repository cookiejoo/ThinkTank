import fs from 'fs/promises';
import path from 'path';

const ROOT_DIR = process.env.DOCS_ROOT ? path.resolve(process.env.DOCS_ROOT) : path.join(process.cwd(), 'docs');
const USERS_FILE = path.join(ROOT_DIR, '.thinktank', 'users.json');

export interface User {
  id: string;
  username: string;
  passwordHash: string; 
  role: 'admin' | 'user';
  accessibleProjects: string[]; // Project IDs
}

const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    passwordHash: '$2b$10$7wfcX9s66eKAV.d5jFh5/OOZZ/yVRWPM8o/PeTO3omFvDxJoz0Bxa', // Simple password
    role: 'admin',
    accessibleProjects: [] // Admin can access all, this might be ignored or used as explicit overrides
  }
];

export async function getUsers(): Promise<User[]> {
  try {
    await fs.access(USERS_FILE);
    const content = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    // If file doesn't exist, create it with default users
    await saveUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  }
}

export async function saveUsers(users: User[]): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(USERS_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function getUser(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.username === username);
}

export async function addUser(user: Omit<User, 'id'>): Promise<void> {
    const users = await getUsers();
    if (users.find(u => u.username === user.username)) {
        throw new Error('User already exists');
    }
    const newUser = { ...user, id: Date.now().toString() };
    users.push(newUser);
    await saveUsers(users);
}

export async function updateUser(user: User): Promise<void> {
    const users = await getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index === -1) {
        throw new Error('User not found');
    }
    users[index] = user;
    await saveUsers(users);
}
