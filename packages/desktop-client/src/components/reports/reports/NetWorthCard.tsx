import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import type {
  AccountEntity,
  NetWorthWidget,
} from '@actual-app/core/types/models';

import { ReportCard } from '#components/reports/ReportCard';
import { ReportCardName } from '#components/reports/ReportCardName';
import { calculateTimeRange } from '#components/reports/reportRanges';
import { createSpreadsheet as netWorthSpreadsheet } from '#components/reports/spreadsheets/net-worth-spreadsheet';
import { useReport } from '#components/reports/useReport';
import { useDateFormat } from '#hooks/useDateFormat';
import { useFormat } from '#hooks/useFormat';
import { useLocale } from '#hooks/useLocale';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { NetWorthCardBody } from './NetWorthCardBody';

type NetWorthCardProps = {
  widgetId: string;
  isEditing?: boolean;
  accounts: AccountEntity[];
  meta?: NetWorthWidget['meta'];
  onMetaChange: (newMeta: NetWorthWidget['meta']) => void;
};

export function NetWorthCard({
  widgetId,
  isEditing,
  accounts,
  meta = {},
  onMetaChange,
}: NetWorthCardProps) {
  const locale = useLocale();
  const { t } = useTranslation();
  const { isNarrowWidth } = useResponsive();
  const [_firstDayOfWeekIdx] = useSyncedPref('firstDayOfWeekIdx');
  const firstDayOfWeekIdx = _firstDayOfWeekIdx || '0';
  const format = useFormat();
  const dateFormat = useDateFormat() || 'MM/dd/yyyy';

  const [latestTransaction, setLatestTransaction] = useState<string>('');
  const [nameMenuOpen, setNameMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchLatestTransaction() {
      const latestTrans = await send('get-latest-transaction');
      setLatestTransaction(
        latestTrans ? latestTrans.date : monthUtils.currentDay(),
      );
    }
    void fetchLatestTransaction();
  }, []);

  const [start, end] = calculateTimeRange(
    meta?.timeFrame,
    undefined,
    latestTransaction,
  );

  const params = useMemo(
    () =>
      netWorthSpreadsheet(
        start,
        end,
        accounts,
        meta?.conditions,
        meta?.conditionsOp,
        locale,
        meta?.interval || 'Monthly',
        firstDayOfWeekIdx,
        format,
        dateFormat,
      ),
    [
      start,
      end,
      accounts,
      meta?.conditions,
      meta?.conditionsOp,
      locale,
      meta?.interval,
      firstDayOfWeekIdx,
      format,
      dateFormat,
    ],
  );
  const data = useReport('net_worth', params);

  return (
    <ReportCard
      widgetId={widgetId}
      isEditing={isEditing}
      disableClick={nameMenuOpen}
      to={`/reports/net-worth/${widgetId}`}
      onRename={() => setNameMenuOpen(true)}
    >
      <NetWorthCardBody
        title={
          <ReportCardName
            name={meta?.name || t('Net Worth')}
            isEditing={nameMenuOpen}
            onChange={newName => {
              onMetaChange({
                ...meta,
                name: newName,
              });
              setNameMenuOpen(false);
            }}
            onClose={() => setNameMenuOpen(false)}
          />
        }
        start={start}
        end={end}
        interval={meta?.interval || 'Monthly'}
        mode={meta?.mode || 'trend'}
        showTooltip={!isEditing && !isNarrowWidth}
        data={data}
      />
    </ReportCard>
  );
}
