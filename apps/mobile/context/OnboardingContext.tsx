import * as React from "react";

type OnboardingValue = {
  /** Placeholder until MOB-003 persists with AsyncStorage. */
  completed: boolean;
  completeOnboarding: () => void;
};

const OnboardingContext = React.createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = React.useState(false);

  const completeOnboarding = React.useCallback(() => {
    setCompleted(true);
  }, []);

  const value = React.useMemo(
    () => ({ completed, completeOnboarding }),
    [completed, completeOnboarding]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
