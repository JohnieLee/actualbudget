import React from 'react';

import type { SpendingWidget } from '@actual-app/core/types/models';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { calculateSpendingReportTimeRange } from '#components/reports/reportRanges';
import { SpendingCardBody } from '#components/reports/reports/SpendingCardBody';
import { normalizeSpendingAverageRange } from '#components/reports/spendingAverageRange';
import { createSpendingSpreadsheet } from '#components/reports/spreadsheets/spending-spreadsheet';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { sidebarSummaryQueries } from '#reports';

import { SidebarChartTitle } from './SidebarChartTitle';

// Monthly Spending, compared against the budget for the current month
const meta = { mode: 'budget' } satisfies NonNullable<SpendingWidget['meta']>;

type BudgetOverviewChartProps = {
  title: string;
  isEnabled: boolean;
};

export function BudgetOverviewChart({
  title,
  isEnabled,
}: BudgetOverviewChartProps) {
  const spreadsheet = useSpreadsheet();
  const [budgetTypePref] = useSyncedPref('budgetType');
  const budgetType: 'envelope' | 'tracking' =
    budgetTypePref === 'tracking' ? 'tracking' : 'envelope';

  const [compare, compareTo] = calculateSpendingReportTimeRange(meta);

  const { data } = useQuery({
    ...sidebarSummaryQueries.slide({
      slideId: 'budget-overview',
      params: [compare, compareTo, budgetType],
      spreadsheet,
      getData: createSpendingSpreadsheet({
        compare,
        compareTo,
        averageRange: normalizeSpendingAverageRange(undefined),
        budgetType,
      }),
    }),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  return (
    <SpendingCardBody
      title={<SidebarChartTitle>{title}</SidebarChartTitle>}
      meta={meta}
      compare={compare}
      compareTo={compareTo}
      data={data ?? null}
      // The sidebar clips overflow, so a tooltip would be cut off
      showTooltip={false}
    />
  );
}
