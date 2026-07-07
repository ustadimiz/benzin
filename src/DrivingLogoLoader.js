import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PALETTE = {
  bg: "#070D17",
  panel: "#0D1626",
  line: "#1D2A3F",
  road: "#121D2F",
  roadEdge: "#22324A",
  lane: "#8FA7BE22",
  textMain: "#E8F2FD",
  textDim: "#8DA6BE",
  accent: "#8CD4FF",
  accentSoft: "#C7ECFF",
};

const SCENES = [
  { key: "fuel", icon: "gas-station", title: "Fuel station", subtitle: "Track every refill" },
  { key: "garage", icon: "garage", title: "Garage", subtitle: "Manage maintenance tasks" },
  { key: "analytics", icon: "chart-line", title: "Analytics", subtitle: "Understand vehicle trends" },
  { key: "home", icon: "home-variant", title: "Home", subtitle: "Ready to continue" },
];

function JourneyCar({ suspension, wheelSpin }) {
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

function SceneCard({ icon, title, subtitle, status }) {
  const isFuture = status === "future";
  const isActive = status === "active";
  const isPast = status === "past";

  return (
    <View
      style={[
        styles.sceneCard,
        isFuture && styles.sceneCardFuture,
        isActive && styles.sceneCardActive,
        isPast && styles.sceneCardPast,
      ]}
    >
      <View style={[styles.sceneIconWrap, isActive && styles.sceneIconWrapActive]}>
        <MaterialCommunityIcons
          name={icon}
          size={17}
          color={isFuture ? "#66809A" : isActive ? PALETTE.accentSoft : "#A6D6F2"}
        />
      </View>
      <Text style={[styles.sceneTitle, isFuture && styles.sceneTitleFuture]}>{title}</Text>
      <Text style={[styles.sceneSubtitle, isFuture && styles.sceneSubtitleFuture]}>{subtitle}</Text>
    </View>
  );
}

function getSceneStatus(progress, index) {
  const segment = index * 0.25;
  if (progress >= segment + 0.25) return "past";
  if (progress >= segment) return "active";
  return "future";
}

export default function DrivingLogoLoader() {
  const progress = useRef(new Animated.Value(0)).current;
  const laneFlow = useRef(new Animated.Value(0)).current;
  const wheel = useRef(new Animated.Value(0)).current;
  const body = useRef(new Animated.Value(0)).current;
  const camera = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const [progressValue, setProgressValue] = useState(0);

  const sceneCenters = useMemo(() => [0.17, 0.4, 0.63, 0.86], []);

  useEffect(() => {
    progress.setValue(0);
    const run = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 9800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(progress, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    run.start();
    return () => run.stop();
  }, [progress]);

  useEffect(() => {
    laneFlow.setValue(0);
    const loop = Animated.loop(
      Animated.timing(laneFlow, {
        toValue: 1,
        duration: 1650,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [laneFlow]);

  useEffect(() => {
    wheel.setValue(0);
    const loop = Animated.loop(
      Animated.timing(wheel, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [wheel]);

  useEffect(() => {
    body.setValue(0);
    const loop = Animated.loop(
      Animated.timing(body, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [body]);

  useEffect(() => {
    camera.setValue(0);
    const loop = Animated.loop(
      Animated.timing(camera, {
        toValue: 1,
        duration: 4200,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [camera]);

  useEffect(() => {
    glow.setValue(0);
    const loop = Animated.loop(
      Animated.timing(glow, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setProgressValue(value));
    return () => progress.removeListener(id);
  }, [progress]);

  const laneShiftA = laneFlow.interpolate({ inputRange: [0, 1], outputRange: [0, -56] });
  const laneShiftB = laneFlow.interpolate({ inputRange: [0, 1], outputRange: [56, 0] });

  const wheelSpin = wheel.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const suspension = body.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -1.8, 0] });

  const cameraX = camera.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-2, 2, -2] });
  const cameraScale = camera.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.006, 1] });

  const ambientOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] });

  const storyTrackTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [70, -250] });

  const destinationMorphOpacity = progress.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [0, 0, 0.42],
  });
  const destinationMorphScale = progress.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 1.08],
  });

  return (
    <View style={styles.root}>
      <View style={styles.vignetteTop} />
      <View style={styles.vignetteBottom} />
      <Animated.View style={[styles.ambientGlow, { opacity: ambientOpacity }]} />

      <Animated.View style={[styles.stage, { transform: [{ translateX: cameraX }, { scale: cameraScale }] }]}>
        <View style={styles.skyLayer} />

        <View style={styles.storyViewport}>
          <Animated.View style={[styles.storyTrack, { transform: [{ translateX: storyTrackTranslate }] }]}>
            {SCENES.map((scene, idx) => {
              const status = getSceneStatus(progressValue, idx);
              return (
                <SceneCard
                  key={scene.key}
                  icon={scene.icon}
                  title={scene.title}
                  subtitle={scene.subtitle}
                  status={status}
                />
              );
            })}
          </Animated.View>
        </View>

        <View style={styles.road}>
          <View style={styles.roadEdgeTop} />
          <View style={styles.roadEdgeBottom} />

          <View style={styles.laneViewport}>
            <Animated.View style={[styles.laneTrack, { transform: [{ translateX: laneShiftA }] }]}>
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
              <View style={styles.laneMark} />
            </Animated.View>

            <Animated.View style={[styles.laneTrack, styles.laneTrackSoft, { transform: [{ translateX: laneShiftB }] }]}>
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
              <View style={styles.laneMarkSoft} />
            </Animated.View>
          </View>

          <View style={styles.carAnchor}>
            <JourneyCar suspension={suspension} wheelSpin={wheelSpin} />
          </View>

          <View style={styles.sceneDotRow}>
            {sceneCenters.map((stop, idx) => {
              const reached = progressValue >= stop;
              return <View key={`dot-${idx}`} style={[styles.sceneDot, reached && styles.sceneDotReached]} />;
            })}
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.destinationOverlay,
          { opacity: destinationMorphOpacity, transform: [{ scale: destinationMorphScale }] },
        ]}
      >
        <View style={styles.destinationCard}>
          <MaterialCommunityIcons name="home-variant" size={18} color={PALETTE.accentSoft} />
          <Text style={styles.destinationText}>Opening your workspace</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#0C15221F",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#00000024",
  },
  ambientGlow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#67B7FF14",
  },

  stage: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.panel,
    paddingHorizontal: 14,
    paddingVertical: 16,
    overflow: "hidden",
  },
  skyLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F1C2F",
    opacity: 0.55,
  },

  storyViewport: {
    height: 84,
    overflow: "hidden",
    marginBottom: 12,
    justifyContent: "center",
  },
  storyTrack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
  },
  sceneCard: {
    width: 148,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2D4260",
    backgroundColor: "#112139",
    padding: 9,
    justifyContent: "space-between",
  },
  sceneCardFuture: {
    backgroundColor: "#0F1A2B",
    borderColor: "#243750",
    opacity: 0.56,
  },
  sceneCardActive: {
    borderColor: "#5AA7D9",
    backgroundColor: "#16304E",
    shadowColor: "#7DD3FC",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    opacity: 1,
  },
  sceneCardPast: {
    backgroundColor: "#0E1F33",
    borderColor: "#355577",
    opacity: 0.36,
  },
  sceneIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#17283E",
    borderWidth: 1,
    borderColor: "#2C415D",
    alignItems: "center",
    justifyContent: "center",
  },
  sceneIconWrapActive: {
    backgroundColor: "#1A3B5E",
    borderColor: "#67B7EB",
  },
  sceneTitle: {
    color: PALETTE.textMain,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  sceneTitleFuture: {
    color: "#8CA4BC",
  },
  sceneSubtitle: {
    color: PALETTE.textDim,
    fontSize: 10,
  },
  sceneSubtitleFuture: {
    color: "#6E869E",
  },

  road: {
    height: 80,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.roadEdge,
    backgroundColor: PALETTE.road,
    overflow: "hidden",
    justifyContent: "center",
  },
  roadEdgeTop: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "#A0B4C414",
  },
  roadEdgeBottom: {
    position: "absolute",
    bottom: 0,
    left: 18,
    right: 18,
    height: 1,
    backgroundColor: "#A0B4C40F",
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
    paddingHorizontal: 14,
  },
  laneTrackSoft: {
    opacity: 0.72,
  },
  laneMark: {
    width: 24,
    height: 2,
    borderRadius: 999,
    backgroundColor: PALETTE.lane,
  },
  laneMarkSoft: {
    width: 24,
    height: 1,
    borderRadius: 999,
    backgroundColor: "#9FB4C614",
  },

  carAnchor: {
    position: "absolute",
    left: "50%",
    marginLeft: -22,
    top: 26,
  },
  carWrap: {
    width: 44,
    height: 28,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  carShadow: {
    position: "absolute",
    bottom: 0,
    width: 30,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#06111D9A",
  },
  carCabin: {
    width: 18,
    height: 7,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "#A8C0D4",
    marginBottom: -2,
    opacity: 0.92,
  },
  carBody: {
    width: 42,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#D9E7F3",
    borderWidth: 1,
    borderColor: "#B7CBDB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  carWindow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8DAFC5",
    opacity: 0.82,
  },
  carHighlight: {
    position: "absolute",
    top: 1,
    left: 5,
    right: 5,
    height: 1,
    backgroundColor: "#FFFFFF52",
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#1C2738",
    borderWidth: 1,
    borderColor: "#4B637B",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelInner: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#7C91A8",
  },
  wheelLeft: {
    left: 8,
  },
  wheelRight: {
    right: 8,
  },

  sceneDotRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sceneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#5E748C",
    opacity: 0.42,
  },
  sceneDotReached: {
    backgroundColor: "#A9E4FF",
    opacity: 0.95,
  },

  destinationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07111F96",
  },
  destinationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2B4F72",
    backgroundColor: "#10263E",
  },
  destinationText: {
    color: "#D7EDFD",
    fontSize: 12,
    fontWeight: "600",
  },
});
