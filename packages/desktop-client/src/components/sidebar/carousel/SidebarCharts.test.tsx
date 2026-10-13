import React from 'react';
import type { ReactNode } from 'react';

import { initServer } from '@actual-app/core/platform/client/connection';
import { render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { SpreadsheetProvider } from '#hooks/useSpreadsheet';
import { createTestQueryClient, TestProviders } from '#mocks';

import { CashFlowChart } from './CashFlowChart';
import { NetWorthChart } from './NetWorthChart';

vi.mock(
  '@actual-app/core/platform/client/connection',
  () => import('#mocks/connection'),
);

// jsdom does not implement matchMedia, which the charts use to check for
// reduced motion
window.matchMedia = (mediaQuery: string): MediaQueryList => ({
  matches: false,
  media: mediaQuery,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => false),
});

function renderChart(chart: ReactNode) {
  return render(
    <TestProviders queryClient={createTestQueryClient()}>
      <SpreadsheetProvider>{chart}</SpreadsheetProvider>
    </TestProviders>,
  );
}

describe('sidebar chart empty states', () => {
  let query: Mock<() => Promise<{ data: number; dependencies: string[] }>>;

  beforeEach(() => {
    query = vi.fn(async () => ({ data: 0, dependencies: [] as string[] }));
    initServer({
      'accounts-get': async () => [],
      'make-filters-from-conditions': async () => ({ filters: [] }),
      query,
    });
  });

  it('asks for an account instead of charting net worth with none', async () => {
    renderChart(<NetWorthChart title="Net Worth" isEnabled />);

    expect(
      await screen.findByText('Add an account to see net worth'),
    ).toBeInTheDocument();
    // There is nothing to chart, so the report doesn't run
    expect(query).not.toHaveBeenCalled();
  });

  it('says so when there is no income or spending this month', async () => {
    renderChart(<CashFlowChart title="Cash Flow" isEnabled />);

    expect(
      await screen.findByText('No income or expenses this month'),
    ).toBeInTheDocument();
  });

  it('shows the bars once there is income or spending', async () => {
    query.mockImplementation(async () => ({
      data: 1500,
      dependencies: [] as string[],
    }));
    renderChart(<CashFlowChart title="Cash Flow" isEnabled />);

    await waitFor(() => expect(query).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText('No income or expenses this month')).toBeNull(),
    );
  });

  it('does not fetch while disabled', async () => {
    renderChart(<CashFlowChart title="Cash Flow" isEnabled={false} />);

    // Give any fetch a chance to start
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(query).not.toHaveBeenCalled();
  });
});
