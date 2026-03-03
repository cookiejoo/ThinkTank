import { exec } from 'child_process';
import util from 'util';
import os from 'os';

const execAsync = util.promisify(exec);

export async function getCurrentUser(): Promise<string> {
  try {
    // Try to get git user email
    const { stdout } = await execAsync('git config user.email');
    const email = stdout.trim();
    if (email) {
      // Return safe filename from email (e.g., "bob@example.com" -> "bob_example_com")
      return email.replace(/[^a-zA-Z0-9]/g, '_');
    }
  } catch (e) {
    // Git not configured or failed
  }

  try {
      // Fallback to git user name
    const { stdout } = await execAsync('git config user.name');
    const name = stdout.trim();
    if (name) {
      return name.replace(/[^a-zA-Z0-9]/g, '_');
    }
  } catch (e) {}

  // Fallback to OS username
  const username = os.userInfo().username;
  return username.replace(/[^a-zA-Z0-9]/g, '_');
}
