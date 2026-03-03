import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CodeBlockComponent from './code-block-component';

const lowlight = createLowlight(common);

export const CodeBlockExtension = CodeBlockLowlight.configure({
  lowlight,
}).extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});
