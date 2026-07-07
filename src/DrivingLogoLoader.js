import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DrivingLogoLoader({ themeMode = "dark", message = "Yükleniyor..." }) {
  const isDark = themeMode === "dark";
  const roadFlowAnim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const wheelAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const roadFlowLoop = Animated.loop(
      Animated.timing(roadFlowAnim, {
        toValue: 1,
        duration: 820,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 760,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 760,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const wheelLoop = Animated.loop(
      Animated.timing(wheelAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    roadFlowAnim.setValue(0);
    bobAnim.setValue(0);
    swayAnim.setValue(0);
    wheelAnim.setValue(0);
    glowAnim.setValue(0);

    roadFlowLoop.start();
    bobLoop.start();
    swayLoop.start();
    wheelLoop.start();
    glowLoop.start();

    return () => {
      roadFlowLoop.stop();
      bobLoop.stop();
      swayLoop.stop();
      wheelLoop.stop();
      glowLoop.stop();
    };
  }, [bobAnim, glowAnim, roadFlowAnim, swayAnim, wheelAnim]);

  const laneTranslateY = roadFlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-42, 58],
  });

  const carTranslateY = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const carTranslateX = swayAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-2, 2, -2],
  });

  const carTilt = swayAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-1.5deg", "1.5deg", "-1.5deg"],
  });

  const carGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.26, 0.72],
  });

  const roadGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.4],
  });

  const wheelRotate = wheelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const wheelPulse = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  const laneMeta = [
    { top: 10, width: 7, height: 10 },
    { top: 30, width: 9, height: 12 },
    { top: 52, width: 11, height: 14 },
    { top: 77, width: 13, height: 16 },
    { top: 104, width: 16, height: 18 },
    { top: 134, width: 19, height: 21 },
  ];

  const sideMeta = [
    { top: 16, width: 14, height: 2 },
    { top: 40, width: 18, height: 2 },
    { top: 68, width: 22, height: 2 },
    { top: 100, width: 28, height: 2 },
    { top: 136, width: 34, height: 2 },
  ];

  const laneDashColor = isDark ? "#8FD5FB" : "#4F7D97";
  const sideDashColor = isDark ? "#3A708C" : "#8FB3C8";
  const wheelCoreColor = isDark ? "#D8EEF9" : "#355364";

  const Wheel = ({ style }) => (
    <Animated.View
      style={[
        styles.wheel,
        style,
        {
          transform: [{ rotate: wheelRotate }, { scale: wheelPulse }],
        },
      ]}
    >
      <View style={[styles.wheelCore, { backgroundColor: wheelCoreColor }]} />
    </Animated.View>
  );

  return (
    <View style={[styles.root, isDark ? styles.rootDark : styles.rootLight]}>
      <View style={styles.sceneWrap}>
        <Animated.View
          style={[
            styles.roadGlow,
            isDark ? styles.roadGlowDark : styles.roadGlowLight,
            { opacity: roadGlowOpacity },
          ]}
        />

        <View style={styles.horizonWrap}>
          <View style={[styles.roadBand, styles.roadBand1, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand2, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand3, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand4, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand5, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand6, isDark ? styles.roadDark : styles.roadLight]} />

          <View style={styles.laneLayer}>
            {laneMeta.map((meta, idx) => (
              <Animated.View
                key={`center-${idx}`}
                style={[
                  styles.centerDash,
                  {
                    top: meta.top,
                    width: meta.width,
                    height: meta.height,
                    backgroundColor: laneDashColor,
                    transform: [{ translateY: laneTranslateY }],
                    opacity: 0.94 - idx * 0.09,
                  },
                ]}
              />
            ))}

            {sideMeta.map((meta, idx) => (
              <Animated.View
                key={`left-${idx}`}
                style={[
                  styles.sideDash,
                  {
                    top: meta.top,
                    width: meta.width,
                    left: 44 - idx * 2,
                    backgroundColor: sideDashColor,
                    transform: [{ translateY: laneTranslateY }],
                    opacity: 0.8 - idx * 0.1,
                  },
                ]}
              />
            ))}

            {sideMeta.map((meta, idx) => (
              <Animated.View
                key={`right-${idx}`}
                style={[
                  styles.sideDash,
                  {
                    top: meta.top,
                    width: meta.width,
                    right: 44 - idx * 2,
                    backgroundColor: sideDashColor,
                    transform: [{ translateY: laneTranslateY }],
                    opacity: 0.8 - idx * 0.1,
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
              transform: [{ translateX: carTranslateX }, { translateY: carTranslateY }, { rotate: carTilt }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.carGlow,
              isDark ? styles.carGlowDark : styles.carGlowLight,
              { opacity: carGlowOpacity },
            ]}
          />

          <View style={styles.carBody}>
            <MaterialCommunityIcons
              name="car-sports"
              size={52}
              color={isDark ? "#EAF7FF" : "#2D4553"}
            />

            <View style={styles.headlightsWrap}>
              <Animated.View
                style={[
                  styles.headlight,
                  isDark ? styles.headlightDark : styles.headlightLight,
                  { opacity: carGlowOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.headlight,
                  isDark ? styles.headlightDark : styles.headlightLight,
                  { opacity: carGlowOpacity },
                ]}
              />
            </View>

            <View style={styles.wheelsWrap}>
              <Wheel style={styles.leftWheel} />
              <Wheel style={styles.rightWheel} />
            </View>
          </View>
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

  sceneWrap: {
    width: "100%",
    maxWidth: 420,
    height: 210,
    justifyContent: "center",
    marginBottom: 14,
  },

  roadGlow: {
    position: "absolute",
    left: "50%",
    marginLeft: -162,
    bottom: 30,
    width: 324,
    height: 128,
    borderRadius: 999,
  },
  roadGlowDark: { backgroundColor: "#1B4D68" },
  roadGlowLight: { backgroundColor: "#C2DCEB" },

  horizonWrap: {
    position: "absolute",
    left: "50%",
    top: 12,
    marginLeft: -160,
    width: 320,
    height: 170,
    alignItems: "center",
  },

  roadBand: {
    position: "absolute",
    borderRadius: 14,
  },
  roadBand1: { top: 2, width: 86, height: 14 },
  roadBand2: { top: 24, width: 118, height: 15 },
  roadBand3: { top: 48, width: 154, height: 16 },
  roadBand4: { top: 74, width: 194, height: 17 },
  roadBand5: { top: 102, width: 238, height: 18 },
  roadBand6: { top: 132, width: 286, height: 19 },
  roadDark: { backgroundColor: "#17394D" },
  roadLight: { backgroundColor: "#C5DCE9" },

  laneLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 12,
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
    borderRadius: 3,
  },

  carWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -34,
    bottom: 10,
    alignItems: "center",
  },
  carGlow: {
    position: "absolute",
    bottom: -10,
    width: 78,
    height: 16,
    borderRadius: 20,
  },
  carGlowDark: { backgroundColor: "#76C5F0" },
  carGlowLight: { backgroundColor: "#6FA7C7" },

  carBody: {
    width: 70,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  headlightsWrap: {
    position: "absolute",
    bottom: 7,
    width: 34,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headlight: {
    width: 7,
    height: 3.2,
    borderRadius: 2,
  },
  headlightDark: { backgroundColor: "#C8F0FF" },
  headlightLight: { backgroundColor: "#5D87A2" },

  wheelsWrap: {
    position: "absolute",
    bottom: 0,
    width: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wheel: {
    width: 11,
    height: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#2A4758",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E1E27",
  },
  leftWheel: { marginLeft: 2 },
  rightWheel: { marginRight: 2 },
  wheelCore: {
    width: 4.5,
    height: 4.5,
    borderRadius: 999,
  },

  message: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  messageDark: { color: "#A7C7D9" },
  messageLight: { color: "#4A7588" },
});
