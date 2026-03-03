'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Markdown } from '@tiptap/markdown';
import UnderlineExtension from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FileCode, Eye, Columns, Pencil, List, Info } from 'lucide-react';
import matter from 'gray-matter';

import { ExtendedCodeBlock as Mermaid } from './extensions/mermaid';
import { CodeBlockExtension } from './extensions/code-block-lowlight';
import { Toolbar } from './editor-toolbar';
import { EditorProvider } from './editor-context';
import { TableOfContents } from './table-of-contents';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  projectId: string;
  currentFilePath?: string;
  versions?: string[];
  selectedVersion?: string;
  onVersionChange?: (version: string) => void;
  onNavigate?: (path: string) => void;
  basePath?: string;
  theme?: 'indigo' | 'emerald';
}

export function Editor({
    initialContent,
    onChange,
    readOnly = false,
    projectId,
    currentFilePath,
    versions = [],
    selectedVersion = 'latest',
    onVersionChange = () => {},
    onNavigate,
    basePath = '/preview',
    theme = 'indigo'
}: EditorProps) {
  const [mode, setMode] = useState<'edit' | 'source' | 'split' | 'preview'>('edit');
  const [showToc, setShowToc] = useState(readOnly);
  const [sourceContent, setSourceContent] = useState(initialContent);
  const frontmatterRef = useRef<string>('');
  const modeRef = useRef(mode);
  const skipUpdateRef = useRef(false);
  const isSyncingRef = useRef(false);
  const onNavigateRef = useRef(onNavigate);

  // Keep onNavigate ref updated
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  // Global click handler to prevent new tab opening for md-links
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a.md-link');

      if (link) {
        event.preventDefault();
        event.stopPropagation();

        const onNavigate = onNavigateRef.current;
        if (onNavigate) {
          const href = link.getAttribute('href');
          if (href) {
            const pathParts = href.split('/');
            if (pathParts.length > 3) {
              const filePath = pathParts.slice(3).join('/');
              onNavigate(filePath);
            }
          }
        }
        return false;
      }
    };

    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  // Sync mode to ref
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Force preview mode if readOnly
  useEffect(() => {
    if (readOnly) {
        setMode('preview');
        setShowToc(true);
    }
  }, [readOnly]);

  const parseFrontmatter = (content: string) => {
      // Strip BOM if present
      const cleanContent = content.replace(/^\uFEFF/, '').trimStart();
      
      // Strategy: Always try to manually separate frontmatter first based on delimiters.
      // This ensures that even if YAML is invalid (e.g. "key: val :"), we still strip the header from the body.
      
      const startMatch = cleanContent.match(/^---\s*[\r\n]+/);
      if (startMatch) {
          const startIndex = startMatch[0].length;
          // Find closing delimiter: newline + "---" + (newline or end of string)
          const endRegex = /[\r\n]+---\s*(?:[\r\n]+|$)/g;
          endRegex.lastIndex = startIndex;
          const endMatch = endRegex.exec(cleanContent);
          
          if (endMatch) {
              const frontmatterInner = cleanContent.substring(startIndex, endMatch.index);
              // Include the closing delimiter in raw
              const frontmatterRaw = cleanContent.substring(0, endMatch.index + endMatch[0].length);
              const bodyStartIndex = endMatch.index + endMatch[0].length;
              const body = cleanContent.substring(bodyStartIndex);
              
              // Now try to parse the data
              try {
                  // Reconstruct a clean block to let gray-matter parse the YAML
                  const parsed = matter(`---\n${frontmatterInner}\n---\n`);
                  return { data: parsed.data, content: body, frontmatterRaw };
              } catch (e) {
                  // YAML parsing failed, but separation succeeded.
                  // Return empty data so properties panel is hidden, but Body is clean.
                  // CRITICAL: Return the raw frontmatter so we don't lose it!
                  return { data: {}, content: body, frontmatterRaw };
              }
          }
      }

      // If manual separation failed (e.g. incomplete header), fallback to gray-matter
      try {
          const parsed = matter(cleanContent);
          // If gray-matter found something
          if (Object.keys(parsed.data).length > 0) {
              // We need to be careful here. matter() removes the frontmatter from content.
              // But we need the raw frontmatter string including delimiters.
              // Since we don't know exactly how gray-matter parsed it (it handles various delimiters),
              // we can reconstruct it, OR try to extract it from original content.
              // The safest bet for consistency is to trust manual separation primarily.
              // If manual failed but matter succeeded (unlikely for standard ---), 
              // we might be in a weird edge case.
              // Let's just reconstruct it for safety if we fallback here.
              const frontmatterRaw = cleanContent.substring(0, cleanContent.length - parsed.content.length);
              return { data: parsed.data, content: parsed.content, frontmatterRaw };
          }
          return { data: {}, content: cleanContent, frontmatterRaw: '' };
      } catch (e) {
          return { data: {}, content: cleanContent, frontmatterRaw: '' }; 
      }
  };

  // Parse initial content to separate frontmatter
  let initialBodyContent = initialContent;
  
  // Clean up potentially corrupted image syntax from previous saves
  // Replaces !\[alt\](src) with ![alt](src)
  initialBodyContent = initialBodyContent.replace(/!\\\[(.*?)\\\]\(/g, '![$1](');
  
  try {
     const { content, frontmatterRaw } = parseFrontmatter(initialBodyContent);
     initialBodyContent = content;
     // Pre-populate ref to avoid race condition on first render/update
     if (frontmatterRaw) {
         frontmatterRef.current = frontmatterRaw.trim();
     }
  } catch (e) {
     // ignore
  }

  // Store frontmatter string (reconstruct it)
  // We use gray-matter to stringify it back to get the raw string if needed, 
  // but better to extract the raw string from initialContent if possible to preserve formatting.
  // For simplicity, we'll reconstruct it using matter.stringify if we need to save.
  // Actually, let's try to just keep the raw frontmatter string if we can.
  // matter(initialContent) returns an object.
  // Let's use a simpler approach: splitting the string manually if we want exact preservation, 
  // or just rely on gray-matter to reconstruct.
  
  // Let's use state for the body content passed to Tiptap
  // BUT: initialContent is only used ONCE on mount.
  // We need to handle updates.

  // Stable effect to patch serializer whenever editor instance changes
  // Removed patchSerializer as we are using official @tiptap/markdown which should handle this better,
  // or we should configure it via extension configuration if needed.
  
  const editor = useEditor({
    immediatelyRender: false,
    content: initialBodyContent, // Initialize with ONLY body
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
      handleDOMEvents: {
        click: (view, event) => {
          const onNavigate = onNavigateRef.current;
          if (!onNavigate) return false;

          const target = event.target as HTMLElement;
          const link = target.closest('a.md-link');

          if (link) {
            event.preventDefault();
            event.stopPropagation();

            const href = link.getAttribute('href');
            if (href) {
              const pathParts = href.split('/');
              if (pathParts.length > 3) {
                const filePath = pathParts.slice(3).join('/');
                onNavigate(filePath);
                return true;
              }
            }
          }
          return false;
        },
      },
    },
    extensions: [
      Mermaid,
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockExtension,
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      LinkExtension.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            href: {
              default: null,
              parseHTML: (element: any) => element.getAttribute('href'),
              renderHTML: (attributes: any) => {
                if (!attributes.href) return {};

                let href = attributes.href;

                // Only process relative paths (not starting with http, /, mailto, etc.)
                if (currentFilePath &&
                    !href.startsWith('http') &&
                    !href.startsWith('/') &&
                    !href.startsWith('mailto:') &&
                    !href.startsWith('#')) {

                  // Resolve relative path based on current file location
                  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));

                  // Handle .. and . in path
                  const parts = (currentDir + '/' + href).split('/');
                  const stack: string[] = [];
                  for (const part of parts) {
                    if (part === '' || part === '.') continue;
                    if (part === '..') {
                      if (stack.length > 0) stack.pop();
                    } else {
                      stack.push(part);
                    }
                  }
                  const resolvedPath = stack.join('/');

                  // Generate the correct URL for internal links
                  // The URL format is: {basePath}/{projectId}/{resolvedPath}
                  // basePath is '/preview' for readOnly mode, '/project' for edit mode
                  href = `${basePath}/${projectId}/${resolvedPath}`;
                }

                return { href, target: '' };
              },
            },
          };
        },
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              // Override Enter to not trigger link click
              return false;
            },
          };
        },
      }).configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'md-link',
          target: '',
        },
      }),
      ImageExtension.extend({
          addAttributes() {
            return {
              ...this.parent?.(),
              src: {
                default: null,
                parseHTML: element => element.getAttribute('src'),
                renderHTML: attributes => {
                    let src = attributes.src;
                    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
                         // Rewrite relative paths to use our API asset route
                         // Need to handle relative paths based on current file location
                         // e.g. currentFilePath = '/strategy/intro.md', src = '../images/pic.png'
                         // resolved = '/images/pic.png'
                         
                         let finalPath = src;
                         if (currentFilePath) {
                            // Simple path resolution
                            // Note: currentFilePath starts with / (e.g. /strategy/intro.md)
                            const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
                            
                            // Handle .. and . in path
                            const parts = (currentDir + '/' + src).split('/');
                            const stack = [];
                            for (const part of parts) {
                                if (part === '' || part === '.') continue;
                                if (part === '..') {
                                    if (stack.length > 0) stack.pop();
                                } else {
                                    stack.push(part);
                                }
                            }
                            finalPath = stack.join('/');
                         }
                         
                         src = `/api/projects/${projectId}/assets/${finalPath}`;
                         if (selectedVersion !== 'latest') {
                            src += `?version=${selectedVersion}`;
                         }
                    }
                    return {
                        src,
                    }
                }
              }
            }
          }
      }),
      Markdown.configure({
          html: true,
          transformPastedText: true,
          transformCopiedText: true,
      } as any),
    ],

    onUpdate: ({ editor }) => {
      // Only sync back to source in 'edit' mode.
      // In 'split' mode, the right side is a read-only preview, so we don't sync back.
      // In 'source' mode, this shouldn't fire, but if it does, ignore it.
      if (modeRef.current !== 'edit') return;

      const markdown = (editor as any).getMarkdown ? (editor as any).getMarkdown() : '';
      
      // Combine with current frontmatter for source view and save
      const currentFrontmatter = frontmatterRef.current;
      const fullContent = currentFrontmatter ? `${currentFrontmatter}\n${markdown}` : markdown;
      
      skipUpdateRef.current = true;
      setSourceContent(fullContent);
      onChange(fullContent);
    },
  });

  // Effect to parse initial content on load
    useEffect(() => {
      try {
          const { content, data } = parseFrontmatter(initialContent);
          // Reconstruct frontmatter string if it exists
        if (Object.keys(data).length > 0) {
             const fullWithMatter = matter.stringify('', data);
             // matter.stringify adds a newline after ---, we just want the block
             frontmatterRef.current = fullWithMatter.trim();
        } else {
             frontmatterRef.current = '';
        }
        
        // If editor is ready, set content
    if (editor && !editor.isDestroyed) {
         // Only set if different to avoid reset loop
         // This is tricky because initialContent changes on file switch
         // We need to detect file switch in parent or here
    }
} catch (e) {
    console.error("Frontmatter parse error", e);
    frontmatterRef.current = '';
}
}, [initialContent]); // This might be too aggressive if typing

