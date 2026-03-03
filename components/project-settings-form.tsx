'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Check, ChevronsUpDown, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectConfig, ProjectGitConfig } from '@/lib/fs-service';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ProjectSettingsFormProps {
  projectId: string;
  initialConfig: ProjectConfig;
  allGroups: string[];
  initialGroup: string;
}

export function ProjectSettingsForm({ projectId, initialConfig, allGroups, initialGroup }: ProjectSettingsFormProps) {
  const [description, setDescription] = useState(initialConfig.description || '');
  const [group, setGroup] = useState(initialGroup);
  const [gitConfig, setGitConfig] = useState<ProjectGitConfig | undefined>(() => {
      const fullGitConfig = initialConfig.gitConfig ? { ...initialConfig.gitConfig } : undefined;
      if (fullGitConfig?.token) {
          fullGitConfig.token = '********';
      }
      return fullGitConfig;
  });
  const [showToken, setShowToken] = useState(false);
  const [openGroupCombobox, setOpenGroupCombobox] = useState(false);

  const [validationState, setValidationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  const toggleShowToken = async () => {
    if (!showToken) {
      try {
        const response = await fetch(`/api/projects/${projectId}/token`);
        if (!response.ok) throw new Error('Failed to fetch token.');
        const data = await response.json();
        if (data.token) {
          setGitConfig(cfg => ({ ...cfg!, token: data.token }));
        }
      } catch (error) {
        toast.error('Could not retrieve token.');
        return; // Don't toggle if fetch fails
      }
    } else {
        // When hiding, revert to placeholder
        setGitConfig(cfg => ({ ...cfg!, token: '********' }));
    }
    setShowToken(!showToken);
  };

  const handleTestConnection = async () => {
    if (!gitConfig?.repoUrl) {
        const message = 'Repository URL is required to test connection.';
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
        body: JSON.stringify({ 
            repoUrl: gitConfig.repoUrl, 
            token: gitConfig.token, 
            projectId: projectId 
        }),
    });
    const data = await response.json();
    if (response.ok) {
        setValidationState('success');
        setValidationMessage('Connection successful!');
        toast.success('Connection successful!');
    } else {
        setValidationState('error');
        const message = data.error || 'An unknown error occurred.';
        setValidationMessage(message);
        toast.error(message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) {
        toast.error('Group is a required field.');
        return;
    }
    try {
        const response = await fetch(`/api/projects/${projectId}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, gitConfig, group }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to save settings.');
        }
        toast.success('Settings saved successfully!');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        toast.error(`Error: ${message}`);
    }
  };

  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="What is this project about?" rows={3} />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group <span className="text-red-500">*</span></label>
              <Popover open={openGroupCombobox} onOpenChange={setOpenGroupCombobox}>
                  <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                          {group || "Select group..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command><CommandInput placeholder="Search group..." /><CommandList><CommandEmpty>No group found.</CommandEmpty><CommandGroup>
                          {allGroups.map((g) => (
                              <CommandItem key={g} value={g} onSelect={(currentValue) => { setGroup(allGroups.find(grp => grp.toLowerCase() === currentValue) || currentValue); setOpenGroupCombobox(false); }}>
                                  <Check className={cn("mr-2 h-4 w-4", group === g ? "opacity-100" : "opacity-0")} />{g}
                              </CommandItem>
                          ))}
                      </CommandGroup></CommandList></Command>
                  </PopoverContent>
              </Popover>
          </div>

          <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Mode</label>
              <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-not-allowed text-gray-500"><input type="radio" name="mode" value="edit" checked={initialConfig.mode === 'edit'} disabled /><span>Online Edit (Read/Write)</span></label>
                  <label className="flex items-center gap-2 cursor-not-allowed text-gray-500"><input type="radio" name="mode" value="git" checked={initialConfig.mode === 'git'} disabled /><span>Git Mirror (Read-only)</span></label>
              </div>
              {initialConfig.mode === 'git' && <p className="text-xs text-gray-500 mt-2">In Git Mirror mode, local changes may be overwritten by the remote repository during sync.</p>}
          </div>

          {initialConfig.mode === 'git' && (
              <div className="bg-gray-50 p-6 rounded-md border">
                  <h3 className="text-lg font-semibold mb-4">Git Configuration</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL <span className="text-red-500">*</span></label>
                          <input type="text" value={gitConfig?.repoUrl || ''} onChange={e => { setGitConfig(cfg => ({...cfg!, repoUrl: e.target.value})); setValidationState('idle'); }} className="w-full border rounded-md px-3 py-2" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Branch <span className="text-red-500">*</span></label>
                              <input type="text" value={gitConfig?.branch || ''} onChange={e => setGitConfig(cfg => ({...cfg!, branch: e.target.value}))} className="w-full border rounded-md px-3 py-2" required />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Root Path <span className="text-red-500">*</span></label>
                              <input type="text" value={gitConfig?.rootPath || ''} onChange={e => setGitConfig(cfg => ({...cfg!, rootPath: e.target.value}))} className="w-full border rounded-md px-3 py-2" required />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token <span className="text-red-500">*</span></label>
                          <div className="flex items-center gap-2">
                              <div className="relative flex-grow">
                                  <input type={showToken ? 'text' : 'password'} value={gitConfig?.token || ''} onChange={e => { setGitConfig(cfg => ({...cfg!, token: e.target.value})); setValidationState('idle'); }} className="w-full border rounded-md px-3 py-2 pr-10" placeholder="Enter new token to update" />
                                  <button type="button" onClick={toggleShowToken} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700">
                                      {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                              </div>
                              <Button type="button" variant="outline" size="lg" onClick={handleTestConnection} disabled={validationState === 'loading'} className="flex-shrink-0">
                                  {validationState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Connection"}
                              </Button>
                          </div>
                          <div className="h-4 mt-2">
                              {validationState === 'success' && <p className="text-xs text-green-600 flex items-center"><Check size={14} className="mr-1"/>{validationMessage}</p>}
                              {validationState === 'error' && <p className="text-xs text-red-600">{validationMessage}</p>}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval (minutes) <span className="text-red-500">*</span></label>
                          <input type="number" value={gitConfig?.syncInterval || 30} onChange={e => setGitConfig(cfg => ({...cfg!, syncInterval: Number(e.target.value)}))} className="w-full border rounded-md px-3 py-2" min="1" required />
                      </div>
                  </div>
              </div>
          )}
      </div>

      <div className="mt-8 pt-6 border-t flex justify-end">
          <Button type="submit" size="lg">Save Changes</Button>
      </div>
    </form>
  );
}
