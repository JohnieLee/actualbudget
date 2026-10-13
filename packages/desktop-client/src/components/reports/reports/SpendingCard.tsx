import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SpendingWidget } from '@actual-app/core/types/models';

import { ReportCard } from '#components/reports/ReportCard';
import { ReportCardName } from '#components/reports/ReportCardName';
import { calculateSpendingReportTimeRange } from '#components/reports/reportRanges';
import { normalizeSpendingAverageRange } from '#components/reports/spendingAverageRange';
import { createSpendingSpreadsheet } from '#components/reports/spreadsheets/spending-spreadsheet';
import { useReport } from '#components/reports/useReport';
import { useSyncedPref } from '#hooks/useSyncedPref';

import { SpendingCardBody } from './SpendingCardBody';

type SpendingCardProps = {
  widgetId: string;
  isEditing?: boolean;
  meta?: SpendingWidget['meta'];
  onMetaChange: (newMeta: SpendingWidget['meta']) => void;
};

export function SpendingCard({
  widgetId,
  isEditing,
  meta = {},
  onMetaChange,
}: SpendingCardProps) {
  const { t } = useTranslation();
  const [budgetTypePref] = useSyncedPref('budgetType');
  const budgetType: 'envelope' | 'tracking' =
    budgetTypePref === 'tracking' ? 'tracking' : 'envelope';

  const [nameMenuOpen, setNameMenuOpen] = useState(false);

  const averageRange = normalizeSpendingAverageRange(meta?.averageRange);

  const [compare, compareTo] = calculateSpendingReportTimeRange(meta ?? {});

  const getGraphData = useMemo(() => {
    return createSpendingSpreadsheet({
      conditions: meta?.conditions,
      conditionsOp: meta?.conditionsOp,
      compare,
      compareTo,
      averageRange,
      budgetType,
    });
  }, [
    meta?.conditions,
    meta?.conditionsOp,
    compare,
    compareTo,
    averageRange,
    budgetType,
  ]);

  const data = useReport('default', getGraphData);

  return (
    <ReportCard
      widgetId={widgetId}
      isEditing={isEditing}
      disableClick={nameMenuOpen}
      to={`/reports/spending/${widgetId}`}
      onRename={() => setNameMenuOpen(true)}
    >
      <SpendingCardBody
        title={
          <ReportCardName
            name={meta?.name || t('Monthly Spending')}
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
        meta={meta}
        compare={compare}
        compareTo={compareTo}
        data={data}
      />
    </ReportCard>
  );
}
