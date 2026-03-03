import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserConfig {
  starred: string[];
  recent: string[];
}

export function useUserConfig(projectId: string) {
  const [config, setConfig] = useState<UserConfig>({ starred: [], recent: [] });
  const [loaded, setLoaded] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      setLoaded(false); // Set loading state before fetch
      fetch(`/api/user/config?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => {
            setConfig(data || { starred: [], recent: [] });
        })
        .catch(() => {
            // In case of error, still provide a default config
            setConfig({ starred: [], recent: [] });
        })
        .finally(() => {
            setLoaded(true);
        });
    } else if (status === 'unauthenticated') {
        // For visitors, config is always empty and loaded is always true
        setConfig({ starred: [], recent: [] });
        setLoaded(true);
    }
    // While status is 'loading', do nothing.
  }, [projectId, status]);

  const toggleStar = async (path: string) => {
    const originalConfig = config;
    // Optimistic update
    const isStarred = config.starred.includes(path);
    const newStarred = isStarred
      ? config.starred.filter(p => p !== path)
      : [...config.starred, path];
      
    setConfig({ ...config, starred: newStarred });

    try {
      await fetch('/api/user/star', {
        method: 'POST',
        body: JSON.stringify({ projectId, path })
      });
    } catch (e) {
      // Revert on error
      setConfig(originalConfig);
    }
  };

  const addRecent = async (path: string) => {
    if (!path) return;
    
    const originalConfig = config;
    // Optimistic update
    const newRecent = [path, ...config.recent.filter(p => p !== path)].slice(0, 20);
    setConfig({ ...config, recent: newRecent });

    try {
      await fetch('/api/user/recent', {
        method: 'POST',
        body: JSON.stringify({ projectId, path })
      });
    } catch (e) {
      // Revert on error
      setConfig(originalConfig);
    }
  };
  
  const isStarred = (path: string) => config.starred.includes(path);

  return { config, toggleStar, addRecent, isStarred, loaded };
}
