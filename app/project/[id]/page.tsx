'use client';
import { useState, use, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Editor } from '@/components/editor';
import { HomePage } from '@/components/home-page';
import { StarredPage } from '@/components/starred-page';
import { SearchPalette } from '@/components/search-palette';
import { TrashPage } from '@/components/trash-page';
import { ImagePreviewDialog } from '@/components/image-preview-dialog';
import { useUserConfig } from '@/hooks/use-user-config';
import { useI18n } from '@/components/i18n-provider';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useI18n();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const [readOnly, setReadOnly] = useState(false);
  const [projectVersion, setProjectVersion] = useState(0);
  const { addRecent } = useUserConfig(projectId);

  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('latest');

  const handleProjectUpdate = () => {
    setProjectVersion(v => v + 1);
  };

  // Fetch project mode and available versions
  useEffect(() => {
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(data => {
            setReadOnly(data.mode === 'git');
            if (data.mode === 'git') {
                fetch(`/api/projects/${projectId}/versions`)
                    .then(res => res.json())
                    .then(versionData => {
                        if (versionData.versions) {
                            setVersions(versionData.versions);
                        }
                    });
            }
        });
  }, [projectId]);
  
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'starred' | 'trash'>('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ src: string; title?: string } | null>(null);

  const handleSelect = async (path: string) => {
    if (!path) {
      setCurrentFile(null);
      setActiveView('home');
      setContent('');
      setLoading(false);
      return;
    }
    const isImage = /\.(gif|jpe?g|png|svg|webp)$/i.test(path);
    const isMarkdown = /\.md$/i.test(path);

    if (isImage) {
        let imageUrl = `/api/projects/${projectId}/assets/${path}`;
        if (selectedVersion !== 'latest') {
            imageUrl += `?version=${selectedVersion}`;
        }
        setImagePreview({ src: imageUrl, title: path.split('/').pop() });
        return;
    }

    if (!isMarkdown) {
        // Maybe show a message that this file type cannot be opened
        return;
    }

    setLoading(true);
    setCurrentFile(path);
    
    addRecent(path);

    try {
        let url = `/api/files/content?projectId=${projectId}&path=${encodeURIComponent(path)}`;
        if (selectedVersion !== 'latest') {
            url += `&version=${selectedVersion}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setContent(data.content || '');
    } catch (e) {
        console.error(e);
        setContent('Error loading file.');
    } finally {
        setLoading(false);
    }
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
    // Reset view when version changes to avoid showing content from a different version
    setCurrentFile(null);
    setActiveView('home');
  };

  const handleHomeClick = () => {
    setCurrentFile(null);
    setActiveView('home');
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleStarredClick = () => {
    setCurrentFile(null);
    setActiveView('starred');
  };

  const handleTrashClick = () => {
    setCurrentFile(null);
    setActiveView('trash');
  };

  const handleSave = async (newContent: string) => {
    if (!currentFile) return;
    
    await fetch('/api/files/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          projectId,
          path: currentFile, 
          content: newContent 
      }),
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        projectId={projectId}
        onSelect={handleSelect}
        onHomeClick={handleHomeClick}
        onSearchClick={handleSearchClick}
        onStarredClick={handleStarredClick}
        onTrashClick={handleTrashClick}
        readOnly={readOnly}
        defaultNav="home"
        onProjectUpdate={handleProjectUpdate}
        refreshToken={projectVersion}
        backHref="/admin"
        selectedVersion={selectedVersion}
        currentFile={currentFile}
      />
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        {currentFile ? (
            loading ? (
                <div className="flex items-center justify-center h-full">{t('home.loading')}</div>
            ) : (
                <Editor
                    key={currentFile}
                    initialContent={content}
                    onChange={handleSave}
                    readOnly={readOnly}
                    projectId={projectId}
                    currentFilePath={currentFile || undefined}
                    onFileSystemChange={handleProjectUpdate}
                    versions={versions}
                    selectedVersion={selectedVersion}
                    onVersionChange={handleVersionChange}
                    onNavigate={handleSelect}
                    basePath="/project"
                    theme="indigo"
                />
            )
        ) : (
            activeView === 'home' ? (
                <HomePage 
                    projectId={projectId} 
                    onNavigate={handleSelect} 
                    onSearch={() => setIsSearchOpen(true)}
                    readOnly={readOnly} 
                    versions={versions}
                    selectedVersion={selectedVersion}
                    onVersionChange={handleVersionChange}
                />
            ) : activeView === 'starred' ? (
                <StarredPage 
                    projectId={projectId} 
                    onNavigate={handleSelect}
                />
            ) : (
                <TrashPage projectId={projectId} refreshToken={projectVersion} onChanged={handleProjectUpdate} />
            )
        )}
      </main>
      <SearchPalette 
        projectId={projectId} 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onSelect={handleSelect} 
      />
      {imagePreview && (
        <ImagePreviewDialog
          open={Boolean(imagePreview)}
          onOpenChange={(open) => !open && setImagePreview(null)}
          src={imagePreview.src}
          title={imagePreview.title}
        />
      )}
    </div>
  );
}
