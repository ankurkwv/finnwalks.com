import { useQuery, useMutation, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { WalkingSlot, WeekSchedule, InsertSlot, DeleteSlot } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";

// Get the schedule for a week
export function useSchedule(startDate: string): UseQueryResult<WeekSchedule> {
  return useQuery({
    queryKey: ['/api/schedule', startDate],
    // Ensure we always have the latest data from the server
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Data is always considered stale to ensure fresh data
  });
}

// Add a new walking slot
export function useAddSlot(): UseMutationResult<WalkingSlot, Error, InsertSlot> {
  return useMutation({
    mutationFn: async (data: InsertSlot) => {
      const response = await apiRequest("POST", "/api/slot", data);
      return response.json();
    },
    onSuccess: (newSlot) => {
      // Get the current date from the new slot
      const { date } = newSlot;
      
      // Update the cache directly while also triggering a background refresh
      queryClient.invalidateQueries({ 
        queryKey: ['/api/schedule'],
        // Refetch immediately to ensure UI updates
        refetchType: 'active',
      });
    },
  });
}

// Delete a walking slot
export function useDeleteSlot(): UseMutationResult<void, Error, DeleteSlot> {
  return useMutation({
    mutationFn: async (data: DeleteSlot) => {
      await apiRequest("DELETE", "/api/slot", data);
    },
    onSuccess: (_, variables) => {
      // Get the current date from the deleted slot variables
      const { date } = variables;
      
      // Update the cache directly while also triggering a background refresh
      queryClient.invalidateQueries({ 
        queryKey: ['/api/schedule'],
        // Refetch immediately to ensure UI updates
        refetchType: 'active',
      });
    },
  });
}
