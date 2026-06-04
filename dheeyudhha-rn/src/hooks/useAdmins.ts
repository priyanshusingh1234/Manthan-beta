import { useState, useEffect } from 'react';

let cachedAdminIds: string[] | null = null;
let lastFetch = 0;

export function useAdmins() {
  const [adminIds, setAdminIds] = useState<string[]>(cachedAdminIds || []);

  useEffect(() => {
    const fetchAdmins = async () => {
      if (cachedAdminIds && Date.now() - lastFetch < 300000) {
        setAdminIds(cachedAdminIds);
        return;
      }
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manthan-beta-c975.vercel.app';
        const res = await fetch(`${API_URL}/api/admins`);
        if (res.ok) {
          const data = await res.json();
          cachedAdminIds = data.adminIds || [];
          lastFetch = Date.now();
          setAdminIds(cachedAdminIds!);
        }
      } catch (err) {
        console.warn('Failed to fetch admin list', err);
      }
    };
    fetchAdmins();
  }, []);

  return { adminIds, isAdmin: (userId?: string | null) => userId ? adminIds.includes(userId) : false };
}
