/**
 * ArtsFellow Premium Theme Colors
 * Based on the Digital Art Renaissance design language.
 */
export const themeColors = {
  light: {
    background: "#ffffff",
    textMain: "#0f172a", // Premium slate black
    textMuted: "#64748b", // Slate-500
    primary: "#008080", // Teal
    secondary: "#004d4d", // Dark Teal

    // Blobs from the uploaded reference photo
    blobs: {
      cyan: {
        start: "#a5f3fc",
        end: "#22d3ee",
      },
      blue: {
        start: "#bae6fd",
        end: "#38bdf8",
      },
      mint: {
        start: "#ccfbf1",
        end: "#5eead4",
      },
    },
  },
  dark: {
    background: "#041a1a", // Deep greenish blue
    textMain: "#ffffff",
    textMuted: "rgba(255, 255, 255, 0.7)",
    primary: "#20b2aa", // Light Sea Green
    primaryDark: "#008080",
    cardBg: "#092b2b",
    border: "rgba(0, 128, 128, 0.3)",
  },
};

export default themeColors;
