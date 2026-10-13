import { QueryObserver } from '@tanstack/react-query';

import { createTestQueryClient } from '#mocks';

import { sidebarSummaryQueries } from './queries';
import {
  createSidebarSummaryRefresher,
  touchesSidebarSummaryTables,
} from './sidebarSummaryRefresh';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

const queryKey = [...sidebarSummaryQueries.all(), 'test-slide'];

describe('touchesSidebarSummaryTables', () => {
  it('matches tables the summary reports read', () => {
    expect(touchesSidebarSummaryTables(['transactions'])).toBe(true);
    expect(touchesSidebarSummaryTables(['notes', 'category_mapping'])).toBe(
      true,
    );
    expect(touchesSidebarSummaryTables(['zero_budgets'])).toBe(true);
  });

  it('ignores other tables', () => {
    expect(touchesSidebarSummaryTables(['notes', 'rules'])).toBe(false);
    expect(touchesSidebarSummaryTables([])).toBe(false);
  });
});

describe('createSidebarSummaryRefresher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses a burst of changes into one refresh', async () => {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const refresher = createSidebarSummaryRefresher(queryClient, 1000);

    refresher.schedule();
    await vi.advanceTimersByTimeAsync(500);
    refresher.schedule();
    refresher.schedule();
    await vi.advanceTimersByTimeAsync(999);
    expect(invalidate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('does nothing once cancelled', async () => {
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const refresher = createSidebarSummaryRefresher(queryClient, 1000);

    refresher.schedule();
    refresher.cancel();
    await vi.advanceTimersByTimeAsync(2000);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('waits for a running fetch to finish, then refreshes', async () => {
    const queryClient = createTestQueryClient();
    const firstFetch = deferred<string>();
    let running = 0;
    let maxRunning = 0;
    const queryFn = vi.fn(async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      const result =
        queryFn.mock.calls.length === 1 ? await firstFetch.promise : 'fresh';
      running--;
      return result;
    });

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(vi.fn());
    expect(queryFn).toHaveBeenCalledTimes(1);

    const refresher = createSidebarSummaryRefresher(queryClient, 1000);
    refresher.schedule();
    await vi.advanceTimersByTimeAsync(1000);

    // The in-flight fetch is not cancelled or duplicated
    expect(queryFn).toHaveBeenCalledTimes(1);

    firstFetch.resolve('stale');
    await vi.advanceTimersByTimeAsync(0);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(maxRunning).toBe(1);
    expect(queryClient.getQueryData(queryKey)).toBe('fresh');
    unsubscribe();
  });

  it('refreshes a slide that was hidden while its fetch was running', async () => {
    const queryClient = createTestQueryClient();
    const firstFetch = deferred<string>();
    const queryFn = vi.fn(async () =>
      queryFn.mock.calls.length === 1 ? await firstFetch.promise : 'fresh',
    );
    const options = { queryKey, queryFn, staleTime: Infinity };

    const observer = new QueryObserver(queryClient, options);
    const unsubscribe = observer.subscribe(vi.fn());

    // The slide is hidden before its first fetch finishes
    observer.setOptions({ ...options, enabled: false });

    const refresher = createSidebarSummaryRefresher(queryClient, 1000);
    refresher.schedule();
    await vi.advanceTimersByTimeAsync(1000);
    firstFetch.resolve('stale');
    await vi.advanceTimersByTimeAsync(0);

    // Hidden slides don't fetch
    expect(queryFn).toHaveBeenCalledTimes(1);

    // Shown again, it catches up instead of keeping the stale result
    observer.setOptions({ ...options, enabled: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(queryKey)).toBe('fresh');
    unsubscribe();
  });
});

describe('sidebar summary queries while hidden', () => {
  it('refetch an invalidated query only once it is enabled again', async () => {
    const queryClient = createTestQueryClient();
    const queryFn = vi.fn(async () => 'data');

    const observer = new QueryObserver(queryClient, {
      queryKey,
      queryFn,
      staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(vi.fn());
    await vi.waitFor(() =>
      expect(queryClient.getQueryData(queryKey)).toBe('data'),
    );

    // The slide is hidden: its query is disabled
    observer.setOptions({
      queryKey,
      queryFn,
      staleTime: Infinity,
      enabled: false,
    });
    await queryClient.invalidateQueries({
      queryKey: sidebarSummaryQueries.all(),
    });
    expect(queryFn).toHaveBeenCalledTimes(1);

    // The slide is shown again
    observer.setOptions({
      queryKey,
      queryFn,
      staleTime: Infinity,
      enabled: true,
    });
    await vi.waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    unsubscribe();
  });
});
