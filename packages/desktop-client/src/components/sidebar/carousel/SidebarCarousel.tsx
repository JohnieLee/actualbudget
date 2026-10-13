import React, { useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import {
  SvgCheveronLeft,
  SvgCheveronRight,
} from '@actual-app/components/icons/v1';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { css } from '@emotion/css';

import { Accounts } from '#components/sidebar/Accounts';
import { useIsInViewport } from '#hooks/useIsInViewport';

import { BudgetOverviewChart } from './BudgetOverviewChart';
import { CashFlowChart } from './CashFlowChart';
import { NetWorthChart } from './NetWorthChart';
import { SidebarChartCard } from './SidebarChartCard';
import { getSidebarSlides } from './slides';
import type { SidebarSlide, SidebarSlideId } from './slides';

const SLIDE_TRANSITION_MS = 200;

const tabsClassName = css({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minHeight: 0,
});

const dotsClassName = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  flexShrink: 0,
});

const dotClassName = css({
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 12,
  cursor: 'pointer',
  outline: 'none',
  '&::before': {
    content: '""',
    width: 7,
    height: 7,
    borderRadius: '50%',
    boxSizing: 'border-box',
    border: `1px solid ${theme.sidebarItemText}`,
    opacity: 0.6,
  },
  '&[data-hovered]::before': {
    opacity: 1,
  },
  '&[data-selected]::before': {
    backgroundColor: theme.sidebarItemTextSelected,
    borderColor: theme.sidebarItemTextSelected,
    opacity: 1,
  },
  '&[data-focus-visible]': {
    boxShadow: `inset 0 0 0 2px ${theme.sidebarItemAccentSelected}`,
  },
});

// Offset of a slide from the active one, in slide widths. The arrows wrap
// around, so each slide sits on the side it will come in from.
function slideOffset(index: number, activeIndex: number, count: number) {
  const offset = (index - activeIndex + count) % count;
  return offset > count / 2 ? offset - count : offset;
}

function slideClassName(offset: number) {
  const isActive = offset === 0;
  return css({
    gridArea: '1 / 1',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    outline: 'none',
    transform: `translateX(${offset * 100}%)`,
    // `visibility: hidden` keeps the layout size, so charts can still measure
    // themselves, and takes the slide out of the tab order and accessibility
    // tree. The outgoing slide is only hidden once it has moved out of view.
    visibility: isActive ? 'visible' : 'hidden',
    transition: `transform ${SLIDE_TRANSITION_MS}ms ease, visibility 0s linear ${
      isActive ? 0 : SLIDE_TRANSITION_MS
    }ms`,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  });
}

export function SidebarCarousel() {
  const { t } = useTranslation();
  const slides = getSidebarSlides(t);

  const [activeId, setActiveId] = useState<SidebarSlideId>(slides[0].id);
  // Chart slides mount on their first visit and then stay mounted, so going
  // back to one shows its last chart straight away
  const [visitedIds, setVisitedIds] = useState<SidebarSlideId[]>([
    slides[0].id,
  ]);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  // False while the floating sidebar is hidden off screen
  const isOnScreen = useIsInViewport(viewport);

  const activeIndex = slides.findIndex(slide => slide.id === activeId);
  const activeSlide = slides[activeIndex];

  function selectSlide(id: SidebarSlideId) {
    setActiveId(id);
    if (!visitedIds.includes(id)) {
      setVisitedIds([...visitedIds, id]);
    }
  }

  function step(delta: number) {
    const index = (activeIndex + delta + slides.length) % slides.length;
    selectSlide(slides[index].id);
  }

  function renderSlide(slide: SidebarSlide) {
    // The Accounts slide is always mounted: it holds the account links
    if (slide.id === 'accounts') {
      return <Accounts />;
    }
    if (!visitedIds.includes(slide.id) || !slide.reportUrl) {
      return null;
    }

    // Only the slide on screen fetches; the others catch up when shown
    const isEnabled = slide.id === activeId && isOnScreen;
    return (
      <SidebarChartCard title={slide.title} to={slide.reportUrl}>
        {slide.id === 'budget-overview' ? (
          <BudgetOverviewChart title={slide.title} isEnabled={isEnabled} />
        ) : slide.id === 'net-worth' ? (
          <NetWorthChart title={slide.title} isEnabled={isEnabled} />
        ) : (
          <CashFlowChart title={slide.title} isEnabled={isEnabled} />
        )}
      </SidebarChartCard>
    );
  }

  return (
    <View
      role="region"
      aria-roledescription={t('carousel')}
      aria-label={t('Summary')}
      style={{
        flexGrow: 1,
        '@media screen and (max-height: 480px)': {
          minHeight: 'auto',
        },
      }}
    >
      <View
        style={{
          height: 1,
          backgroundColor: theme.sidebarItemBackgroundHover,
          marginTop: 15,
          flexShrink: 0,
        }}
      />

      <Tabs
        selectedKey={activeId}
        onSelectionChange={key => {
          const slide = slides.find(s => s.id === key);
          if (slide) {
            selectSlide(slide.id);
          }
        }}
        className={tabsClassName}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingInline: 8,
            marginTop: 10,
            flexShrink: 0,
          }}
        >
          <Button
            variant="bare"
            aria-label={t('Previous slide')}
            onPress={() => step(-1)}
            style={{ color: theme.sidebarItemText }}
          >
            <SvgCheveronLeft width={14} height={14} />
          </Button>
          <View
            aria-live="polite"
            style={{ flex: 1, alignItems: 'center', minWidth: 0 }}
          >
            <Text
              style={{
                fontWeight: 600,
                color: theme.sidebarItemText,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {activeSlide.title}
            </Text>
            <Text style={{ fontSize: 12, color: theme.sidebarItemText }}>
              {t('{{current}} of {{total}}', {
                current: activeIndex + 1,
                total: slides.length,
              })}
            </Text>
          </View>
          <Button
            variant="bare"
            aria-label={t('Next slide')}
            onPress={() => step(1)}
            style={{ color: theme.sidebarItemText }}
          >
            <SvgCheveronRight width={14} height={14} />
          </Button>
        </View>

        <TabList aria-label={t('Summary slides')} className={dotsClassName}>
          {slides.map(slide => (
            <Tab
              key={slide.id}
              id={slide.id}
              aria-label={slide.title}
              className={dotClassName}
            />
          ))}
        </TabList>

        <View
          ref={setViewport}
          style={{
            display: 'grid',
            gridTemplateRows: 'minmax(0, 1fr)',
            gridTemplateColumns: 'minmax(0, 1fr)',
            flexGrow: 1,
            // Clip the slides waiting off to the sides. Unlike `hidden`, `clip`
            // doesn't make this a scroll container.
            overflowX: 'clip',
            '@media screen and (max-height: 480px)': {
              minHeight: 260,
            },
          }}
        >
          {slides.map((slide, index) => (
            <TabPanel
              key={slide.id}
              id={slide.id}
              shouldForceMount
              className={slideClassName(
                slideOffset(index, activeIndex, slides.length),
              )}
            >
              {renderSlide(slide)}
            </TabPanel>
          ))}
        </View>
      </Tabs>
    </View>
  );
}
