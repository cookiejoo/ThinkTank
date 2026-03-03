import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import mermaid from 'mermaid';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import CodeBlock from '@tiptap/extension-code-block';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';

import { useEditorContext } from '../editor-context';

const CodeBlockComponent = ({ node, editor }: any) => {
  const isMermaid = node.attrs.language === 'mermaid';
  const { isEditable } = useEditorContext();
  
  // -- Mermaid Logic --
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  
  const content = node.textContent;

  useEffect(() => {
    if (!isMermaid) return;
    
    mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
    });
  }, [isMermaid]);

  useEffect(() => {
    if (!isMermaid) return;

    const renderDiagram = async () => {
      if (!content) {
          setSvg('');
          return;
      }
      try {
        setError('');
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, content);
        setSvg(svg);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setError(err.message || 'Failed to render diagram');
      }
    };
    
    const timeoutId = setTimeout(renderDiagram, 300);
    return () => clearTimeout(timeoutId);
  }, [content, isMermaid]);

  // -- Render --
  
  if (isMermaid) {
    if (!isEditable) {
        // Preview Mode: Show ONLY SVG with Zoom Controls
        return (
            <NodeViewWrapper className="mermaid-wrapper relative my-4 border rounded-md overflow-hidden bg-white shadow-sm">
                 {error ? (
                     <div className="text-red-500 text-sm p-4 border-l-4 border-red-500 bg-red-50">
                         <strong>Mermaid Error:</strong>
                         <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
                     </div>
                 ) : (
                     <div className="h-[400px] w-full relative group">
                         <TransformWrapper
                            initialScale={1}
                         >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white/90 p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => zoomIn()} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom In">
                                            <ZoomIn size={16} />
                                        </button>
                                        <button onClick={() => zoomOut()} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out">
                                            <ZoomOut size={16} />
                                        </button>
                                        <button onClick={() => resetTransform()} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Reset">
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                                        <div 
                                            className="w-full h-full flex items-center justify-center p-4"
                                            dangerouslySetInnerHTML={{ __html: svg }} 
                                        />
                                    </TransformComponent>
                                </>
                            )}
                         </TransformWrapper>
                     </div>
                 )}
            </NodeViewWrapper>
        );
    }
    
    // Edit Mode: Show Editor + Preview (with Zoom support too)
    return (
      <NodeViewWrapper className="code-block-mermaid relative my-4 border rounded-md overflow-hidden bg-white shadow-sm transition-all duration-200">
        <div className="bg-gray-50 border-b flex justify-between items-center px-3 py-2 select-none">
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mermaid Diagram</span>
            </div>
            <div className="flex gap-1">
                <button 
                    onClick={() => setIsSplit(!isSplit)}
                    className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                        isSplit 
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                            : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                    )}
                    title={isSplit ? "Switch to Stacked View" : "Switch to Split View"}
                >
                   <Maximize size={12} className={cn("transition-transform", isSplit ? "rotate-90" : "")} />
                   {isSplit ? "Split View" : "Stacked View"}
                </button>
            </div>
        </div>
        
        <div className={cn("flex transition-all", isSplit ? "flex-row h-[600px]" : "flex-col")}>
            {/* The Code Editor */}
            <div className={cn("relative transition-all", isSplit ? "w-1/2 border-r" : "w-full")}>
                <pre className={cn(
                    "p-4 bg-gray-50/50 text-sm font-mono overflow-auto focus:outline-none",
                    isSplit ? "h-full resize-none" : "min-h-[250px] resize-y"
                )}>
                    <NodeViewContent />
                </pre>
            </div>
        
            {/* The Preview */}
            <div className={cn(
                "bg-white relative group transition-all",
                isSplit ? "w-1/2 h-full" : "w-full h-[400px] border-t"
            )}>
                 {error ? (
                     <div className="text-red-500 text-xs p-4 border-l-4 border-red-500 bg-red-50 m-4">
                         <strong>Syntax Error:</strong>
                         <pre className="mt-2 whitespace-pre-wrap font-mono">{error}</pre>
                     </div>
                 ) : (
                    <TransformWrapper initialScale={1} centerOnInit>
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                                <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white/90 p-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100">
                                    <button onClick={() => zoomIn()} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom In">
                                        <ZoomIn size={14} />
                                    </button>
                                    <button onClick={() => zoomOut()} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out">
                                        <ZoomOut size={14} />
                                    </button>
                                    <button onClick={() => resetTransform()} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Reset">
                                        <RotateCcw size={14} />
                                    </button>
                                </div>
                                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                                    <div 
                                        className="w-full h-full flex items-center justify-center p-4"
                                        dangerouslySetInnerHTML={{ __html: svg }} 
                                    />
                                </TransformComponent>
                            </>
                        )}
                    </TransformWrapper>
                 )}
            </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Default Code Block Rendering
  return (
    <NodeViewWrapper className="code-block relative my-4 rounded-md bg-gray-100 p-4 font-mono text-sm">
      <pre>
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
};

export const ExtendedCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});
