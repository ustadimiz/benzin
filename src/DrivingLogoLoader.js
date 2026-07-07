import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DrivingLogoLoader({ themeMode = "dark", message = "Yükleniyor..." }) {
  const isDark = themeMode === "dark";

  const laneFlow = useRef(new Animated.Value(0)).current;
  const carBob = useRef(new Animated.Value(0)).current;
  const carSway = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const laneLoop = Animated.loop(
      Animated.timing(laneFlow, {
        toValue: 1,
        duration: 820,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carBob, {
          toValue: 1,
          duration: 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(carBob, {
          toValue: 0,
          duration: 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(carSway, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(carSway, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    laneFlow.setValue(0);
    carBob.setValue(0);
    carSway.setValue(0);
    glowPulse.setValue(0);

    laneLoop.start();
    bobLoop.start();
    swayLoop.start();
    glowLoop.start();

    return () => {
      laneLoop.stop();
      bobLoop.stop();
      swayLoop.stop();
      glowLoop.stop();
    };
  }, [carBob, carSway, glowPulse, laneFlow]);

  const laneY = laneFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-42, 58],
  });

  const carY = carBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const carX = carSway.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-1.5, 1.5, -1.5],
  });

  const carTilt = carSway.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-1deg", "1deg", "-1deg"],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.6],
  });

  const roadGlow = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.14, 0.28],
  });

  const centerDashColor = isDark ? "#91D7FF" : "#5E8EA9";
  const sideDashColor = isDark ? "#2F5E78" : "#9ABBCF";

  const dashes = [
    { top: 16, width: 7, height: 10 },
    { top: 38, width: 9, height: 12 },
    { top: 63, width: 11, height: 14 },
    { top: 92, width: 14, height: 17 },
    { top: 124, width: 17, height: 20 },
  ];

  return (
    <View style={[styles.root, isDark ? styles.rootDark : styles.rootLight]}>
      <View style={styles.scene}>
        <Animated.View
          style={[
            styles.roadGlow,
            isDark ? styles.roadGlowDark : styles.roadGlowLight,
            { opacity: roadGlow },
          ]}
        />

        <View style={styles.road}>
          <View style={[styles.roadBand, styles.band1, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.band2, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.band3, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.band4, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.band5, isDark ? styles.roadDark : styles.roadLight]} />

          <View style={styles.laneLayer}>
            {dashes.map((dash, index) => (
              <Animated.View
                key={`center-${index}`}
                style={[
                  styles.centerDash,
                  {
                    top: dash.top,
                    width: dash.width,
                    height: dash.height,
                    transform: [{ translateY: laneY }],
                    opacity: 0.95 - index * 0.12,
                    backgroundColor: centerDashColor,
                  },
                ]}
              />
            ))}

            {dashes.map((dash, index) => (
              <Animated.View
                key={`left-${index}`}
                style={[
                  styles.sideDash,
                  {
                    top: dash.top + 2,
                    width: 10 + index * 4,
                    left: 52 - index * 3,
                    transform: [{ translateY: laneY }],
                    opacity: 0.7 - index * 0.1,
                    backgroundColor: sideDashColor,
                  },
                ]}
              />
            ))}

            {dashes.map((dash, index) => (
              <Animated.View
                key={`right-${index}`}
                style={[
                  styles.sideDash,
                  {
                    top: dash.top + 2,
                    width: 10 + index * 4,
                    right: 52 - index * 3,
                    transform: [{ translateY: laneY }],
                    opacity: 0.7 - index * 0.1,
                    backgroundColor: sideDashColor,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <Animated.View
          style={[
            styles.carWrap,
            {
              transform: [{ translateX: carX }, { translateY: carY }, { rotate: carTilt }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.carShadow,
              isDark ? styles.carShadowDark : styles.carShadowLight,
              { opacity: glowOpacity },
            ]}
          />

          <MaterialCommunityIcons
            name="car-sports"
            size={50}
            color={isDark ? "#E8F6FF" : "#2E4958"}
          />

          <Animated.View style={[styles.headlight, styles.headlightLeft, { opacity: glowOpacity }]} />
          <Animated.View style={[styles.headlight, styles.headlightRight, { opacity: glowOpacity }]} />
        </Animated.View>
      </View>

      <Text style={[styles.message, isDark ? styles.messageDark : styles.messageLight]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  rootDark: { backgroundColor: "#081B26" },
  rootLight: { backgroundColor: "#EAF3F9" },

  scene: {
    width: "100%",
    maxWidth: 380,
    height: 205,
    justifyContent: "center",
    marginBottom: 14,
  },

  roadGlow: {
    position: "absolute",
    left: "50%",
    marginLeft: -150,
    bottom: 38,
    width: 300,
    height: 96,
    borderRadius: 999,
  },
  roadGlowDark: { backgroundColor: "#1D4C66" },
  roadGlowLight: { backgroundColor: "#C3DBE8" },

  road: {
    position: "absolute",
    left: "50%",
    top: 14,
    marginLeft: -150,
    width: 300,
    height: 158,
    alignItems: "center",
  },

  roadBand: {
    position: "absolute",
    borderRadius: 12,
  },
  band1: { top: 2, width: 94, height: 13 },
  band2: { top: 28, width: 132, height: 14 },
  band3: { top: 56, width: 176, height: 16 },
  band4: { top: 87, width: 226, height: 18 },
  band5: { top: 122, width: 282, height: 20 },

  roadDark: { backgroundColor: "#17394D" },
  roadLight: { backgroundColor: "#C6DBE8" },

  laneLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 8,
    bottom: 0,
  },
  centerDash: {
    position: "absolute",
    left: "50%",
    marginLeft: -4,
    borderRadius: 4,
  },
  sideDash: {
    position: "absolute",
    height: 2,
    borderRadius: 2,
  },

  carWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -30,
    bottom: 20,
    alignItems: "center",
  },
  carShadow: {
    position: "absolute",
    bottom: -7,
    width: 66,
    height: 13,
    borderRadius: 999,
  },
  carShadowDark: { backgroundColor: "#72C2EA" },
  carShadowLight: { backgroundColor: "#78A9C4" },

  headlight: {
    position: "absolute",
    width: 7,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#C7EEFF",
    bottom: 6,
  },
  headlightLeft: { left: 16 },
  headlightRight: { right: 16 },

  message: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  messageDark: { color: "#A7C7D9" },
  messageLight: { color: "#4A7588" },
});
