import React from 'react';
import { useTranslation } from 'react-i18next';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { calculateTimeRange } from '#components/reports/reportRanges';
import { CashFlowCardBody } from '#components/reports/reports/CashFlowCardBody';
import { defaultTimeFrame } from '#components/reports/reports/cashFlowTimeFrame';
import { simpleCashFlow } from '#components/reports/spreadsheets/cash-flow-spreadsheet';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { sidebarSummaryQueries } from '#reports';

import { SidebarChartTitle } from './SidebarChartTitle';

type CashFlowChartProps = {
  title: string;
  isEnabled: boolean;
};

export function CashFlowChart({ title, isEnabled }: CashFlowChartProps) {
  const { t } = useTranslation();
  const spreadsheet = useSpreadsheet();

  // The current month, as the Cash Flow report shows without a saved widget
  const [start, end] = calculateTimeRange(undefined, defaultTimeFrame);

  const { data } = useQuery({
    ...sidebarSummaryQueries.slide({
      slideId: 'cash-flow',
      params: [start, end],
      spreadsheet,
      getData: simpleCashFlow(start, end),
    }),
    enabled: isEnabled,
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const isEmpty =
    data != null && data.graphData.income === 0 && data.graphData.expense === 0;

  return (
    <CashFlowCardBody
      title={<SidebarChartTitle>{title}</SidebarChartTitle>}
      start={start}
      end={end}
      data={data ?? null}
      compact
      emptyMessage={isEmpty ? t('No income or expenses this month') : undefined}
    />
  );
}
