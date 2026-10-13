import React, { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Bar, BarChart, LabelList } from 'recharts';

import { PrivacyFilter } from '#components/PrivacyFilter';
import { Change } from '#components/reports/Change';
import { useRechartsAnimation } from '#components/reports/chart-theme';
import { Container } from '#components/reports/Container';
import { DateRange } from '#components/reports/DateRange';
import { LoadingIndicator } from '#components/reports/LoadingIndicator';
import type { SimpleCashFlowData } from '#components/reports/spreadsheets/cash-flow-spreadsheet';

import { CashFlowBarLabel } from './CashFlowBarLabel';
import { ReportCardEmptyMessage } from './ReportCardEmptyMessage';

// A bar label is two lines: the name, then the amount
const LABEL_HEIGHT = 32;

type CashFlowCardBodyProps = {
  title: ReactNode;
  start: string;
  end: string;
  data: SimpleCashFlowData | null;
  // Shown in place of the bars, e.g. when there is nothing to chart
  emptyMessage?: string;
  // Keeps the bar labels inside a small card, such as in the sidebar
  compact?: boolean;
};

export function CashFlowCardBody({
  title,
  start,
  end,
  data,
  emptyMessage,
  compact = false,
}: CashFlowCardBodyProps) {
  const { t } = useTranslation();
  const animationProps = useRechartsAnimation();

  const [isCardHovered, setIsCardHovered] = useState(false);
  const onCardHover = useCallback(() => setIsCardHovered(true), []);
  const onCardHoverEnd = useCallback(() => setIsCardHovered(false), []);

  const { graphData } = data || {};
  const expenses = -(graphData?.expense || 0);
  const income = graphData?.income || 0;

  return (
    <View
      style={{ flex: 1 }}
      onPointerEnter={onCardHover}
      onPointerLeave={onCardHoverEnd}
    >
      <View style={{ flexDirection: 'row', padding: 20 }}>
        <View style={{ flex: 1 }}>
          {title}
          <DateRange start={start} end={end} />
        </View>
        {data && (
          <View style={{ textAlign: 'right' }}>
            <PrivacyFilter activationFilters={[!isCardHovered]}>
              <Change amount={income - expenses} />
            </PrivacyFilter>
          </View>
        )}
      </View>

      {emptyMessage ? (
        <ReportCardEmptyMessage>{emptyMessage}</ReportCardEmptyMessage>
      ) : data ? (
        <Container style={{ height: 'auto', flex: 1 }}>
          {(width, height) => (
            <BarChart
              responsive
              width={width}
              height={height}
              data={[
                {
                  income,
                  expenses,
                },
              ]}
              margin={{
                top: 10,
                bottom: 0,
              }}
            >
              <Bar
                dataKey="income"
                fill={theme.reportsNumberPositive}
                barSize={14}
                {...animationProps}
              >
                <LabelList
                  dataKey="income"
                  position="left"
                  content={
                    <CashFlowBarLabel
                      name={t('Income')}
                      maxLabelY={compact ? height - LABEL_HEIGHT : undefined}
                    />
                  }
                />
              </Bar>

              <Bar
                dataKey="expenses"
                fill={theme.reportsNumberNegative}
                barSize={14}
                {...animationProps}
              >
                <LabelList
                  dataKey="expenses"
                  position="right"
                  content={
                    <CashFlowBarLabel
                      name={t('Expenses')}
                      maxLabelY={compact ? height - LABEL_HEIGHT : undefined}
                    />
                  }
                />
              </Bar>
            </BarChart>
          )}
        </Container>
      ) : (
        <LoadingIndicator />
      )}
    </View>
  );
}
