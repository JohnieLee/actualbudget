import type { QueryClient } from '@tanstack/react-query';

import { SIDEBAR_SUMMARY_TABLES, sidebarSummaryQueries } from './queries';

const REFRESH_DELAY_MS = 1000;

export function touchesSidebarSummaryTables(tables: string[]) {
  return SIDEBAR_SUMMARY_TABLES.some(table => tables.includes(table));
}

function waitUntilIdle(queryClient: QueryClient, queryKey: string[]) {
  return new Promise<void>(resolve => {
    if (queryClient.isFetching({ queryKey }) === 0) {
      resolve();
      return;
    }
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      if (queryClient.isFetching({ queryKey }) === 0) {
        unsubscribe();
        resolve();
      }
    });
  });
}

// Refreshes the sidebar summary queries after data changes. A bank sync or a
// bulk edit fires many sync events, so they are collapsed into one refresh
// that runs once the events stop for a moment.
export function createSidebarSummaryRefresher(
  queryClient: QueryClient,
  delayMs = REFRESH_DELAY_MS,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function refresh() {
    timer = null;
    const queryKey = sidebarSummaryQueries.all();

    // A fetch that is still running may have read the data before this
    // change, and its result would clear an invalidation made now. Worker
    // queries can't be aborted, so wait for it to finish rather than starting
    // a second one alongside it.
    await waitUntilIdle(queryClient, queryKey);
    await queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false });
  }

  return {
    schedule() {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => void refresh(), delayMs);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
