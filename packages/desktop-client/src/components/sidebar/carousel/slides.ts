import type { TFunction } from 'i18next';

export type SidebarSlideId =
  | 'budget-overview'
  | 'net-worth'
  | 'cash-flow'
  | 'accounts';

export type SidebarSlide = {
  id: SidebarSlideId;
  title: string;
  // The full report a chart slide opens; the defaults of each chart match
  // what that page shows when opened without a saved widget
  reportUrl?: string;
};

// The sidebar summary slides in display order. The app opens on the first.
export function getSidebarSlides(t: TFunction): SidebarSlide[] {
  return [
    {
      id: 'budget-overview',
      title: t('Budget Overview'),
      reportUrl: '/reports/spending?mode=budget',
    },
    {
      id: 'net-worth',
      title: t('Net Worth'),
      reportUrl: '/reports/net-worth',
    },
    {
      id: 'cash-flow',
      title: t('Cash Flow'),
      reportUrl: '/reports/cash-flow',
    },
    { id: 'accounts', title: t('Accounts') },
  ];
}
