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

    /* Responsive tweaks for tablet (web) */
    @media (min-width: 768px) and (max-width: 1199px) {
      /* Grid/card optimizasyonu */
      .stationCard, .cityCard, .modalBox {
        max-width: 95vw !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .stationCard {
        min-width: 320px !important;
        max-width: 48vw !important;
        font-size: 1.05em !important;
        padding: 18px !important;
      }
      .cityCard {
        max-width: 700px !important;
        padding: 18px !important;
      }
      .modalBox {
        max-width: 500px !important;
        width: 95vw !important;
      }
      .filtersRow {
        max-width: 500px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      .columnWrapper {
        gap: 16px !important;
      }
      .brandPrice {
        font-size: 1.15em !important;
      }
    }
    /* Küçük tabletler için (dikey) */
    @media (min-width: 600px) and (max-width: 767px) {
      .stationCard {
        min-width: 260px !important;
        max-width: 95vw !important;
        font-size: 1em !important;
        padding: 12px !important;
      }
      .cityCard {
        max-width: 95vw !important;
        padding: 12px !important;
      }
      .modalBox {
        max-width: 95vw !important;
        width: 95vw !important;
      }
      .filtersRow {
        max-width: 95vw !important;
      }
    }
  `;
  document.head.appendChild(style);
}
