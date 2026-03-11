import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: "#0a0a0f",
        card: "#0d1117",
        "card-border": "#1e2030",
        bull: "#00ff88",
        bear: "#ff4444",
        macro: "#4d9eff",
        judge: "#f7931a",
        muted: "#6b7280",
        dim: "#374151",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
}
export default config
