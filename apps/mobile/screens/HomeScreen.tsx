import * as React from "react";
import { PlaceholderScreen } from "./PlaceholderScreen";

export function HomeScreen() {
  return (
    <PlaceholderScreen
      title="Home"
      subtitle="Search destinations and start trips. Full home experience comes in MOB-005."
      ctaLabel="Where to?"
      ctaAccessibilityLabel="Where to"
      ctaAccessibilityHint="Placeholder for destination search"
    />
  );
}
