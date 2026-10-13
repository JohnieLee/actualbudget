import type { ReactNode } from 'react';

import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

type ReportCardEmptyMessageProps = {
  children: ReactNode;
};

export function ReportCardEmptyMessage({
  children,
}: ReportCardEmptyMessageProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingInline: 20,
        paddingBottom: 20,
        textAlign: 'center',
        color: theme.pageTextSubdued,
      }}
    >
      {children}
    </View>
  );
}
