
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectConfig, getProjectGroups, getProjects } from '@/lib/fs-service';
import { ProjectSettingsForm } from '@/components/project-settings-form';

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  // Guard clause to ensure projectId is valid
  const { id } = await params;
  const projectId = decodeURIComponent(id);
  if (!projectId || typeof projectId !== 'string') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Invalid Project ID</h1>
        <p className="text-red-500">The project ID provided in the URL is missing or invalid.</p>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/admin"><ArrowLeft size={16} className="mr-2" />Back to Console</Link>
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
            <h1 className="text-2xl font-bold text-red-600">Project Not Found</h1>
            <p className="text-red-500">{`Project configuration for '${projectId}' could not be found.`}</p>
            <Button variant="ghost" asChild className="mt-4">
              <Link href="/admin"><ArrowLeft size={16} className="mr-2" />Back to Console</Link>
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
            Back to Project
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Project Settings</h1>
      <p className="text-slate-500 mb-8">Manage configuration for <strong>{projectId}</strong></p>
      
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
