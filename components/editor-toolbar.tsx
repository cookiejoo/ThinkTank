'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useState, useRef } from 'react';
import { useI18n } from '@/components/i18n-provider';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ToolbarProps {
  editor: Editor | null;
  onUploadImage?: (file: File) => Promise<string | null>;
}

export function Toolbar({ editor, onUploadImage }: ToolbarProps) {
  const { t } = useI18n();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const openLinkDialog = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setLinkDialogOpen(true);
  };

  const submitLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setLinkDialogOpen(false);
  };

  const openImageDialog = () => {
    setImageUrl('');
    setImageDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    try {
      const url = await onUploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        setImageDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const submitImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageDialogOpen(false);
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    children,
    title
  }: { 
    onClick: () => void, 
    isActive?: boolean, 
    disabled?: boolean,
    children: React.ReactNode,
    title?: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors text-gray-600 hover:bg-gray-100 disabled:opacity-50",
        isActive && "bg-blue-100 text-blue-600 hover:bg-blue-200"
      )}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-6 bg-gray-200 mx-1 self-center" />;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-white sticky top-0 z-10">
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title={t('toolbar.undo')}
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title={t('toolbar.redo')}
        >
          <Redo size={16} />
        </ToolbarButton>
      </div>

      <Separator />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title={t('toolbar.h1')}
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title={t('toolbar.h2')}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title={t('toolbar.h3')}
        >
          <Heading3 size={16} />
        </ToolbarButton>
      </div>

      <Separator />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={t('toolbar.bold')}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={t('toolbar.italic')}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title={t('toolbar.underline')}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title={t('toolbar.strike')}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title={t('toolbar.code')}
        >
          <Code size={16} />
        </ToolbarButton>
      </div>

      <Separator />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={t('toolbar.bulletList')}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={t('toolbar.orderedList')}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={t('toolbar.blockquote')}
        >
          <Quote size={16} />
        </ToolbarButton>
      </div>

      <Separator />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title={t('toolbar.alignLeft')}
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title={t('toolbar.alignCenter')}
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title={t('toolbar.alignRight')}
        >
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title={t('toolbar.justify')}
        >
          <AlignJustify size={16} />
        </ToolbarButton>
      </div>
      
      <Separator />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={openLinkDialog}
          isActive={editor.isActive('link')}
          title={t('toolbar.link')}
        >
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={openImageDialog}
          title={t('toolbar.image')}
        >
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertContent('```mermaid\ngraph TD\n  A[Start] --> B[End]\n```').run()}
          title={t('toolbar.mermaid')}
        >
          <Workflow size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title={t('toolbar.hr')}
        >
          <Minus size={16} />
        </ToolbarButton>
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('toolbar.insertLink')}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="link-url">{t('toolbar.url')}</Label>
            <Input 
                id="link-url" 
                value={linkUrl} 
                onChange={(e) => setLinkUrl(e.target.value)} 
                placeholder="https://example.com"
                onKeyDown={(e) => e.key === 'Enter' && submitLink()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>{t('action.cancel')}</Button>
            <Button onClick={submitLink}>{t('action.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('toolbar.insertImage')}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">{t('toolbar.imageUrl')}</Label>
              <Input 
                  id="image-url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.png"
                  onKeyDown={(e) => e.key === 'Enter' && submitImage()}
              />
            </div>
            {onUploadImage && (
              <div className="space-y-2">
                <Label>{t('toolbar.orUpload')}</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    {t('toolbar.selectFile')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>{t('action.cancel')}</Button>
            <Button onClick={submitImage}>{t('toolbar.insertUrl')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
