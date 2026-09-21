/**
 * src/hooks/useDashboard.js
 *
 * React Query hook that fetches and caches all dashboard data.
 *
 * Usage:
 *   const { data, isLoading, isError, error, refetch } = useDashboard();
 *
 * The hook owns the query key, caching strategy, and retry logic.
 * Dashboard.jsx only calls this hook — it never imports the API directly.
 *
 * Requires QueryClientProvider to be set up in main.jsx:
 *   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
 *   const queryClient = new QueryClient()
 *   <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboardApi';

export function useDashboard() {
  return useQuery({
    // Unique cache key for this query.
    // ['dashboard'] is the namespace; add a user ID later for multi-account support:
    //   queryKey: ['dashboard', userId]
    queryKey: ['dashboard'],

    // The function that fetches data (mock or real, depending on VITE_USE_MOCK)
    queryFn: getDashboard,

    // Treat data as fresh for 5 minutes — avoids re-fetching on every navigation
    staleTime: 1000 * 60 * 5,

    // Keep cached data for 10 minutes after the component unmounts
    gcTime: 1000 * 60 * 10,

    // Retry up to 2 times before showing the error state
    retry: 2,

    // Don't silently refetch when the user switches back to the tab
    // (the user can always press the manual refresh button)
    refetchOnWindowFocus: false,
  });
}