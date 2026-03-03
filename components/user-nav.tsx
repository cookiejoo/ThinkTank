'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function UserNav() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Button variant="outline" onClick={() => signIn()}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <User size={16} />
        </div>
        <span className="hidden sm:inline-block font-medium truncate max-w-[150px]">
            {session.user?.name}
        </span>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        title="Sign Out"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
      >
        <LogOut size={18} />
      </Button>
    </div>
  );
}
