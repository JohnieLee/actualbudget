import React from 'react';
import type { ReactNode } from 'react';

import { Block } from '@actual-app/components/block';
import { styles } from '@actual-app/components/styles';

type SidebarChartTitleProps = {
  children: ReactNode;
};

export function SidebarChartTitle({ children }: SidebarChartTitleProps) {
  return (
    <Block style={{ ...styles.mediumText, marginBottom: 5 }}>{children}</Block>
  );
}
