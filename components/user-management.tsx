'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Shield, ShieldAlert, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/components/i18n-provider';

interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user';
  accessibleProjects: string[];
}

interface Project {
  id: string;
  name: string;
  group?: string;
}

export function UserManagement() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  
  // Edit User State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/projects')
      ]);
      
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      if (projectsRes.ok) {
        setProjects(await projectsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          accessibleProjects: []
        })
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        loadData();
      } else {
        alert(t('users.createFailed'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (user: UserData) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      if (res.ok) {
        setEditingUser(null);
        loadData();
      } else {
        alert(t('users.updateFailed'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleProjectAccess = (userId: string, projectId: string, currentProjects: string[]) => {
      if (!editingUser) return;
      
      const newProjects = currentProjects.includes(projectId)
        ? currentProjects.filter(id => id !== projectId)
        : [...currentProjects, projectId];
      
      setEditingUser({
          ...editingUser,
          accessibleProjects: newProjects
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('users.title')}</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" /> {t('users.add')}
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500">{t('users.col.user')}</th>
              <th className="px-4 py-3 font-medium text-slate-500">{t('users.col.role')}</th>
              <th className="px-4 py-3 font-medium text-slate-500">{t('users.col.access')}</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">{t('users.col.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <User size={14} />
                    </div>
                    {user.username}
                </td>
                <td className="px-4 py-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-indigo-600' : ''}>
                        {user.role}
                    </Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">
                    {user.role === 'admin' ? (
                        <span className="text-xs italic text-green-600 flex items-center gap-1">
                            <Shield size={12} /> {t('users.fullAccess')}
                        </span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {user.accessibleProjects.length === 0 ? (
                                <span className="text-xs italic text-slate-400">{t('users.noProjects')}</span>
                            ) : (
                                user.accessibleProjects.map(pid => (
                                    <span key={pid} className="bg-slate-100 px-1.5 py-0.5 rounded text-xs border">
                                        {pid}
                                    </span>
                                ))
                            )}
                        </div>
                    )}
                </td>
                <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                        {t('action.edit')}
                    </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('login.username')}</Label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('login.password')}</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('users.role')}</Label>
              <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        checked={newRole === 'user'} 
                        onChange={() => setNewRole('user')}
                      />
                      {t('users.role.user')}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="role" 
                        checked={newRole === 'admin'} 
                        onChange={() => setNewRole('admin')}
                      />
                      {t('users.role.admin')}
                  </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t('action.cancel')}</Button>
            <Button onClick={handleCreate}>{t('users.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('users.editTitle', { username: editingUser?.username || '' })}</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>{t('users.role')}</Label>
                  <div className="flex gap-4 border p-3 rounded bg-slate-50">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="radio" 
                            name="edit_role" 
                            checked={editingUser.role === 'user'} 
                            onChange={() => setEditingUser({...editingUser, role: 'user'})}
                          />
                          {t('users.role.userRestricted')}
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input 
                            type="radio" 
                            name="edit_role" 
                            checked={editingUser.role === 'admin'} 
                            onChange={() => setEditingUser({...editingUser, role: 'admin'})}
                          />
                          {t('users.role.adminFull')}
                      </label>
                  </div>
                </div>

                {editingUser.role === 'user' && (
                    <div className="space-y-3">
                        <Label>{t('users.projectAccess')}</Label>
                        <div className="border p-4 rounded max-h-80 overflow-y-auto space-y-4">
                            {Array.from(
                                projects.reduce((acc, project) => {
                                    const groupName = project.group || t('preview.otherGroup');
                                    if (!acc.has(groupName)) {
                                        acc.set(groupName, []);
                                    }
                                    acc.get(groupName)!.push(project);
                                    return acc;
                                }, new Map<string, Project[]>()).entries()
                            ).map(([groupName, groupProjects]) => (
                                <div key={groupName}>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{groupName}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {groupProjects.map(project => (
                                            <label key={project.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer border">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${editingUser.accessibleProjects.includes(project.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white'}`}>
                                                    {editingUser.accessibleProjects.includes(project.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="hidden"
                                                    checked={editingUser.accessibleProjects.includes(project.id)}
                                                    onChange={() => toggleProjectAccess(editingUser.id, project.id, editingUser.accessibleProjects)}
                                                />
                                                <span className="text-sm font-medium">{project.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="space-y-2">
                    <Label>{t('users.changePassword')}</Label>
                    <Input type="password" placeholder={t('users.newPassword')} onChange={(e) => {
                         // We handle this by adding a temporary password field to the object being sent, 
                         // but for UI state simplicity here we might need a separate state or just attach it
                         (editingUser as any).password = e.target.value;
                    }} />
                </div>
              </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>{t('action.cancel')}</Button>
            <Button onClick={() => editingUser && handleUpdate(editingUser)}>{t('settings.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
