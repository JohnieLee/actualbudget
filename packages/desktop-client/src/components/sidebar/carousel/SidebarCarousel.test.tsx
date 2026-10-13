import React from 'react';

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TestProviders } from '#mocks';

import { SidebarCarousel } from './SidebarCarousel';

// Real charts are covered by the end-to-end tests; these stubs record what the
// carousel passes down
const chartRenders: Array<{ name: string; isEnabled: boolean }> = [];
let failingChart: string | null = null;

function renderChartStub(name: string, { isEnabled }: { isEnabled: boolean }) {
  chartRenders.push({ name, isEnabled });
  if (failingChart === name) {
    throw new Error(`${name} failed`);
  }
  return <div data-testid={`chart-${name}`} data-enabled={isEnabled} />;
}

vi.mock('./BudgetOverviewChart', () => ({
  BudgetOverviewChart: vi.fn((props: { isEnabled: boolean }) =>
    renderChartStub('budget-overview', props),
  ),
}));
vi.mock('./NetWorthChart', () => ({
  NetWorthChart: vi.fn((props: { isEnabled: boolean }) =>
    renderChartStub('net-worth', props),
  ),
}));
vi.mock('./CashFlowChart', () => ({
  CashFlowChart: vi.fn((props: { isEnabled: boolean }) =>
    renderChartStub('cash-flow', props),
  ),
}));
vi.mock('#components/sidebar/Accounts', () => ({
  Accounts: vi.fn(() => <span role="link">All accounts</span>),
}));

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('#hooks/useNavigate', () => ({ useNavigate: () => navigate }));

type IntersectionCallback = (
  entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>,
) => void;

let observers: IntersectionCallback[] = [];

// jsdom doesn't implement IntersectionObserver
class IntersectionObserverStub {
  constructor(callback: IntersectionCallback) {
    observers.push(callback);
  }
  observe() {
    // Tests call setOnScreen to simulate intersection changes
  }
  unobserve() {
    // no-op
  }
  disconnect() {
    // no-op
  }
}

function setOnScreen(isIntersecting: boolean) {
  act(() => {
    observers.forEach(callback => callback([{ isIntersecting }]));
  });
}

function renderCarousel() {
  const result = render(
    <TestProviders>
      <SidebarCarousel />
    </TestProviders>,
  );
  setOnScreen(true);
  return result;
}

function selectedTabName() {
  const tab = screen
    .getAllByRole('tab')
    .find(tab => tab.getAttribute('aria-selected') === 'true');
  return tab?.getAttribute('aria-label');
}

function lastRender(name: string) {
  return chartRenders.filter(render => render.name === name).at(-1);
}

describe('SidebarCarousel', () => {
  beforeEach(() => {
    chartRenders.length = 0;
    failingChart = null;
    navigate.mockClear();
    observers = [];
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens on Budget Overview', () => {
    renderCarousel();

    expect(selectedTabName()).toBe('Budget Overview');
    const region = screen.getByRole('region', { name: 'Summary' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(within(region).getByText('1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(
      'Budget Overview',
    );
  });

  it('wraps around in both directions', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(selectedTabName()).toBe('Accounts');
    expect(screen.getByText('4 of 4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(selectedTabName()).toBe('Budget Overview');
  });

  it('jumps to a slide from its dot', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole('tab', { name: 'Cash Flow' }));

    expect(selectedTabName()).toBe('Cash Flow');
    expect(screen.getByTestId('chart-cash-flow')).toBeInTheDocument();
  });

  it('moves between slides with the arrow, Home and End keys', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(screen.getByRole('tab', { name: 'Budget Overview' }));
    await user.keyboard('{ArrowRight}');
    expect(selectedTabName()).toBe('Net Worth');

    await user.keyboard('{End}');
    expect(selectedTabName()).toBe('Accounts');

    await user.keyboard('{Home}');
    expect(selectedTabName()).toBe('Budget Overview');
  });

  it('keeps only the active slide in the accessibility tree', async () => {
    const user = userEvent.setup();
    renderCarousel();

    // The account links stay mounted but are unreachable while hidden
    expect(screen.queryByRole('link', { name: 'All accounts' })).toBeNull();

    await user.click(screen.getByRole('tab', { name: 'Accounts' }));

    expect(
      screen.getByRole('link', { name: 'All accounts' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('mounts chart slides on first visit and keeps them mounted', async () => {
    const user = userEvent.setup();
    renderCarousel();

    expect(screen.getByTestId('chart-budget-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-net-worth')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));

    expect(screen.getByTestId('chart-net-worth')).toBeInTheDocument();
    expect(screen.getByTestId('chart-budget-overview')).toBeInTheDocument();
  });

  it('only lets the active slide fetch while the sidebar is on screen', async () => {
    const user = userEvent.setup();
    renderCarousel();

    expect(lastRender('budget-overview')?.isEnabled).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(lastRender('net-worth')?.isEnabled).toBe(true);
    expect(lastRender('budget-overview')?.isEnabled).toBe(false);

    // The floating sidebar slides off screen
    setOnScreen(false);
    expect(lastRender('net-worth')?.isEnabled).toBe(false);
  });

  it('opens the full report when a chart card is clicked', async () => {
    const user = userEvent.setup();
    renderCarousel();

    await user.click(
      screen.getByRole('button', { name: 'Open Budget Overview report' }),
    );

    expect(navigate).toHaveBeenCalledWith('/reports/spending?mode=budget', {
      state: { goBack: true },
    });
  });

  it('isolates a failing chart from the rest of the sidebar', async () => {
    const user = userEvent.setup();
    // Error boundaries log the caught error
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
    failingChart = 'budget-overview';
    renderCarousel();

    expect(screen.getByText("Couldn't load this chart")).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Accounts' }));
    expect(
      screen.getByRole('link', { name: 'All accounts' }),
    ).toBeInTheDocument();

    failingChart = null;
    await user.click(screen.getByRole('tab', { name: 'Budget Overview' }));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByTestId('chart-budget-overview')).toBeInTheDocument();
  });
});
