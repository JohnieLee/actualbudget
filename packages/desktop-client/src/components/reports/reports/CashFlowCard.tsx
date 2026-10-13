import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { send } from '@actual-app/core/platform/client/connection';
import * as monthUtils from '@actual-app/core/shared/months';
import type { CashFlowWidget } from '@actual-app/core/types/models';

import { ReportCard } from '#components/reports/ReportCard';
import { ReportCardName } from '#components/reports/ReportCardName';
import { calculateTimeRange } from '#components/reports/reportRanges';
import { simpleCashFlow } from '#components/reports/spreadsheets/cash-flow-spreadsheet';
import { useReport } from '#components/reports/useReport';

import { CashFlowCardBody } from './CashFlowCardBody';
import { defaultTimeFrame } from './cashFlowTimeFrame';

type CashFlowCardProps = {
  widgetId: string;
  isEditing?: boolean;
  meta?: CashFlowWidget['meta'];
  onMetaChange: (newMeta: CashFlowWidget['meta']) => void;
};

export function CashFlowCard({
  widgetId,
  isEditing,
  meta = {},
  onMetaChange,
}: CashFlowCardProps) {
  const { t } = useTranslation();
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
    defaultTimeFrame,
    latestTransaction,
  );

  const params = useMemo(
    () => simpleCashFlow(start, end, meta?.conditions, meta?.conditionsOp),
    [start, end, meta?.conditions, meta?.conditionsOp],
  );
  const data = useReport('cash_flow_simple', params);

  return (
    <ReportCard
      widgetId={widgetId}
      isEditing={isEditing}
      disableClick={nameMenuOpen}
      to={`/reports/cash-flow/${widgetId}`}
      onRename={() => setNameMenuOpen(true)}
    >
      <CashFlowCardBody
        title={
          <ReportCardName
            name={meta?.name || t('Cash Flow')}
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
        data={data}
      />
    </ReportCard>
  );
}
