import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const TILE_WIDTH = 640;
const MOTION_EASE = Easing.bezier(0.42, 0.0, 0.2, 1);

function pair(animValue, span = TILE_WIDTH) {
  return {
    a: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -span] }),
    b: animValue.interpolate({ inputRange: [0, 1], outputRange: [span, 0] }),
  };
}

function LoopLayer({ style, xA, xB, children }) {
  return (
    <View style={style} pointerEvents="none">
      <Animated.View style={[styles.tile, { transform: [{ translateX: xA }] }]}>{children}</Animated.View>
      <Animated.View style={[styles.tile, { transform: [{ translateX: xB }] }]}>{children}</Animated.View>
    </View>
  );
}

export default function DrivingLogoLoader({ themeMode = "dark" }) {
  const isDark = themeMode !== "light";

  const hillsFlow = useRef(new Animated.Value(0)).current;
  const treesFlow = useRef(new Animated.Value(0)).current;
  const lightsFlow = useRef(new Animated.Value(0)).current;
  const roadFlow = useRef(new Animated.Value(0)).current;
  const particleFlow = useRef(new Animated.Value(0)).current;

  const carBob = useRef(new Animated.Value(0)).current;
  const wheelSpin = useRef(new Animated.Value(0)).current;
  const lampPulse = useRef(new Animated.Value(0)).current;
  const fogPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startLoop = (value, duration) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: MOTION_EASE,
          useNativeDriver: true,
        })
      );

    const hillsLoop = startLoop(hillsFlow, 14000);
    const treesLoop = startLoop(treesFlow, 9800);
    const lightsLoop = startLoop(lightsFlow, 7600);
    const roadLoop = startLoop(roadFlow, 2100);
    const particlesLoop = startLoop(particleFlow, 11800);

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carBob, {
          toValue: 1,
          duration: 780,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(carBob, {
          toValue: 0,
          duration: 780,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const wheelLoop = Animated.loop(
      Animated.timing(wheelSpin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const lampLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lampPulse, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(lampPulse, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const fogLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fogPulse, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fogPulse, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    [hillsFlow, treesFlow, lightsFlow, roadFlow, particleFlow, carBob, wheelSpin, lampPulse, fogPulse].forEach((v) => v.setValue(0));

    hillsLoop.start();
    treesLoop.start();
    lightsLoop.start();
    roadLoop.start();
    particlesLoop.start();
    bobLoop.start();
    wheelLoop.start();
    lampLoop.start();
    fogLoop.start();

    return () => {
      hillsLoop.stop();
      treesLoop.stop();
      lightsLoop.stop();
      roadLoop.stop();
      particlesLoop.stop();
      bobLoop.stop();
      wheelLoop.stop();
      lampLoop.stop();
      fogLoop.stop();
    };
  }, [carBob, fogPulse, hillsFlow, lampPulse, lightsFlow, particleFlow, roadFlow, treesFlow, wheelSpin]);

  const hillsX = pair(hillsFlow);
  const treesX = pair(treesFlow);
  const lightsX = pair(lightsFlow);
  const roadX = pair(roadFlow);
  const particlesX = pair(particleFlow);

  const carY = carBob.interpolate({ inputRange: [0, 1], outputRange: [0, -2.6] });
  const wheelRotation = wheelSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const lampGlow = lampPulse.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.78] });
  const fogOpacity = fogPulse.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.17] });
  const beamOpacity = lampPulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.24] });

  return (
    <View style={[styles.root, isDark ? styles.rootDark : styles.rootLight]}>
      <View style={[styles.scene, isDark ? styles.sceneDark : styles.sceneLight]}>
        <View style={styles.vignetteTop} />

        <LoopLayer style={styles.hillsLayer} xA={hillsX.a} xB={hillsX.b}>
          <View style={[styles.hill, { left: 10, width: 220, height: 80 }]} />
          <View style={[styles.hill, { left: 180, width: 260, height: 100 }]} />
          <View style={[styles.hill, { left: 430, width: 220, height: 86 }]} />
        </LoopLayer>

        <LoopLayer style={styles.treesLayer} xA={treesX.a} xB={treesX.b}>
          {[42, 122, 212, 300, 402, 498, 588].map((left) => (
            <View key={`tree-${left}`} style={[styles.tree, { left }]}>
              <View style={styles.treeBody} />
            </View>
          ))}
        </LoopLayer>

        <LoopLayer style={styles.lightsLayer} xA={lightsX.a} xB={lightsX.b}>
          {[70, 188, 306, 424, 542].map((left) => (
            <View key={`lamp-${left}`} style={[styles.lampWrap, { left }]}>
              <View style={styles.lampPole} />
              <Animated.View style={[styles.lampBloom, { opacity: lampGlow }]} />
              <Animated.View style={[styles.lampBeam, { opacity: beamOpacity }]} />
            </View>
          ))}
        </LoopLayer>

        <View style={styles.roadZone}>
          <View style={styles.roadSurface} />

          <LoopLayer style={styles.roadMarksLayer} xA={roadX.a} xB={roadX.b}>
            {[34, 164, 294, 424, 554].map((left) => (
              <View key={`mark-${left}`} style={[styles.roadMark, { left }]} />
            ))}
          </LoopLayer>

          <LoopLayer style={styles.roadTextureLayer} xA={roadX.a} xB={roadX.b}>
            {[16, 98, 176, 258, 336, 418, 502, 584].map((left) => (
              <View key={`tx-${left}`} style={[styles.textureDot, { left }]} />
            ))}
          </LoopLayer>
        </View>

        <LoopLayer style={styles.particlesLayer} xA={particlesX.a} xB={particlesX.b}>
          {[44, 134, 222, 326, 410, 506, 606].map((left, idx) => (
            <Animated.View
              key={`pt-${left}`}
              style={[
                styles.particle,
                { left, top: 44 + ((idx * 17) % 70), opacity: fogOpacity },
              ]}
            />
          ))}
        </LoopLayer>

        <Animated.View style={[styles.fogBand, { opacity: fogOpacity }]} />

        <Animated.View style={[styles.carWrap, { transform: [{ translateY: carY }] }]}>
          <Animated.View style={[styles.headlightLeft, { opacity: beamOpacity }]} />
          <Animated.View style={[styles.headlightRight, { opacity: beamOpacity }]} />

          <View style={styles.carShadow} />
          <View style={styles.carShell}>
            <View style={styles.carCabin} />
            <View style={styles.carBody} />
          </View>

          <View style={[styles.wheel, styles.wheelLeft]}>
            <Animated.View style={[styles.wheelCore, { transform: [{ rotate: wheelRotation }] }]} />
          </View>
          <View style={[styles.wheel, styles.wheelRight]}>
            <Animated.View style={[styles.wheelCore, { transform: [{ rotate: wheelRotation }] }]} />
          </View>
        </Animated.View>

        <View style={styles.vignetteBottom} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rootDark: { backgroundColor: "#0F172A" },
  rootLight: { backgroundColor: "#0F172A" },

  scene: {
    width: "100%",
    height: "100%",
    minHeight: 260,
    overflow: "hidden",
  },
  sceneDark: { backgroundColor: "#111827" },
  sceneLight: { backgroundColor: "#111827" },

  tile: {
    position: "absolute",
    top: 0,
    width: TILE_WIDTH,
    height: "100%",
  },

  hillsLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 56,
    height: 110,
  },
  hill: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: "#1B2A3C",
    opacity: 0.74,
  },

  treesLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 122,
    height: 86,
  },
  tree: {
    position: "absolute",
    bottom: 0,
    width: 20,
    height: 44,
  },
  treeBody: {
    width: 18,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#243746",
    opacity: 0.82,
  },

  lightsLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 98,
    height: 118,
  },
  lampWrap: {
    position: "absolute",
    bottom: 0,
    width: 16,
    alignItems: "center",
  },
  lampPole: {
    width: 2,
    height: 56,
    borderRadius: 2,
    backgroundColor: "#4E5F72",
    opacity: 0.62,
  },
  lampBloom: {
    position: "absolute",
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 8,
    backgroundColor: "#D7E9FF",
  },
  lampBeam: {
    position: "absolute",
    top: 8,
    width: 40,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#8DA7C2",
  },

  roadZone: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 66,
    height: 110,
  },
  roadSurface: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 28,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#2A3442",
  },
  roadMarksLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 53,
    height: 4,
  },
  roadMark: {
    position: "absolute",
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#D7E5F2",
    opacity: 0.9,
  },
  roadTextureLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 38,
    height: 20,
  },
  textureDot: {
    position: "absolute",
    width: 8,
    height: 1,
    borderRadius: 2,
    backgroundColor: "#425063",
    opacity: 0.85,
  },

  particlesLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 40,
    height: 90,
  },
  particle: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#C1D4EA",
  },
  fogBand: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 134,
    height: 72,
    borderRadius: 90,
    backgroundColor: "#94A8C0",
  },

  carWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -24,
    bottom: 92,
    width: 48,
    alignItems: "center",
  },
  carShadow: {
    position: "absolute",
    bottom: -3,
    width: 44,
    height: 9,
    borderRadius: 99,
    backgroundColor: "#04070B",
    opacity: 0.55,
  },
  carShell: {
    width: 48,
    height: 24,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  carCabin: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#9EB2C3",
    opacity: 0.9,
  },
  carBody: {
    width: 46,
    height: 13,
    borderRadius: 6,
    backgroundColor: "#CAD7E2",
  },
  headlightLeft: {
    position: "absolute",
    left: -10,
    top: 7,
    width: 28,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#9DB7D2",
  },
  headlightRight: {
    position: "absolute",
    right: -10,
    top: 7,
    width: 28,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#9DB7D2",
  },

  wheel: {
    position: "absolute",
    bottom: -1,
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: "#121922",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelLeft: { left: 6 },
  wheelRight: { right: 6 },
  wheelCore: {
    width: 4,
    height: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#90A5B8",
  },

  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 62,
    backgroundColor: "#0A111C",
    opacity: 0.34,
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#0A1018",
    opacity: 0.45,
  },
});
