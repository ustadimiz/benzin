import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CYAN = "#7DD3FC";
const CYAN_SOFT = "#67E8F9";
const GRID = "#1E293B";
const CARD = "#0B1321";
const PANEL = "#111827";
const RING = "#1F2E45";

function useLoop(value, duration, easing = Easing.inOut(Easing.cubic)) {
  useEffect(() => {
    value.setValue(0);
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [duration, easing, value]);
}

function RadialGauge({ progress, pulse }) {
  const ticks = useMemo(() => new Array(36).fill(0), []);
  return (
    <View style={styles.gaugeWrap}>
      <View style={styles.gaugeOuter}>
        {ticks.map((_, idx) => {
          const angle = -140 + idx * 8;
          const active = idx <= Math.round(progress * 28);
          return (
            <View
              key={`t-${idx}`}
              style={[
                styles.tick,
                {
                  backgroundColor: active ? CYAN : "#243448",
                  transform: [{ rotate: `${angle}deg` }, { translateY: -74 }],
                  opacity: active ? 1 : 0.45,
                },
              ]}
            />
          );
        })}

        <Animated.View style={[styles.gaugeGlow, { opacity: pulse }]} />
        <View style={styles.gaugeCore}>
          <Text style={styles.speedValue}>{Math.round(12 + progress * 36)}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>
    </View>
  );
}

function FuelGauge({ fill }) {
  return (
    <View style={styles.fuelCard}>
      <Text style={styles.cardTitle}>Fuel</Text>
      <View style={styles.fuelTrack}>
        <Animated.View style={[styles.fuelFill, { width: `${22 + fill * 34}%` }]} />
      </View>
      <Text style={styles.fuelLabel}>{Math.round(22 + fill * 34)}%</Text>
    </View>
  );
}

function MiniChart({ phase }) {
  const points = [18, 22, 20, 28, 26, 31, 30, 36];
  return (
    <View style={styles.chartCard}>
      <Text style={styles.cardTitle}>Trend</Text>
      <View style={styles.chartArea}>
        {points.map((v, i) => {
          const h = 4 + v;
          const active = i <= Math.floor(phase * (points.length - 1));
          return (
            <View
              key={`b-${i}`}
              style={[
                styles.chartBar,
                {
                  height: h,
                  backgroundColor: active ? CYAN_SOFT : "#223246",
                  opacity: active ? 0.95 : 0.55,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function Odometer({ value }) {
  return (
    <View style={styles.odoCard}>
      <Text style={styles.cardTitle}>Odometer</Text>
      <Text style={styles.odoDigits}>{value.toString().padStart(6, "0")}</Text>
      <Text style={styles.odoUnit}>km</Text>
    </View>
  );
}

export default function DrivingLogoLoader() {
  const assemble = useRef(new Animated.Value(0)).current;
  const gaugeLoop = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef(new Animated.Value(0)).current;
  const morph = useRef(new Animated.Value(0)).current;
  const [odo, setOdo] = useState(124530);
  const [speed, setSpeed] = useState(26);
  const [fuelLevel, setFuelLevel] = useState(28);
  const [chartPhase, setChartPhase] = useState(0.25);

  useLoop(gaugeLoop, 4200, Easing.inOut(Easing.quad));
  useLoop(pulseLoop, 2200, Easing.inOut(Easing.sin));
  useLoop(morph, 5200, Easing.inOut(Easing.quad));

  useEffect(() => {
    assemble.setValue(0);
    const enter = Animated.timing(assemble, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    enter.start();
    return () => enter.stop();
  }, [assemble]);

  useEffect(() => {
    const id = setInterval(() => {
      setOdo((prev) => (prev >= 124999 ? 124530 : prev + 1));
    }, 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = gaugeLoop.addListener(({ value }) => {
      const wave = value < 0.5 ? value / 0.5 : 1 - (value - 0.5) / 0.5;
      setSpeed(Math.round(18 + wave * 42));
      setFuelLevel(Math.round(24 + value * 34));
      setChartPhase(value);
    });
    return () => gaugeLoop.removeListener(id);
  }, [gaugeLoop]);

  const pulse = pulseLoop.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });

  const panelY = assemble.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const panelOpacity = assemble.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const morphScale = morph.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 1.02] });
  const morphOpacity = morph.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0.92] });

  const iconPulse = pulseLoop.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.dashboardShell, { transform: [{ translateY: panelY }, { scale: morphScale }], opacity: panelOpacity }]}>
        <View style={styles.backGrid} />
        <Animated.View style={[styles.overlayGlow, { opacity: morphOpacity }]} />

        <View style={styles.topRow}>
          <RadialGauge progress={speed / 70} pulse={pulse} />
          <View style={styles.sideStack}>
            <FuelGauge fill={fuelLevel / 100} />
            <MiniChart phase={chartPhase} />
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Odometer value={odo} />
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>Status</Text>
            <View style={styles.iconRow}>
              <Animated.View style={[styles.iconChip, { opacity: iconPulse }]}>
                <MaterialCommunityIcons name="oil" size={14} color={CYAN} />
              </Animated.View>
              <Animated.View style={[styles.iconChip, { opacity: iconPulse }]}>
                <MaterialCommunityIcons name="wrench" size={14} color={CYAN_SOFT} />
              </Animated.View>
              <Animated.View style={[styles.iconChip, { opacity: iconPulse }]}>
                <MaterialCommunityIcons name="engine-outline" size={14} color={CYAN} />
              </Animated.View>
            </View>
            <View style={styles.morphHint} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  dashboardShell: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 14,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden",
  },
  backGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
    backgroundColor: CARD,
  },
  overlayGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0EA5E914",
  },
  topRow: { flexDirection: "row", gap: 10 },
  sideStack: { flex: 1, gap: 10 },

  gaugeWrap: {
    width: 180,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#1C2A3E",
    overflow: "hidden",
  },
  gaugeOuter: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    position: "absolute",
    width: 4,
    height: 10,
    borderRadius: 3,
  },
  gaugeGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#38BDF81A",
  },
  gaugeCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#0D1828",
    borderWidth: 1,
    borderColor: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  speedValue: { color: "#E2F3FF", fontSize: 24, fontWeight: "700" },
  speedUnit: { color: "#7AA5BD", fontSize: 10, marginTop: 2 },

  fuelCard: {
    borderRadius: 14,
    padding: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#1C2A3E",
  },
  cardTitle: { color: "#8CB3CC", fontSize: 11, fontWeight: "600", marginBottom: 8 },
  fuelTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#1B2A3F",
    overflow: "hidden",
  },
  fuelFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: CYAN,
  },
  fuelLabel: { marginTop: 8, color: "#DDF3FF", fontSize: 12, fontWeight: "600" },

  chartCard: {
    borderRadius: 14,
    padding: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#1C2A3E",
  },
  chartArea: {
    height: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  chartBar: {
    flex: 1,
    borderRadius: 3,
  },

  bottomRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  odoCard: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#1C2A3E",
  },
  odoDigits: {
    color: "#EAF8FF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.8,
    marginTop: 2,
  },
  odoUnit: { color: "#7CA8C2", fontSize: 11, marginTop: 2 },

  statusCard: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#1C2A3E",
  },
  iconRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102035",
    borderWidth: 1,
    borderColor: "#203953",
  },
  morphHint: {
    marginTop: 10,
    height: 4,
    borderRadius: 999,
    backgroundColor: GRID,
  },
});
