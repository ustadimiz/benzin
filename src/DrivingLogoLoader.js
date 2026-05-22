import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function DrivingLogoLoader({ themeMode = "dark", message = "Yükleniyor..." }) {
  const isDark = themeMode === "dark";
  const approachAnim = useRef(new Animated.Value(0)).current;
  const laneAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const approachLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(approachAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(approachAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const laneLoop = Animated.loop(
      Animated.timing(laneAnim, {
        toValue: 1,
        duration: 900,
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

    approachLoop.start();
    laneLoop.start();
    glowLoop.start();

    return () => {
      approachLoop.stop();
      laneLoop.stop();
      glowLoop.stop();
    };
  }, [approachAnim, glowAnim, laneAnim]);

  const carScale = approachAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.84, 1.12],
  });

  const carTranslateY = approachAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 10],
  });

  const laneTranslateY = laneAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 28],
  });

  const carGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });

  return (
    <View style={[styles.root, isDark ? styles.rootDark : styles.rootLight]}>
      <View style={styles.sceneWrap}>
        <View style={styles.horizonWrap}>
          <View style={[styles.roadBand, styles.roadBand1, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand2, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand3, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand4, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand5, isDark ? styles.roadDark : styles.roadLight]} />
          <View style={[styles.roadBand, styles.roadBand6, isDark ? styles.roadDark : styles.roadLight]} />

          <Animated.View style={[styles.centerLaneWrap, { transform: [{ translateY: laneTranslateY }] }]}>
            <View style={[styles.centerDash, isDark ? styles.dashDark : styles.dashLight]} />
            <View style={[styles.centerDash, isDark ? styles.dashDark : styles.dashLight]} />
            <View style={[styles.centerDash, isDark ? styles.dashDark : styles.dashLight]} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.carWrap,
            {
              transform: [{ translateY: carTranslateY }, { scale: carScale }],
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
            <MaterialCommunityIcons name="car" size={46} color={isDark ? "#EAF7FF" : "#253946"} />
            <View style={styles.headlightsWrap}>
              <View style={[styles.headlight, isDark ? styles.headlightDark : styles.headlightLight]} />
              <View style={[styles.headlight, isDark ? styles.headlightDark : styles.headlightLight]} />
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
    height: 190,
    justifyContent: "center",
    marginBottom: 14,
  },

  horizonWrap: {
    position: "absolute",
    left: "50%",
    top: 14,
    marginLeft: -160,
    width: 320,
    height: 150,
    alignItems: "center",
  },
  roadBand: {
    position: "absolute",
    borderRadius: 14,
  },
  roadBand1: { top: 2, width: 90, height: 14 },
  roadBand2: { top: 22, width: 120, height: 15 },
  roadBand3: { top: 44, width: 154, height: 16 },
  roadBand4: { top: 68, width: 192, height: 17 },
  roadBand5: { top: 94, width: 236, height: 18 },
  roadBand6: { top: 122, width: 284, height: 19 },
  roadDark: { backgroundColor: "#153344" },
  roadLight: { backgroundColor: "#C9DCE9" },

  centerLaneWrap: {
    position: "absolute",
    top: 30,
    alignItems: "center",
  },
  centerDash: {
    width: 7,
    height: 16,
    borderRadius: 4,
    marginBottom: 10,
  },
  dashDark: { backgroundColor: "#7FC3E8" },
  dashLight: { backgroundColor: "#3E6E8A" },

  carWrap: {
    position: "absolute",
    left: "50%",
    marginLeft: -32,
    bottom: 8,
    alignItems: "center",
  },
  carGlow: {
    position: "absolute",
    bottom: -7,
    width: 72,
    height: 14,
    borderRadius: 20,
  },
  carGlowDark: { backgroundColor: "#7FC3E8" },
  carGlowLight: { backgroundColor: "#6FA7C7" },

  carBody: {
    width: 62,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headlightsWrap: {
    position: "absolute",
    bottom: 1,
    width: 42,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headlight: {
    width: 8,
    height: 3,
    borderRadius: 2,
  },
  headlightDark: { backgroundColor: "#BEEBFF" },
  headlightLight: { backgroundColor: "#5D87A2" },

  message: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  messageDark: { color: "#A7C7D9" },
  messageLight: { color: "#4A7588" },
});
