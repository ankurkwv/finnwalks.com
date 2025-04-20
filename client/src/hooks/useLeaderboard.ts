import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";

export interface LeaderboardEntry {
  name: string;
  totalWalks: number;
  colorIndex: number;
}

// Hook to fetch the all-time leaderboard
export function useAllTimeLeaderboard() {
  return useQuery({
    queryKey: ['/api/leaderboard/all-time'],
    queryFn: getQueryFn({ on401: "returnNull" })
  });
}

// Hook to fetch the next 7 days leaderboard
export function useNextWeekLeaderboard(startDate: string) {
  return useQuery({
    queryKey: ['/api/leaderboard/next-week', startDate],
    queryFn: getQueryFn({ on401: "returnNull" })
  });
}