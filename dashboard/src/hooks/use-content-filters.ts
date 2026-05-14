'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface ContentFilters {
  searchQuery: string;
  status: string[];
  platform: string[];
  niche: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

export function useContentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current values from URL
  const filters: ContentFilters = useMemo(() => {
    return {
      searchQuery: searchParams.get('q') || '',
      status: searchParams.get('status')?.split(',').filter(Boolean) || [],
      platform: searchParams.get('platform')?.split(',').filter(Boolean) || [],
      niche: searchParams.get('niche') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
    };
  }, [searchParams]);

  // Update URL with new filters
  const updateFilters = useCallback((newFilters: Partial<ContentFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    const merged = { ...filters, ...newFilters };

    if (merged.searchQuery) params.set('q', merged.searchQuery);
    else params.delete('q');

    if (merged.status.length > 0) params.set('status', merged.status.join(','));
    else params.delete('status');

    if (merged.platform.length > 0) params.set('platform', merged.platform.join(','));
    else params.delete('platform');

    if (merged.niche) params.set('niche', merged.niche);
    else params.delete('niche');

    params.set('sortBy', merged.sortBy);
    params.set('sortOrder', merged.sortOrder);
    
    if (merged.page > 1) params.set('page', merged.page.toString());
    else params.delete('page');

    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams, filters]);

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    filters,
    updateFilters,
    clearFilters
  };
}
