import type { ReactNode } from 'react';

import { initServer } from '@actual-app/core/platform/client/connection';
import { renderHook, waitFor } from '@testing-library/react';

import { createTestQueryClient, TestProviders } from '#mocks';

import { useDashboardWidget } from './useDashboardWidget';

vi.mock(
  '@actual-app/core/platform/client/connection',
  () => import('#mocks/connection'),
);

const widget = {
  id: 'widget-1',
  dashboard_page_id: 'page-1',
  type: 'net-worth-card',
  x: 0,
  y: 0,
  width: 4,
  height: 2,
  meta: null,
  tombstone: false,
};

describe('useDashboardWidget', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  function wrapper({ children }: { children: ReactNode }) {
    return <TestProviders queryClient={queryClient}>{children}</TestProviders>;
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    initServer({
      query: async () => ({ data: [widget], dependencies: [] }),
    });
  });

  it('is not pending when there is no widget id', () => {
    const { result } = renderHook(
      () => useDashboardWidget({ id: undefined, type: 'net-worth-card' }),
      { wrapper },
    );

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('loads the widget when there is an id', async () => {
    const { result } = renderHook(
      () => useDashboardWidget({ id: 'widget-1', type: 'net-worth-card' }),
      { wrapper },
    );

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toEqual(widget);
  });
});
