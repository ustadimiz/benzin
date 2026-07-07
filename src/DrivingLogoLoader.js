import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BG = "#0B1220";
const CARD = "#0E1729";
const LINE = "#1E2A3E";
const ROAD = "#1B263A";
const ROAD_ACTIVE = "#223A5B";
const PRIMARY = "#7DD3FC";
const PRIMARY_SOFT = "#A5E6FF";
const TEXT_DIM = "#8AA6BF";
const TEXT_MAIN = "#EAF4FF";

const STEPS = [
  { key: "fuel", label: "Fuel", icon: "gas-station" },
  { key: "maintenance", label: "Maintenance", icon: "wrench" },
  { key: "statistics", label: "Statistics", icon: "chart-line" },
  { key: "destination", label: "Destination", icon: "flag-checkered" },
];

function StepNode({ icon, label, reached, active }) {
  return (
    <View style={styles.stepWrap}>
      <View
        style={[
          styles.stepDot,
          reached && styles.stepDotReached,
          active && styles.stepDotActive,
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={reached || active ? PRIMARY_SOFT : "#5A6E86"}
        />
      </View>
      <Text style={[styles.stepLabel, reached && styles.stepLabelReached, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

function CarBody() {
  return (
    <View style={styles.car}>
      <View style={styles.carCabin} />
      <View style={styles.carBody}>
        <View style={styles.carWindow} />
      </View>
      <View style={[styles.wheel, styles.wheelLeft]} />
      <View style={[styles.wheel, styles.wheelRight]} />
    </View>
  );
}

export default function DrivingLogoLoader() {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [progressValue, setProgressValue] = useState(0);

  const milestoneStops = useMemo(() => [0.2, 0.45, 0.7, 0.95], []);

  useEffect(() => {
    progress.setValue(0);
    const move = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 5600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    move.start();
    return () => move.stop();
  }, [progress]);

  useEffect(() => {
    pulse.setValue(0);
    const glow = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true }
    );
    glow.start();
    return () => glow.stop();
  }, [pulse]);

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setProgressValue(value);
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const carTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 292],
  });

  const roadFillWidth = `${8 + progressValue * 88}%`;
  const isFinishing = progressValue >= 0.9;

  const destinationMorphScale = progress.interpolate({
    inputRange: [0, 0.9, 1],
    outputRange: [1, 1, 1.1],
  });

  const destinationMorphOpacity = progress.interpolate({
    inputRange: [0, 0.9, 1],
    outputRange: [0, 0, 0.35],
  });

  const ambientGlow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.48],
  });

  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <Animated.View style={[styles.ambientGlow, { opacity: ambientGlow }]} />

        <Text style={styles.title}>Preparing Your Drive</Text>

        <View style={styles.roadSection}>
          <View style={styles.roadTrack}>
            <View style={[styles.roadProgress, { width: roadFillWidth }]} />
            <View style={styles.roadDashRow}>
              <View style={styles.roadDash} />
              <View style={styles.roadDash} />
              <View style={styles.roadDash} />
              <View style={styles.roadDash} />
            </View>

            <Animated.View style={[styles.carWrap, { transform: [{ translateX: carTranslateX }] }]}>
              <CarBody />
            </Animated.View>
          </View>

          <View style={styles.milestoneRow}>
            {STEPS.map((step, idx) => {
              const stop = milestoneStops[idx];
              const reached = progressValue >= stop;
              const active = progressValue > stop - 0.08 && progressValue < stop + 0.08;
              return (
                <StepNode
                  key={step.key}
                  icon={step.icon}
                  label={step.label}
                  reached={reached}
                  active={active}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Synchronizing vehicle timeline</Text>
          <Text style={styles.footerPercent}>{Math.round(progressValue * 100)}%</Text>
        </View>

        <Animated.View
          style={[
            styles.destinationOverlay,
            {
              opacity: destinationMorphOpacity,
              transform: [{ scale: destinationMorphScale }],
            },
          ]}
        >
          <View style={styles.destinationBadge}>
            <MaterialCommunityIcons name="flag-checkered" size={16} color={PRIMARY_SOFT} />
            <Text style={styles.destinationText}>Opening destination screen</Text>
          </View>
        </Animated.View>

        {isFinishing ? <View style={styles.destinationHintLine} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: LINE,
    paddingVertical: 18,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    top: -60,
    left: "20%",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#38BDF81A",
  },
  title: {
    color: TEXT_MAIN,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 18,
  },

  roadSection: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22324A",
    backgroundColor: "#0C1626",
    padding: 12,
  },
  roadTrack: {
    height: 48,
    borderRadius: 999,
    backgroundColor: ROAD,
    borderWidth: 1,
    borderColor: "#22344E",
    justifyContent: "center",
    overflow: "hidden",
  },
  roadProgress: {
    ...StyleSheet.absoluteFillObject,
    right: undefined,
    backgroundColor: ROAD_ACTIVE,
  },
  roadDashRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  roadDash: {
    width: 26,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#7A8DA61A",
  },

  carWrap: {
    position: "absolute",
    top: 8,
    left: 0,
  },
  car: {
    width: 42,
    height: 24,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  carCabin: {
    width: 20,
    height: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "#BFD7EA",
    marginBottom: -2,
    opacity: 0.9,
  },
  carBody: {
    width: 38,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D6E6F3",
    borderWidth: 1,
    borderColor: "#AEC7DA",
    alignItems: "center",
    justifyContent: "center",
  },
  carWindow: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8CB6D4",
    opacity: 0.8,
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1E2E42",
    borderWidth: 1,
    borderColor: "#4D6782",
  },
  wheelLeft: { left: 8 },
  wheelRight: { right: 8 },

  milestoneRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  stepWrap: {
    flex: 1,
    alignItems: "center",
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#132036",
    borderWidth: 1,
    borderColor: "#2A3D59",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotReached: {
    backgroundColor: "#113251",
    borderColor: "#3C6D95",
    shadowColor: "#67E8F9",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  stepDotActive: {
    backgroundColor: "#164064",
    borderColor: "#5AA6DA",
  },
  stepLabel: {
    marginTop: 8,
    color: TEXT_DIM,
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  stepLabelReached: {
    color: "#CFEAFF",
  },
  stepLabelActive: {
    color: PRIMARY_SOFT,
  },

  footerRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    color: "#90A9C1",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  footerPercent: {
    color: "#D8EEFF",
    fontSize: 12,
    fontWeight: "700",
  },

  destinationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A132199",
  },
  destinationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#102239",
    borderWidth: 1,
    borderColor: "#2E5578",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  destinationText: {
    color: "#D6EEFF",
    fontSize: 12,
    fontWeight: "600",
  },
  destinationHintLine: {
    marginTop: 12,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#3E6E96",
    opacity: 0.4,
  },
});
