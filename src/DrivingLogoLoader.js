import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const BG = "#070B12";
const ROAD = "#111926";
const ROAD_EDGE = "#1B2A3F";
const LANE = "#7B8DA41F";
const CAR_BODY = "#DBE6F2";
const CAR_ACCENT = "#9DB6CA";
const WHEEL = "#1B2635";
const WHEEL_RING = "#4A6178";

function useLoop(anim, duration, easing = Easing.linear) {
  useEffect(() => {
    anim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration,
        easing,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, easing]);
}

function Car({ suspension, wheelSpin }) {
  return (
    <Animated.View style={[styles.carWrap, { transform: [{ translateY: suspension }] }]}>
      <View style={styles.carShadow} />
      <View style={styles.carCabin} />
      <View style={styles.carBody}>
        <View style={styles.carWindow} />
        <View style={styles.carHighlight} />
      </View>

      <Animated.View style={[styles.wheel, styles.wheelLeft, { transform: [{ rotate: wheelSpin }] }]}> 
        <View style={styles.wheelInner} />
      </Animated.View>
      <Animated.View style={[styles.wheel, styles.wheelRight, { transform: [{ rotate: wheelSpin }] }]}> 
        <View style={styles.wheelInner} />
      </Animated.View>
    </Animated.View>
  );
}

export default function DrivingLogoLoader() {
  const laneFlow = useRef(new Animated.Value(0)).current;
  const laneFlowSoft = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const wheel = useRef(new Animated.Value(0)).current;
  const body = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const lightSweep = useRef(new Animated.Value(0)).current;

  useLoop(laneFlow, 1400, Easing.linear);
  useLoop(laneFlowSoft, 2600, Easing.linear);
  useLoop(glowPulse, 2600, Easing.inOut(Easing.sin));
  useLoop(wheel, 900, Easing.linear);
  useLoop(body, 1800, Easing.inOut(Easing.sin));
  useLoop(breathe, 4200, Easing.inOut(Easing.cubic));
  useLoop(lightSweep, 5200, Easing.inOut(Easing.quad));

  const laneShiftA = laneFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -52],
  });
  const laneShiftB = laneFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [52, 0],
  });

  const laneShiftC = laneFlowSoft.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -52],
  });

  const ambientOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });

  const suspension = body.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -1.6, 0],
  });

  const stageScale = breathe.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.005, 1],
  });

  const stageY = breathe.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -1, 0],
  });

  const sweepX = lightSweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-340, 340],
  });

  const sweepOpacity = lightSweep.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.16, 0],
  });

  const wheelSpin = wheel.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.root}>
      <View style={styles.bgVignetteTop} />
      <View style={styles.bgVignetteBottom} />
      <Animated.View style={[styles.ambientGlow, { opacity: ambientOpacity }]} />

      <Animated.View style={[styles.stage, { transform: [{ translateY: stageY }, { scale: stageScale }] }]}>
        <View style={styles.road}>
          <View style={styles.roadEdgeTop} />
          <View style={styles.roadEdgeBottom} />

          <Animated.View style={[styles.roadSweep, { transform: [{ translateX: sweepX }], opacity: sweepOpacity }]} />

          <View style={styles.laneViewport}>
            <Animated.View style={[styles.laneTrack, { transform: [{ translateX: laneShiftA }] }]}>
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
            </Animated.View>

            <Animated.View style={[styles.laneTrack, styles.laneTrackSecond, { transform: [{ translateX: laneShiftB }] }]}>
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
            </Animated.View>

            <Animated.View style={[styles.laneTrack, styles.laneTrackThird, { transform: [{ translateX: laneShiftC }] }]}>
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
            </Animated.View>
          </View>

          <View style={styles.carAnchor}>
            <Car suspension={suspension} wheelSpin={wheelSpin} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  ambientGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#60A5FA14",
  },
  bgVignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#0D17241F",
  },
  bgVignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#00000022",
  },
  stage: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
  },
  road: {
    width: "100%",
    height: 74,
    borderRadius: 999,
    backgroundColor: ROAD,
    borderWidth: 1,
    borderColor: ROAD_EDGE,
    overflow: "hidden",
    justifyContent: "center",
  },
  roadSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
    backgroundColor: "#BFD7EA14",
  },
  roadEdgeTop: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "#9CB3C114",
  },
  roadEdgeBottom: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: "#9CB3C10E",
  },
  laneViewport: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  laneTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  laneTrackSecond: {
    opacity: 0.72,
  },
  laneTrackThird: {
    opacity: 0.48,
  },
  laneMark: {
    width: 24,
    height: 2,
    borderRadius: 999,
    backgroundColor: LANE,
  },
  laneMarkSoft: {
    width: 24,
    height: 1,
    borderRadius: 999,
    backgroundColor: "#A4B5C412",
  },

  carAnchor: {
    position: "absolute",
    left: "50%",
    marginLeft: -21,
    top: 24,
  },
  carWrap: {
    width: 42,
    height: 26,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  carShadow: {
    position: "absolute",
    bottom: 0,
    width: 30,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#0A142199",
  },
  carCabin: {
    width: 18,
    height: 7,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: CAR_ACCENT,
    opacity: 0.92,
    marginBottom: -2,
  },
  carBody: {
    width: 40,
    height: 12,
    borderRadius: 7,
    backgroundColor: CAR_BODY,
    borderWidth: 1,
    borderColor: "#B6CBDB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  carWindow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8EAEC4",
    opacity: 0.85,
  },
  carHighlight: {
    position: "absolute",
    top: 1,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: "#FFFFFF4A",
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: WHEEL,
    borderWidth: 1,
    borderColor: WHEEL_RING,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelInner: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#7B8DA5",
  },
  wheelLeft: {
    left: 8,
  },
  wheelRight: {
    right: 8,
  },
});
