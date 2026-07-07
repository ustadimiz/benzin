import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COLORS = {
  bg: "#070F1D",
  panel: "#0D1729",
  panelSoft: "#111F36",
  border: "#20324C",
  ring: "#2A3E5D",
  textMain: "#E8F5FF",
  textMuted: "#8EAAC3",
  cyan: "#7DD3FC",
  cyanSoft: "#AEE9FF",
  blueSoft: "#93C5FD",
};

function useAnimatedLoop(value, duration, easing = Easing.inOut(Easing.cubic)) {
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

function Speedometer({ speed, wake, pulse }) {
  const ticks = useMemo(() => new Array(40).fill(0), []);
  const arcProgress = Math.min(Math.max((speed - 10) / 90, 0), 1);

  return (
    <Animated.View
      style={[
        styles.speedCard,
        {
          opacity: wake,
          transform: [
            {
              scale: wake.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.speedRing}>
        {ticks.map((_, idx) => {
          const angle = -140 + idx * 7;
          const active = idx <= Math.round(arcProgress * 30);
          return (
            <View
              key={`tick-${idx}`}
              style={[
                styles.tick,
                {
                  transform: [{ rotate: `${angle}deg` }, { translateY: -72 }],
                  backgroundColor: active ? COLORS.cyan : "#2A3B54",
                  opacity: active ? 1 : 0.45,
                },
              ]}
            />
          );
        })}

        <Animated.View style={[styles.ringGlow, { opacity: pulse }]} />

        <View style={styles.speedCore}>
          <Text style={styles.speedNumber}>{speed}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function FuelGauge({ value, wake }) {
  return (
    <Animated.View
      style={[
        styles.fuelCard,
        {
          opacity: wake,
          transform: [
            {
              translateY: wake.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.cardTitle}>Fuel</Text>
      <View style={styles.fuelTrack}>
        <View style={[styles.fuelFill, { width: `${value}%` }]} />
      </View>
      <Text style={styles.cardValue}>{value}%</Text>
    </Animated.View>
  );
}

function Odometer({ value, wake }) {
  return (
    <Animated.View
      style={[
        styles.odoCard,
        {
          opacity: wake,
          transform: [
            {
              translateY: wake.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.cardTitle}>Odometer</Text>
      <Text style={styles.odoValue}>{value.toString().padStart(6, "0")}</Text>
      <Text style={styles.cardSub}>km</Text>
    </Animated.View>
  );
}

function GraphCard({ phase, wake }) {
  const bars = [16, 20, 19, 24, 22, 27, 25, 31];
  return (
    <Animated.View
      style={[
        styles.graphCard,
        {
          opacity: wake,
          transform: [
            {
              translateY: wake.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.cardTitle}>Statistics</Text>
      <View style={styles.graphRow}>
        {bars.map((h, idx) => {
          const active = idx <= Math.floor(phase * (bars.length - 1));
          return (
            <View
              key={`bar-${idx}`}
              style={[
                styles.graphBar,
                {
                  height: h,
                  opacity: active ? 0.95 : 0.45,
                  backgroundColor: active ? COLORS.cyanSoft : "#2A3A52",
                },
              ]}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

function StatusIcons({ pulse, wake }) {
  return (
    <Animated.View
      style={[
        styles.statusCard,
        {
          opacity: wake,
          transform: [
            {
              translateY: wake.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.cardTitle}>System</Text>
      <View style={styles.iconRow}>
        <Animated.View style={[styles.iconChip, { opacity: pulse }]}> 
          <MaterialCommunityIcons name="oil" size={14} color={COLORS.cyan} />
        </Animated.View>
        <Animated.View style={[styles.iconChip, { opacity: pulse }]}> 
          <MaterialCommunityIcons name="wrench" size={14} color={COLORS.blueSoft} />
        </Animated.View>
        <Animated.View style={[styles.iconChip, { opacity: pulse }]}> 
          <MaterialCommunityIcons name="engine-outline" size={14} color={COLORS.cyanSoft} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export default function DrivingLogoLoader() {
  const assemble = useRef(new Animated.Value(0)).current;
  const speedLoop = useRef(new Animated.Value(0)).current;
  const graphLoop = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef(new Animated.Value(0)).current;
  const morphLoop = useRef(new Animated.Value(0)).current;

  const [speed, setSpeed] = useState(18);
  const [fuel, setFuel] = useState(24);
  const [odo, setOdo] = useState(124380);
  const [graphPhase, setGraphPhase] = useState(0.1);

  useAnimatedLoop(speedLoop, 4600, Easing.inOut(Easing.quad));
  useAnimatedLoop(graphLoop, 3600, Easing.inOut(Easing.cubic));
  useAnimatedLoop(pulseLoop, 2200, Easing.inOut(Easing.sin));
  useAnimatedLoop(morphLoop, 5600, Easing.inOut(Easing.quad));

  useEffect(() => {
    assemble.setValue(0);
    const intro = Animated.sequence([
      Animated.delay(120),
      Animated.timing(assemble, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    intro.start();
    return () => intro.stop();
  }, [assemble]);

  useEffect(() => {
    const speedId = speedLoop.addListener(({ value }) => {
      const wave = value < 0.5 ? value / 0.5 : 1 - (value - 0.5) / 0.5;
      setSpeed(Math.round(18 + wave * 48));
      setFuel(Math.round(24 + value * 16));
    });

    const graphId = graphLoop.addListener(({ value }) => {
      setGraphPhase(value);
    });

    return () => {
      speedLoop.removeListener(speedId);
      graphLoop.removeListener(graphId);
    };
  }, [graphLoop, speedLoop]);

  useEffect(() => {
    const timer = setInterval(() => {
      setOdo((prev) => (prev >= 124980 ? 124380 : prev + 1));
    }, 85);
    return () => clearInterval(timer);
  }, []);

  const iconPulse = pulseLoop.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const speedWake = assemble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });
  const panelWake = assemble.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const panelY = assemble.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const panelScale = morphLoop.interpolate({ inputRange: [0, 0.82, 1], outputRange: [1, 1, 1.018] });

  const overlayOpacity = morphLoop.interpolate({
    inputRange: [0, 0.86, 1],
    outputRange: [0, 0, 0.38],
  });

  const overlayScale = morphLoop.interpolate({
    inputRange: [0, 0.86, 1],
    outputRange: [1, 1, 1.06],
  });

  const ambientOpacity = pulseLoop.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.3] });

  return (
    <View style={styles.root}>
      <View style={styles.vignetteTop} />
      <View style={styles.vignetteBottom} />
      <Animated.View style={[styles.ambientGlow, { opacity: ambientOpacity }]} />

      <Animated.View
        style={[
          styles.dashboard,
          {
            opacity: panelWake,
            transform: [{ translateY: panelY }, { scale: panelScale }],
          },
        ]}
      >
        <View style={styles.gridLayer} />

        <View style={styles.topRow}>
          <Speedometer speed={speed} wake={speedWake} pulse={iconPulse} />
          <View style={styles.topSide}>
            <FuelGauge value={fuel} wake={panelWake} />
            <GraphCard phase={graphPhase} wake={panelWake} />
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Odometer value={odo} wake={panelWake} />
          <StatusIcons pulse={iconPulse} wake={panelWake} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.destinationOverlay, { opacity: overlayOpacity, transform: [{ scale: overlayScale }] }]}>
        <View style={styles.destinationBadge}>
          <MaterialCommunityIcons name="view-dashboard-outline" size={16} color={COLORS.cyanSoft} />
          <Text style={styles.destinationText}>Opening dashboard</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    overflow: "hidden",
  },
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: "#0D1B2A1C",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: "#0000002B",
  },
  ambientGlow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#4CC9F01A",
  },

  dashboard: {
    width: "100%",
    maxWidth: 430,
    borderRadius: 22,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    overflow: "hidden",
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.panelSoft,
    opacity: 0.5,
  },

  topRow: {
    flexDirection: "row",
    gap: 10,
  },
  topSide: {
    flex: 1,
    gap: 10,
  },

  speedCard: {
    width: 182,
    height: 144,
    borderRadius: 16,
    backgroundColor: "#0C1626",
    borderWidth: 1,
    borderColor: "#22344D",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  speedRing: {
    width: 154,
    height: 154,
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    position: "absolute",
    width: 4,
    height: 10,
    borderRadius: 2,
  },
  ringGlow: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#67E8F920",
  },
  speedCore: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: COLORS.ring,
    backgroundColor: "#0C1A2D",
    alignItems: "center",
    justifyContent: "center",
  },
  speedNumber: {
    color: COLORS.textMain,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  speedUnit: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },

  fuelCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22344D",
    backgroundColor: "#0C1626",
    padding: 10,
  },
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  fuelTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#1C2C44",
    overflow: "hidden",
  },
  fuelFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.cyan,
  },
  cardValue: {
    marginTop: 8,
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: "600",
  },

  graphCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22344D",
    backgroundColor: "#0C1626",
    padding: 10,
  },
  graphRow: {
    height: 42,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  graphBar: {
    flex: 1,
    borderRadius: 3,
  },

  bottomRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  odoCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22344D",
    backgroundColor: "#0C1626",
    padding: 10,
  },
  odoValue: {
    marginTop: 2,
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  cardSub: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 11,
  },

  statusCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#22344D",
    backgroundColor: "#0C1626",
    padding: 10,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2F4E72",
    backgroundColor: "#10213A",
  },

  destinationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07112099",
  },
  destinationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2F567C",
    backgroundColor: "#10243D",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  destinationText: {
    color: "#D8EEFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
