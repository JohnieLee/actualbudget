import * as monthUtils from '@actual-app/core/shared/months';
import type { TimeFrame } from '@actual-app/core/types/models';

// Month-shaped so the range means the whole current month (the query clamps
// to today); day-shaped values here would slide by days instead.
export const defaultTimeFrame = {
  start: monthUtils.currentMonth(),
  end: monthUtils.currentMonth(),
  mode: 'sliding-window',
} satisfies TimeFrame;
