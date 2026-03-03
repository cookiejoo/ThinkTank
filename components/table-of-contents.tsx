'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

interface ToCItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

interface TableOfContentsProps {
  editor: Editor;
  theme?: 'indigo' | 'emerald';
}

export function TableOfContents({ editor, theme = 'indigo' }: TableOfContentsProps) {
  const [items, setItems] = useState<ToCItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const themeColors = {
    indigo: {
      hoverText: "hover:text-indigo-600",
      hoverBorder: "hover:border-indigo-300",
    },
    emerald: {
      hoverText: "hover:text-emerald-600",
      hoverBorder: "hover:border-emerald-300",
    }
  };

  const currentTheme = themeColors[theme];

  useEffect(() => {
    if (!editor) return;

    const updateToC = () => {
      const newItems: ToCItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          // Only include H1-H3
          if (node.attrs.level <= 3) {
            newItems.push({
              id: `heading-${pos}`,
              level: node.attrs.level,
              text: node.textContent,
              pos: pos
            });
          }
        }
      });
      setItems(newItems);
    };

    updateToC();
    editor.on('update', updateToC);

    return () => {
      editor.off('update', updateToC);
    };
  }, [editor]);

  // Optional: Highlight active heading based on scroll position
  // This requires access to the scrollable container, which we might not have easily here.
  // We can skip this for MVP.

  if (items.length === 0) {
      return (
          <div className="w-64 bg-slate-50/50 p-4 h-full hidden lg:block">
              <div className="text-xs text-slate-400 italic text-center mt-10">
                  Add headings to see a table of contents.
              </div>
          </div>
      );
  }

  const handleItemClick = (pos: number) => {
    editor.commands.setTextSelection(pos);
    
    // We need to scroll the node into view.
    // Tiptap's built-in scroll might be enough if we focus.
    editor.commands.focus();
    
    // Attempt to find the DOM node and scroll it smoothly
    const { view } = editor;
    const dom = view.nodeDOM(pos) as HTMLElement;
    if (dom && dom.scrollIntoView) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-64 bg-slate-50/50 p-4 h-full overflow-y-auto hidden lg:block shrink-0">
      <div className="flex items-center gap-2 mb-4 text-slate-500">
        <List size={14} />
        <h3 className="text-xs font-semibold uppercase tracking-wider">
            CONTENTS
        </h3>
      </div>
      
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.pos)}
            className={cn(
              "text-sm text-left block w-full py-1 pr-2 transition-colors truncate border-l-2 border-transparent",
              currentTheme.hoverText,
              currentTheme.hoverBorder,
              item.level === 1 ? "font-semibold text-slate-800" : "text-slate-600",
              item.level === 2 && "pl-3",
              item.level === 3 && "pl-6",
            )}
          >
            {item.text || <span className="text-slate-300 italic">Untitled</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