// Better approach: Handle content separation in render or state init.
// The Editor component is re-mounted when file changes (key={currentFile} in page.tsx).
// So we can rely on initialContent being fresh for a new file.

const [frontmatterData, setFrontmatterData] = useState<Record<string, any>>({});

// Initialization logic (runs once per file due to key prop)
useState(() => {
  try {
    const { content, data, frontmatterRaw } = parseFrontmatter(initialContent);
    setFrontmatterData(data);
    // Use the raw frontmatter we extracted, ensuring we preserve formatting/comments/errors
    if (frontmatterRaw) {
        frontmatterRef.current = frontmatterRaw.trim();
    } else {
         frontmatterRef.current = '';
    }
    
    // CRITICAL: Initialize Tiptap content correctly
    // We MUST update the initialBodyContent variable used in useEditor
    // But useEditor is called before this effect/state init.
    // This is why we had the let initialBodyContent block above.
    // We need to ensure that block uses the SAME parsing logic.
  } catch (e) {
    // ignore
  }
});

  const updateFrontmatter = (newData: Record<string, any>) => {
    setFrontmatterData(newData);
    
    // Re-generate YAML block
    try {
      const newYamlBlock = matter.stringify('', newData).trim();
      frontmatterRef.current = newYamlBlock;
      
      // Get current markdown body from editor
      const markdown = (editor?.storage as any).markdown.getMarkdown();
      const fullContent = `${newYamlBlock}\n${markdown}`;
      
      setSourceContent(fullContent);
      onChange(fullContent);
    } catch (e) {
      console.error("Failed to update frontmatter", e);
    }
  };

  const handleFrontmatterUpdate = (key: string, value: string) => {
      const newData = { ...frontmatterData, [key]: value };
      updateFrontmatter(newData);
  };

  const handleFrontmatterRename = (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;
      if (!newKey.trim()) return; // Don't allow empty keys
      
      const entries = Object.entries(frontmatterData);
      const newEntries = entries.map(([k, v]) => {
          if (k === oldKey) return [newKey, v];
          return [k, v];
      });
      
      const newData = Object.fromEntries(newEntries);
      updateFrontmatter(newData);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFullContent = e.target.value;
    setSourceContent(newFullContent);
    onChange(newFullContent);
    
    // Parse frontmatter from new source to update our ref
    try {
        const { data, content, frontmatterRaw } = parseFrontmatter(newFullContent);
        setFrontmatterData(data);
        
        // Always update ref with the raw extracted block, valid or not
        if (frontmatterRaw) {
            frontmatterRef.current = frontmatterRaw.trim();
        } else {
            frontmatterRef.current = '';
        }
    } catch (e) {
        // parsing error
    }
  };

  // Separate effect for managing editable state
  useEffect(() => {
    if (!editor) return;
    
    // In Split mode, the Tiptap editor (right side) acts as a preview, so it must be read-only.
    // It is only editable in 'edit' mode.
    // And of course, if the global readOnly prop is true, it's always read-only.
    const shouldBeEditable = !readOnly && mode === 'edit';
    
    if (editor.isEditable !== shouldBeEditable) {
        // Wrap in setTimeout to avoid flushSync error during render cycle
        setTimeout(() => {
            if (editor && !editor.isDestroyed) {
                editor.setEditable(shouldBeEditable);
            }
        }, 0);
    }
  }, [editor, mode, readOnly]);

  // When switching to Edit, update editor content from source
  useEffect(() => {
    if (editor) {
        if (mode !== 'source') {
             // If we just updated via onUpdate, skip syncing back
             if (skipUpdateRef.current) {
                 skipUpdateRef.current = false;
             } else {
                 // Parse current source content
                let bodyToSync = sourceContent;
                try {
                    const { content } = parseFrontmatter(sourceContent);
                    bodyToSync = content;
                } catch (e) {
                    // fallback
                }
                
                // Use getMarkdown() from editor instance (official extension)
                const currentMarkdown = (editor as any).getMarkdown ? (editor as any).getMarkdown() : '';
                
                if (currentMarkdown !== bodyToSync) {
                    // Only update if content is different to avoid cursor jumps/re-renders
                    // And potentially use a more stable update method if needed
                    // For now, setContent is okay if guarded
                    
                    // Fix flushSync error
                        setTimeout(() => {
                            if (editor && !editor.isDestroyed) {
                                editor.commands.setContent(bodyToSync, { contentType: 'markdown' } as any);
                            }
                        }, 0);
                }
             }
        }
    }
  }, [mode, editor, sourceContent]);

  if (!editor) {
    return null;
  }

  return (
    <EditorProvider value={{ isEditable: mode === 'edit' || mode === 'split' }}>
      <div className="flex-1 flex flex-col overflow-hidden bg-background">


      {/* Editor Toolbar */}
      <div className="relative flex items-center justify-center p-2 border-b bg-muted/40 bg-gray-50 h-[53px]">
        {!readOnly && (
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-md">
            <button
              onClick={() => setMode('edit')}
              className={cn("p-1.5 rounded text-sm flex items-center gap-1", mode === 'edit' ? "bg-white shadow text-black" : "text-gray-600 hover:bg-white/50")}
              title="Edit"
            >
              <Pencil size={16} />
              <span className="text-xs">Edit</span>
            </button>
            <button
              onClick={() => setMode('source')}
              className={cn("p-1.5 rounded text-sm flex items-center gap-1", mode === 'source' ? "bg-white shadow text-black" : "text-gray-600 hover:bg-white/50")}
              title="Source"
            >
              <FileCode size={16} />
              <span className="text-xs">Source</span>
            </button>
            <button
              onClick={() => setMode('split')}
              className={cn("p-1.5 rounded text-sm flex items-center gap-1", mode === 'split' ? "bg-white shadow text-black" : "text-gray-600 hover:bg-white/50")}
              title="Split"
            >
              <Columns size={16} />
              <span className="text-xs">Split</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={cn("p-1.5 rounded text-sm flex items-center gap-1", mode === 'preview' ? "bg-white shadow text-black" : "text-gray-600 hover:bg-white/50")}
              title="Preview"
            >
              <Eye size={16} />
              <span className="text-xs">Preview</span>
            </button>
          </div>
        )}
        
        <div className="absolute right-4 flex items-center gap-2">
            {versions.length > 0 && (
                <Select onValueChange={onVersionChange} value={selectedVersion}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        {versions.map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            <button
                onClick={() => setShowToc(!showToc)}
                className={cn(
                    "p-1.5 rounded text-sm flex items-center gap-1 transition-colors text-gray-500",
                    showToc 
                        ? (theme === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600')
                        : (theme === 'emerald' ? 'hover:bg-emerald-50 hover:text-emerald-900' : 'hover:bg-indigo-50 hover:text-indigo-900')
                )}
                title="Toggle Table of Contents"
            >
                <List size={18} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Source View */}
        {(mode === 'source' || mode === 'split') && (
            <textarea
                className={cn("flex-1 resize-none p-4 font-mono text-sm focus:outline-none bg-slate-50 text-slate-800", mode === 'split' ? "border-r" : "")}
                value={sourceContent}
                onChange={handleSourceChange}
                placeholder="# Type markdown here..."
            />
        )}

        {/* WYSIWYG / Preview View */}
        {(mode === 'edit' || mode === 'split' || mode === 'preview') && (
            <>
                <div className="flex-1 overflow-y-auto bg-white">
                    {/* Hide toolbar in preview AND split mode (since split is read-only preview) */}
                    {mode === 'edit' && <Toolbar editor={editor} />}
                    <EditorContent editor={editor} />
                </div>
                
                {/* Table of Contents */}
                {showToc && (mode === 'edit' || mode === 'preview' || mode === 'split') && (
                    <TableOfContents editor={editor} theme={theme} />
                )}
            </>
        )}
      </div>
      </div>
    </EditorProvider>
  );
}
