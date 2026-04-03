'use client';

import { FileText, Star } from 'lucide-react';
import { useUserConfig } from '@/hooks/use-user-config';
import { useI18n } from '@/components/i18n-provider';

export function StarredPage({ projectId, onNavigate }: { projectId: string, onNavigate: (path: string) => void }) {
  const { t } = useI18n();
  const { config: userConfig, loaded: configLoaded } = useUserConfig(projectId);

  if (!configLoaded) {
    return <div className="flex items-center justify-center h-full text-gray-400">{t('starred.loading')}</div>;
  }

  const files = userConfig.starred;

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Star className="mr-3 text-yellow-500 fill-yellow-500" size={32} />
            {t('starred.title')}
          </h1>
          <p className="text-gray-500">{t('starred.desc')}</p>
        </div>

        {files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((path: string) => (
              <div 
                key={path}
                onClick={() => onNavigate(path)}
                className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex items-start"
              >
                <div className="p-2 bg-blue-50 rounded-md text-blue-600 mr-4 group-hover:bg-blue-100 transition-colors">
                  <FileText size={24} />
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="text-base font-semibold text-gray-800 truncate group-hover:text-blue-700 mb-1">
                    {path.split('/').pop()}
                  </div>
                  <div className="text-xs text-gray-400 truncate flex items-center">
                    {path}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-gray-200 rounded-xl">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Star size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('starred.emptyTitle')}</h3>
            <p className="text-gray-500 text-sm max-w-sm text-center">
              {t('starred.emptyDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
