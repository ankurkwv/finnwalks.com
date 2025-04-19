import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Walker } from '@shared/schema';

// Search walkers by name (for autocomplete)
export function useSearchWalkers(query: string) {
  return useQuery({
    queryKey: ['walkers', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const data = await apiRequest<Walker[]>(`/api/walkers/search?q=${encodeURIComponent(query)}`);
      return data || [];
    },
    enabled: !!query.trim(),
    staleTime: 10000, // Cache results for 10 seconds
  });
}

// Get a walker by exact name
export function useWalker(name: string) {
  return useQuery({
    queryKey: ['walkers', name],
    queryFn: async () => {
      if (!name.trim()) return null;
      try {
        return await apiRequest<Walker>(`/api/walkers/${encodeURIComponent(name)}`);
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