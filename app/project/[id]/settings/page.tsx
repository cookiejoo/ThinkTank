
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectConfig, getProjectGroups, getProjects } from '@/lib/fs-service';
import { ProjectSettingsForm } from '@/components/project-settings-form';
import { getLocaleFromCookies } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocaleFromCookies();
  // Guard clause to ensure projectId is valid
  const { id } = await params;
  const projectId = decodeURIComponent(id);
  if (!projectId || typeof projectId !== 'string') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">{t(locale, 'settings.invalidProjectId.title')}</h1>
        <p className="text-red-500">{t(locale, 'settings.invalidProjectId.desc')}</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/admin"><ArrowLeft size={16} className="mr-2" />{t(locale, 'settings.backToConsole')}</Link>
        </Button>
      </div>
    );
  }

  // Fetch all necessary data on the server in parallel
  const [config, allProjects, allGroups] = await Promise.all([
    getProjectConfig(projectId),
    getProjects(),
    getProjectGroups(),
  ]);

  // Check if project configuration exists
  if (!config.mode) {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-red-600">{t(locale, 'settings.notFound.title')}</h1>
            <p className="text-red-500">{t(locale, 'settings.notFound.desc', { projectId })}</p>
            <Button variant="ghost" asChild className="mt-4">
              <Link href="/admin"><ArrowLeft size={16} className="mr-2" />{t(locale, 'settings.backToConsole')}</Link>
            </Button>
        </div>
    );
  }

  // Determine the project's current group
  const thisProject = allProjects.find(p => p.id === projectId);
  const initialGroup = thisProject?.group || '';
  const groupNames = allGroups.map(g => g.name);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href={`/project/${projectId}`}>
            <ArrowLeft size={16} className="mr-2" />
            {t(locale, 'settings.backToProject')}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">{t(locale, 'settings.title')}</h1>
      <p className="text-slate-500 mb-8">{t(locale, 'settings.desc', { projectId })}</p>
      
      {/* Render the Client Component with all data passed as props */}
      <ProjectSettingsForm 
        projectId={projectId}
        initialConfig={config}
        allGroups={groupNames}
        initialGroup={initialGroup}
      />
    </div>
  );
}
