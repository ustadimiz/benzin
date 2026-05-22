import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePullToRefresh } from "../hooks/usePullToRefresh";

export default function PullToRefreshFlatList({
  onRefresh,
  enabled = true,
  webEnabled = true,
  refreshTintColor = "#D3ECFB",
  indicatorColor = "#D3ECFB",
  indicatorPullText = "Pull down to refresh",
  indicatorReleaseText = "Release to refresh",
  indicatorLoadingText = "Refreshing...",
  threshold = 72,
  damping = 0.45,
  maxPullDistance = 128,
  onScroll,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  ListHeaderComponent,
  scrollEventThrottle = 16,
  style,
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

  const isWeb = Platform.OS === "web";
  const webIndicatorHeight = isWeb && webEnabled ? (pull.refreshing ? 56 : pull.pullDistance) : 0;
  const indicatorLabel = pull.refreshing
    ? indicatorLoadingText
    : pull.armed
      ? indicatorReleaseText
      : indicatorPullText;

  const mergedHeader = (
    <>
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
      {typeof ListHeaderComponent === "function"
        ? <ListHeaderComponent />
        : ListHeaderComponent}
    </>
  );

  return (
    <FlatList
      {...rest}
      style={[style, isWeb && webEnabled && styles.webList]}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={(event) => {
        pull.scrollHandlers.onScroll(event);
        if (typeof onScroll === "function") onScroll(event);
      }}
      onTouchStart={(event) => {
        pull.scrollHandlers.onTouchStart(event);
        if (typeof onTouchStart === "function") onTouchStart(event);
      }}
      onTouchMove={(event) => {
        pull.scrollHandlers.onTouchMove(event);
        if (typeof onTouchMove === "function") onTouchMove(event);
      }}
      onTouchEnd={(event) => {
        pull.scrollHandlers.onTouchEnd(event);
        if (typeof onTouchEnd === "function") onTouchEnd(event);
      }}
      onTouchCancel={(event) => {
        pull.scrollHandlers.onTouchCancel(event);
        if (typeof onTouchCancel === "function") onTouchCancel(event);
      }}
      ListHeaderComponent={mergedHeader}
      refreshControl={
        !isWeb && enabled
          ? <RefreshControl refreshing={pull.refreshing} onRefresh={pull.runRefresh} tintColor={refreshTintColor} />
          : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  webList: {
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
