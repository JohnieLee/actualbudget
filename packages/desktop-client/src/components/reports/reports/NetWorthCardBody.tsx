import React, { useCallback, useState } from 'react';
import type { ReactNode } from 'react';

import { Block } from '@actual-app/components/block';
import { styles } from '@actual-app/components/styles';
import { View } from '@actual-app/components/view';
import type { NetWorthWidget } from '@actual-app/core/types/models';

import { FinancialText } from '#components/FinancialText';
import { PrivacyFilter } from '#components/PrivacyFilter';
import { Change } from '#components/reports/Change';
import { DateRange } from '#components/reports/DateRange';
import { NetWorthGraph } from '#components/reports/graphs/NetWorthGraph';
import { LoadingIndicator } from '#components/reports/LoadingIndicator';
import type { NetWorthData } from '#components/reports/spreadsheets/net-worth-spreadsheet';
import { useFormat } from '#hooks/useFormat';

import { ReportCardEmptyMessage } from './ReportCardEmptyMessage';

type NetWorthCardBodyProps = {
  title: ReactNode;
  start: string;
  end: string;
  interval: NonNullable<NonNullable<NetWorthWidget['meta']>['interval']>;
  mode: NonNullable<NonNullable<NetWorthWidget['meta']>['mode']>;
  showTooltip: boolean;
  data: NetWorthData | null;
  // Shown in place of the graph, e.g. when there is nothing to chart
  emptyMessage?: string;
};

export function NetWorthCardBody({
  title,
  start,
  end,
  interval,
  mode,
  showTooltip,
  data,
  emptyMessage,
}: NetWorthCardBodyProps) {
  const format = useFormat();

  const [isCardHovered, setIsCardHovered] = useState(false);
  const onCardHover = useCallback(() => setIsCardHovered(true), []);
  const onCardHoverEnd = useCallback(() => setIsCardHovered(false), []);

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
            <Block
              style={{
                ...styles.mediumText,
                fontWeight: 500,
                marginBottom: 5,
              }}
            >
              <PrivacyFilter activationFilters={[!isCardHovered]}>
                <FinancialText>
                  {format(data.netWorth, 'financial')}
                </FinancialText>
              </PrivacyFilter>
            </Block>
            <PrivacyFilter activationFilters={[!isCardHovered]}>
              <Change amount={data.totalChange} />
            </PrivacyFilter>
          </View>
        )}
      </View>

      {emptyMessage ? (
        <ReportCardEmptyMessage>{emptyMessage}</ReportCardEmptyMessage>
      ) : data ? (
        <NetWorthGraph
          graphData={data.graphData}
          accounts={data.accounts}
          compact
          showTooltip={showTooltip}
          interval={interval}
          mode={mode}
          style={{ height: 'auto', flex: 1 }}
        />
      ) : (
        <LoadingIndicator />
      )}
    </View>
  );
}
