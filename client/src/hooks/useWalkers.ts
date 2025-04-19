import { useQuery } from '@tanstack/react-query';
import { Walker } from '@shared/schema';
import { getQueryFn, queryClient } from '@/lib/queryClient';

// Hook to fetch the list of walkers
export function useWalkers() {
  return useQuery({
    queryKey: ['/api/walkers'],
    queryFn: getQueryFn({ on401: 'throw' })
  });
}

// Hook to add a new walker
export function useAddWalker() {
  return async (name: string, phone?: string) => {
    try {
      const response = await fetch('/api/walker', {
        method: 'POST',
        body: JSON.stringify({ name, phone }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to add walker');
      }
      
      const walker = await response.json();
      
      // Invalidate the walkers cache
      queryClient.invalidateQueries({ queryKey: ['/api/walkers'] });
      
      return walker as Walker;
    } catch (error) {
      console.error('Error adding walker:', error);
      throw error;
    }
  };
}