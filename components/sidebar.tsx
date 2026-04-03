'use client';
import { Tree, TreeApi } from 'react-arborist';
import { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Home, 
  Star,
  Settings,
  MoreHorizontal,
  Plus,
  FilePlus,
  FolderPlus,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Check,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useUserConfig } from '@/hooks/use-user-config';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/components/i18n-provider';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isDir?: boolean;
  isVisible?: boolean;
  isStarred?: boolean;
}

interface SidebarProps {
  projectId: string;
  onSelect: (path: string) => void;
  onHomeClick?: () => void;
  onSearchClick?: () => void;
  onStarredClick?: () => void;
  onTrashClick?: () => void;
  readOnly?: boolean;
  defaultNav?: 'home' | 'search' | 'starred' | 'trash';
  onProjectUpdate?: () => void;
  refreshToken?: number;
  backHref?: string;
  theme?: 'indigo' | 'emerald';
  selectedVersion?: string;
  currentFile?: string | null;
}

export function Sidebar({
    projectId,
    onSelect,
    onHomeClick,
    onSearchClick,
    onStarredClick,
    onTrashClick,
    readOnly = false,
    defaultNav,
    onProjectUpdate,
    refreshToken,
    backHref = "/view",
    theme = 'indigo',
    selectedVersion = 'latest',
    currentFile
}: SidebarProps) {
  const { t } = useI18n();
  const [data, setData] = useState<TreeNode[]>([]);
  
  const themeColors = {
    indigo: {
      activeBg: "bg-indigo-100",
      activeText: "text-indigo-700",
      hoverBg: "hover:bg-indigo-100",
      hoverText: "hover:text-indigo-700",
      iconActive: "text-indigo-700",
      avatarBg: "bg-indigo-100",
      avatarText: "text-indigo-600",
      headerBadge: "bg-indigo-600"
    },
    emerald: {
      activeBg: "bg-emerald-100",
      activeText: "text-emerald-700",
      hoverBg: "hover:bg-emerald-100",
      hoverText: "hover:text-emerald-700",
      iconActive: "text-emerald-700",
      avatarBg: "bg-emerald-100",
      avatarText: "text-emerald-600",
      headerBadge: "bg-emerald-600"
    }
  };

  const currentTheme = themeColors[theme];
  const [activeId, setActiveId] = useState<string | null>(null);
  const treeApiRef = useRef<TreeApi<TreeNode>>(null);
  const [treeLoaded, setTreeLoaded] = useState(false);
  const contextMenuActiveElRef = useRef<HTMLDivElement | null>(null);

  const clearContextMenuHighlight = () => {
    if (!contextMenuActiveElRef.current) return;
    contextMenuActiveElRef.current.classList.remove(
      'ring-2',
      'ring-offset-1',
      'ring-offset-white',
      'ring-indigo-400',
      'ring-emerald-400'
    );
    contextMenuActiveElRef.current = null;
  };

  const applyContextMenuHighlight = (el: HTMLDivElement | null) => {
    if (!el) return;
    if (contextMenuActiveElRef.current && contextMenuActiveElRef.current !== el) {
      clearContextMenuHighlight();
    }
    const ringColor = theme === 'emerald' ? 'ring-emerald-400' : 'ring-indigo-400';
    el.classList.add('ring-2', 'ring-offset-1', 'ring-offset-white', ringColor);
    contextMenuActiveElRef.current = el;
  };

  // Sync external currentFile to internal activeId and expand parent directories
  useEffect(() => {
    if (!currentFile) return;

    // Tree node IDs start with /, e.g. /getting-started/overview.md
    const normalizedId = currentFile.startsWith('/') ? currentFile : `/${currentFile}`;
    setActiveId(normalizedId);

    // Function to expand parent directories and select the node
    const expandAndSelect = () => {
      if (!treeApiRef.current) return;

      // First expand parent directories
      const parts = currentFile.split('/');
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        // Tree node IDs start with /, e.g. /getting-started
        path = path ? `${path}/${parts[i]}` : `/${parts[i]}`;
        try {
          treeApiRef.current.open(path);
        } catch (e) {
          // Node might not exist yet
        }
      }

      // Then select the node
      try {
        treeApiRef.current.select(normalizedId);
      } catch (e) {
        // Node might not exist yet
      }
    };

    // Use setTimeout to ensure tree is fully rendered
    if (treeLoaded && treeApiRef.current) {
      setTimeout(expandAndSelect, 100);
    }
  }, [currentFile, treeLoaded]);

  // Listen for tree data changes to set treeLoaded
  useEffect(() => {
    if (data.length > 0) {
      setTreeLoaded(true);
    }
  }, [data]);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const { toggleStar, isStarred, loaded: configLoaded } = useUserConfig(projectId);
  const { data: session } = useSession();

  const filterHiddenNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
          .filter(node => {
              // Always show all files and folders, visibility is now handled by a separate mechanism if needed
              return true;
          })
          .map(node => ({
              ...node,
              isStarred: isStarred(node.id),
              children: node.children ? filterHiddenNodes(node.children) : undefined
          }));
  };

  const displayData = configLoaded ? filterHiddenNodes(data) : [];
  const [activeNav, setActiveNav] = useState<'home' | 'search' | 'starred' | 'trash' | 'settings' | null>(defaultNav || null);
  const [treeDims, setTreeDims] = useState({ width: 230, height: 500 });
  const treeContainerRef = useRef<HTMLDivElement>(null);
  
  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createInput, setCreateInput] = useState('');
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [targetNode, setTargetNode] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'trash' | 'permanent'>('trash');

  useEffect(() => {
    if (defaultNav) {
      setActiveNav(defaultNav);
    }
  }, [defaultNav]);

  useEffect(() => {
    if (!treeContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setTreeDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(treeContainerRef.current);
    return () => observer.disconnect();
  }, []);
  
  const reloadTree = async () => {
    let url = `/api/files/tree?projectId=${projectId}`;
    if (selectedVersion !== 'latest') {
        url += `&version=${selectedVersion}`;
    }
    console.log("Fetching tree from URL:", url); // <-- DEBUG LOG
    try {
        const res = await fetch(url);
        const treeData = await res.json();
        console.log("Received tree data:", JSON.stringify(treeData, null, 2)); // <-- DEBUG LOG
        setData(treeData);
    } catch (err) {
        console.error("Failed to load tree:", err);
    }
  };

  useEffect(() => {
    reloadTree();
  }, [projectId, selectedVersion, refreshToken]);

  const handleSelect = (nodeId: string) => {
    setActiveId(nodeId);
    setActiveNav(null);
    onSelect(nodeId);
  };

  const handleNavClick = (nav: 'home' | 'search' | 'starred' | 'trash' | 'settings') => {
    if (nav !== 'search') {
      setActiveNav(nav);
      setActiveId(null);
    }
    
    if (nav === 'home' && onHomeClick) {
        onHomeClick();
    }
    if (nav === 'search' && onSearchClick) {
        onSearchClick();
    }
    if (nav === 'starred' && onStarredClick) {
        onStarredClick();
    }
    if (nav === 'trash' && onTrashClick) {
        onTrashClick();
    }
    if (nav === 'settings') {
        window.location.href = `/project/${projectId}/settings`;
    }
  };

  const handleToggleStar = async (node: any) => {
      toggleStar(node.id);
  };

  const handleToggleVisibility = async (node: any) => {
      const newVisibility = node.data.isVisible === false ? true : false;
      
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
              if (n.id === node.id) {
                  return { ...n, isVisible: newVisibility };
              }
              if (n.children) {
                  return { ...n, children: updateNode(n.children) };
              }
              return n;
          });
      };
      setData(updateNode(data));

      try {
          await fetch('/api/files/visibility', {
              method: 'POST',
              body: JSON.stringify({
                  projectId,
                  path: node.id,
                  isHidden: newVisibility
              })
          });
      } catch (e) {
          console.error("Failed to toggle visibility", e);
          reloadTree(); // Revert on failure
      }
  };

  const handleRename = async (node: any) => {
      setTargetNode(node);
      setRenameInput(node.data.name);
      setRenameDialogOpen(true);
  };

  const submitRename = async () => {
      if (!targetNode || !renameInput.trim() || renameInput.trim() === targetNode.data.name) {
          setRenameDialogOpen(false);
          return;
      }

      try {
          await fetch('/api/files/rename', {
              method: 'POST',
              body: JSON.stringify({
                  projectId,
                  oldPath: targetNode.id,
                  newName: renameInput.trim()
              })
          });
          reloadTree();
          setRenameDialogOpen(false);
      } catch (e) {
          console.error("Failed to rename", e);
      }
  };

  const onMove = async ({ dragIds, parentId, index }: any) => {
      const movedNodeId = dragIds[0];
      const newData = [...data];
      let movedNode: any = null;

      const removeNode = (nodes: any[]) => {
          for (let i = nodes.length - 1; i >= 0; i--) {
              if (nodes[i].id === movedNodeId) {
                  movedNode = nodes.splice(i, 1)[0];
                  return;
              }
              if (nodes[i].children) {
                  removeNode(nodes[i].children);
              }
          }
      };

      removeNode(newData);
      
      if (!movedNode) return;
      
      let siblings: any[] = [];
      if (parentId === null) {
          siblings = newData;
      } else {
          const findParent = (nodes: any[]): any => {
              for (const node of nodes) {
                  if (node.id === parentId) return node;
                  if (node.children) {
                      const found = findParent(node.children);
                      if (found) return found;
                  }
              }
              return null;
          };
          const parent = findParent(newData);
          if (parent) {
              if (!parent.children) parent.children = [];
              siblings = parent.children;
          }
      }
      
      siblings.splice(index, 0, movedNode);
      setData(newData);
      
      const updates = siblings.map((node: any, idx: number) => ({
          path: node.id,
          sortOrder: idx
      }));
      
      try {
          await fetch('/api/files/sort', {
              method: 'POST',
              body: JSON.stringify({
                  projectId,
                  updates
              })
          });
      } catch (e) {
          console.error("Failed to sort", e);
          reloadTree();
      }
  };

  const handleCreate = async (type: 'file' | 'folder', parentNode?: any) => {
      setTargetNode(parentNode || null);
      setCreateType(type);
      setCreateInput('');
      setCreateDialogOpen(true);
  };

  const submitCreate = async () => {
      if (!createInput.trim()) return;

      let input = createInput.trim();
      const isDir = createType === 'folder';
      if (!isDir && !input.endsWith('.md')) {
          input += '.md';
      }
      
      let parentPath = '';
      if (targetNode) {
          parentPath = targetNode.id;
      }
      
      const cleanParent = parentPath.startsWith('/') ? parentPath.substring(1) : parentPath;
      
      let finalPath = '';
      if (cleanParent) {
          finalPath = `${cleanParent}/${input}`;
      } else {
          finalPath = input;
      }
      
      try {
          if (targetNode?.isInternal && treeApiRef.current) {
              try {
                  treeApiRef.current.open(targetNode.id);
              } catch {
              }
          }
          await fetch('/api/files/create', {
              method: 'POST',
              body: JSON.stringify({
                  projectId,
                  path: finalPath,
                  isDir
              })
          });
          await reloadTree();
          if (targetNode?.isInternal && treeApiRef.current) {
              try {
                  treeApiRef.current.open(targetNode.id);
              } catch {
              }
          }
          if (isDir && treeApiRef.current) {
              const createdId = `/${finalPath}`;
              try {
                  treeApiRef.current.open(createdId);
              } catch {
              }
          }
          setCreateDialogOpen(false);
          setTargetNode(null);
      } catch (e) {
          console.error("Failed to create", e);
      }
  };

  const handleDelete = async (node: any) => {
      setTargetNode(node);
      setDeleteMode('trash');
      setDeleteDialogOpen(true);
  };

  const submitDelete = async () => {
      if (!targetNode) return;
      
      try {
          await fetch('/api/files/delete', {
              method: 'POST',
              body: JSON.stringify({
                  projectId,
                  path: targetNode.id,
                  physical: deleteMode === 'permanent',
              })
          });
          reloadTree();
          onProjectUpdate?.();
          if (activeId === targetNode.id) {
              onSelect('');
          }
          setDeleteDialogOpen(false);
      } catch (e) {
          console.error("Failed to delete", e);
      }
  };

  const Node = ({ node, style, dragHandle }: any) => {
    const isFile = !node.isInternal;
    const isSelected = node.id === activeId;
    const rowRef = useRef<HTMLDivElement | null>(null);

    const isStarred = node.data.isStarred;

    const iconColor = isSelected ? currentTheme.iconActive : "text-gray-500";
    const textColor = isSelected ? currentTheme.activeText : "text-gray-700";
    const hoverBg = isSelected ? '' : currentTheme.hoverBg;
    const hoverText = isSelected ? '' : currentTheme.hoverText;

    return (
      <ContextMenu
        onOpenChange={(open) => {
          if (open) {
            applyContextMenuHighlight(rowRef.current);
          } else {
            if (contextMenuActiveElRef.current === rowRef.current) {
              clearContextMenuHighlight();
            }
          }
        }}
      >
        <ContextMenuTrigger disabled={readOnly && !session} asChild>
            <div
                ref={(el) => {
                  rowRef.current = el;
                  if (typeof dragHandle === 'function') {
                    dragHandle(el);
                  } else if (dragHandle && typeof dragHandle === 'object') {
                    (dragHandle as any).current = el;
                  }
                }}
                style={style}
                className={cn(
                    `flex items-center h-7 rounded-md cursor-pointer pr-2`,
                    isSelected ? currentTheme.activeBg : 'bg-transparent',
                    hoverBg,
                    !node.data.isVisible && 'italic text-gray-400'
                )}
                onClick={(e) => {
                    if (e.ctrlKey) return;
                    if (node.isInternal) {
                        node.toggle();
                    } else {
                        handleSelect(node.id);
                    }
                }}
            >
                <div className="flex items-center h-full">
                {node.isInternal ? (
                    <ChevronRight className={cn("w-4 h-4 transition-transform", node.isOpen && "rotate-90")} />
                ) : (
                    <div className="w-4 h-4" />
                )}
                </div>
                <span className={cn("ml-1 truncate", isSelected ? currentTheme.activeText : "text-gray-700", hoverText)}>{node.data.name}</span>
                <div className="flex-grow" />
                {isStarred && <Star size={12} className="text-yellow-500 fill-yellow-400 flex-shrink-0" />}
                {!readOnly && (
                    <DropdownMenu node={node} />
                )}
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
            {node.isInternal && !readOnly && <ContextMenuItem onClick={() => handleCreate('file', node)}>{t('files.newFile')}</ContextMenuItem>}
            {node.isInternal && !readOnly && <ContextMenuItem onClick={() => handleCreate('folder', node)}>{t('files.newFolder')}</ContextMenuItem>}
            {session && <ContextMenuItem onClick={() => handleToggleStar(node)}>{isStarred ? t('files.unstar') : t('files.star')}</ContextMenuItem>}
            {!readOnly && <ContextMenuItem onClick={() => handleToggleVisibility(node)}>{node.data.isVisible === false ? t('files.show') : t('files.hide')}</ContextMenuItem>}
            {!readOnly && <ContextMenuItem onClick={() => handleRename(node)}>{t('action.rename')}</ContextMenuItem>}
            {!readOnly && <ContextMenuItem onClick={() => handleDelete(node)} className="text-red-500">{t('action.delete')}…</ContextMenuItem>}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const DropdownMenu = ({ node }: { node: any }) => {
    return (
      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal size={16} className="text-gray-500 hover:text-gray-800" />
      </div>
    );
  };

  return (
    <TooltipProvider>
      <aside className="w-64 flex-shrink-0 border-r bg-gray-50 flex flex-col h-full">
        <div className="p-3 flex items-center justify-between border-b h-[53px]">
          <div className="flex items-center min-w-0 flex-1 overflow-hidden">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mr-2", currentTheme.avatarBg)}>
                  <span className={cn("font-bold text-lg", currentTheme.avatarText)}>{projectId.charAt(0).toUpperCase()}</span>
              </div>
              <h2 className="font-bold text-lg text-gray-800 truncate">{projectId}</h2>
          </div>
          <Link href={backHref} className="text-gray-500 hover:text-gray-800 flex-shrink-0 relative z-10">
              <ArrowLeft size={20} />
          </Link>
        </div>

        <nav className="p-2">
          <NavItem icon={Home} label={t('nav.home')} isActive={activeNav === 'home'} onClick={() => handleNavClick('home')} theme={currentTheme} />
          <NavItem icon={Search} label={t('nav.search')} isActive={activeNav === 'search'} onClick={() => handleNavClick('search')} theme={currentTheme} />
          {session && <NavItem icon={Star} label={t('nav.starred')} isActive={activeNav === 'starred'} onClick={() => handleNavClick('starred')} theme={currentTheme} />}
          {session && !readOnly && <NavItem icon={Trash2} label={t('nav.trash')} isActive={activeNav === 'trash'} onClick={() => handleNavClick('trash')} theme={currentTheme} />}
          {theme !== 'emerald' && session && (session.user.role === 'admin' || !readOnly) && <NavItem icon={Settings} label={t('nav.settings')} isActive={activeNav === 'settings'} onClick={() => handleNavClick('settings')} theme={currentTheme} />}
        </nav>

        <div className="px-3 mb-2 mt-2 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('files.title')}</h3>
          {!readOnly && (
              <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => handleCreate('file')} className="text-gray-400 hover:text-gray-700">
                          <FilePlus size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('files.newFile')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => handleCreate('folder')} className="text-gray-400 hover:text-gray-700">
                          <FolderPlus size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('files.newFolder')}</p>
                    </TooltipContent>
                  </Tooltip>
              </div>
          )}
        </div>

        <div ref={treeContainerRef} className="flex-grow px-2 pb-4 overflow-y-auto overflow-x-hidden">
          <Tree
            ref={treeApiRef}
            data={displayData}
            width={treeDims.width}
            height={treeDims.height}
            rowHeight={28}
            openByDefault={false}
            onMove={onMove}
            disableDrag={readOnly}
            disableDrop={readOnly}
          >
            {Node}
          </Tree>
        </div>
        
        <div className="p-3 border-t mt-auto">
          {session ? (
              <div className="flex items-center justify-between">
                  <div className="flex items-center">
                      <User size={16} className="mr-2 text-gray-600"/>
                      <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
                      {session.user.role === 'admin' && (
                          <span className={cn("ml-2 px-2 py-0.5 text-xs font-semibold rounded-full", currentTheme.headerBadge, "text-white")}>Admin</span>
                      )}
                  </div>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="text-gray-500 hover:text-gray-800">
                      <LogOut size={16} />
                  </button>
              </div>
          ) : (
              <Button onClick={() => signIn()} className="w-full">{t('action.signIn')}</Button>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createType === 'file' ? t('dialog.createFile.title') : t('dialog.createFolder.title')}</DialogTitle>
              <DialogDescription>
                {createType === 'file' ? t('dialog.createFile.desc') : t('dialog.createFolder.desc')}
              </DialogDescription>
            </DialogHeader>
            <Input 
              value={createInput} 
              onChange={(e) => setCreateInput(e.target.value)} 
              placeholder={createType === 'file' ? 'e.g., new-feature.md' : 'e.g., components'} 
              onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                      e.preventDefault();
                      submitCreate();
                  }
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('action.cancel')}</Button>
              <Button onClick={submitCreate}>{t('action.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.rename.title')}</DialogTitle>
            </DialogHeader>
            <Input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>{t('action.cancel')}</Button>
              <Button onClick={submitRename}>{t('action.rename')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialog.delete.title', { name: targetNode?.data?.name || '' })}</DialogTitle>
              <DialogDescription>
                {t('dialog.delete.desc')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Button
                type="button"
                variant={deleteMode === 'trash' ? 'default' : 'outline'}
                onClick={() => setDeleteMode('trash')}
                className="justify-start"
              >
                {t('dialog.delete.moveToTrash')}
              </Button>
              <Button
                type="button"
                variant={deleteMode === 'permanent' ? 'destructive' : 'outline'}
                onClick={() => setDeleteMode('permanent')}
                className="justify-start"
              >
                {t('dialog.delete.permanent')}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('action.cancel')}</Button>
              <Button
                variant={deleteMode === 'permanent' ? 'destructive' : 'default'}
                onClick={submitDelete}
              >
                {deleteMode === 'permanent' ? t('action.delete') : t('dialog.delete.moveToTrash')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </aside>
    </TooltipProvider>
  );
}

const NavItem = ({ icon: Icon, label, isActive, onClick, theme }: any) => (
  <button
    onClick={onClick}
    className={cn(
      `w-full flex items-center h-9 px-3 rounded-md text-sm font-medium`,
      isActive 
        ? `${theme.activeBg} ${theme.activeText}` 
        : `text-gray-600 ${theme.hoverBg} ${theme.hoverText}`
    )}
  >
    <Icon size={16} className={cn("mr-3", isActive ? theme.iconActive : "text-gray-500")} />
    <span>{label}</span>
  </button>
);
