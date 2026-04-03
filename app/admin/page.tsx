'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Plus, Folder, ArrowLeft, Users, LayoutGrid, Check, ChevronsUpDown, Trash2, Loader2, Eye, EyeOff, GitBranch, Pencil } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { UserManagement } from '@/components/user-management';
import { useI18n } from '@/components/i18n-provider';
import { LanguageSwitcher } from '@/components/language-switcher';

interface Project {
  id: string;
  name: string;
  description?: string;
  group?: string;
  mode: 'git' | 'edit';
}

interface Group {
  name: string;
  projects: string[];
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [groups, setGroups] = useState<{name: string, projects: string[]}[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectGroup, setNewProjectGroup] = useState('');
  const [openGroupCombobox, setOpenGroupCombobox] = useState(false);
  const [groupSearchValue, setGroupSearchValue] = useState('');
  const [newProjectMode, setNewProjectMode] = useState<'edit' | 'git'>('edit');
  const [gitRepoUrl, setGitRepoUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitRootPath, setGitRootPath] = useState('/');
  const [gitToken, setGitToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [syncInterval, setSyncInterval] = useState(10);

  const [validationState, setValidationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'project' | 'group', id: string, name: string } | null>(null);
  const [isPhysicalDelete, setIsPhysicalDelete] = useState(false);

  const resetCreateForm = () => {
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectGroup('');
      setNewProjectMode('edit');
      setGitRepoUrl('');
      setGitBranch('main');
      setGitRootPath('/');
      setGitToken('');
      setShowToken(false);
      setSyncInterval(30);
      setValidationState('idle');
      setValidationMessage('');
  }

  const loadProjects = () => {
    fetch('/api/admin/projects').then(res => res.json()).then(setProjects).catch(console.error);
    fetch('/api/groups').then(res => res.json()).then(setGroups).catch(console.error);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleTestConnection = async () => {
    if (!gitRepoUrl || !gitToken) {
        const message = t('admin.toast.repoTokenRequired');
        setValidationState('error');
        setValidationMessage(message);
        toast.error(message);
        return;
    }
    setValidationState('loading');
    setValidationMessage('');
    const response = await fetch('/api/git/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: gitRepoUrl, token: gitToken }),
    });
    const data = await response.json();
    if (response.ok) {
        setValidationState('success');
        setValidationMessage(t('admin.toast.connectionOk'));
        toast.success(t('admin.toast.connectionOk'));
    } else {
        setValidationState('error');
        const message = data.error || t('error.unknown');
        setValidationMessage(message);
        toast.error(message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectGroup.trim()) {
        toast.error(t('admin.toast.createProjectRequired'));
        return;
    }

    if (newProjectMode === 'git' && validationState !== 'success') {
        toast.error(t('admin.toast.gitTestRequired'));
        return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: newProjectName.trim(), 
            description: newProjectDesc,
            group: newProjectGroup,
            mode: newProjectMode,
            gitConfig: newProjectMode === 'git' ? {
                repoUrl: gitRepoUrl,
                branch: gitBranch,
                rootPath: gitRootPath,
                token: gitToken,
                syncInterval: syncInterval
            } : undefined
        }),
      });
      const data = await response.json();
      if (!response.ok) {
          throw new Error(data.error || t('admin.toast.createProjectFailedDefault'));
      }
      toast.success(t('admin.toast.createProjectOk', { name: newProjectName.trim() }));
      setShowCreateModal(false);
      resetCreateForm();
      loadProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('error.unknown');
      toast.error(`${t('error.prefix')}: ${message}`);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
        await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newGroupName.trim() }),
        });
        toast.success(t('admin.toast.createGroupOk', { name: newGroupName.trim() }));
        setShowGroupModal(false);
        setNewGroupName('');
        loadProjects();
    } catch (error) {
        const message = error instanceof Error ? error.message : t('error.unknown');
        toast.error(t('admin.toast.createGroupFailed', { message }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
        const url = deleteTarget.type === 'project'
            ? `/api/projects/${deleteTarget.id}?physical=${isPhysicalDelete}`
            : `/api/groups?name=${encodeURIComponent(deleteTarget.name)}&physical=${isPhysicalDelete}`;
        await fetch(url, { method: 'DELETE' });
        toast.success(
          t('admin.toast.deleteOk', {
            type: deleteTarget.type === 'project' ? t('admin.delete.type.project') : t('admin.delete.type.group'),
            name: deleteTarget.name,
          })
        );
        setDeleteTarget(null);
        setIsPhysicalDelete(false);
        loadProjects();
    } catch (error) {
        const message = error instanceof Error ? error.message : t('error.unknown');
        toast.error(t('admin.toast.deleteFailed', { message }));
    }
  };

  const isAdmin = session?.user?.role === 'admin';
  const existingGroups = groups.map(g => g.name);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1"><span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">{t('admin.badge')}</span></div>
            <h1 className="text-3xl font-bold text-slate-900">{t('admin.title')}</h1>
            <p className="text-slate-500 mt-1">{t('admin.desc')}</p>
          </div>
          <div className="flex gap-4 items-center">
              <LanguageSwitcher variant="button" className="h-9 px-3" />
              <Button variant="outline" size="sm" className="h-9 px-3" asChild>
                <Link href="/"><ArrowLeft size={16} className="mr-2" />{t('admin.exitPreview')}</Link>
              </Button>
              {isAdmin && (
                <Button size="sm" className="h-9 px-3" onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} className="mr-2" />{t('admin.newProject')}
                </Button>
              )}
              <UserNav />
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
            <TabsList className="mb-8">
                <TabsTrigger value="projects" className="flex items-center gap-2"><LayoutGrid size={16} /> {t('admin.tabs.projects')}</TabsTrigger>
                {isAdmin && <TabsTrigger value="users" className="flex items-center gap-2"><Users size={16} /> {t('admin.tabs.users')}</TabsTrigger>}
                {isAdmin && <TabsTrigger value="groups" className="flex items-center gap-2"><LayoutGrid size={16} /> {t('admin.tabs.groups')}</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="projects">
                {Array.from(projects.reduce((acc, project) => {
                    const groupName = project.group || t('preview.otherGroup');
                    if (!acc.has(groupName)) { acc.set(groupName, []); }
                    acc.get(groupName)!.push(project);
                    return acc;
                }, new Map<string, Project[]>()).entries()).map(([groupName, groupProjects]) => (
                    <div key={groupName} className="mb-10 last:mb-0">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>{groupName}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupProjects.map(project => (
                                <div key={project.id} className="relative group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all h-full flex flex-col">
                                    <Link href={`/project/${project.id}`} className="absolute inset-0 z-0" aria-label={t('admin.project.viewAria', { name: project.name })} />
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                                <Folder size={24} />
                                            </div>
                                            <div className="flex items-center gap-2 z-10">
                                                {project.mode === 'git' ? (
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                    <GitBranch size={12} />
                                                    <span>{t('preview.mode.git')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                                    <Pencil size={12} />
                                                    <span>{t('preview.mode.online')}</span>
                                                    </div>
                                                )}
                                                {isAdmin && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ type: 'project', id: project.id, name: project.name }); setIsPhysicalDelete(false); }} className="relative p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all" title={t('admin.project.delete')}><Trash2 size={16} /></button>}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">{project.name}</h3>
                                        <p className="text-gray-500 text-sm flex-1">{project.description || t('admin.noDescProvided')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </TabsContent>
            
            {isAdmin && <TabsContent value="users"><UserManagement /></TabsContent>}
            {isAdmin && <TabsContent value="groups">
                <div className="mb-6 flex justify-end"><Button onClick={() => setShowGroupModal(true)}><Plus size={16} className="mr-2" />{t('admin.group.add')}</Button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.name} className="bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{t('admin.group.projectsCount', { count: group.projects.length })}</p>
                            <div className="flex justify-end">
                                <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget({ type: 'group', id: group.name, name: group.name }); setIsPhysicalDelete(false); }} disabled={group.projects.length > 0} title={group.projects.length > 0 ? t('admin.group.deleteDisabled') : t('admin.group.deleteTitle')}>{t('action.delete')}</Button>
                            </div>
                        </div>
                    ))}
                    {groups.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">{t('admin.noGroups')}</div>}
                </div>
            </TabsContent>}
        </Tabs>
      </div>

      {showGroupModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{t('admin.createGroup.title')}</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.createGroup.name')}</label>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder={t('admin.createGroup.placeholder')} required />
              </div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">{t('action.cancel')}</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{t('action.create')}</button></div>
            </form>
          </div>
      </div>}

      {showCreateModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold p-6 border-b">{t('admin.createProject.title')}</h2>
            <form onSubmit={handleCreate} className="flex flex-col overflow-hidden flex-grow">
              <div className="overflow-y-auto p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.createProject.name')} <span className="text-red-500">*</span></label><input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder={t('admin.createProject.namePlaceholder')} required /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.createProject.description')}</label><textarea value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder={t('admin.createProject.descPlaceholder')} rows={3} /></div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.createProject.group')} <span className="text-red-500">*</span></label>
                    <Popover open={openGroupCombobox} onOpenChange={setOpenGroupCombobox}>
                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between font-normal text-slate-900">{newProjectGroup || t('admin.createProject.groupSelect')}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder={t('admin.createProject.groupSearchCreate')} value={groupSearchValue} onValueChange={setGroupSearchValue} /><CommandList><CommandEmpty>{t('admin.createProject.groupEmpty')}</CommandEmpty><CommandGroup heading={t('admin.createProject.groupExistingHeading')}>
                            {existingGroups.map((group) => (<CommandItem key={group} value={group} onSelect={(currentValue) => { setNewProjectGroup(existingGroups.find(g => g.toLowerCase() === currentValue.toLowerCase()) || currentValue); setOpenGroupCombobox(false);}}><Check className={cn("mr-2 h-4 w-4", newProjectGroup === group ? "opacity-100" : "opacity-0")} />{group}</CommandItem>))}
                        </CommandGroup></CommandList></Command></PopoverContent>
                    </Popover>
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.createProject.mode')}</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mode" value="edit" checked={newProjectMode === 'edit'} onChange={() => { setNewProjectMode('edit'); setValidationState('idle'); }} className="text-blue-600"/><span>{t('admin.createProject.mode.online')}</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="mode" value="git" checked={newProjectMode === 'git'} onChange={() => setNewProjectMode('git')} className="text-blue-600"/><span>{t('admin.createProject.mode.git')}</span></label>
                    </div>
                    {newProjectMode === 'git' && <p className="text-xs text-gray-500 mt-2">{t('settings.mode.gitWarn')}</p>}
                </div>

                {newProjectMode === 'git' && <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="space-y-3">
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.git.repoUrl')} <span className="text-red-500">*</span></label><input type="text" value={gitRepoUrl} onChange={e => { setGitRepoUrl(e.target.value); setValidationState('idle'); }} className="w-full px-3 py-2 border rounded-md text-sm" placeholder={t('admin.createProject.git.repoUrlPlaceholder')} required /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.git.branch')} <span className="text-red-500">*</span></label><input type="text" value={gitBranch} onChange={e => setGitBranch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder={t('admin.createProject.git.branchPlaceholder')} required/></div>
                            <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.git.rootPath')} <span className="text-red-500">*</span></label><input type="text" value={gitRootPath} onChange={e => setGitRootPath(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" placeholder={t('admin.createProject.git.rootPathPlaceholder')} required/></div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.git.token')} <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type={showToken ? 'text' : 'password'} value={gitToken} onChange={e => { setGitToken(e.target.value); setValidationState('idle'); }} className="w-full px-3 py-2 border rounded-md text-sm pr-10" placeholder={t('admin.createProject.git.tokenPlaceholder')} required/>
                                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700">
                                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                             <div className="flex justify-end items-center mt-2">
                                <div className="h-4 flex-grow">
                                    {validationState === 'success' && <p className="text-xs text-green-600 flex items-center"><Check size={14} className="mr-1"/>{validationMessage}</p>}
                                    {validationState === 'error' && <p className="text-xs text-red-600">{validationMessage}</p>}
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handleTestConnection} disabled={validationState === 'loading'}>{validationState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin.createProject.git.testShort')}</Button>
                            </div>
                        </div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">{t('settings.git.sync')} <span className="text-red-500">*</span></label><input type="number" value={syncInterval} onChange={e => setSyncInterval(Number(e.target.value))} className="w-full px-3 py-2 border rounded-md text-sm" min="1" required/></div>
                    </div>
                </div>}
              </div>
              <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
                <Button type="button" variant="ghost" onClick={() => {setShowCreateModal(false); resetCreateForm();}}>{t('action.cancel')}</Button>
                <Button type="submit">{t('action.create')}</Button>
              </div>
            </form>
          </div>
        </div>}

      {deleteTarget && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">{t('admin.delete.title', { type: deleteTarget.type === 'project' ? t('admin.delete.type.project') : t('admin.delete.type.group') })}</h2>
            <p className="text-gray-600 mb-4">{t('admin.delete.confirmDesc', { name: deleteTarget.name })}</p>
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-md">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={isPhysicalDelete} onChange={(e) => setIsPhysicalDelete(e.target.checked)} className="w-4 h-4 text-red-600 rounded"/>
                    <div>
                        <span className="font-medium text-red-800 text-sm">{t('admin.delete.physicalTitle')}</span>
                        <p className="text-xs text-red-600 mt-0.5">{t('admin.delete.physicalDesc')}</p>
                    </div>
                </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-gray-600 hover:text-gray-900">{t('action.cancel')}</button>
              <button onClick={handleConfirmDelete} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">{t('admin.delete.confirm')}</button>
            </div>
          </div>
      </div>}
    </div>
  );
}
