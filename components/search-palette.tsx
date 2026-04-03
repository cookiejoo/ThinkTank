'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n-provider';

interface SearchPaletteProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isDir?: boolean;
}

interface FlatNode {
  id: string;
  name: string;
  path: string; // derived from id usually, or we build it
}

export function SearchPalette({ projectId, isOpen, onClose, onSelect }: SearchPaletteProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<FlatNode[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FlatNode[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten the tree
  const flatten = (nodes: TreeNode[]): FlatNode[] => {
    let result: FlatNode[] = [];
    for (const node of nodes) {
      if (!node.isDir) {
        result.push({ id: node.id, name: node.name, path: node.id });
      }
      if (node.children) {
        result = result.concat(flatten(node.children));
      }
    }
    return result;
  };

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/files/tree?projectId=${projectId}`)
        .then(res => res.json())
        .then((data: TreeNode[]) => {
          const flat = flatten(data);
          setFiles(flat);
          setFilteredFiles(flat);
        })
        .catch(console.error);
        
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!query) {
      setFilteredFiles(files);
    } else {
      const lowerQuery = query.toLowerCase();
      setFilteredFiles(files.filter(f => f.name.toLowerCase().includes(lowerQuery)));
    }
    setSelectedIndex(0);
  }, [query, files]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredFiles.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          onSelect(filteredFiles[selectedIndex].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-base outline-none placeholder:text-slate-400 text-slate-800"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => (
              <div
                key={file.id}
                onClick={() => {
                  onSelect(file.id);
                  onClose();
                }}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                  index === selectedIndex ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <FileText className={cn("w-4 h-4 mr-3", index === selectedIndex ? "text-indigo-500" : "text-slate-400")} />
                <span className="truncate font-medium">{file.name}</span>
                <span className="ml-auto text-xs text-slate-400 truncate max-w-[100px]">{file.path}</span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              {t('search.noResults')}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>
                <span className="font-medium text-slate-500">↑↓</span> {t('search.hintNavigate')}
            </span>
            <span>
                <span className="font-medium text-slate-500">Enter</span> {t('search.hintSelect')}
            </span>
            <span>
                <span className="font-medium text-slate-500">Esc</span> {t('search.hintClose')}
            </span>
        </div>
      </div>
    </div>
  );
}
