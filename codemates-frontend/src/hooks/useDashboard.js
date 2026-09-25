// src/hooks/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboardApi';

export function useDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 30_000,
  });
  return { data, isLoading, isError, error, refetch };
}