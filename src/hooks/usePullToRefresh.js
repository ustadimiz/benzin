import { useCallback, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  webEnabled = true,
  threshold = 72,
  damping = 0.45,
  maxPullDistance = 128,
} = {}) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [armed, setArmed] = useState(false);

  const scrollYRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isTrackingRef = useRef(false);

  const canUseWebPull = Platform.OS === "web" && webEnabled;

  const runRefresh = useCallback(async () => {
    if (refreshing || typeof onRefresh !== "function") return;

    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  const resetPull = useCallback(() => {
    isTrackingRef.current = false;
    setArmed(false);
    setPullDistance(0);
  }, []);

  const onScroll = useCallback((event) => {
    scrollYRef.current = event?.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const onTouchStart = useCallback(
    (event) => {
      if (!canUseWebPull || !enabled || refreshing) return;

      const touch = event?.nativeEvent?.touches?.[0] || event?.nativeEvent?.changedTouches?.[0];
      if (!touch) return;

      isTrackingRef.current = scrollYRef.current <= 0;
      touchStartYRef.current = touch.pageY ?? touch.locationY ?? 0;
    },
    [canUseWebPull, enabled, refreshing]
  );

  const onTouchMove = useCallback(
    (event) => {
      if (!canUseWebPull || !enabled || refreshing || !isTrackingRef.current) return;

      const touch = event?.nativeEvent?.touches?.[0] || event?.nativeEvent?.changedTouches?.[0];
      if (!touch) return;

      const currentY = touch.pageY ?? touch.locationY ?? 0;
      const deltaY = currentY - touchStartYRef.current;

      if (deltaY <= 0) {
        setArmed(false);
        setPullDistance(0);
        return;
      }

      const nextDistance = Math.min(maxPullDistance, deltaY * damping);
      setPullDistance(nextDistance);
      setArmed(nextDistance >= threshold);

      if (typeof event?.preventDefault === "function") {
        event.preventDefault();
      }
    },
    [canUseWebPull, damping, enabled, maxPullDistance, refreshing, threshold]
  );

  const onTouchEnd = useCallback(async () => {
    if (!canUseWebPull || !enabled || refreshing) return;

    const shouldRefresh = isTrackingRef.current && armed;
    resetPull();

    if (shouldRefresh) {
      await runRefresh();
    }
  }, [armed, canUseWebPull, enabled, refreshing, resetPull, runRefresh]);

  const onTouchCancel = useCallback(() => {
    if (!canUseWebPull) return;
    resetPull();
  }, [canUseWebPull, resetPull]);

  return useMemo(
    () => ({
      refreshing,
      pullDistance,
      armed,
      runRefresh,
      scrollHandlers: {
        onScroll,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
      },
    }),
    [armed, onScroll, onTouchCancel, onTouchEnd, onTouchMove, onTouchStart, pullDistance, refreshing, runRefresh]
  );
}
