import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

export default function PullToRefreshScrollView({
  onRefresh,
  children,
  style,
  contentContainerStyle,
  scrollEventThrottle = 16,
  refreshTintColor = "#D3ECFB",
  indicatorColor = "#D3ECFB",
  indicatorPullText = "Pull down to refresh",
  indicatorReleaseText = "Release to refresh",
  indicatorLoadingText = "Refreshing...",
  enabled = true,
  webEnabled = true,
  threshold = 72,
  damping = 0.45,
  maxPullDistance = 128,
  onScroll,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  ...rest
}) {
  const pull = usePullToRefresh({
    onRefresh,
    enabled,
    webEnabled,
    threshold,
    damping,
    maxPullDistance,
  });

  const handleScroll = (event) => {
    pull.scrollHandlers.onScroll(event);
    if (typeof onScroll === "function") onScroll(event);
  };

  const handleTouchStart = (event) => {
    pull.scrollHandlers.onTouchStart(event);
    if (typeof onTouchStart === "function") onTouchStart(event);
  };

  const handleTouchMove = (event) => {
    pull.scrollHandlers.onTouchMove(event);
    if (typeof onTouchMove === "function") onTouchMove(event);
  };

  const handleTouchEnd = (event) => {
    pull.scrollHandlers.onTouchEnd(event);
    if (typeof onTouchEnd === "function") onTouchEnd(event);
  };

  const handleTouchCancel = (event) => {
    pull.scrollHandlers.onTouchCancel(event);
    if (typeof onTouchCancel === "function") onTouchCancel(event);
  };

  const isWeb = Platform.OS === "web";
  const webIndicatorHeight = isWeb && webEnabled ? (pull.refreshing ? 56 : pull.pullDistance) : 0;
  const indicatorLabel = pull.refreshing
    ? indicatorLoadingText
    : pull.armed
      ? indicatorReleaseText
      : indicatorPullText;

  return (
    <ScrollView
      {...rest}
      style={[style, isWeb && webEnabled && styles.webScroll]}
      contentContainerStyle={contentContainerStyle}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      refreshControl={
        !isWeb && enabled
          ? <RefreshControl refreshing={pull.refreshing} onRefresh={pull.runRefresh} tintColor={refreshTintColor} />
          : undefined
      }
    >
      {isWeb && webEnabled ? (
        <View style={[styles.webIndicator, { height: webIndicatorHeight }]}>
          {(pull.pullDistance > 8 || pull.refreshing) ? (
            <>
              <ActivityIndicator size="small" color={indicatorColor} />
              <Text style={[styles.webIndicatorText, { color: indicatorColor }]}>{indicatorLabel}</Text>
            </>
          ) : null}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  webScroll: {
    overscrollBehaviorY: "contain",
    touchAction: "pan-x pan-y",
  },
  webIndicator: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
  },
  webIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
