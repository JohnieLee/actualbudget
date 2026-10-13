import type { DashboardWidgetEntity } from '@actual-app/core/types/models';
import { useQuery } from '@tanstack/react-query';

import { dashboardQueries } from '#reports';

type UseDashboardWidgetProps<W extends DashboardWidgetEntity> = Partial<
  Pick<W, 'id' | 'type'>
>;

export function useDashboardWidget<W extends DashboardWidgetEntity>({
  id,
  type,
}: UseDashboardWidgetProps<W>) {
  const enabled = !!id && !!type;
  const query = useQuery({
    ...dashboardQueries.listDashboardWidgets<W>(),
    select: widgets => widgets.find(w => w.id === id && w.type === type),
    enabled,
  });

  // A disabled query with nothing cached stays pending forever, so a report
  // opened without a widget id (e.g. /reports/cash-flow) would never get past
  // its loading state unless the dashboard had already filled the cache.
  return { ...query, isPending: enabled && query.isPending };
}
