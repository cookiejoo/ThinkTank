'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Folder, LayoutDashboard, GitBranch, Pencil } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  description?: string;
  group?: string;
  mode: 'git' | 'edit';
}

export default function PreviewHub() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(async res => {
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                setProjects(data);
            } else {
                console.error('Projects data is not an array:', data);
                setProjects([]);
            }
        } else {
            console.error('Failed to fetch projects:', res.status, res.statusText);
            setProjects([]);
        }
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setProjects([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Preview</h1>
            <p className="text-gray-500 mt-1">Browse and read documentation</p>
          </div>
          <div className="flex items-center gap-4">
            {(session?.user?.role === 'admin' || (session?.user?.accessibleProjects?.length ?? 0) > 0) && (
              <Button asChild>
                <Link href="/admin">
                  <LayoutDashboard size={16} className="mr-2" />
                  Manage Projects
                </Link>
              </Button>
            )}
            <UserNav />
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            {session?.user?.role === 'admin' ? (
              <>
                <h2 className="text-2xl font-semibold text-gray-800">Welcome, {session.user?.name || 'Admin'}!</h2>
                <p className="mt-3 text-gray-500">It looks like there are no projects yet. Get started by creating one.</p>
                <Button asChild className="mt-8">
                  <Link href="/admin">
                    <LayoutDashboard size={16} className="mr-2" />
                    Create Your First Project
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-800">No Projects Found</h2>
                <p className="mt-3 text-gray-500">There are currently no projects shared with you. Please contact an administrator.</p>
              </>
            )}
          </div>
        ) : (
          Array.from(
              projects.reduce((acc, project) => {
                  const groupName = project.group || '其他项目';
                  if (!acc.has(groupName)) {
                      acc.set(groupName, []);
                  }
                  acc.get(groupName)!.push(project);
                  return acc;
              }, new Map<string, Project[]>()).entries()
          ).map(([groupName, groupProjects]) => (
              <div key={groupName} className="mb-10 last:mb-0">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span>
                      {groupName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupProjects.map(project => (
                          <Link 
                              key={project.id} 
                              href={`/preview/${project.id}`}
                              className="block group"
                          >
                          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-300 transition-all h-full flex flex-col">
                              <div className="flex items-start justify-between mb-4">
                                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                      <Folder size={24} />
                                  </div>
                                  {project.mode === 'git' ? (
                                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                      <GitBranch size={12} />
                                      <span>Git</span>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                      <Pencil size={12} />
                                      <span>Online</span>
                                      </div>
                                  )}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600">{project.name}</h3>
                              <p className="text-gray-500 text-sm flex-1">{project.description || 'No description'}</p>
                          </div>
                          </Link>
                      ))}
                  </div>
              </div>
          ))
        )}
      </div>
    </div>
  );
}
