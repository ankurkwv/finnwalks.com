import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Walker } from '@shared/schema';

// Search walkers by name (for autocomplete)
export function useSearchWalkers(query: string) {
  return useQuery({
    queryKey: ['/api/walkers/search?q=' + encodeURIComponent(query)],
    queryFn: async ({ queryKey }) => {
      if (!query.trim()) return [];
      // Use default queryFn
      const res = await fetch(queryKey[0] as string);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Failed to fetch walkers');
      }
      return await res.json();
    },
    enabled: !!query.trim(),
    staleTime: 10000, // Cache results for 10 seconds
  });
}

// Get a walker by exact name
export function useWalker(name: string) {
  return useQuery({
    queryKey: [`/api/walkers/${encodeURIComponent(name)}`],
    queryFn: async ({ queryKey }) => {
      if (!name.trim()) return null;
      try {
        const res = await fetch(queryKey[0] as string);
        if (!res.ok) {
          if (res.status === 404) return null;
          throw new Error('Failed to fetch walker');
        }
        return await res.json();
      } catch (err) {
        // If 404, return null
        if (err instanceof Error && err.message.includes('404')) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!name.trim(),
    staleTime: 60000, // Cache results for 1 minute
  });
}