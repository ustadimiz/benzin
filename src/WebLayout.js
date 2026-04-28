import { Platform, View, StyleSheet, Dimensions } from "react-native";
import { useEffect, useState } from "react";

/**
 * Web-responsive layout wrapper
 * Desktop: sidebar nav + content area
 * Mobile: bottom tabs (existing)
 */
export default function WebLayout({ children, navComponent, activeTab }) {
  const [windowWidth, setWindowWidth] = useState(Dimensions.get("window").width);
  const isDesktop = windowWidth >= 1024;
  const isMobile = Platform.OS === "web" ? windowWidth < 768 : true;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    
    const handleResize = () => {
      setWindowWidth(Dimensions.get("window").width);
    };

    const subscription = Dimensions.addEventListener("change", handleResize);
    return () => subscription?.remove?.();
  }, []);

  // Mobile (bottom nav) - existing behavior
  if (isMobile || Platform.OS !== "web") {
    return children;
  }

  // Desktop (sidebar nav + content)
  return (
    <View style={styles.desktopContainer}>
      {/* Sidebar Navigation */}
      <View style={styles.sidebar}>
        {navComponent}
      </View>
      
      {/* Content Area */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: "#1A3E53",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
});
