import { Platform } from "react-native";

/**
 * Inject lightweight responsive styles on web platform.
 * No full Bootstrap - only custom responsive CSS that won't conflict with react-native-web.
 */
export function injectWebStyles() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = `
    /* Tap highlight removal */
    * { -webkit-tap-highlight-color: transparent; }

    /* Better font rendering */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Thin scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1A3E5360; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #2A5E7580; }

    /* Hover/active feedback for interactive elements */
    [role="button"]:hover { opacity: 0.88; transition: opacity 0.12s ease; }
    [role="button"]:active { transform: scale(0.98); transition: transform 0.08s ease; }
  `;
  document.head.appendChild(style);
}
