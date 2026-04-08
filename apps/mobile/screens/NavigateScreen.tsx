import * as React from "react";
import { PlaceholderScreen } from "./PlaceholderScreen";

export function NavigateScreen() {
  return (
    <PlaceholderScreen
      title="Navigate"
      subtitle="Walking directions and turn-by-turn guidance will be added in later tickets."
      ctaLabel="Start navigation"
      ctaAccessibilityLabel="Start navigation"
      ctaAccessibilityHint="Placeholder for starting a walking route"
    />
  );
}
