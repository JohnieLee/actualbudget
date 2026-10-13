import React from 'react';
import { useTranslation } from 'react-i18next';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { calculateTimeRange } from '#components/reports/reportRanges';
import { NetWorthCardBody } from '#components/reports/reports/NetWorthCardBody';
import { createSpreadsheet as netWorthSpreadsheet } from '#components/reports/spreadsheets/net-worth-spreadsheet';
import { useAccounts } from '#hooks/useAccounts';
import { useDateFormat } from '#hooks/useDateFormat';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { useSpreadsheet } from '#hooks/useSpreadsheet';
import { useSyncedPref } from '#hooks/useSyncedPref';
import { sidebarSummaryQueries } from '#reports';

import { SidebarChartTitle } from './SidebarChartTitle';

type NetWorthChartProps = {
  title: string;
  isEnabled: boolean;
};

export function NetWorthChart({ title, isEnabled }: NetWorthChartProps) {
  const { t } = useTranslation();
  const spreadsheet = useSpreadsheet();
  const locale = useLocale();
  const [_firstDayOfWeekIdx] = useSyncedPref('firstDayOfWeekIdx');
  const firstDayOfWeekIdx = _firstDayOfWeekIdx || '0';
  const format = useFormat();
  const dateFormat = useDateFormat() || 'MM/dd/yyyy';
  const { data: accounts = [], isPending: isLoadingAccounts } = useAccounts();
  const hasAccounts = accounts.length > 0;

  // The last 6 months, as the Net Worth report shows without a saved widget
  const [start, end] = calculateTimeRange(undefined);

  const { data } = useQuery({
    ...sidebarSummaryQueries.slide({
      slideId: 'net-worth',
      params: [start, end, accounts.map(account => account.id).join(',')],
      spreadsheet,
      getData: netWorthSpreadsheet(
        start,
        end,
        accounts,
        [],
        'and',
        locale,
        'Monthly',
        firstDayOfWeekIdx,
        format,
        dateFormat,
      ),
    }),
    enabled: isEnabled && hasAccounts,
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  return (
    <NetWorthCardBody
      title={<SidebarChartTitle>{title}</SidebarChartTitle>}
      start={start}
      end={end}
      interval="Monthly"
      mode="trend"
      // The sidebar clips overflow, so a tooltip would be cut off
      showTooltip={false}
      data={data ?? null}
      emptyMessage={
        !isLoadingAccounts && !hasAccounts
          ? t('Add an account to see net worth')
          : undefined
      }
    />
  );
}
