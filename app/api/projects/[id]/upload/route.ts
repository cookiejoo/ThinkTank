import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getProjectRoot } from '@/lib/fs-service';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const projectId = decodeURIComponent(resolvedParams.id);
  
  if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  // NOTE: You might want to enable this for production depending on your auth needs
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetDir = formData.get('targetDir') as string || 'images';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to avoid collisions
    const ext = path.extname(file.name);
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    // Sanitize filename to replace spaces and special characters with hyphens
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-');
    const filename = `${safeBaseName}-${hash}${ext}`;

    // Ensure the target directory exists within the project
    const projectRoot = await getProjectRoot(projectId);
    const absoluteTargetDir = path.join(projectRoot, targetDir);
    
    // Prevent directory traversal attacks
    if (!absoluteTargetDir.startsWith(projectRoot)) {
        return NextResponse.json({ error: 'Invalid target directory' }, { status: 400 });
    }

    await fs.mkdir(absoluteTargetDir, { recursive: true });

    // Save the file
    const absoluteFilePath = path.join(absoluteTargetDir, filename);
    await fs.writeFile(absoluteFilePath, buffer);

    // Return the relative path from project root (e.g. "images/my-pic-123.png")
    const relativeFilePath = path.relative(projectRoot, absoluteFilePath);

    return NextResponse.json({ 
        success: true, 
        filePath: relativeFilePath 
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
