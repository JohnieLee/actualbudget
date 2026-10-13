import React from 'react';
import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';

type SidebarChartErrorFallbackProps = {
  onRetry: () => void;
};

export function SidebarChartErrorFallback({
  onRetry,
}: SidebarChartErrorFallbackProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <Text>
        <Trans>Couldn't load this chart</Trans>
      </Text>
      <Button onPress={onRetry}>
        <Trans>Try again</Trans>
      </Button>
    </View>
  );
}
