import * as React from "react";
import { PlaceholderScreen } from "./PlaceholderScreen";

export function DetectScreen() {
  return (
    <PlaceholderScreen
      title="Detect"
      subtitle="Camera capture and cloud detection will connect here in MOB-006."
      ctaLabel="Scan surroundings"
      ctaAccessibilityLabel="Scan surroundings"
      ctaAccessibilityHint="Placeholder for opening the camera to scan"
    />
  );
}
