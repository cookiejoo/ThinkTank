'use client';

import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TrashedItem = {
  path: string;
  name: string;
  isDir: boolean;
  deletedAt?: string;
};

export function TrashPage({
  projectId,
  refreshToken,
  onChanged,
}: {
  projectId: string;
  refreshToken?: number;
  onChanged?: () => void;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TrashedItem[]>([]);
  const [purgeTarget, setPurgeTarget] = useState<TrashedItem | null>(null);
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/trash?projectId=${encodeURIComponent(projectId)}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId, refreshToken]);

  const hasItems = items.length > 0;

  const formattedItems = useMemo(() => {
    return items.map((item) => {
      const deletedLabel = item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '';
      return { ...item, deletedLabel };
    });
  }, [items]);

  const restore = async (item: TrashedItem) => {
    await fetch('/api/files/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'restore', path: item.path }),
    });
    await load();
    onChanged?.();
  };

  const purge = async (item: TrashedItem) => {
    await fetch('/api/files/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'purge', path: item.path }),
    });
    setPurgeTarget(null);
    await load();
    onChanged?.();
  };

  const emptyTrash = async () => {
    await fetch('/api/files/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'empty' }),
    });
    setEmptyConfirmOpen(false);
    await load();
    onChanged?.();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Trash2 className="mr-3 text-gray-800" size={32} />
              {t('trash.title')}
            </h1>
            <p className="text-gray-500">{t('trash.desc')}</p>
          </div>

          <Button
            variant="destructive"
            disabled={!hasItems}
            onClick={() => setEmptyConfirmOpen(true)}
          >
            {t('trash.empty')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-[40vh] text-gray-400">{t('trash.loading')}</div>
        ) : hasItems ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
              <div className="col-span-7">{t('trash.col.path')}</div>
              <div className="col-span-3">{t('trash.col.deleted')}</div>
              <div className="col-span-2 text-right">{t('trash.col.actions')}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {formattedItems.map((item) => (
                <div key={item.path} className="grid grid-cols-12 px-4 py-3 items-center">
                  <div className="col-span-7 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400 truncate">{item.path}</div>
                  </div>
                  <div className="col-span-3 text-sm text-gray-600 truncate">
                    {item.deletedLabel}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restore(item)}
                      className="gap-1"
                    >
                      <RotateCcw size={14} />
                      {t('trash.restore')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPurgeTarget(item)}
                    >
                      {t('trash.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <Trash2 size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('trash.emptyStateTitle')}</h3>
            <p className="text-gray-500 text-sm max-w-sm text-center">
              {t('trash.emptyStateDesc')}
            </p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(purgeTarget)} onOpenChange={(open) => !open && setPurgeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('trash.deletePermanentlyTitle')}</DialogTitle>
            <DialogDescription>
              {t('trash.deletePermanentlyDesc', { name: purgeTarget?.name || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurgeTarget(null)}>{t('action.cancel')}</Button>
            <Button variant="destructive" onClick={() => purgeTarget && purge(purgeTarget)}>{t('action.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emptyConfirmOpen} onOpenChange={setEmptyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('trash.emptyTitle')}</DialogTitle>
            <DialogDescription>
              {t('trash.emptyDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmptyConfirmOpen(false)}>{t('action.cancel')}</Button>
            <Button variant="destructive" onClick={emptyTrash}>{t('trash.emptyConfirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
