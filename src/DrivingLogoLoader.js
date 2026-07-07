import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TILE_WIDTH = 520;

function makeLoopPair(animValue, duration) {
  const first = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, -TILE_WIDTH] });
  const second = animValue.interpolate({ inputRange: [0, 1], outputRange: [TILE_WIDTH, 0] });
  return {
    first,
    second,
    duration,
  };
}

function Layer({ x1, x2, style, children }) {
  return (
    <View style={style} pointerEvents="none">
      <Animated.View style={[styles.tile, { transform: [{ translateX: x1 }] }]}>{children}</Animated.View>
      <Animated.View style={[styles.tile, { transform: [{ translateX: x2 }] }]}>{children}</Animated.View>
    </View>
  );
}

export default function DrivingLogoLoader({ themeMode = "dark" }) {
  const isDark = themeMode === "dark";
  const farFlow = useRef(new Animated.Value(0)).current;
  const midFlow = useRef(new Animated.Value(0)).current;
  const nearFlow = useRef(new Animated.Value(0)).current;
  const roadFlow = useRef(new Animated.Value(0)).current;
  const wheelSpin = useRef(new Animated.Value(0)).current;
  const carBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const far = makeLoopPair(farFlow, 7600);
    const mid = makeLoopPair(midFlow, 5200);
    const near = makeLoopPair(nearFlow, 3400);
    const road = makeLoopPair(roadFlow, 960);

    const farLoop = Animated.loop(
      Animated.timing(farFlow, {
        toValue: 1,
        duration: far.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const midLoop = Animated.loop(
      Animated.timing(midFlow, {
        toValue: 1,
        duration: mid.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const nearLoop = Animated.loop(
      Animated.timing(nearFlow, {
        toValue: 1,
        duration: near.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const roadLoop = Animated.loop(
      Animated.timing(roadFlow, {
        toValue: 1,
        duration: road.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const wheelLoop = Animated.loop(
      Animated.timing(wheelSpin, {
        toValue: 1,
        duration: 520,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carBob, {
          toValue: 1,
          duration: 370,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(carBob, {
          toValue: 0,
          duration: 370,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    farFlow.setValue(0);
    midFlow.setValue(0);
    nearFlow.setValue(0);
    roadFlow.setValue(0);
    wheelSpin.setValue(0);
    carBob.setValue(0);

    farLoop.start();
    midLoop.start();
    nearLoop.start();
    roadLoop.start();
    wheelLoop.start();
    bobLoop.start();

    return () => {
      farLoop.stop();
      midLoop.stop();
      nearLoop.stop();
      roadLoop.stop();
      wheelLoop.stop();
      bobLoop.stop();
    };
  }, [carBob, farFlow, midFlow, nearFlow, roadFlow, wheelSpin]);

  const far = makeLoopPair(farFlow, 7600);
  const mid = makeLoopPair(midFlow, 5200);
  const near = makeLoopPair(nearFlow, 3400);
  const road = makeLoopPair(roadFlow, 960);

  const wheelRotate = wheelSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const carY = carBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3.5],
  });

  return (
    <View style={[styles.root, isDark ? styles.rootDark : styles.rootLight]}>
      <View style={[styles.scene, isDark ? styles.sceneDark : styles.sceneLight]}>
        <View style={[styles.skyBand, isDark ? styles.skyBandDark : styles.skyBandLight]} />

        <Layer style={[styles.layer, styles.farLayer]} x1={far.first} x2={far.second}>
          <View style={[styles.hill, { left: 20, width: 170, height: 74 }]} />
          <View style={[styles.hill, { left: 150, width: 210, height: 96 }]} />
          <View style={[styles.hill, { left: 330, width: 180, height: 78 }]} />
        </Layer>

        <Layer style={[styles.layer, styles.midLayer]} x1={mid.first} x2={mid.second}>
          <View style={[styles.tree, { left: 48 }]}>
            <View style={styles.treeTop} />
            <View style={styles.treeTrunk} />
          </View>
          <View style={[styles.tree, { left: 150 }]}>
            <View style={styles.treeTop} />
            <View style={styles.treeTrunk} />
          </View>
          <View style={[styles.tree, { left: 280 }]}>
            <View style={styles.treeTop} />
            <View style={styles.treeTrunk} />
          </View>
          <View style={[styles.tree, { left: 400 }]}>
            <View style={styles.treeTop} />
            <View style={styles.treeTrunk} />
          </View>
          <View style={[styles.sign, { left: 228 }]}>
            <View style={styles.signTop} />
            <View style={styles.signPole} />
          </View>
        </Layer>

        <View style={styles.roadArea}>
          <View style={[styles.road, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadEdgeTop, isDark ? styles.roadEdgeTopDark : styles.roadEdgeTopLight]} />
          <View style={[styles.roadEdgeBottom, isDark ? styles.roadEdgeBottomDark : styles.roadEdgeBottomLight]} />

          <Layer style={[styles.layer, styles.textureLayer]} x1={near.first} x2={near.second}>
            <View style={[styles.textureStripe, isDark ? styles.textureStripeDark : styles.textureStripeLight, { left: 8, width: 92 }]} />
            <View style={[styles.textureStripe, isDark ? styles.textureStripeDark : styles.textureStripeLight, { left: 126, width: 68 }]} />
            <View style={[styles.textureStripe, isDark ? styles.textureStripeDark : styles.textureStripeLight, { left: 218, width: 84 }]} />
            <View style={[styles.textureStripe, isDark ? styles.textureStripeDark : styles.textureStripeLight, { left: 330, width: 58 }]} />
            <View style={[styles.textureStripe, isDark ? styles.textureStripeDark : styles.textureStripeLight, { left: 412, width: 76 }]} />
          </Layer>

          <Layer style={[styles.layer, styles.centerDashLayer]} x1={road.first} x2={road.second}>
            <View style={[styles.centerDash, isDark ? styles.centerDashDark : styles.centerDashLight, { left: 22 }]} />
            <View style={[styles.centerDash, isDark ? styles.centerDashDark : styles.centerDashLight, { left: 128 }]} />
            <View style={[styles.centerDash, isDark ? styles.centerDashDark : styles.centerDashLight, { left: 234 }]} />
            <View style={[styles.centerDash, isDark ? styles.centerDashDark : styles.centerDashLight, { left: 340 }]} />
            <View style={[styles.centerDash, isDark ? styles.centerDashDark : styles.centerDashLight, { left: 446 }]} />
          </Layer>
        </View>

        <Animated.View style={[styles.carWrap, { transform: [{ translateY: carY }] }]}>
          <View style={styles.carShadow} />
          <MaterialCommunityIcons name="car-sports" size={56} color={isDark ? "#11171D" : "#EEF7FF"} />
          <View style={[styles.wheel, styles.wheelLeft]}>
            <Animated.View style={[styles.wheelCore, { transform: [{ rotate: wheelRotate }] }]} />
          </View>
          <View style={[styles.wheel, styles.wheelRight]}>
            <Animated.View style={[styles.wheelCore, { transform: [{ rotate: wheelRotate }] }]} />
          </View>
        </Animated.View>
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
  rootDark: { backgroundColor: "#071722" },
  rootLight: { backgroundColor: "#EAF3F9" },
  scene: {
    width: "100%",
    maxWidth: 9999,
    height: "100%",
    minHeight: 260,
    overflow: "hidden",
  },
  sceneDark: { backgroundColor: "#071722" },
  sceneLight: { backgroundColor: "#EAF3F9" },
  skyBand: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 160,
  },
  skyBandDark: { backgroundColor: "#123547", opacity: 0.82 },
  skyBandLight: { backgroundColor: "#BFD9EA", opacity: 0.92 },
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  tile: {
    position: "absolute",
    top: 0,
    width: TILE_WIDTH,
    height: "100%",
  },

  farLayer: {
    top: 72,
    height: 98,
  },
  hill: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    backgroundColor: "#3E6E87",
    opacity: 0.92,
  },

  midLayer: {
    top: 130,
    height: 72,
  },
  tree: {
    position: "absolute",
    bottom: 0,
    width: 18,
    height: 42,
    alignItems: "center",
  },
  treeTop: {
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: "#79B59E",
  },
  treeTrunk: {
    marginTop: 2,
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: "#8EA083",
  },
  sign: {
    position: "absolute",
    bottom: 0,
    width: 16,
    alignItems: "center",
  },
  signTop: {
    width: 14,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#D2E7F2",
  },
  signPole: {
    width: 2,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#C5D7E1",
  },

  roadArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 70,
    height: 100,
    justifyContent: "center",
  },
  road: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 22,
    height: 54,
    borderRadius: 10,
  },
  roadDark: { backgroundColor: "#3B4956" },
  roadLight: { backgroundColor: "#B7C5CF" },
  roadEdgeTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 22,
    height: 2,
  },
  roadEdgeTopDark: { backgroundColor: "#9CB2C0", opacity: 0.9 },
  roadEdgeTopLight: { backgroundColor: "#EDF5FA", opacity: 0.95 },
  roadEdgeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 74,
    height: 2,
  },
  roadEdgeBottomDark: { backgroundColor: "#8398A6", opacity: 0.65 },
  roadEdgeBottomLight: { backgroundColor: "#DCE9F1", opacity: 0.85 },
  textureLayer: {
    top: 34,
    height: 10,
  },
  textureStripe: {
    position: "absolute",
    height: 1,
    borderRadius: 1,
  },
  textureStripeDark: { backgroundColor: "#738592", opacity: 0.92 },
  textureStripeLight: { backgroundColor: "#8EA1AF", opacity: 0.7 },
  centerDashLayer: {
    top: 47,
    height: 5,
  },
  centerDash: {
    position: "absolute",
    width: 54,
    height: 4,
    borderRadius: 2,
  },
  centerDashDark: { backgroundColor: "#ECF7FF", opacity: 1 },
  centerDashLight: { backgroundColor: "#FFFFFF", opacity: 1 },

  carWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -34,
    bottom: 88,
    width: 68,
    alignItems: "center",
  },
  carShadow: {
    position: "absolute",
    bottom: -4,
    width: 62,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#020507",
    opacity: 0.62,
  },
  wheel: {
    position: "absolute",
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 13,
    backgroundColor: "#0C1115",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelLeft: { left: 8 },
  wheelRight: { right: 8 },
  wheelCore: {
    width: 6,
    height: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D5E4EC",
  },
});
