import React, { useId } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';

import { useNavigate } from '#hooks/useNavigate';

import { SidebarChartErrorFallback } from './SidebarChartErrorFallback';

const CARD_HEIGHT = 200;

type SidebarChartCardProps = {
  title: string;
  // The full report a click on the card opens
  to: string;
  children: ReactNode;
};

// The frame of a chart slide: an inset card that opens the full report, and
// an error boundary so a failing chart can't take down the rest of the sidebar
export function SidebarChartCard({
  title,
  to,
  children,
}: SidebarChartCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reset } = useQueryErrorResetBoundary();
  const descriptionId = useId();

  return (
    <View style={{ paddingInline: 8, paddingTop: 8, flexShrink: 0 }}>
      <View
        // Chart content depends on the current date, so screenshot tests mask it
        data-vrt-mask="true"
        style={{
          height: CARD_HEIGHT,
          backgroundColor: theme.tableBackground,
          color: theme.tableText,
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <SidebarChartErrorFallback onRetry={resetErrorBoundary} />
          )}
        >
          <Button
            variant="bare"
            aria-label={t('Open {{name}} report', { name: title })}
            aria-describedby={descriptionId}
            onPress={() => navigate(to, { state: { goBack: true } })}
            style={{
              height: '100%',
              width: '100%',
              background: 'transparent',
              padding: 0,
              textAlign: 'left',
              alignItems: 'stretch',
            }}
          >
            <View id={descriptionId} style={{ flex: 1, minWidth: 0 }}>
              {children}
            </View>
          </Button>
        </ErrorBoundary>
      </View>
    </View>
  );
}
