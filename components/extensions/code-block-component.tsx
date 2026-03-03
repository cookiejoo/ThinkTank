import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { cn } from '@/lib/utils';

interface CodeBlockComponentProps {
  node: {
    attrs: {
      language: string;
    };
  };
  updateAttributes: (attrs: { language: string }) => void;
  extension: {
    options: {
      lowlight: {
        listLanguages: () => string[];
      };
    };
  };
}

export default function CodeBlockComponent({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
}: CodeBlockComponentProps) {
  const languages = extension.options.lowlight.listLanguages();

  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-4 rounded-lg border bg-slate-950 text-slate-50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50 rounded-t-lg select-none" contentEditable={false}>
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Language:</span>
            <select
                defaultValue={defaultLanguage || 'auto'}
                onChange={(event) => updateAttributes({ language: event.target.value })}
                className="bg-transparent text-xs text-slate-300 focus:outline-none focus:ring-0 border-none h-6 cursor-pointer hover:text-white appearance-none pr-4"
                style={{
                   backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23CBD5E1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                   backgroundRepeat: 'no-repeat',
                   backgroundPosition: 'right center',
                   backgroundSize: '8px auto'
                }}
            >
                <option value="null">auto</option>
                <option disabled>---</option>
                {languages.map((lang, index) => (
                    <option key={index} value={lang}>
                        {lang}
                    </option>
                ))}
            </select>
        </div>
      </div>
      <pre className="relative p-0 m-0 overflow-x-auto">
        <NodeViewContent as="div" className={cn(
            "block p-4 font-mono text-sm leading-relaxed",
            // Language class for highlighting
            defaultLanguage ? `language-${defaultLanguage}` : ''
        )} />
      </pre>
    </NodeViewWrapper>
  );
}
