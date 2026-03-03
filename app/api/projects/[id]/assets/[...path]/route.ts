import { NextRequest, NextResponse } from 'next/server';
import { getAbsoluteFilePath } from '@/lib/fs-service';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id: projectId, path: pathSegments } = await params;
  
  if (!projectId || !pathSegments || pathSegments.length === 0) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  // Join segments to get the file path relative to project root
  // e.g. /api/projects/p1/assets/images/pic.png -> path=['images', 'pic.png'] -> filePath='images/pic.png'
  const filePath = pathSegments.join('/');

  try {
    const absolutePath = await getAbsoluteFilePath(projectId, filePath);
    const fileBuffer = await fs.readFile(absolutePath);
    
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf'
    };
    
    if (mimeTypes[ext]) {
        contentType = mimeTypes[ext];
    }

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600'
        }
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
