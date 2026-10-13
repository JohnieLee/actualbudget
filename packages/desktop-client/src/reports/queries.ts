import { send } from '@actual-app/core/platform/client/connection';
import { q } from '@actual-app/core/shared/query';
import type {
  CustomReportEntity,
  DashboardPageEntity,
  DashboardWidgetEntity,
} from '@actual-app/core/types/models';
import { queryOptions } from '@tanstack/react-query';

import type { useSpreadsheet } from '#hooks/useSpreadsheet';
import { aqlQuery } from '#queries/aqlQuery';

export const reportQueries = {
  all: () => ['reports'],
  lists: () => [...reportQueries.all(), 'lists'],
  list: () =>
    queryOptions<CustomReportEntity[]>({
      queryKey: [...reportQueries.lists()],
      queryFn: async () => {
        return await send('report/get');
      },
    }),
};

export const dashboardQueries = {
  all: () => ['dashboards'],
  lists: () => [...dashboardQueries.all(), 'lists'],
  listDashboardWidgets: <T extends DashboardWidgetEntity>() =>
    queryOptions<T[]>({
      queryKey: [...dashboardQueries.lists(), 'widgets'],
      queryFn: async () => {
        const { data }: { data: T[] } = await aqlQuery(
          q('dashboard').select('*'),
        );
        return data;
      },
    }),
  listDashboardPageWidgets: <T extends DashboardWidgetEntity>(
    dashboardPageId?: DashboardPageEntity['id'] | null,
  ) =>
    queryOptions<T[]>({
      ...dashboardQueries.listDashboardWidgets<T>(),
      select: widgets =>
        widgets.filter(w => w.dashboard_page_id === dashboardPageId),
      enabled: !!dashboardPageId,
    }),
  listDashboardPages: () =>
    queryOptions<DashboardPageEntity[]>({
      queryKey: [...dashboardQueries.lists(), 'pages'],
      queryFn: async () => {
        const { data }: { data: DashboardPageEntity[] } = await aqlQuery(
          q('dashboard_pages').select('*'),
        );
        return data.map(page => ({ ...page, name: page.name ?? '' }));
      },
    }),
};

type Spreadsheet = ReturnType<typeof useSpreadsheet>;

// The shape every report spreadsheet function shares, e.g. `simpleCashFlow()`
export type ReportGetData<T> = (
  spreadsheet: Spreadsheet,
  setData: (data: T) => void,
) => Promise<void>;

// Every table the sidebar summary reports read, directly or through an AQL
// view. Add to this list when one of those reports starts reading a new table.
// `preferences` covers the synced prefs the reports depend on, such as the
// budget type and number format.
export const SIDEBAR_SUMMARY_TABLES = [
  'transactions',
  'accounts',
  'categories',
  'category_groups',
  'category_mapping',
  'payees',
  'payee_mapping',
  'zero_budgets',
  'reflect_budgets',
  'preferences',
];

function runReport<T>(
  spreadsheet: Spreadsheet,
  getData: ReportGetData<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let hasData = false;
    getData(spreadsheet, data => {
      hasData = true;
      resolve(data);
    }).then(() => {
      if (!hasData) {
        reject(new Error('Report finished without returning data'));
      }
    }, reject);
  });
}

export const sidebarSummaryQueries = {
  all: () => ['sidebar-summary'],
  slide: <T>({
    slideId,
    params,
    spreadsheet,
    getData,
  }: {
    slideId: string;
    // Everything that changes the report's result, e.g. its date range
    params: Array<string | number | boolean>;
    spreadsheet: Spreadsheet;
    getData: ReportGetData<T>;
  }) =>
    queryOptions<T>({
      queryKey: [...sidebarSummaryQueries.all(), slideId, ...params],
      queryFn: () => runReport(spreadsheet, getData),
      // Refreshed by invalidation from sync-events.ts, not by time
      staleTime: Infinity,
      // Local RPCs don't fail transiently, so show the error straight away
      retry: false,
    }),
};
