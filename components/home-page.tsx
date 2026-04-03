'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Star, Clock, BookOpen, Edit2, Check, X, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUserConfig } from '@/hooks/use-user-config';
import { useI18n } from '@/components/i18n-provider';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HomeData {
  readme: string;
  description: string;
  group?: string;
}

export function HomePage({ 
    projectId, 
    onNavigate, 
    onSearch, 
    readOnly = false,
    versions = [],
    selectedVersion = 'latest',
    onVersionChange = () => {}
}: { 
    projectId: string, 
    onNavigate: (path: string) => void, 
    onSearch: () => void, 
    readOnly?: boolean,
    versions?: string[],
    selectedVersion?: string,
    onVersionChange?: (version: string) => void
}) {
  const { t } = useI18n();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');
  
  const [availableGroups, setAvailableGroups] = useState<{name: string, projects: string[]}[]>([]);
  const [openGroupCombobox, setOpenGroupCombobox] = useState(false);

  const { config: userConfig, loaded: configLoaded } = useUserConfig(projectId);

  const readmeHtml = useMemo(() => {
    if (!data?.readme) return '';
    // This is a placeholder, as @tiptap/html is not available in this context.
    // A proper solution would be to install and use a library like 'marked' or 'react-markdown'.
    // For now, we will just return the raw text to avoid crashing.
    return data.readme.replace(/\n/g, '<br />');
  }, [data?.readme]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setDescInput(json.description || '');
        }
        
        if (!readOnly) {
            const groupsRes = await fetch('/api/groups');
            if (groupsRes.ok) {
                setAvailableGroups(await groupsRes.json());
            }
        }
      } catch (error) {
        console.error("Failed to load home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, readOnly]);

  const handleSaveDescription = async () => {
      try {
          await fetch(`/api/projects/${projectId}`,
              {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ description: descInput })
              });
          setData(prev => prev ? { ...prev, description: descInput } : null);
          setIsEditingDesc(false);
      } catch (e) {
          console.error("Failed to save description", e);
      }
  };

  const handleUpdateGroup = async (newGroup: string) => {
      try {
          await fetch(`/api/projects/${projectId}`,
              {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ group: newGroup })
              });
          setData(prev => prev ? { ...prev, group: newGroup } : null);
          setOpenGroupCombobox(false);
      } catch (e) {
          console.error("Failed to update group", e);
      }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">{t('home.loading')}</div>;
  }

  if (!data || !configLoaded) {
    return <div className="flex items-center justify-center h-full text-gray-400">{t('home.loadFailed')}</div>;
  }

  const FileList = ({ files, icon: Icon, title, emptyText }: any) => (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
        <Icon size={16} className="mr-2" />
        {title}
      </h2>
      {files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((path: string) => (
            <div 
              key={path}
              onClick={() => onNavigate(path)}
              className="group p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-start">
                <FileText size={20} className="text-gray-400 group-hover:text-blue-500 mt-0.5 mr-3" />
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700">
                    {path.split('/').pop()}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {path}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
          {emptyText}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/50">

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('home.welcome', { projectId })}
                    </h1>
                    <div className="min-h-[1.5rem] relative group">
                        {isEditingDesc ? (
                            <div className="space-y-2">
                                <textarea 
                                    className="w-full min-h-[80px] p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
                                    value={descInput}
                                    onChange={(e) => setDescInput(e.target.value)}
                                    placeholder={t('home.descPlaceholder')}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleSaveDescription} className="h-7 px-2">
                                        <Check size={14} className="mr-1" /> {t('action.save')}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                        setIsEditingDesc(false);
                                        setDescInput(data.description || '');
                                    }} className="h-7 px-2">
                                        <X size={14} className="mr-1" /> {t('action.cancel')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                <p className="text-gray-500">
                                    {data.description || (readOnly ? t('home.descReadOnly') : t('home.descEditable'))}
                                </p>
                                {!readOnly && (
                                    <Button 
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsEditingDesc(true)}
                                        className="opacity-0 group-hover:opacity-100 h-6 w-6 text-gray-400 hover:text-gray-700"
                                        title={t('home.editDesc')}
                                    >
                                        <Edit2 size={12} />
                                    </Button>
                                )}
                                </div>
                                {data.group ? (
                                    <div className="flex items-center gap-2">
                                    {!readOnly ? (
                                        <Popover open={openGroupCombobox} onOpenChange={setOpenGroupCombobox}>
                                            <PopoverTrigger asChild>
                                                <button 
                                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 hover:bg-gray-200 flex items-center gap-1 transition-colors"
                                                >
                                                    {data.group}
                                                    <ChevronsUpDown size={12} />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0 w-[200px]">
                                                <Command>
                                                    <CommandInput placeholder={t('home.groupSelect')} />
                                                    <CommandList>
                                                        <CommandEmpty>{t('home.groupEmpty')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {availableGroups.map((group) => (
                                                                <CommandItem
                                                                    key={group.name}
                                                                    value={group.name}
                                                                    onSelect={(currentValue) => {
                                                                        handleUpdateGroup(currentValue === data.group ? "" : currentValue)
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        data.group === group.name ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {group.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                            {data.group}
                                        </span>
                                    )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
                {versions.length > 0 && (
                    <Select onValueChange={onVersionChange} value={selectedVersion}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('home.selectVersion')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">{t('home.latest')}</SelectItem>
                            {versions.map(v => (
                                <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Starred & Recent */}
            {session && (
                <>
                    <FileList files={userConfig.starred} icon={Star} title={t('home.starredTitle')} emptyText={t('home.starredEmpty')} />
                    <FileList files={userConfig.recent} icon={Clock} title={t('home.recentTitle')} emptyText={t('home.recentEmpty')} />
                </>
            )}

            {/* README */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <BookOpen size={16} className="mr-2" />
                    README.md
                </h2>
                <div className="prose prose-sm max-w-none p-6 bg-white border border-gray-200 rounded-lg" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
            </div>
        </div>
      </div>
    </div>
  );
}
