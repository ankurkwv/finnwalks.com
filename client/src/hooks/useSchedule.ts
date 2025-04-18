import { useQuery, useMutation, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { WalkingSlot, WeekSchedule, InsertSlot, DeleteSlot } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { queryClient } from "../lib/queryClient";

// Get the schedule for a week
export function useSchedule(startDate: string): UseQueryResult<WeekSchedule> {
  return useQuery({
    queryKey: [`/api/schedule?start=${startDate}`],
    refetchOnWindowFocus: true, // Update if user comes back to the window
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  });
}

// Add a new walking slot
export function useAddSlot(): UseMutationResult<WalkingSlot, Error, InsertSlot> {
  return useMutation({
    mutationFn: async (data: InsertSlot) => {
      const response = await apiRequest("POST", "/api/slot", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate schedule queries to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
    },
  });
}

// Delete a walking slot
export function useDeleteSlot(): UseMutationResult<void, Error, DeleteSlot> {
  return useMutation({
    mutationFn: async (data: DeleteSlot) => {
      await apiRequest("DELETE", "/api/slot", data);
    },
    onSuccess: () => {
      // Invalidate schedule queries to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
    },
  });
}
