'use client';

import { X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/components/i18n-provider';

export function ImagePreviewDialog({
  open,
  onOpenChange,
  src,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  title?: string;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="max-w-none w-screen h-screen p-0 bg-transparent border-none shadow-none">
        <DialogTitle className="sr-only">{title || t('imagePreview.title')}</DialogTitle>
        <div className="w-full h-full flex flex-col">
          <div className="px-4 py-3 bg-black/40 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-white truncate min-w-0">
              {title || t('imagePreview.title')}
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label={t('action.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center p-2">
            <img
              src={src}
              alt={title || t('imagePreview.alt')}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
