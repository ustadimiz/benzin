import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export function getResponsiveLayout(width) {
  const compact = width < 480;
  const tablet = width >= 768 && width < 1024;
  const desktop = width >= 1024;
  const wide = width >= 1280;

  return {
    width,
    compact,
    tablet,
    desktop,
    wide,
    pagePadding: compact ? 14 : tablet ? 18 : 24,
    contentMaxWidth: wide ? 1240 : desktop ? 1160 : tablet ? 980 : undefined,
    cardMaxWidth: wide ? 720 : desktop ? 640 : tablet ? 560 : undefined,
    modalMaxWidth: wide ? 620 : desktop ? 580 : tablet ? 540 : undefined,
    chartHeight: compact ? 190 : tablet ? 210 : 230,
    kpiColumns: compact ? 1 : tablet ? 2 : 4,
    stackChips: width < 620,
  };
}

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  return useMemo(() => getResponsiveLayout(width), [width]);
}